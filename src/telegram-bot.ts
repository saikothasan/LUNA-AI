export class TelegramBot {
  private baseUrl: string

  constructor(private token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`
  }

  async setWebhook(url: string, secretToken: string) {
    const response = await fetch(`${this.baseUrl}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secretToken,
        allowed_updates: ["message", "callback_query", "poll_answer"],
      }),
    })
    return response.json()
  }

  async sendMessage(chatId: number, text: string, options: any = {}) {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...options,
      }),
    })
    return response.json()
  }

  async sendPoll(
    chatId: number,
    question: string,
    options: string[],
    isAnonymous = true,
    allowsMultipleAnswers = false,
  ) {
    const response = await fetch(`${this.baseUrl}/sendPoll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        question,
        options,
        is_anonymous: isAnonymous,
        allows_multiple_answers: allowsMultipleAnswers,
      }),
    })
    return response.json()
  }

  async deleteMessage(chatId: number, messageId: number) {
    const response = await fetch(`${this.baseUrl}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    })
    return response.json()
  }

  async kickChatMember(chatId: number, userId: number, untilDate?: number) {
    const response = await fetch(`${this.baseUrl}/kickChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        until_date: untilDate,
      }),
    })
    return response.json()
  }

  async restrictChatMember(chatId: number, userId: number, permissions: any, untilDate?: number) {
    const response = await fetch(`${this.baseUrl}/restrictChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
        permissions,
        until_date: untilDate,
      }),
    })
    return response.json()
  }

  async getChatMember(chatId: number, userId: number) {
    const response = await fetch(`${this.baseUrl}/getChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    })
    return response.json()
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean) {
    const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    })
    return response.json()
  }

  async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    const response = await fetch(`${this.baseUrl}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    })
    return response.json()
  }

  async getFile(fileId: string) {
    const response = await fetch(`${this.baseUrl}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id: fileId,
      }),
    })
    return response.json()
  }

  async sendPhoto(chatId: number, photo: string, caption?: string, options: any = {}) {
    const response = await fetch(`${this.baseUrl}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        caption,
        parse_mode: "HTML",
        ...options,
      }),
    })
    return response.json()
  }

  async sendDocument(chatId: number, document: string, caption?: string, options: any = {}) {
    const response = await fetch(`${this.baseUrl}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        document,
        caption,
        parse_mode: "HTML",
        ...options,
      }),
    })
    return response.json()
  }
}
