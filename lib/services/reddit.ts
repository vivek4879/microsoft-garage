import { prisma } from "./db";

// Reddit's public JSON API - just add .json to any Reddit URL!
// No API key needed for reading public data.

interface RedditPost {
    title: string;
    permalink: string;
    score: number;        // upvotes - downvotes
    num_comments: number;
    url: string;
    subreddit: string;
    selftext: string;
}

interface RedditComment {
    body: string;
    score: number;
    author: string;
}

// Fetches hot posts from a subreddit
// Why "hot"? It's Reddit's algorithm for trending content -
// balances recency + upvotes, so we get fresh viral stuff
export async function fetchSubredditPosts(
    subreddit: string,
    limit: number = 25
): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

    const res = await fetch(url, {
        headers: {
            // Reddit blocks simple or data-center User-Agents.
            // Using a realistic browser string helps avoid 403 Forbidden errors.
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
    });

    if (!res.ok) {
        throw new Error(`Reddit API error: ${res.status}`);
    }

    const data = await res.json();

    // Reddit wraps everything in { data: { children: [...] } }
    // Each child has { kind: "t3", data: { ...post } }
    return data.data.children.map((child: any) => ({
        title: child.data.title,
        permalink: child.data.permalink,
        score: child.data.score,
        num_comments: child.data.num_comments,
        url: child.data.url,
        subreddit: child.data.subreddit,
        selftext: child.data.selftext || "",
    }));
}

// Fetches top comments from a specific post
// Why? The comments are often funnier than the post itself!
export async function fetchPostComments(
    permalink: string,
    limit: number = 10
): Promise<RedditComment[]> {
    const url = `https://www.reddit.com${permalink}.json?limit=${limit}`;

    const res = await fetch(url, {
        headers: { "User-Agent": "SocialAgent/1.0" },
    });

    if (!res.ok) {
        throw new Error(`Reddit comments error: ${res.status}`);
    }

    const data = await res.json();

    // Reddit returns [postData, commentsData]
    // commentsData.data.children contains the comment threads
    const comments = data[1]?.data?.children || [];

    return comments
        .filter((c: any) => c.kind === "t1") // t1 = comment, skip "more" links
        .map((c: any) => ({
            body: c.data.body,
            score: c.data.score,
            author: c.data.author,
        }));
}

// Main entry point for Reddit discovery
export async function discoverRedditContent(userId: string): Promise<void> {
    const settings = await prisma.settings.findUnique({
        where: { userId },
    });

    if (!settings) {
        console.warn(`No settings found for user ${userId}. Skipping Reddit.`);
        return;
    }

    const subreddits: string[] = JSON.parse(settings.subreddits);

    for (const sub of subreddits) {
        console.log(`📡 Fetching r/${sub} for user ${userId}...`);
        try {
            const posts = await fetchSubredditPosts(sub);
            
            for (const post of posts) {
                // Check if we've already seen this post
                const existing = await prisma.post.findFirst({
                    where: { sourceUrl: post.url, userId },
                });

                if (existing) continue;

                // Save to DB
                await prisma.post.create({
                    data: {
                        userId,
                        source: "reddit",
                        sourceUrl: post.url,
                        sourceTitle: post.title,
                        rawContent: post.selftext || post.title,
                    },
                });
            }
        } catch (error) {
            console.error(`Failed to fetch r/${sub}:`, error);
        }
    }
}
