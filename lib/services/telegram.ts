import TelegramBot from "node-telegram-bot-api";
import { prisma } from "./db";

// The Telegram Bot sends you post previews on your phone
// with Approve/Reject buttons. When you tap a button,
// Telegram sends a "callback query" back to our server,
// which updates the post status in the database.

let bot: TelegramBot | null = null;

// Initialize the bot — called once when the app starts
// Why lazy initialization? The user might not have set up
// their Telegram token yet. We only create the bot when needed.
export async function getTelegramBot(): Promise<TelegramBot> {
    if (bot) return bot;

    // Favor environment variables for security (set on Vercel)
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN not found in environment variables.");
    }

    // Initialize without polling (we use webhooks in production)
    bot = new TelegramBot(token, { polling: false });

    return bot;
}

// Sends a post preview to your Telegram with Approve/Reject buttons
export async function sendApprovalRequest(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error(`Post ${postId} not found`);

    const telegramBot = await getTelegramBot();

    // The chat ID is YOUR personal Telegram user ID
    // We prioritize env var, then fallback to DB settings
    const chatId = process.env.TELEGRAM_CHAT_ID || (await prisma.settings.findFirst())?.telegramChatId;

    if (!chatId) throw new Error("Telegram chat ID not configured (checked ENV and DB)");

    // Build the message
    const message = `
🆕 **New Content for Review**

📌 **Source:** ${post.source.toUpperCase()}
📝 **Title:** ${post.sourceTitle}
⭐ **AI Score:** ${post.aiScore}/10

✍️ **Suggested Caption:**
${post.caption || "No caption generated"}

🔗 ${post.sourceUrl}
  `.trim();

    // Send with inline keyboard buttons
    // callback_data is what we receive when the user taps a button
    await telegramBot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Approve", callback_data: `approve_${postId}` },
                    { text: "❌ Reject", callback_data: `reject_${postId}` },
                ],
            ],
        },
    });

    // If we have a screenshot, send it as a photo too
    if (post.screenshotUrl) {
        const screenshotPath = `${process.cwd()}/public${post.screenshotUrl}`;
        try {
            await telegramBot.sendPhoto(chatId, screenshotPath);
        } catch (error) {
            console.error("Failed to send screenshot:", error);
        }
    }
}

// Handles button taps from Telegram
// This is called by our webhook API route when Telegram
// sends us a callback_query
export async function handleTelegramCallback(
    callbackData: string,
    callbackQueryId: string
): Promise<void> {
    const telegramBot = await getTelegramBot();

    // Parse the action and post ID from the callback data
    // Format: "approve_clxyz123" or "reject_clxyz123"
    const [action, postId] = callbackData.split("_");

    if (!postId) {
        await telegramBot.answerCallbackQuery(callbackQueryId, {
            text: "Invalid action",
        });
        return;
    }

    if (action === "approve") {
        await prisma.post.update({
            where: { id: postId },
            data: { status: "approved" },
        });

        await telegramBot.answerCallbackQuery(callbackQueryId, {
            text: "✅ Post approved! It will be scheduled automatically.",
        });
    } else if (action === "reject") {
        await prisma.post.update({
            where: { id: postId },
            data: { status: "rejected" },
        });

        await telegramBot.answerCallbackQuery(callbackQueryId, {
            text: "❌ Post rejected.",
        });
    }
}
