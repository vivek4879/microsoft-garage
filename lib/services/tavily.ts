import { tavily } from "@tavily/core";
import { prisma } from "./db";

// Tavily searches the PUBLIC WEB — including tweets indexed by Google.
// This is our workaround for Twitter's expensive API.
// We use "site:twitter.com" or "site:x.com" to limit results to tweets.

// Create a Tavily client — reads API key from Settings
async function getTavilyClient(userId: string) {
    const settings = await prisma.settings.findUnique({
        where: { userId }
    });
    if (!settings?.tavilyApiKey) {
        throw new Error("Tavily API key not configured. Add it in Settings.");
    }
    return tavily({ apiKey: settings.tavilyApiKey });
}

interface TwitterResult {
    url: string;
    title: string;
    content: string; // snippet of the tweet/thread
}

// Search for funny Twitter content
// Why these queries? We combine "site:x.com" (limits to Twitter)
// with humor keywords to find viral tweets
export async function searchFunnyTweets(
    userId: string,
    query: string = "funny thread",
    maxResults: number = 10
): Promise<TwitterResult[]> {
    const client = await getTavilyClient(userId);

    const response = await client.search(
        `site:x.com OR site:twitter.com ${query}`,
        {
            maxResults,
            searchDepth: "advanced",   // deeper search = better results
            includeAnswer: false,
        }
    );

    return response.results.map((r) => ({
        url: r.url,
        title: r.title ?? "",
        content: r.content ?? "",
    }));
}

// Main entry point for Twitter discovery via Tavily
export async function discoverTwitterContent(userId: string): Promise<void> {
    const settings = await prisma.settings.findUnique({
        where: { userId },
    });

    if (!settings?.tavilyApiKey) {
        console.warn(`No Tavily API key for user ${userId}. Skipping Twitter.`);
        return;
    }

    try {
        console.log(`🐦 Searching Twitter for user ${userId}...`);
        const tweets = await searchFunnyTweets(userId, "funny thread", 10);

        for (const tweet of tweets) {
            // Isolation check
            const existing = await prisma.post.findFirst({
                where: { sourceUrl: tweet.url, userId },
            });

            if (existing) continue;

            await prisma.post.create({
                data: {
                    userId,
                    source: "twitter",
                    sourceUrl: tweet.url,
                    sourceTitle: tweet.title,
                    rawContent: tweet.content,
                },
            });
        }
    } catch (error) {
        console.error("Tavily Twitter search failed:", error);
    }
}
