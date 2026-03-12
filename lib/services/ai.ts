import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "./db";

// Why Vercel AI SDK? It gives us ONE interface for multiple AI providers.
// The user picks their model in Settings, and this code Just Works™
// without needing separate implementations for each provider.

// Creates the right AI model based on user's settings
async function getModel() {
    const settings = await prisma.settings.findFirst();
    if (!settings?.aiApiKey) {
        throw new Error("AI API key not configured. Add it in Settings.");
    }

    const { aiProvider, aiApiKey } = settings;

    // Each provider has its own SDK, but they all return the same interface
    switch (aiProvider) {
        case "openai": {
            const openai = createOpenAI({ apiKey: aiApiKey });
            return openai("gpt-4o-mini"); // fast + cheap, great for curation
        }
        case "anthropic": {
            const anthropic = createAnthropic({ apiKey: aiApiKey });
            return anthropic("claude-3-5-sonnet-latest");
        }
        case "gemini": {
            const google = createGoogleGenerativeAI({ apiKey: aiApiKey });
            return google("gemini-1.5-flash-latest");
        }
        default:
            throw new Error(`Unknown AI provider: ${aiProvider}`);
    }
}

// Scores content on a 0-10 scale for humor/virality
export async function scoreContent(
    title: string,
    content: string
): Promise<{ score: number; reason: string }> {
    const model = await getModel();

    try {
        const { object } = await generateObject({
            model,
            schema: z.object({
                score: z.number().min(0).max(10),
                reason: z.string(),
            }),
            prompt: `You are a social media content curator for a funny content Instagram page.
    
    Rate this content on a scale of 0-10 for humor and viral potential on Instagram.
    
    Title: ${title}
    Content: ${content}`,
        });

        return object;
    } catch (error) {
        console.error("AI Scoring Error:", error);
        return { score: 0, reason: "AI failed to score, using 0 to avoid false positives" };
    }
}

// Generates an Instagram caption with relevant hashtags
export async function generateCaption(
    title: string,
    content: string,
    source: string
): Promise<string> {
    const model = await getModel();

    const { text } = await generateText({
        model,
        prompt: `You are a social media manager for a popular funny content Instagram page.

Write an engaging Instagram caption for this ${source} content:

Title: ${title}
Content: ${content}

Rules:
- Keep it short and punchy (2-3 lines max)
- Add 5-8 relevant hashtags
- Use emojis sparingly but effectively
- Don't just repeat the content, add your own spin
- Make people want to tag their friends

Respond with ONLY the caption text, nothing else.`,
    });

    return text;
}

// Suggests the best time to post based on general Instagram best practices
export async function suggestPostTime(): Promise<number> {
    const settings = await prisma.settings.findFirst();
    const bestTimes: number[] = settings
        ? JSON.parse(settings.bestPostTimes)
        : [9, 12, 18]; // default: 9am, noon, 6pm

    // Pick one of the configured best times
    return bestTimes[Math.floor(Math.random() * bestTimes.length)];
}

// Main curation pipeline — scores all pending posts and generates captions
// for the top ones. This is called after discovery.
export async function curateContent(): Promise<void> {
    // RESET BUG: If any posts were marked as rejected but have NO score, 
    // it was due to a previous bug. Let's give them another chance!
    await prisma.post.updateMany({
        where: { status: "rejected", aiScore: null },
        data: { status: "pending" }
    });

    let hasMore = true;
    while (hasMore) {
        const pendingPosts = await prisma.post.findMany({
            where: { status: "pending", aiScore: null },
            take: 20, // process in batches
        });

        if (pendingPosts.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`🧠 Curating batch of ${pendingPosts.length} posts...`);

        for (const post of pendingPosts) {
            try {
                // Score the content
                const { score, reason } = await scoreContent(
                    post.sourceTitle,
                    post.rawContent || ""
                );

                // Generate caption only for high-scoring content (7+)
                let caption = null;
                if (score >= 7) {
                    caption = await generateCaption(
                        post.sourceTitle,
                        post.rawContent || "",
                        post.source
                    );
                }

                // Update the post with AI results
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        aiScore: score,
                        caption,
                        status: score >= 7 ? "pending" : "rejected",
                    },
                });
                console.log(`✅ Scored ${score}/10: ${post.sourceTitle}`);
            } catch (error) {
                console.error(`Failed to curate post ${post.id}:`, error);
            }
        }
    }
}
