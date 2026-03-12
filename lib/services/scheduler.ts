import cron from "node-cron";
import { discoverRedditContent } from "./reddit";
import { discoverTwitterContent } from "./tavily";
import { curateContent } from "./ai";
import { screenshotPendingPosts } from "./screenshot";
import { sendApprovalRequest } from "./telegram";
import { postToInstagram } from "./instagram";
import { prisma } from "./db";

// This is the "conductor" of the orchestra.
// Each cron job is like an instrument section that plays at the right time.
// Together, they create the full automated pipeline:
//
// Discovery → Curation → Screenshot → Telegram → Post
//
// Cron syntax: "minute hour * * *"
// * means "every". So "0 */3 * * *" = "at minute 0, every 3 hours"

// Job 1: Content Discovery — runs every 3 hours
// Fetches fresh content from Reddit and Twitter
export function startDiscoveryJob() {
    cron.schedule("0 */3 * * *", async () => {
        console.log("🔍 Discovery job started...");
        try {
            await discoverRedditContent();
            await discoverTwitterContent();
            console.log("✅ Discovery complete");
        } catch (error) {
            console.error("❌ Discovery failed:", error);
        }
    });
}

// Job 2: Curation — runs every 3 hours (30 min after discovery)
// Gives discovery time to finish, then AI scores the new content
export function startCurationJob() {
    cron.schedule("30 */3 * * *", async () => {
        console.log("🧠 Curation job started...");
        try {
            await curateContent();
            await screenshotPendingPosts();

            // Send Telegram notifications for high-scoring posts
            const readyPosts = await prisma.post.findMany({
                where: {
                    status: "pending",
                    aiScore: { gte: 7 },
                    screenshotUrl: { not: null },
                    caption: { not: null },
                },
            });

            for (const post of readyPosts) {
                try {
                    await sendApprovalRequest(post.id);
                } catch (error) {
                    console.error(`Failed to notify for post ${post.id}:`, error);
                }
            }

            console.log(`✅ Curation complete. ${readyPosts.length} posts sent for approval.`);
        } catch (error) {
            console.error("❌ Curation failed:", error);
        }
    });
}

// Job 3: Auto-posting — runs every hour
// Checks for approved posts that are scheduled for NOW and posts them
export function startPostingJob() {
    cron.schedule("0 * * * *", async () => {
        console.log("📤 Posting job started...");
        try {
            const now = new Date();
            const postsToPublish = await prisma.post.findMany({
                where: {
                    status: "approved",
                    scheduledAt: { lte: now }, // scheduled time has passed
                },
            });

            for (const post of postsToPublish) {
                try {
                    await postToInstagram(post.id);
                    console.log(`✅ Posted: ${post.sourceTitle}`);
                } catch (error) {
                    console.error(`❌ Failed to post ${post.id}:`, error);
                }
            }
        } catch (error) {
            console.error("❌ Posting job failed:", error);
        }
    });
}

// Start all jobs at once — called when the app starts
export function startAllJobs() {
    console.log("🚀 Starting all scheduled jobs...");
    startDiscoveryJob();
    startCurationJob();
    startPostingJob();
    console.log("✅ All jobs scheduled!");
}

// Manual trigger — for the "Trigger Discovery" button in the dashboard
// This runs the full pipeline immediately instead of waiting for cron
export async function triggerDiscoveryNow(): Promise<{
    discovered: number;
    curated: number;
}> {
    // Step 1: Discover
    console.log("🔍 Starting discovery from sources...");
    try {
        await discoverRedditContent();
        console.log("✅ Reddit discovery finished");
    } catch (e: any) {
        console.error("❌ Reddit discovery failed:", e.message);
    }

    try {
        await discoverTwitterContent();
        console.log("✅ Twitter discovery finished");
    } catch (e: any) {
        console.error("❌ Twitter discovery failed:", e.message);
    }

    const discovered = await prisma.post.count({
        where: { aiScore: null },
    });

    // Step 2: Curate
    await curateContent();
    await screenshotPendingPosts();
    const curated = await prisma.post.count({
        where: { status: "pending", aiScore: { gte: 7 } },
    });

    // Step 3: Notify via Telegram
    const readyPosts = await prisma.post.findMany({
        where: {
            status: "pending",
            aiScore: { gte: 7 },
            screenshotUrl: { not: null },
            caption: { not: null },
        },
    });

    for (const post of readyPosts) {
        try {
            await sendApprovalRequest(post.id);
        } catch (error) {
            console.error(`Telegram notification failed for ${post.id}:`, error);
        }
    }

    return { discovered, curated };
}
