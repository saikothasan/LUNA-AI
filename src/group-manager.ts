import type { Redis } from "@upstash/redis/cloudflare"
import type { TelegramBot } from "./telegram-bot"
import type { TelegramMessage } from "./index"
import type { AIManager } from "./ai-manager"

export interface GroupSettings {
  welcomeMessage?: string
  welcomeEnabled: boolean
  antiSpamEnabled: boolean
  aiModerationEnabled: boolean
  maxWarnings: number
  muteNewUsers: boolean
  deleteServiceMessages: boolean
  allowedLinks: string[]
  bannedWords: string[]
  autoTranslate: boolean
  targetLanguage: string
  sentimentAnalysis: boolean
  mediaFiltering: boolean
  forwardFiltering: boolean
  linkPreviewDisabled: boolean
}

export class GroupManager {
  constructor(
    private redis: Redis,
    private aiManager: AIManager,
  ) {}

  async getGroupSettings(chatId: number): Promise<GroupSettings> {
    const settings = await this.redis.get(`group:${chatId}:settings`)
    return (
      (settings as GroupSettings) || {
        welcomeEnabled: true,
        antiSpamEnabled: true,
        aiModerationEnabled: true,
        maxWarnings: 3,
        muteNewUsers: false,
        deleteServiceMessages: true,
        allowedLinks: [],
        bannedWords: ["spam", "scam"],
        autoTranslate: false,
        targetLanguage: "en",
        sentimentAnalysis: false,
        mediaFiltering: false,
        forwardFiltering: false,
        linkPreviewDisabled: false,
      }
    )
  }

  async updateGroupSettings(chatId: number, settings: Partial<GroupSettings>) {
    const currentSettings = await this.getGroupSettings(chatId)
    const newSettings = { ...currentSettings, ...settings }
    await this.redis.set(`group:${chatId}:settings`, newSettings)
    return newSettings
  }

  async handleNewMembers(message: TelegramMessage, bot: TelegramBot) {
    const chatId = message.chat.id
    const settings = await this.getGroupSettings(chatId)

    if (!message.new_chat_members) return

    for (const newMember of message.new_chat_members) {
      if (newMember.is_bot) continue

      // Send welcome message with enhanced keyboard
      if (settings.welcomeEnabled) {
        const welcomeText =
          settings.welcomeMessage ||
          `🎉 Welcome to ${message.chat.title}, ${newMember.first_name}!\n\nPlease read our rules and enjoy your stay! Use the buttons below to get started.`

        const keyboard = {
          inline_keyboard: [
            [
              { text: "📋 Rules", callback_data: `rules_${chatId}` },
              { text: "❓ Help", callback_data: `help_${chatId}` },
            ],
            [
              { text: "📊 Group Stats", callback_data: `stats_${chatId}` },
              { text: "🌐 Translate", callback_data: `translate_${chatId}` },
            ],
            [
              { text: "🎮 Games", callback_data: `games_${chatId}` },
              { text: "🔧 Settings", callback_data: `user_settings_${chatId}` },
            ],
          ],
        }

        await bot.sendMessage(chatId, welcomeText, { reply_markup: keyboard })
      }

      // Mute new users if enabled
      if (settings.muteNewUsers) {
        await bot.restrictChatMember(
          chatId,
          newMember.id,
          {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
          },
          Math.floor(Date.now() / 1000) + 300,
        )

        const unmuteKeyboard = {
          inline_keyboard: [[{ text: "🔓 Unmute Me", callback_data: `unmute_${chatId}_${newMember.id}` }]],
        }

        await bot.sendMessage(
          chatId,
          `🔇 ${newMember.first_name}, you've been temporarily muted for 5 minutes. Click the button below when you're ready to participate!`,
          { reply_markup: unmuteKeyboard },
        )
      }

      // Track user join
      await this.redis.incr(`group:${chatId}:stats:joins`)
      await this.redis.set(`user:${newMember.id}:joined:${chatId}`, Date.now())
    }

    // Delete service message if enabled
    if (settings.deleteServiceMessages) {
      await bot.deleteMessage(chatId, message.message_id)
    }
  }

  async handleLeftMember(message: TelegramMessage, bot: TelegramBot) {
    const chatId = message.chat.id
    const settings = await this.getGroupSettings(chatId)

    if (message.left_chat_member) {
      await this.redis.incr(`group:${chatId}:stats:leaves`)

      // Delete service message if enabled
      if (settings.deleteServiceMessages) {
        await bot.deleteMessage(chatId, message.message_id)
      }
    }
  }

