import { prisma } from "./db";

// Instagram Graph API uses a 2-step posting process:
// 1. Create a "media container" (upload image + caption)
// 2. Publish the container (makes it live)
//
// This requires an Instagram Creator/Business account
// linked to a Facebook Page, plus a Graph API access token.

const IG_API_BASE = "https://graph.facebook.com/v18.0";

// Get Instagram credentials from Settings
async function getIGCredentials() {
    const settings = await prisma.settings.findFirst();
    if (!settings?.igAccessToken || !settings?.igPageId) {
        throw new Error(
            "Instagram not configured. Add access token and page ID in Settings."
        );
    }
    return {
        accessToken: settings.igAccessToken,
        igUserId: settings.igPageId,
    };
}

// Step 1: Create a media container
// Think of this as "uploading" — Instagram processes the image
// and gives you a receipt (container ID) to publish later
async function createMediaContainer(
    imageUrl: string,
    caption: string
): Promise<string> {
    const { accessToken, igUserId } = await getIGCredentials();

    const res = await fetch(`${IG_API_BASE}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            image_url: imageUrl,  // must be a publicly accessible URL
            caption,
            access_token: accessToken,
        }),
    });

    const data = await res.json();

    if (data.error) {
        throw new Error(`IG Media Error: ${data.error.message}`);
    }

    return data.id; // this is the container ID
}

// Step 2: Publish the container — makes the post go live!
async function publishMedia(containerId: string): Promise<string> {
    const { accessToken, igUserId } = await getIGCredentials();

    const res = await fetch(`${IG_API_BASE}/${igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
        }),
    });

    const data = await res.json();

    if (data.error) {
        throw new Error(`IG Publish Error: ${data.error.message}`);
    }

    return data.id; // the published media ID
}

// Full posting flow — upload + publish + update DB
export async function postToInstagram(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error(`Post ${postId} not found`);
    if (!post.screenshotUrl) throw new Error("Post has no screenshot");
    if (!post.caption) throw new Error("Post has no caption");

    // The screenshot URL needs to be publicly accessible for Instagram
    // In production, you'd upload to a CDN. For now, we use the app's URL.
    const publicImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}${post.screenshotUrl}`;

    // Step 1: Upload
    const containerId = await createMediaContainer(
        publicImageUrl,
        post.caption
    );

    // Instagram needs a few seconds to process the image
    await new Promise((r) => setTimeout(r, 5000));

    // Step 2: Publish
    const mediaId = await publishMedia(containerId);

    // Update our database
    await prisma.post.update({
        where: { id: postId },
        data: {
            status: "posted",
            postedAt: new Date(),
        },
    });

    console.log(`📸 Posted to Instagram! Media ID: ${mediaId}`);
}

// Fetch insights (likes, comments, reach) for a posted media
export async function getMediaInsights(
    mediaId: string
): Promise<{ likes: number; comments: number; reach: number }> {
    const { accessToken } = await getIGCredentials();

    const res = await fetch(
        `${IG_API_BASE}/${mediaId}/insights?metric=likes,comments,reach&access_token=${accessToken}`
    );

    const data = await res.json();

    if (data.error) {
        return { likes: 0, comments: 0, reach: 0 };
    }

    const metrics: Record<string, number> = {};
    for (const item of data.data || []) {
        metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        reach: metrics.reach || 0,
    };
}
