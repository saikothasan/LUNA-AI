import { TelegramBot } from "./telegram-bot"
import { CommandHandler } from "./command-handler"
import { GroupManager } from "./group-manager"
import { AIManager } from "./ai-manager"
import { PollManager } from "./poll-manager"
import { VerificationManager } from "./verification-manager"
import { Redis } from "@upstash/redis/cloudflare"

export interface Env {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  AI: Ai
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // Initialize Redis client
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Initialize bot components
    const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN)
    const aiManager = new AIManager(env.AI)
    const groupManager = new GroupManager(redis, aiManager)
    const pollManager = new PollManager(redis, bot)
    const verificationManager = new VerificationManager(redis, bot)
    const commandHandler = new CommandHandler(bot, groupManager, aiManager, pollManager, verificationManager)

    // Handle webhook setup
    if (request.method === "GET" && url.pathname === "/setup") {
      const webhookUrl = `${url.origin}/webhook`
      const result = await bot.setWebhook(webhookUrl, env.TELEGRAM_WEBHOOK_SECRET)
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Handle Telegram webhooks
    if (request.method === "POST" && url.pathname === "/webhook") {
      try {
        // Verify webhook secret
        const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
          return new Response("Unauthorized", { status: 401 })
        }

        const update = (await request.json()) as TelegramUpdate
        await handleUpdate(update, bot, commandHandler, groupManager, pollManager, verificationManager)

        return new Response("OK")
      } catch (error) {
        console.error("Webhook error:", error)
        return new Response("Error", { status: 500 })
      }
    }

    return new Response("Advanced Telegram Group Management Bot with AI", {
      headers: { "Content-Type": "text/plain" },
    })
  },
}

async function handleUpdate(
  update: TelegramUpdate,
  bot: TelegramBot,
  commandHandler: CommandHandler,
  groupManager: GroupManager,
  pollManager: PollManager,
  verificationManager: VerificationManager,
) {
  // Handle messages
  if (update.message) {
    const message = update.message
    const chatId = message.chat.id
    const userId = message.from?.id

    // Only process group/supergroup messages
    if (message.chat.type !== "group" && message.chat.type !== "supergroup") {
      return
    }

    // Handle new members
    if (message.new_chat_members) {
      await groupManager.handleNewMembers(message, bot)
      await verificationManager.handleNewMembers(message)
      return
    }

    // Handle left members
    if (message.left_chat_member) {
      await groupManager.handleLeftMember(message, bot)
      return
    }

    // Handle poll answers
    if (message.poll) {
      await pollManager.handlePollUpdate(message)
      return
    }

    // Handle commands
    if (message.text?.startsWith("/")) {
      await commandHandler.handleCommand(message)
      return
    }

    // Handle regular messages (AI analysis, spam detection, etc.)
    await groupManager.handleMessage(message, bot)
  }

  // Handle callback queries (inline keyboard buttons)
  if (update.callback_query) {
    await commandHandler.handleCallbackQuery(update.callback_query)
  }

  // Handle poll answers
  if (update.poll_answer) {
    await pollManager.handlePollAnswer(update.poll_answer)
  }
}

// Enhanced Telegram API types
export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
  poll_answer?: TelegramPollAnswer
}

export interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  photo?: TelegramPhotoSize[]
  document?: TelegramDocument
  video?: TelegramVideo
  audio?: TelegramAudio
  voice?: TelegramVoice
  new_chat_members?: TelegramUser[]
  left_chat_member?: TelegramUser
  reply_to_message?: TelegramMessage
  poll?: TelegramPoll
  forward_from?: TelegramUser
  forward_from_chat?: TelegramChat
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: "private" | "group" | "supergroup" | "channel"
  title?: string
  username?: string
  description?: string
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface TelegramPoll {
  id: string
  question: string
  options: TelegramPollOption[]
  total_voter_count: number
  is_closed: boolean
  is_anonymous: boolean
  type: string
  allows_multiple_answers: boolean
}

export interface TelegramPollOption {
  text: string
  voter_count: number
}

export interface TelegramPollAnswer {
  poll_id: string
  user: TelegramUser
  option_ids: number[]
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramVideo {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  file_size?: number
}

export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  file_size?: number
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  file_size?: number
}

import type { Ai } from "@cloudflare/ai"
import type { ExecutionContext } from "@cloudflare/workers-types"