  async handleMessage(message: TelegramMessage, bot: TelegramBot) {
    const chatId = message.chat.id
    const userId = message.from?.id
    const settings = await this.getGroupSettings(chatId)

    if (!userId) return

    // Handle different message types
    if (message.text) {
      await this.handleTextMessage(message, bot, settings)
    } else if (message.photo || message.video || message.document) {
      await this.handleMediaMessage(message, bot, settings)
    } else if (message.forward_from || message.forward_from_chat) {
      await this.handleForwardedMessage(message, bot, settings)
    }

    // Track message stats
    await this.redis.incr(`group:${chatId}:stats:messages`)
    await this.redis.incr(`user:${userId}:messages:${chatId}`)

    // Update user activity
    await this.redis.set(`user:${userId}:last_activity:${chatId}`, Date.now())
  }

  private async handleTextMessage(message: TelegramMessage, bot: TelegramBot, settings: GroupSettings) {
    const chatId = message.chat.id
    const userId = message.from?.id!
    const text = message.text!

    // AI-powered spam detection
    if (settings.aiModerationEnabled) {
      const spamAnalysis = await this.aiManager.analyzeSpam(text)

      if (spamAnalysis.isSpam && spamAnalysis.confidence > 0.7) {
        await bot.deleteMessage(chatId, message.message_id)
        await this.addWarning(chatId, userId, `AI detected spam: ${spamAnalysis.reason}`)

        const keyboard = {
          inline_keyboard: [
            [
              { text: "🔄 Appeal", callback_data: `appeal_${chatId}_${userId}` },
              { text: "📞 Contact Admin", callback_data: `contact_admin_${chatId}` },
            ],
          ],
        }

        await bot.sendMessage(
          chatId,
          `🤖 AI detected spam from ${message.from?.first_name}. Message removed.\nReason: ${spamAnalysis.reason}`,
          { reply_markup: keyboard },
        )
        return
      }
    }

    // Traditional spam checks
    if (settings.antiSpamEnabled) {
      const isSpam = await this.checkForSpam(message, settings)
      if (isSpam) {
        await bot.deleteMessage(chatId, message.message_id)
        await this.handleSpamDetection(chatId, userId, bot, settings)
        return
      }
    }

    // Auto-translation
    if (settings.autoTranslate && settings.targetLanguage !== "en") {
      const translation = await this.aiManager.translateText(text, settings.targetLanguage)
      if (translation && translation !== text) {
        const keyboard = {
          inline_keyboard: [[{ text: "🌐 Show Original", callback_data: `original_${message.message_id}` }]],
        }

        await bot.sendMessage(chatId, `🌐 <b>Translation:</b>\n${translation}`, {
          reply_to_message_id: message.message_id,
          reply_markup: keyboard,
        })
      }
    }

    // Sentiment analysis
    if (settings.sentimentAnalysis) {
      const sentiment = await this.aiManager.analyzeSentiment(text)
      if (sentiment.sentiment === "negative" && sentiment.score < -0.7) {
        // Store negative sentiment for admin review
        await this.redis.lpush(`negative_messages:${chatId}`, {
          userId,
          messageId: message.message_id,
          text,
          sentiment: sentiment.sentiment,
          score: sentiment.score,
          timestamp: Date.now(),
        })
      }
    }
  }

  private async handleMediaMessage(message: TelegramMessage, bot: TelegramBot, settings: GroupSettings) {
    if (!settings.mediaFiltering) return

    const chatId = message.chat.id
    const userId = message.from?.id!

    // Check if user has permission to send media
    const userLevel = await this.getUserLevel(chatId, userId)
    if (userLevel < 2) {
      await bot.deleteMessage(chatId, message.message_id)

      const keyboard = {
        inline_keyboard: [[{ text: "📝 Request Permission", callback_data: `request_media_${chatId}_${userId}` }]],
      }

      await bot.sendMessage(
        chatId,
        `📷 ${message.from?.first_name}, you need permission to send media. Please request access from admins.`,
        { reply_markup: keyboard },
      )
    }
  }

  private async handleForwardedMessage(message: TelegramMessage, bot: TelegramBot, settings: GroupSettings) {
    if (!settings.forwardFiltering) return

    const chatId = message.chat.id
    const userId = message.from?.id!

    // Check if forwarded messages are allowed
    const userLevel = await this.getUserLevel(chatId, userId)
    if (userLevel < 3) {
      await bot.deleteMessage(chatId, message.message_id)

      await bot.sendMessage(chatId, `↩️ ${message.from?.first_name}, forwarded messages are restricted in this group.`, {
        reply_to_message_id: message.message_id,
      })
    }
  }

