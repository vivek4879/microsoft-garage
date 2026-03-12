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
export function startDiscoveryJob() {
    cron.schedule("0 */3 * * *", async () => {
        console.log("🔍 Discovery job started for all users...");
        const users = await prisma.user.findMany();
        for (const user of users) {
          try {
              await discoverRedditContent(user.id);
              await discoverTwitterContent(user.id);
          } catch (error) {
              console.error(`❌ Discovery failed for user ${user.id}:`, error);
          }
        }
    });
}

// Job 2: Curation — runs every 3 hours (30 min after discovery)
export function startCurationJob() {
    cron.schedule("30 */3 * * *", async () => {
        console.log("🧠 Curation job started for all users...");
        const users = await prisma.user.findMany();
        for (const user of users) {
          try {
              await curateContent(user.id);
              await screenshotPendingPosts(user.id);

              const readyPosts = await prisma.post.findMany({
                  where: {
                      userId: user.id,
                      status: "pending",
                      aiScore: { gte: 7 },
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
          } catch (error) {
              console.error(`❌ Curation failed for user ${user.id}:`, error);
          }
        }
    });
}

// Job 3: Auto-posting — runs every hour
export function startPostingJob() {
    cron.schedule("0 * * * *", async () => {
        console.log("📤 Posting job started for all users...");
        const users = await prisma.user.findMany();
        for (const user of users) {
          try {
              const now = new Date();
              const postsToPublish = await prisma.post.findMany({
                  where: {
                      userId: user.id,
                      status: "approved",
                      scheduledAt: { lte: now },
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
              console.error(`❌ Posting job failed for user ${user.id}:`, error);
          }
        }
    });
}

// Manual trigger — for the "Trigger Discovery" button in the dashboard
export async function triggerDiscoveryNow(userId: string): Promise<{
    discovered: number;
    curated: number;
}> {
    // Step 1: Discover
    console.log(`🔍 Starting discovery for user ${userId}...`);
    try {
        await discoverRedditContent(userId);
    } catch (e: any) {
        console.error("❌ Reddit discovery failed:", e.message);
    }

    try {
        await discoverTwitterContent(userId);
    } catch (e: any) {
        console.error("❌ Twitter discovery failed:", e.message);
    }

    const discovered = await prisma.post.count({
        where: { userId, aiScore: null },
    });

    // Step 2: Curate
    await curateContent(userId);
    await screenshotPendingPosts(userId);
    
    const curated = await prisma.post.count({
        where: { userId, status: "pending", aiScore: { gte: 7 } },
    });

    // Step 3: Notify via Telegram
    const readyPosts = await prisma.post.findMany({
        where: {
            userId,
            status: "pending",
            aiScore: { gte: 7 },
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
