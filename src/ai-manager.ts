import type { Ai } from "@cloudflare/ai"

export class AIManager {
  constructor(private ai: Ai) {}

  async analyzeSpam(text: string): Promise<{ isSpam: boolean; confidence: number; reason: string }> {
    try {
      const prompt = `Analyze this message for spam content. Consider promotional content, scams, excessive links, repetitive text, and inappropriate content.

Message: "${text}"

Respond with JSON format:
{
  "isSpam": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation"
}`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 200,
      })

      const result = JSON.parse(response.response as string)
      return {
        isSpam: result.isSpam || false,
        confidence: result.confidence || 0,
        reason: result.reason || "No specific reason",
      }
    } catch (error) {
      console.error("AI spam analysis error:", error)
      return { isSpam: false, confidence: 0, reason: "Analysis failed" }
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number; emotions: string[] }> {
    try {
      const prompt = `Analyze the sentiment and emotions in this message:

Message: "${text}"

Respond with JSON format:
{
  "sentiment": "positive/negative/neutral",
  "score": number (-1 to 1),
  "emotions": ["emotion1", "emotion2"]
}`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 150,
      })

      const result = JSON.parse(response.response as string)
      return {
        sentiment: result.sentiment || "neutral",
        score: result.score || 0,
        emotions: result.emotions || [],
      }
    } catch (error) {
      console.error("AI sentiment analysis error:", error)
      return { sentiment: "neutral", score: 0, emotions: [] }
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const prompt = `Translate this text to ${targetLanguage}:

"${text}"

Only respond with the translation, no additional text.`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 500,
      })

      return response.response as string
    } catch (error) {
      console.error("AI translation error:", error)
      return "Translation failed"
    }
  }

  async summarizeText(text: string, maxLength = 100): Promise<string> {
    try {
      const prompt = `Summarize this text in maximum ${maxLength} characters:

"${text}"

Provide a concise summary that captures the main points.`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: Math.ceil(maxLength / 2),
      })

      return response.response as string
    } catch (error) {
      console.error("AI summarization error:", error)
      return "Summarization failed"
    }
  }

  async generateResponse(context: string, userMessage: string): Promise<string> {
    try {
      const prompt = `You are a helpful group management bot assistant. Based on the context and user message, provide a helpful response.

Context: ${context}
User message: "${userMessage}"

Provide a helpful, friendly response (max 200 characters):`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 100,
      })

      return response.response as string
    } catch (error) {
      console.error("AI response generation error:", error)
      return "I'm sorry, I couldn't process your request right now."
    }
  }

  async moderateContent(text: string): Promise<{
    shouldModerate: boolean
    categories: string[]
    severity: number
  }> {
    try {
      const prompt = `Analyze this content for moderation. Check for hate speech, harassment, violence, adult content, and other inappropriate material.

Content: "${text}"

Respond with JSON format:
{
  "shouldModerate": boolean,
  "categories": ["category1", "category2"],
  "severity": number (1-10)
}`

      const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 150,
      })

      const result = JSON.parse(response.response as string)
      return {
        shouldModerate: result.shouldModerate || false,
        categories: result.categories || [],
        severity: result.severity || 0,
      }
    } catch (error) {
      console.error("AI content moderation error:", error)
      return { shouldModerate: false, categories: [], severity: 0 }
    }
  }
}
