import type { TelegramBot } from "./telegram-bot"
import type { GroupManager } from "./group-manager"
import type { AIManager } from "./ai-manager"
import type { PollManager } from "./poll-manager"
import type { VerificationManager } from "./verification-manager"
import type { TelegramMessage, TelegramCallbackQuery } from "./index"

export class CommandHandler {
  constructor(
    private bot: TelegramBot,
    private groupManager: GroupManager,
    private aiManager: AIManager,
    private pollManager: PollManager,
    private verificationManager: VerificationManager,
  ) {}

  async handleCommand(message: TelegramMessage) {
    const chatId = message.chat.id
    const userId = message.from?.id
    const text = message.text || ""
    const command = text.split(" ")[0].toLowerCase()
    const args = text.split(" ").slice(1)

    // Check if user is admin for admin commands
    const isAdmin = await this.isUserAdmin(chatId, userId!)

    switch (command) {
      case "/start":
        await this.handleStart(message)
        break

      case "/help":
        await this.handleHelp(message)
        break

      case "/rules":
        await this.handleRules(message)
        break

      case "/stats":
        await this.handleStats(message)
        break

      case "/translate":
        await this.handleTranslate(message, args)
        break

      case "/summarize":
        await this.handleSummarize(message)
        break

      case "/sentiment":
        await this.handleSentiment(message)
        break

      case "/poll":
        await this.handleCreatePoll(message, args)
        break

      case "/games":
        await this.handleGames(message)
        break

      case "/profile":
        await this.handleProfile(message)
        break

      // Admin commands
      case "/settings":
        if (isAdmin) await this.handleSettings(message)
        break

      case "/verification":
        if (isAdmin) await this.handleVerificationSettings(message)
        break

      case "/warn":
        if (isAdmin) await this.handleWarn(message, args)
        break

      case "/unwarn":
        if (isAdmin) await this.handleUnwarn(message, args)
        break

      case "/kick":
        if (isAdmin) await this.handleKick(message, args)
        break

      case "/ban":
        if (isAdmin) await this.handleBan(message, args)
        break

      case "/mute":
        if (isAdmin) await this.handleMute(message, args)
        break

      case "/setwelcome":
        if (isAdmin) await this.handleSetWelcome(message, args)
        break

      case "/analytics":
        if (isAdmin) await this.handleAnalytics(message)
        break

      default:
        // AI-powered response for unknown commands
        await this.handleAIResponse(message, command)
        break
    }
  }

  async handleCallbackQuery(query: TelegramCallbackQuery) {
    const data = query.data || ""
    const chatId = query.message?.chat.id!
    const userId = query.from.id

    // Parse callback data
    const [action, ...params] = data.split("_")

    switch (action) {
      case "rules":
        await this.handleRulesCallback(query)
        break

      case "help":
        await this.handleHelpCallback(query)
        break

      case "stats":
        await this.handleStatsCallback(query)
        break

      case "translate":
        await this.handleTranslateCallback(query)
        break

      case "games":
        await this.handleGamesCallback(query)
        break

      case "settings":
        await this.handleSettingsCallback(query, params[0])
        break

      case "verification":
        await this.handleVerificationCallback(query, params)
        break

      case "verify":
        await this.handleVerifyCallback(query, params)
        break

      case "vote":
        await this.handleVoteCallback(query, params)
        break

      case "results":
        await this.handlePollResultsCallback(query, params[0])
        break

      case "close":
        await this.handleClosePollCallback(query, params[0])
        break

      case "unmute":
        await this.handleUnmuteCallback(query, params)
        break

      case "appeal":
        await this.handleAppealCallback(query, params)
        break

      case "contact":
        await this.handleContactAdminCallback(query)
        break

      case "game":
        await this.handleGameCallback(query, params)
        break

      default:
        await this.bot.answerCallbackQuery(query.id, "Unknown action")
        break
    }
  }

