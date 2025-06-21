import type { Redis } from "@upstash/redis/cloudflare"
import type { TelegramBot } from "./telegram-bot"
import type { TelegramMessage, TelegramPollAnswer } from "./index"

export interface Poll {
  id: string
  chatId: number
  creatorId: number
  question: string
  options: string[]
  voters: Record<number, number[]>
  isAnonymous: boolean
  multipleAnswers: boolean
  createdAt: number
  expiresAt?: number
}

export class PollManager {
  constructor(
    private redis: Redis,
    private bot: TelegramBot,
  ) {}

  async createPoll(
    chatId: number,
    creatorId: number,
    question: string,
    options: string[],
    isAnonymous = true,
    multipleAnswers = false,
    expirationMinutes?: number,
  ): Promise<string> {
    const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const poll: Poll = {
      id: pollId,
      chatId,
      creatorId,
      question,
      options,
      voters: {},
      isAnonymous,
      multipleAnswers,
      createdAt: Date.now(),
      expiresAt: expirationMinutes ? Date.now() + expirationMinutes * 60 * 1000 : undefined,
    }

    await this.redis.set(`poll:${pollId}`, poll)
    await this.redis.expire(`poll:${pollId}`, expirationMinutes ? expirationMinutes * 60 : 86400) // 24h default

    // Send poll message with inline keyboard
    const keyboard = this.generatePollKeyboard(poll)
    await this.bot.sendMessage(chatId, this.formatPollMessage(poll), {
      reply_markup: keyboard,
    })

    return pollId
  }

  async handlePollAnswer(pollAnswer: TelegramPollAnswer) {
    // This handles native Telegram polls, not our custom polls
    const pollId = pollAnswer.poll_id
    const userId = pollAnswer.user.id
    const optionIds = pollAnswer.option_ids

    // Store poll answer for analytics
    await this.redis.set(`poll_answer:${pollId}:${userId}`, {
      userId,
      optionIds,
      timestamp: Date.now(),
    })
  }

  async handlePollUpdate(message: TelegramMessage) {
    // Handle native Telegram poll updates
    if (message.poll) {
      const poll = message.poll
      await this.redis.set(`poll_data:${poll.id}`, {
        question: poll.question,
        options: poll.options,
        totalVoters: poll.total_voter_count,
        isClosed: poll.is_closed,
        timestamp: Date.now(),
      })
    }
  }

  async votePoll(pollId: string, userId: number, optionIndex: number): Promise<boolean> {
    const poll = (await this.redis.get(`poll:${pollId}`)) as Poll
    if (!poll) return false

    // Check if poll is expired
    if (poll.expiresAt && Date.now() > poll.expiresAt) {
      return false
    }

    // Handle voting logic
    if (!poll.multipleAnswers) {
      poll.voters[userId] = [optionIndex]
    } else {
      if (!poll.voters[userId]) {
        poll.voters[userId] = []
      }
      const currentVotes = poll.voters[userId]
      if (currentVotes.includes(optionIndex)) {
        // Remove vote
        poll.voters[userId] = currentVotes.filter((v) => v !== optionIndex)
      } else {
        // Add vote
        poll.voters[userId].push(optionIndex)
      }
    }

    await this.redis.set(`poll:${pollId}`, poll)
    return true
  }

  async getPollResults(
    pollId: string,
  ): Promise<{ question: string; results: Array<{ option: string; votes: number }> } | null> {
    const poll = (await this.redis.get(`poll:${pollId}`)) as Poll
    if (!poll) return null

    const results = poll.options.map((option, index) => ({
      option,
      votes: Object.values(poll.voters).filter((votes) => votes.includes(index)).length,
    }))

    return {
      question: poll.question,
      results,
    }
  }

  private generatePollKeyboard(poll: Poll) {
    const keyboard = poll.options.map((option, index) => [
      {
        text: `${index + 1}. ${option}`,
        callback_data: `vote_${poll.id}_${index}`,
      },
    ])

    keyboard.push([
      { text: "📊 Results", callback_data: `results_${poll.id}` },
      { text: "🔒 Close Poll", callback_data: `close_${poll.id}` },
    ])

    return { inline_keyboard: keyboard }
  }

  private formatPollMessage(poll: Poll): string {
    const totalVotes = Object.keys(poll.voters).length
    const expiryText = poll.expiresAt ? `\n⏰ Expires: ${new Date(poll.expiresAt).toLocaleString()}` : ""

    return `📊 <b>Poll</b>\n\n<b>${poll.question}</b>\n\n👥 Total voters: ${totalVotes}${expiryText}\n\nClick buttons below to vote!`
  }

  async formatPollResults(pollId: string): Promise<string> {
    const results = await this.getPollResults(pollId)
    if (!results) return "Poll not found"

    const totalVotes = results.results.reduce((sum, r) => sum + r.votes, 0)

    let message = `📊 <b>Poll Results</b>\n\n<b>${results.question}</b>\n\n`

    results.results.forEach((result, index) => {
      const percentage = totalVotes > 0 ? Math.round((result.votes / totalVotes) * 100) : 0
      const bar = "█".repeat(Math.floor(percentage / 5))
      message += `${index + 1}. ${result.option}\n${bar} ${result.votes} votes (${percentage}%)\n\n`
    })

    message += `👥 Total votes: ${totalVotes}`
    return message
  }
}
