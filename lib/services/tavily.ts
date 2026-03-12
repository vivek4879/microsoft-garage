import { tavily } from "@tavily/core";
import { prisma } from "./db";

// Tavily searches the PUBLIC WEB — including tweets indexed by Google.
// This is our workaround for Twitter's expensive API.
// We use "site:twitter.com" or "site:x.com" to limit results to tweets.

// Create a Tavily client — reads API key from Settings
async function getTavilyClient() {
    const settings = await prisma.settings.findFirst();
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
    query: string = "funny thread",
    maxResults: number = 10
): Promise<TwitterResult[]> {
    const client = await getTavilyClient();

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

// Main discovery function — searches Twitter via Tavily
// and saves results to our database
export async function discoverTwitterContent(): Promise<void> {
    // Different search queries to get variety
    const queries = [
        "funny thread",
        "hilarious reply",
        "funniest tweet today",
        "comedy gold twitter",
    ];

    // Pick a random query each time for variety
    const query = queries[Math.floor(Math.random() * queries.length)];
    const results = await searchFunnyTweets(query, 10);

    for (const result of results) {
        // Skip duplicates
        const exists = await prisma.post.findFirst({
            where: { sourceUrl: result.url },
        });
        if (exists) continue;

        await prisma.post.create({
            data: {
                source: "twitter",
                sourceUrl: result.url,
                sourceTitle: result.title,
                rawContent: result.content,
                status: "pending",
            },
        });
    }
}