  private async handleStart(message: TelegramMessage) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "📋 Help", callback_data: `help_${message.chat.id}` },
          { text: "📊 Stats", callback_data: `stats_${message.chat.id}` },
        ],
        [
          { text: "🎮 Games", callback_data: `games_${message.chat.id}` },
          { text: "🌐 Translate", callback_data: `translate_${message.chat.id}` },
        ],
        [{ text: "⚙️ Settings", callback_data: `settings_main_${message.chat.id}` }],
      ],
    }

    const text = `
🤖 <b>Advanced Group Management Bot with AI</b>

Welcome! I'm an intelligent bot that helps manage your Telegram group with:

🛡️ <b>AI-Powered Moderation</b>
• Smart spam detection
• Content analysis
• Sentiment monitoring

🌐 <b>Language Features</b>
• Auto-translation
• Text summarization
• Multi-language support

🎮 <b>Interactive Features</b>
• Polls and voting
• Games and quizzes
• User verification

📊 <b>Analytics</b>
• Detailed statistics
• User activity tracking
• Trend analysis

Use the buttons below to explore features!
    `

    await this.bot.sendMessage(message.chat.id, text, { reply_markup: keyboard })
  }

  private async handleHelp(message: TelegramMessage) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🛡️ Moderation", callback_data: `help_moderation` },
          { text: "🌐 AI Features", callback_data: `help_ai` },
        ],
        [
          { text: "🎮 Games", callback_data: `help_games` },
          { text: "📊 Analytics", callback_data: `help_analytics` },
        ],
        [{ text: "⚙️ Admin Commands", callback_data: `help_admin` }],
        [{ text: "🔙 Back to Main", callback_data: `start_${message.chat.id}` }],
      ],
    }

    await this.bot.sendMessage(message.chat.id, this.getHelpText(), { reply_markup: keyboard })
  }

  private async handleTranslate(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.text) {
      const keyboard = {
        inline_keyboard: [
          [
            { text: "🇺🇸 English", callback_data: `translate_en` },
            { text: "🇪🇸 Spanish", callback_data: `translate_es` },
          ],
          [
            { text: "🇫🇷 French", callback_data: `translate_fr` },
            { text: "🇩🇪 German", callback_data: `translate_de` },
          ],
          [
            { text: "🇮🇹 Italian", callback_data: `translate_it` },
            { text: "🇷🇺 Russian", callback_data: `translate_ru` },
          ],
        ],
      }

      await this.bot.sendMessage(
        message.chat.id,
        "🌐 Reply to a message to translate it, or choose a language for auto-translation:",
        { reply_markup: keyboard },
      )
      return
    }

    const targetLang = args[0] || "en"
    const textToTranslate = message.reply_to_message.text

    const translation = await this.aiManager.translateText(textToTranslate, targetLang)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Translate Back", callback_data: `translate_back_${message.reply_to_message.message_id}` },
          { text: "📋 Copy", callback_data: `copy_translation` },
        ],
      ],
    }

    await this.bot.sendMessage(
      message.chat.id,
      `🌐 <b>Translation (${targetLang.toUpperCase()}):</b>\n\n${translation}`,
      {
        reply_to_message_id: message.reply_to_message.message_id,
        reply_markup: keyboard,
      },
    )
  }

  private async handleSummarize(message: TelegramMessage) {
    if (!message.reply_to_message?.text) {
      await this.bot.sendMessage(message.chat.id, "📝 Reply to a message to summarize it.")
      return
    }

    const textToSummarize = message.reply_to_message.text
    const summary = await this.aiManager.summarizeText(textToSummarize)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📄 Full Text", callback_data: `show_full_${message.reply_to_message.message_id}` },
          { text: "🔄 Re-summarize", callback_data: `resummarize_${message.reply_to_message.message_id}` },
        ],
      ],
    }

    await this.bot.sendMessage(message.chat.id, `📝 <b>Summary:</b>\n\n${summary}`, {
      reply_to_message_id: message.reply_to_message.message_id,
      reply_markup: keyboard,
    })
  }

  private async handleSentiment(message: TelegramMessage) {
    if (!message.reply_to_message?.text) {
      await this.bot.sendMessage(message.chat.id, "😊 Reply to a message to analyze its sentiment.")
      return
    }

    const textToAnalyze = message.reply_to_message.text
    const sentiment = await this.aiManager.analyzeSentiment(textToAnalyze)

    const emoji = sentiment.sentiment === "positive" ? "😊" : sentiment.sentiment === "negative" ? "😞" : "😐"
    const scoreBar = "█".repeat(Math.abs(Math.round(sentiment.score * 10)))

    await this.bot.sendMessage(
      message.chat.id,
      `${emoji} <b>Sentiment Analysis:</b>\n\n<b>Sentiment:</b> ${sentiment.sentiment}\n<b>Score:</b> ${sentiment.score.toFixed(2)}\n<b>Intensity:</b> ${scoreBar}\n<b>Emotions:</b> ${sentiment.emotions.join(", ")}`,
      { reply_to_message_id: message.reply_to_message.message_id },
    )
  }

  private async handleCreatePoll(message: TelegramMessage, args: string[]) {
    if (args.length < 3) {
      const keyboard = {
        inline_keyboard: [
          [{ text: "📊 Quick Poll", callback_data: `quick_poll_${message.chat.id}` }],
          [{ text: "📋 Poll Templates", callback_data: `poll_templates_${message.chat.id}` }],
        ],
      }

      await this.bot.sendMessage(
        message.chat.id,
        "📊 <b>Create a Poll</b>\n\nUsage: /poll Question? Option1 Option2 Option3\n\nOr use the buttons below for quick options:",
        { reply_markup: keyboard },
      )
      return
    }

    const question = args[0]
    const options = args.slice(1)

    if (options.length < 2 || options.length > 10) {
      await this.bot.sendMessage(message.chat.id, "❌ Please provide 2-10 options for the poll.")
      return
    }

    await this.pollManager.createPoll(message.chat.id, message.from?.id!, question, options)
  }

  private async handleGames(message: TelegramMessage) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🎯 Quiz", callback_data: `game_quiz_${message.chat.id}` },
          { text: "🎲 Dice", callback_data: `game_dice_${message.chat.id}` },
        ],
        [
          { text: "🔤 Word Game", callback_data: `game_word_${message.chat.id}` },
          { text: "🧮 Math Challenge", callback_data: `game_math_${message.chat.id}` },
        ],
        [
          { text: "🎪 Random Fact", callback_data: `game_fact_${message.chat.id}` },
          { text: "🎭 Joke", callback_data: `game_joke_${message.chat.id}` },
        ],
      ],
    }

    await this.bot.sendMessage(message.chat.id, "🎮 <b>Choose a Game:</b>", { reply_markup: keyboard })
  }

  private async handleProfile(message: TelegramMessage) {
    const userId = message.from?.id!
    const chatId = message.chat.id

    const [warnings, messageCount, joinTime] = await Promise.all([
      this.groupManager.getUserWarnings(chatId, userId),
      // Get user message count
      0, // Placeholder
      // Get join time
      Date.now(), // Placeholder
    ])

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📊 Detailed Stats", callback_data: `user_stats_${userId}` },
          { text: "🏆 Achievements", callback_data: `user_achievements_${userId}` },
        ],
        [{ text: "⚙️ User Settings", callback_data: `user_settings_${userId}` }],
      ],
    }

    const profileText = `
👤 <b>Your Profile</b>

<b>Name:</b> ${message.from?.first_name}
<b>User ID:</b> ${userId}
<b>Warnings:</b> ${warnings}
<b>Messages:</b> ${messageCount}
<b>Member since:</b> ${new Date(joinTime).toLocaleDateString()}

Use the buttons below for more details!
    `

    await this.bot.sendMessage(chatId, profileText, { reply_markup: keyboard })
  }

  private async handleSettings(message: TelegramMessage) {
    const settings = await this.groupManager.getGroupSettings(message.chat.id)

    const keyboard = {
      inline_keyboard: [
        [
          { text: `Welcome: ${settings.welcomeEnabled ? "✅" : "❌"}`, callback_data: "settings_welcome" },
          { text: `Anti-spam: ${settings.antiSpamEnabled ? "✅" : "❌"}`, callback_data: "settings_antispam" },
        ],
        [
          { text: `AI Moderation: ${settings.aiModerationEnabled ? "✅" : "❌"}`, callback_data: "settings_ai" },
          { text: `Auto-translate: ${settings.autoTranslate ? "✅" : "❌"}`, callback_data: "settings_translate" },
        ],
        [
          { text: `Media Filter: ${settings.mediaFiltering ? "✅" : "❌"}`, callback_data: "settings_media" },
          { text: `Forward Filter: ${settings.forwardFiltering ? "✅" : "❌"}`, callback_data: "settings_forward" },
        ],
        [
          {
            text: `Sentiment Analysis: ${settings.sentimentAnalysis ? "✅" : "❌"}`,
            callback_data: "settings_sentiment",
          },
          { text: `Mute New Users: ${settings.muteNewUsers ? "✅" : "❌"}`, callback_data: "settings_mutenew" },
        ],
        [{ text: `Max Warnings: ${settings.maxWarnings}`, callback_data: "settings_maxwarnings" }],
        [{ text: "🔧 Advanced Settings", callback_data: "settings_advanced" }],
      ],
    }

    await this.bot.sendMessage(message.chat.id, "⚙️ <b>Group Settings</b>\n\nClick buttons to toggle settings:", {
      reply_markup: keyboard,
    })
  }

  private async handleVerificationSettings(message: TelegramMessage) {
    const settings = await this.verificationManager.getVerificationSettings(message.chat.id)

    const keyboard = {
      inline_keyboard: [
        [{ text: `Verification: ${settings.enabled ? "✅" : "❌"}`, callback_data: "verification_toggle" }],
        [{ text: `Timeout: ${settings.timeout / 60}min`, callback_data: "verification_timeout" }],
        [{ text: "🔧 Test Verification", callback_data: "verification_test" }],
      ],
    }

    await this.bot.sendMessage(
      message.chat.id,
      "🔐 <b>Verification Settings</b>\n\nConfigure new member verification:",
      { reply_markup: keyboard },
    )
  }

  private async handleAnalytics(message: TelegramMessage) {
    const stats = await this.groupManager.getGroupStats(message.chat.id)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📈 Detailed Stats", callback_data: `analytics_detailed_${message.chat.id}` },
          { text: "👥 User Activity", callback_data: `analytics_users_${message.chat.id}` },
        ],
        [
          { text: "📊 Message Trends", callback_data: `analytics_trends_${message.chat.id}` },
          { text: "🚫 Moderation Log", callback_data: `analytics_moderation_${message.chat.id}` },
        ],
        [{ text: "📋 Export Data", callback_data: `analytics_export_${message.chat.id}` }],
      ],
    }

    const analyticsText = `
📊 <b>Group Analytics</b>

👥 <b>Members:</b> ${(stats.joins as number) - (stats.leaves as number)}
📈 <b>Total Joins:</b> ${stats.joins}
📉 <b>Total Leaves:</b> ${stats.leaves}
💬 <b>Messages:</b> ${stats.messages}
🔥 <b>Active Users:</b> ${stats.activeUsers}

Use the buttons below for detailed analytics!
    `

    await this.bot.sendMessage(message.chat.id, analyticsText, { reply_markup: keyboard })
  }

  private async handleAIResponse(message: TelegramMessage, command: string) {
    const context = `Group management bot in Telegram group "${message.chat.title}"`
    const userMessage = message.text || ""

    const response = await this.aiManager.generateResponse(context, userMessage)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "👍", callback_data: `feedback_positive_${message.message_id}` },
          { text: "👎", callback_data: `feedback_negative_${message.message_id}` },
        ],
        [{ text: "🔄 Try Again", callback_data: `retry_ai_${message.message_id}` }],
      ],
    }

    await this.bot.sendMessage(message.chat.id, `🤖 ${response}`, {
      reply_to_message_id: message.message_id,
      reply_markup: keyboard,
    })
  }

  // Callback handlers
  private async handleRulesCallback(query: TelegramCallbackQuery) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "📝 Suggest Rule", callback_data: `suggest_rule_${query.message?.chat.id}` },
          { text: "❓ Rule Question", callback_data: `rule_question_${query.message?.chat.id}` },
        ],
        [{ text: "🔙 Back", callback_data: `start_${query.message?.chat.id}` }],
      ],
    }

    const rules = `
📋 <b>Group Rules</b>

1. 🤝 Be respectful to all members
2. 🚫 No spam, advertising, or self-promotion
3. 🎯 Stay on topic and relevant
4. 💬 No offensive language or harassment
5. 📱 Follow Telegram's Terms of Service
6. 🔗 No unauthorized links or forwarding
7. 📷 Media sharing requires permission
8. 🤖 Respect bot commands and moderation

<b>Violations may result in:</b>
⚠️ Warnings → 🔇 Mute → 🚫 Ban

Our AI system helps enforce these rules automatically.
    `

    await this.bot.editMessageText(query.message?.chat.id!, query.message?.message_id!, rules, keyboard)
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleHelpCallback(query: TelegramCallbackQuery) {
    await this.bot.answerCallbackQuery(query.id)
    await this.bot.sendMessage(query.message?.chat.id!, this.getDetailedHelpText())
  }

  private async handleStatsCallback(query: TelegramCallbackQuery) {
    const stats = await this.groupManager.getGroupStats(query.message?.chat.id!)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📈 Growth Chart", callback_data: `stats_growth_${query.message?.chat.id}` },
          { text: "👥 Top Users", callback_data: `stats_users_${query.message?.chat.id}` },
        ],
        [{ text: "🔄 Refresh", callback_data: `stats_${query.message?.chat.id}` }],
      ],
    }

    const statsText = `
📊 <b>Group Statistics</b>

👥 <b>Current Members:</b> ${(stats.joins as number) - (stats.leaves as number)}
📈 <b>Total Joins:</b> ${stats.joins}
📉 <b>Total Leaves:</b> ${stats.leaves}
💬 <b>Messages Today:</b> ${stats.messages}
🔥 <b>Active Users:</b> ${stats.activeUsers}
📊 <b>Growth Rate:</b> ${(((stats.joins as number) / Math.max(stats.leaves as number, 1)) * 100).toFixed(1)}%

<b>Last Updated:</b> ${new Date().toLocaleString()}
    `

    await this.bot.editMessageText(query.message?.chat.id!, query.message?.message_id!, statsText, keyboard)
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleTranslateCallback(query: TelegramCallbackQuery) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🇺🇸 English", callback_data: `set_translate_en` },
          { text: "🇪🇸 Spanish", callback_data: `set_translate_es` },
        ],
        [
          { text: "🇫🇷 French", callback_data: `set_translate_fr` },
          { text: "🇩🇪 German", callback_data: `set_translate_de` },
        ],
        [
          { text: "🇮🇹 Italian", callback_data: `set_translate_it` },
          { text: "🇷🇺 Russian", callback_data: `set_translate_ru` },
        ],
        [{ text: "❌ Disable Auto-translate", callback_data: `set_translate_off` }],
      ],
    }

    await this.bot.editMessageText(
      query.message?.chat.id!,
      query.message?.message_id!,
      "🌐 <b>Translation Settings</b>\n\nChoose your preferred language for auto-translation:",
      keyboard,
    )
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleGamesCallback(query: TelegramCallbackQuery) {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🎯 Trivia Quiz", callback_data: `game_trivia_${query.message?.chat.id}` },
          { text: "🎲 Lucky Number", callback_data: `game_lucky_${query.message?.chat.id}` },
        ],
        [
          { text: "🔤 Word Chain", callback_data: `game_wordchain_${query.message?.chat.id}` },
          { text: "🧮 Quick Math", callback_data: `game_quickmath_${query.message?.chat.id}` },
        ],
        [
          { text: "🎪 Fun Fact", callback_data: `game_funfact_${query.message?.chat.id}` },
          { text: "😂 Random Joke", callback_data: `game_randomjoke_${query.message?.chat.id}` },
        ],
        [{ text: "🏆 Leaderboard", callback_data: `game_leaderboard_${query.message?.chat.id}` }],
      ],
    }

    await this.bot.editMessageText(
      query.message?.chat.id!,
      query.message?.message_id!,
      "🎮 <b>Games & Entertainment</b>\n\nChoose a game to play:",
      keyboard,
    )
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleSettingsCallback(query: TelegramCallbackQuery, setting: string) {
    const chatId = query.message?.chat.id!
    const settings = await this.groupManager.getGroupSettings(chatId)

    switch (setting) {
      case "welcome":
        await this.groupManager.updateGroupSettings(chatId, {
          welcomeEnabled: !settings.welcomeEnabled,
        })
        break
      case "antispam":
        await this.groupManager.updateGroupSettings(chatId, {
          antiSpamEnabled: !settings.antiSpamEnabled,
        })
        break
      case "ai":
        await this.groupManager.updateGroupSettings(chatId, {
          aiModerationEnabled: !settings.aiModerationEnabled,
        })
        break
      case "translate":
        await this.groupManager.updateGroupSettings(chatId, {
          autoTranslate: !settings.autoTranslate,
        })
        break
      case "media":
        await this.groupManager.updateGroupSettings(chatId, {
          mediaFiltering: !settings.mediaFiltering,
        })
        break
      case "forward":
        await this.groupManager.updateGroupSettings(chatId, {
          forwardFiltering: !settings.forwardFiltering,
        })
        break
      case "sentiment":
        await this.groupManager.updateGroupSettings(chatId, {
          sentimentAnalysis: !settings.sentimentAnalysis,
        })
        break
      case "mutenew":
        await this.groupManager.updateGroupSettings(chatId, {
          muteNewUsers: !settings.muteNewUsers,
        })
        break
    }

    await this.bot.answerCallbackQuery(query.id, "Setting updated!")

    // Refresh settings display
    const newSettings = await this.groupManager.getGroupSettings(chatId)
    const keyboard = {
      inline_keyboard: [
        [
          { text: `Welcome: ${newSettings.welcomeEnabled ? "✅" : "❌"}`, callback_data: "settings_welcome" },
          { text: `Anti-spam: ${newSettings.antiSpamEnabled ? "✅" : "❌"}`, callback_data: "settings_antispam" },
        ],
        [
          { text: `AI Moderation: ${newSettings.aiModerationEnabled ? "✅" : "❌"}`, callback_data: "settings_ai" },
          { text: `Auto-translate: ${newSettings.autoTranslate ? "✅" : "❌"}`, callback_data: "settings_translate" },
        ],
        [
          { text: `Media Filter: ${newSettings.mediaFiltering ? "✅" : "❌"}`, callback_data: "settings_media" },
          { text: `Forward Filter: ${newSettings.forwardFiltering ? "✅" : "❌"}`, callback_data: "settings_forward" },
        ],
        [
          {
            text: `Sentiment Analysis: ${newSettings.sentimentAnalysis ? "✅" : "❌"}`,
            callback_data: "settings_sentiment",
          },
          { text: `Mute New Users: ${newSettings.muteNewUsers ? "✅" : "❌"}`, callback_data: "settings_mutenew" },
        ],
        [{ text: `Max Warnings: ${newSettings.maxWarnings}`, callback_data: "settings_maxwarnings" }],
        [{ text: "🔧 Advanced Settings", callback_data: "settings_advanced" }],
      ],
    }

    await this.bot.editMessageText(
      chatId,
      query.message?.message_id!,
      "⚙️ <b>Group Settings</b>\n\nClick buttons to toggle settings:",
      keyboard,
    )
  }

  private async handleVerifyCallback(query: TelegramCallbackQuery, params: string[]) {
    const [chatId, userId, selectedOption] = params.map(Number)

    const success = await this.verificationManager.handleVerificationAttempt(chatId, userId, selectedOption)

    if (success) {
      await this.bot.answerCallbackQuery(query.id, "✅ Verification successful!")
    } else {
      await this.bot.answerCallbackQuery(query.id, "❌ Wrong answer, try again!")
    }
  }

  private async handleVoteCallback(query: TelegramCallbackQuery, params: string[]) {
    const [pollId, optionIndex] = params
    const userId = query.from.id

    const success = await this.pollManager.votePoll(pollId, userId, Number.parseInt(optionIndex))

    if (success) {
      await this.bot.answerCallbackQuery(query.id, "✅ Vote recorded!")
    } else {
      await this.bot.answerCallbackQuery(query.id, "❌ Voting failed or poll expired!")
    }
  }

  private async handlePollResultsCallback(query: TelegramCallbackQuery, pollId: string) {
    const results = await this.pollManager.formatPollResults(pollId)
    await this.bot.answerCallbackQuery(query.id)
    await this.bot.sendMessage(query.message?.chat.id!, results)
  }

  private async handleGameCallback(query: TelegramCallbackQuery, params: string[]) {
    const [gameType, chatId] = params

    switch (gameType) {
      case "trivia":
        await this.handleTriviaGame(query, Number.parseInt(chatId))
        break
      case "lucky":
        await this.handleLuckyNumberGame(query, Number.parseInt(chatId))
        break
      case "funfact":
        await this.handleFunFactGame(query, Number.parseInt(chatId))
        break
      case "randomjoke":
        await this.handleRandomJokeGame(query, Number.parseInt(chatId))
        break
    }
  }

  private async handleTriviaGame(query: TelegramCallbackQuery, chatId: number) {
    const triviaQuestion = await this.aiManager.generateResponse(
      "Generate a trivia question with 4 multiple choice answers",
      "Create an interesting trivia question",
    )

    const keyboard = {
      inline_keyboard: [
        [
          { text: "A", callback_data: `trivia_answer_A_${chatId}` },
          { text: "B", callback_data: `trivia_answer_B_${chatId}` },
        ],
        [
          { text: "C", callback_data: `trivia_answer_C_${chatId}` },
          { text: "D", callback_data: `trivia_answer_D_${chatId}` },
        ],
      ],
    }

    await this.bot.editMessageText(
      chatId,
      query.message?.message_id!,
      `🎯 <b>Trivia Time!</b>\n\n${triviaQuestion}`,
      keyboard,
    )
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleLuckyNumberGame(query: TelegramCallbackQuery, chatId: number) {
    const luckyNumber = Math.floor(Math.random() * 100) + 1
    const userNumber = Math.floor(Math.random() * 100) + 1

    const result = Math.abs(luckyNumber - userNumber) <= 10 ? "🎉 You win!" : "😅 Try again!"

    await this.bot.editMessageText(
      chatId,
      query.message?.message_id!,
      `🎲 <b>Lucky Number Game</b>\n\n🎯 Lucky Number: ${luckyNumber}\n🎮 Your Number: ${userNumber}\n\n${result}`,
    )
    await this.bot.answerCallbackQuery(query.id, result)
  }

  private async handleFunFactGame(query: TelegramCallbackQuery, chatId: number) {
    const funFact = await this.aiManager.generateResponse(
      "Generate an interesting fun fact",
      "Tell me something interesting",
    )

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🤔 Another Fact", callback_data: `game_funfact_${chatId}` },
          { text: "🔄 Different Topic", callback_data: `games_${chatId}` },
        ],
      ],
    }

    await this.bot.editMessageText(chatId, query.message?.message_id!, `🎪 <b>Fun Fact</b>\n\n${funFact}`, keyboard)
    await this.bot.answerCallbackQuery(query.id)
  }

  private async handleRandomJokeGame(query: TelegramCallbackQuery, chatId: number) {
    const joke = await this.aiManager.generateResponse("Tell a clean, family-friendly joke", "Make me laugh")

    const keyboard = {
      inline_keyboard: [
        [
          { text: "😂 Another Joke", callback_data: `game_randomjoke_${chatId}` },
          { text: "🎮 Other Games", callback_data: `games_${chatId}` },
        ],
      ],
    }

    await this.bot.editMessageText(chatId, query.message?.message_id!, `😂 <b>Random Joke</b>\n\n${joke}`, keyboard)
    await this.bot.answerCallbackQuery(query.id)
  }

  // Helper methods
  private getHelpText(): string {
    return `
📋 <b>Bot Commands & Features</b>

🤖 <b>AI-Powered Features:</b>
/translate [lang] - Translate messages
/summarize - Summarize long text
/sentiment - Analyze message sentiment

🎮 <b>Interactive Features:</b>
/poll [question] [options] - Create polls
/games - Play games and quizzes
/profile - View your profile

📊 <b>Information:</b>
/help - Show this help
/rules - Display group rules
/stats - Group statistics

👑 <b>Admin Commands:</b>
/settings - Configure bot settings
/verification - Setup user verification
/warn, /kick, /ban, /mute - Moderation
/analytics - Detailed analytics

🌟 <b>Special Features:</b>
• AI spam detection
• Auto-translation
• Sentiment analysis
• User verification system
• Advanced analytics
    `
  }

  private getDetailedHelpText(): string {
    return `
📚 <b>Detailed Help Guide</b>

🛡️ <b>Moderation Features:</b>
• AI-powered spam detection
• Content moderation with sentiment analysis
• Automatic warning system
• Media and forward filtering
• User verification for new members

🌐 <b>AI Features:</b>
• Smart translation (50+ languages)
• Text summarization
• Sentiment analysis
• Intelligent responses
• Content moderation

🎮 <b>Games & Entertainment:</b>
• Trivia quizzes
• Math challenges
• Word games
• Fun facts and jokes
• User leaderboards

📊 <b>Analytics:</b>
• Real-time group statistics
• User activity tracking
• Message trend analysis
• Moderation logs
• Export capabilities

⚙️ <b>Customization:</b>
• Flexible settings per group
• Custom welcome messages
• Configurable moderation rules
• Language preferences
• Feature toggles

For specific help with any feature, use the inline buttons or contact an admin!
    `
  }

  // Admin command handlers (continued from previous implementation)
  private async handleWarn(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.from) {
      await this.bot.sendMessage(message.chat.id, "Please reply to a message to warn the user.")
      return
    }

    const targetUser = message.reply_to_message.from
    const reason = args.join(" ") || "No reason specified"

    const warnings = (await this.groupManager.getUserWarnings(message.chat.id, targetUser.id)) + 1
    const settings = await this.groupManager.getGroupSettings(message.chat.id)

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Appeal", callback_data: `appeal_${message.chat.id}_${targetUser.id}` },
          { text: "📞 Contact Admin", callback_data: `contact_admin_${message.chat.id}` },
        ],
      ],
    }

    if (warnings >= settings.maxWarnings) {
      await this.bot.kickChatMember(message.chat.id, targetUser.id)
      await this.bot.sendMessage(
        message.chat.id,
        `🚫 ${targetUser.first_name} has been banned for reaching the warning limit.`,
        { reply_markup: keyboard },
      )
    } else {
      await this.bot.sendMessage(
        message.chat.id,
        `⚠️ Warning ${warnings}/${settings.maxWarnings} for ${targetUser.first_name}.\nReason: ${reason}`,
        { reply_markup: keyboard },
      )
    }
  }

  private async handleUnwarn(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.from) {
      await this.bot.sendMessage(message.chat.id, "Please reply to a message to unwarn the user.")
      return
    }

    const targetUser = message.reply_to_message.from
    await this.groupManager.clearUserWarnings(message.chat.id, targetUser.id)

    await this.bot.sendMessage(message.chat.id, `✅ Warnings cleared for ${targetUser.first_name}.`)
  }

  private async handleKick(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.from) {
      await this.bot.sendMessage(message.chat.id, "Please reply to a message to kick the user.")
      return
    }

    const targetUser = message.reply_to_message.from
    const reason = args.join(" ") || "No reason specified"

    await this.bot.kickChatMember(message.chat.id, targetUser.id)
    await this.bot.sendMessage(message.chat.id, `👢 ${targetUser.first_name} has been kicked.\nReason: ${reason}`)
  }

  private async handleBan(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.from) {
      await this.bot.sendMessage(message.chat.id, "Please reply to a message to ban the user.")
      return
    }

    const targetUser = message.reply_to_message.from
    const reason = args.join(" ") || "No reason specified"

    await this.bot.kickChatMember(message.chat.id, targetUser.id, 0) // Permanent ban
    await this.bot.sendMessage(
      message.chat.id,
      `🚫 ${targetUser.first_name} has been banned permanently.\nReason: ${reason}`,
    )
  }

  private async handleMute(message: TelegramMessage, args: string[]) {
    if (!message.reply_to_message?.from) {
      await this.bot.sendMessage(message.chat.id, "Please reply to a message to mute the user.")
      return
    }

    const targetUser = message.reply_to_message.from
    const duration = Number.parseInt(args[0]) || 60 // Default 60 minutes
    const untilDate = Math.floor(Date.now() / 1000) + duration * 60

    await this.bot.restrictChatMember(
      message.chat.id,
      targetUser.id,
      {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
      untilDate,
    )

    await this.bot.sendMessage(message.chat.id, `🔇 ${targetUser.first_name} has been muted for ${duration} minutes.`)
  }

  private async handleSetWelcome(message: TelegramMessage, args: string[]) {
    const welcomeMessage = args.join(" ")

    if (!welcomeMessage) {
      await this.bot.sendMessage(
        message.chat.id,
        "Please provide a welcome message.\nExample: /setwelcome Welcome to our amazing group!",
      )
      return
    }

    await this.groupManager.updateGroupSettings(message.chat.id, {
      welcomeMessage,
    })

    await this.bot.sendMessage(message.chat.id, "✅ Welcome message updated successfully!")
  }

  private async isUserAdmin(chatId: number, userId: number): Promise<boolean> {
    try {
      const member = await this.bot.getChatMember(chatId, userId)
      return member.result?.status === "administrator" || member.result?.status === "creator"
    } catch {
      return false
    }
  }
}
