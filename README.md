# 🚀 Social Pipeline: AI-Powered Social Media Automation

**Social Pipeline** is an intelligent, automated content engine designed to discover, curate, and post viral content to Instagram. Built for creators and social media managers who want to automate their growth while maintaining high-quality curation standards.

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🛠️ Architecture & Tech Stack](#️-architecture--tech-stack)
- [💻 Local Setup](#-local-setup)
- [🔐 Environment Variables](#-environment-variables)
- [🏢 Origin & Credits](#-origin--credits)
- [🏗️ Status](#️-status-work-in-progress)

---

## ✨ Features

- **Multi-Source Discovery**: Automatically scrapes trending content from Reddit and crawls Twitter (X) using **Tavily's** live search API.
- **AI-Powered Curation**: Uses advanced LLMs (Gemini, Claude, or OpenAI) to score content for viral potential and generate highly engaging Instagram captions.
- **Automated Screenshots**: Captures beautiful, high-quality previews of source posts to use as visual content for scheduling.
- **Multi-User Architecture**: Secure authentication via GitHub OAuth. Each user manages their own separate API keys, settings, and content queues in isolation.
- **Telegram Inbox Integration**: Notifies you directly via a Telegram bot when high-scoring content is ready for your approval.
- **Smart Scheduling**: AI suggests the optimal posting times based on general audience engagement patterns.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/) with GitHub OAuth (Edge Runtime compatible)
- **Database**: [Prisma ORM](https://www.prisma.io/) with [Vercel Postgres](https://vercel.com/storage/postgres)
- **AI Orchestration**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **Search & Discovery**: [Tavily API](https://tavily.com/) & Reddit JSON API
- **UI Components**: Tailwind CSS, Lucide React
- **Deployment**: Vercel

### Agentic Flow (How it works)
1. **Discovery**: A background job periodically triggers the scraping of configured Subreddits and dynamic Twitter searches via Tavily.
2. **Curation**: New un-scored posts are evaluated by an AI model. High-scoring posts get captions generated and screenshots captured.
3. **Notification**: The system messages the user via Telegram for approval.
4. **Publishing**: *(In development)* Approved posts are dispatched to destination platforms based on scheduled times.

---

## 💻 Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/microsoft-garage.git
   cd microsoft-garage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the Database**
   Connect to your Postgres database and push the schema:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory and add your global keys:

```env
# Database Connection (Vercel Postgres or Supabase)
DATABASE_URL="postgresql://user:password@host:port/postgres?sslmode=require"

# Auth.js / NextAuth
AUTH_SECRET="your_generated_secret_string" # Run: openssl rand -base64 33
GITHUB_ID="your_github_oauth_app_client_id"
GITHUB_SECRET="your_github_oauth_app_client_secret"

# Application URL (for OAuth callbacks & background jobs)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Telegram Bot (Global App Notification Identity)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
```

*(Note: User-specific API keys like Gemini, Tavily, or specific Telegram Chat IDs are configured securely within the application's dashboard UI after logging in, not in the `.env` file.)*

---

## 🏢 Origin & Credits

This project was conceived and built during the **"Build agents, not cars"** event at the **Microsoft Garage**. 

### The Event
A hands-on AI Builder Day at the Microsoft Garage; designed for anyone who wants to ship real AI-powered applications in a collaborative co-working environment. 

The focus was practical building: moving from idea to working prototype in one day using:
- **Claude in VS Code** – AI coding assistant for anyone
- **Lovable** – AI-native app builder
- **Tavily** – Live web search API for LLMs
- **Microsoft Garage** – A platform for Microsoft employees and the ecosystem to iterate on hack projects.

---

### 🏗️ Status: Work in Progress
This project is currently a **Work in Progress**. Developed with 💙 by builders for builders.