  private async checkForSpam(message: TelegramMessage, settings: GroupSettings): Promise<boolean> {
    if (!message.text) return false

    const text = message.text.toLowerCase()

    // Check for banned words
    for (const word of settings.bannedWords) {
      if (text.includes(word.toLowerCase())) {
        return true
      }
    }

    // Check for unauthorized links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex)

    if (urls) {
      for (const url of urls) {
        const isAllowed = settings.allowedLinks.some((allowed) => url.includes(allowed))
        if (!isAllowed) {
          return true
        }
      }
    }

    // Check for excessive caps
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length
    if (capsRatio > 0.7 && text.length > 10) {
      return true
    }

    // Check for repetitive messages
    const userId = message.from?.id!
    const recentMessages = await this.redis.lrange(`recent_messages:${message.chat.id}:${userId}`, 0, 4)
    const similarCount = recentMessages.filter((msg) => msg === text).length
    if (similarCount >= 3) {
      return true
    }

    // Store recent message
    await this.redis.lpush(`recent_messages:${message.chat.id}:${userId}`, text)
    await this.redis.ltrim(`recent_messages:${message.chat.id}:${userId}`, 0, 9)
    await this.redis.expire(`recent_messages:${message.chat.id}:${userId}`, 300)

    return false
  }

  private async handleSpamDetection(chatId: number, userId: number, bot: TelegramBot, settings: GroupSettings) {
    const warnings = await this.addWarning(chatId, userId, "Spam detected")

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Appeal", callback_data: `appeal_${chatId}_${userId}` },
          { text: "📞 Contact Admin", callback_data: `contact_admin_${chatId}` },
        ],
      ],
    }

    if (warnings >= settings.maxWarnings) {
      await bot.kickChatMember(chatId, userId)
      await bot.sendMessage(chatId, `🚫 User has been banned for repeated spam violations.`, { reply_markup: keyboard })
      await this.redis.del(`warnings:${chatId}:${userId}`)
    } else {
      await bot.sendMessage(chatId, `⚠️ Warning ${warnings}/${settings.maxWarnings}. Reason: Spam detected.`, {
        reply_markup: keyboard,
      })
    }
  }

  private async addWarning(chatId: number, userId: number, reason: string): Promise<number> {
    const key = `warnings:${chatId}:${userId}`
    const warnings = await this.redis.incr(key)
    await this.redis.expire(key, 86400) // Expire after 24 hours

    // Store warning details
    await this.redis.lpush(`warning_details:${chatId}:${userId}`, {
      reason,
      timestamp: Date.now(),
      warningNumber: warnings,
    })

    return warnings
  }

  async getUserWarnings(chatId: number, userId: number): Promise<number> {
    const warnings = await this.redis.get(`warnings:${chatId}:${userId}`)
    return (warnings as number) || 0
  }

  async clearUserWarnings(chatId: number, userId: number) {
    await this.redis.del(`warnings:${chatId}:${userId}`)
    await this.redis.del(`warning_details:${chatId}:${userId}`)
  }

  async getGroupStats(chatId: number) {
    const [joins, leaves, messages, activeUsers] = await Promise.all([
      this.redis.get(`group:${chatId}:stats:joins`) || 0,
      this.redis.get(`group:${chatId}:stats:leaves`) || 0,
      this.redis.get(`group:${chatId}:stats:messages`) || 0,
      this.redis.scard(`active_users:${chatId}`) || 0,
    ])

    return { joins, leaves, messages, activeUsers }
  }

  private async getUserLevel(chatId: number, userId: number): Promise<number> {
    // 1 = new user, 2 = regular, 3 = trusted, 4 = admin
    const joinTime = await this.redis.get(`user:${userId}:joined:${chatId}`)
    const messageCount = ((await this.redis.get(`user:${userId}:messages:${chatId}`)) as number) || 0
    const warnings = await this.getUserWarnings(chatId, userId)

    if (!joinTime) return 1

    const daysSinceJoin = (Date.now() - (joinTime as number)) / (1000 * 60 * 60 * 24)

    if (warnings > 0) return 1
    if (daysSinceJoin < 1) return 1
    if (messageCount < 10) return 1
    if (daysSinceJoin < 7 || messageCount < 50) return 2
    if (daysSinceJoin < 30 || messageCount < 200) return 3

    return 3
  }
}
