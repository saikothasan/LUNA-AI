import type { Redis } from "@upstash/redis/cloudflare"
import type { TelegramBot } from "./telegram-bot"
import type { TelegramMessage } from "./index"

export interface VerificationChallenge {
  userId: number
  chatId: number
  question: string
  correctAnswer: number
  options: string[]
  attempts: number
  createdAt: number
  messageId?: number
}

export class VerificationManager {
  constructor(
    private redis: Redis,
    private bot: TelegramBot,
  ) {}

  async handleNewMembers(message: TelegramMessage) {
    if (!message.new_chat_members) return

    const chatId = message.chat.id
    const settings = await this.getVerificationSettings(chatId)

    if (!settings.enabled) return

    for (const newMember of message.new_chat_members) {
      if (newMember.is_bot) continue

      // Restrict user immediately
      await this.bot.restrictChatMember(chatId, newMember.id, {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
      })

      // Send verification challenge
      await this.sendVerificationChallenge(chatId, newMember.id)
    }
  }

  async sendVerificationChallenge(chatId: number, userId: number) {
    const challenge = this.generateMathChallenge()

    const verificationData: VerificationChallenge = {
      userId,
      chatId,
      question: challenge.question,
      correctAnswer: challenge.answer,
      options: challenge.options,
      attempts: 0,
      createdAt: Date.now(),
    }

    await this.redis.set(`verification:${chatId}:${userId}`, verificationData, { ex: 300 }) // 5 minutes

    const keyboard = {
      inline_keyboard: challenge.options.map((option, index) => [
        {
          text: option,
          callback_data: `verify_${chatId}_${userId}_${index}`,
        },
      ]),
    }

    const message = await this.bot.sendMessage(
      chatId,
      `🔐 <b>Verification Required</b>\n\n@${await this.getUserMention(userId)}, please solve this to verify you're human:\n\n<b>${challenge.question}</b>\n\nYou have 5 minutes to complete this verification.`,
      { reply_markup: keyboard },
    )

    if (message.result) {
      verificationData.messageId = message.result.message_id
      await this.redis.set(`verification:${chatId}:${userId}`, verificationData, { ex: 300 })
    }
  }

  async handleVerificationAttempt(chatId: number, userId: number, selectedOption: number): Promise<boolean> {
    const verificationData = (await this.redis.get(`verification:${chatId}:${userId}`)) as VerificationChallenge
    if (!verificationData) return false

    verificationData.attempts++

    if (selectedOption === verificationData.correctAnswer) {
      // Verification successful
      await this.bot.restrictChatMember(chatId, userId, {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
      })

      await this.bot.sendMessage(chatId, `✅ Verification successful! Welcome to the group!`)

      if (verificationData.messageId) {
        await this.bot.deleteMessage(chatId, verificationData.messageId)
      }

      await this.redis.del(`verification:${chatId}:${userId}`)
      return true
    } else {
      // Wrong answer
      if (verificationData.attempts >= 3) {
        // Ban user after 3 failed attempts
        await this.bot.kickChatMember(chatId, userId)
        await this.bot.sendMessage(chatId, `❌ Verification failed. User has been removed from the group.`)

        if (verificationData.messageId) {
          await this.bot.deleteMessage(chatId, verificationData.messageId)
        }

        await this.redis.del(`verification:${chatId}:${userId}`)
      } else {
        await this.redis.set(`verification:${chatId}:${userId}`, verificationData, { ex: 300 })
        await this.bot.sendMessage(
          chatId,
          `❌ Wrong answer. You have ${3 - verificationData.attempts} attempts remaining.`,
        )
      }
      return false
    }
  }

  private generateMathChallenge(): { question: string; answer: number; options: string[] } {
    const operations = ["+", "-", "×"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let num1: number, num2: number, answer: number

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        answer = num1 + num2
        break
      case "-":
        num1 = Math.floor(Math.random() * 20) + 10
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 - num2
        break
      case "×":
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 * num2
        break
      default:
        num1 = 5
        num2 = 3
        answer = 8
    }

    const question = `${num1} ${operation} ${num2} = ?`

    // Generate wrong options
    const wrongOptions = new Set<number>()
    while (wrongOptions.size < 3) {
      const wrong = answer + Math.floor(Math.random() * 10) - 5
      if (wrong !== answer && wrong > 0) {
        wrongOptions.add(wrong)
      }
    }

    const allOptions = [answer, ...Array.from(wrongOptions)]
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)
    const correctIndex = shuffledOptions.indexOf(answer)

    return {
      question,
      answer: correctIndex,
      options: shuffledOptions.map(String),
    }
  }

  private async getUserMention(userId: number): Promise<string> {
    // This would need to be implemented to get user info
    return `user_${userId}`
  }

  async getVerificationSettings(chatId: number): Promise<{ enabled: boolean; timeout: number }> {
    const settings = await this.redis.get(`verification_settings:${chatId}`)
    return (settings as { enabled: boolean; timeout: number }) || { enabled: false, timeout: 300 }
  }

  async updateVerificationSettings(chatId: number, settings: { enabled?: boolean; timeout?: number }) {
    const currentSettings = await this.getVerificationSettings(chatId)
    const newSettings = { ...currentSettings, ...settings }
    await this.redis.set(`verification_settings:${chatId}`, newSettings)
    return newSettings
  }
}
