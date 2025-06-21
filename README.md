# Advanced Telegram Group Management Bot with AI

A comprehensive Telegram bot built with Cloudflare Workers, TypeScript, and AI integration for intelligent group management.

## 🚀 Features

### 🤖 AI-Powered Moderation
- **Smart Spam Detection**: AI analyzes messages for spam patterns
- **Content Moderation**: Automatic detection of inappropriate content
- **Sentiment Analysis**: Monitor group mood and detect negative interactions
- **Intelligent Responses**: AI-generated responses to user queries

### 🛡️ Advanced Moderation Tools
- **Warning System**: Progressive warnings with automatic actions
- **User Verification**: Math-based challenges for new members
- **Media Filtering**: Control image, video, and document sharing
- **Forward Filtering**: Prevent unauthorized message forwarding
- **Link Management**: Whitelist/blacklist URL domains

### 🌐 Language Features
- **Auto-Translation**: Real-time message translation (50+ languages)
- **Text Summarization**: AI-powered text summarization
- **Multi-language Support**: Interface available in multiple languages

### 🎮 Interactive Features
- **Custom Polls**: Advanced polling system with analytics
- **Games & Quizzes**: Trivia, math challenges, word games
- **User Profiles**: Detailed user statistics and achievements
- **Leaderboards**: Gamification with user rankings

### 📊 Advanced Analytics
- **Real-time Statistics**: Live group metrics and trends
- **User Activity Tracking**: Individual user behavior analysis
- **Moderation Logs**: Comprehensive action history
- **Export Capabilities**: Data export for external analysis

### ⚙️ Comprehensive Settings
- **Granular Controls**: Fine-tune every aspect of bot behavior
- **Per-Group Configuration**: Different settings for each group
- **Admin Dashboard**: Easy-to-use settings interface
- **Backup & Restore**: Configuration backup system

## 🔧 Setup Instructions

### 1. Prerequisites
- Cloudflare Workers account
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Upstash Redis database

### 2. Create Telegram Bot
\`\`\`bash
# Message @BotFather on Telegram
/newbot
# Follow instructions and save your bot token
\`\`\`

### 3. Set up Upstash Redis
1. Create account at [Upstash](https://upstash.com)
2. Create new Redis database
3. Copy REST URL and token

### 4. Configure Environment
Update `wrangler.toml`:
\`\`\`toml
[vars]
TELEGRAM_BOT_TOKEN = "your_bot_token_here"
TELEGRAM_WEBHOOK_SECRET = "your_secret_key_here"
UPSTASH_REDIS_REST_URL = "your_redis_url_here"
UPSTASH_REDIS_REST_TOKEN = "your_redis_token_here"

[ai]
binding = "AI"
\`\`\`

### 5. Deploy
\`\`\`bash
npm install
npm run deploy
\`\`\`

### 6. Initialize Webhook
\`\`\`bash
curl https://your-worker-url.workers.dev/setup
\`\`\`

## 📱 Commands

### General Commands
- `/start` - Initialize bot with main menu
- `/help` - Comprehensive help system
- `/rules` - Display group rules
- `/stats` - Group statistics
- `/profile` - User profile and statistics

### AI Features
- `/translate [language]` - Translate messages
- `/summarize` - Summarize long text
- `/sentiment` - Analyze message sentiment

### Interactive Features
- `/poll [question] [options]` - Create custom polls
- `/games` - Access games and entertainment
- `/verify` - Manual verification trigger

### Admin Commands
- `/settings` - Bot configuration panel
- `/verification` - User verification settings
- `/analytics` - Detailed group analytics
- `/warn [reply]` - Warn users
- `/kick [reply]` - Remove users
- `/ban [reply]` - Ban users permanently
- `/mute [reply] [duration]` - Temporarily mute users
- `/setwelcome [message]` - Set custom welcome message

## 🎯 Usage Examples

### Setting up Auto-Translation
\`\`\`
1. Use /settings command
2. Toggle "Auto-translate" option
3. Choose target language
4. Messages will be automatically translated
\`\`\`

### Creating Interactive Polls
\`\`\`
/poll "What's your favorite programming language?" JavaScript Python Go Rust
\`\`\`

### AI-Powered Moderation
\`\`\`
1. Enable "AI Moderation" in settings
2. Bot automatically detects spam and inappropriate content
3. Configurable confidence thresholds
4. Appeals system for false positives
\`\`\`

## 🏗️ Architecture

### Core Components
- **AIManager**: Cloudflare AI integration for intelligent features
- **GroupManager**: Group settings and moderation logic
- **CommandHandler**: Command processing and user interactions
- **PollManager**: Advanced polling system
- **VerificationManager**: User verification system
- **TelegramBot**: Telegram API communication layer

### Data Storage
- **Redis**: Fast, persistent storage for:
  - Group settings and configurations
  - User statistics and profiles
  - Moderation logs and warnings
  - Poll data and votes
  - Analytics and metrics

### AI Integration
- **Cloudflare Workers AI**: Powered by Llama 3.1 8B model
- **Smart Content Analysis**: Spam detection, sentiment analysis
- **Language Processing**: Translation, summarization
- **Intelligent Responses**: Context-aware bot responses

## 🔒 Security Features

### Data Protection
- **Webhook Verification**: Secret token validation
- **Admin Permissions**: Role-based access control
- **Rate Limiting**: Built-in Cloudflare protection
- **Secure Storage**: Encrypted Redis storage

### Privacy Compliance
- **Data Minimization**: Only necessary data stored
- **Automatic Cleanup**: Expired data removal
- **User Control**: Data deletion on request
- **Transparent Logging**: Clear audit trails

## 🎨 Customization

### Themes and Branding
- Custom welcome messages with HTML formatting
- Configurable button layouts and colors
- Group-specific rule sets
- Custom command aliases

### Advanced Configuration
\`\`\`javascript
// Example group settings
{
  welcomeEnabled: true,
  aiModerationEnabled: true,
  autoTranslate: true,
  targetLanguage: "en",
  maxWarnings: 3,
  mediaFiltering: true,
  sentimentAnalysis: true
}
\`\`\`

## 📈 Performance

### Scalability
- **Serverless Architecture**: Auto-scaling with Cloudflare Workers
- **Global Distribution**: Edge deployment worldwide
- **Efficient Caching**: Redis-based caching strategy
- **Optimized Queries**: Minimal database operations

### Monitoring
- **Real-time Metrics**: Built-in analytics dashboard
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **Usage Statistics**: Detailed usage reports

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Comprehensive inline help system
- **Community**: Join our Telegram support group
- **Issues**: GitHub issue tracker
- **Professional Support**: Available for enterprise users

## 🔮 Roadmap

### Upcoming Features
- **Voice Message Processing**: AI transcription and analysis
- **Image Recognition**: Content-based image moderation
- **Advanced Analytics**: Machine learning insights
- **Multi-Bot Management**: Centralized bot management
- **API Integration**: Third-party service connections
- **Mobile App**: Companion mobile application

---

Built with ❤️ using Cloudflare Workers, TypeScript, and AI
