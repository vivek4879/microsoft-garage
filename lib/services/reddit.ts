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

// Main discovery function - pulls from all configured subreddits
// and saves the best content to our database
export async function discoverRedditContent(): Promise<void> {
    // Read subreddit list from Settings
    const settings = await prisma.settings.findFirst();
    const subreddits: string[] = settings
        ? JSON.parse(settings.subreddits)
        : ["funny", "AskReddit", "mildlyinteresting"];

    for (const sub of subreddits) {
        const posts = await fetchSubredditPosts(sub, 10);

        for (const post of posts) {
            // Skip if we've already saved this post (no duplicates)
            const exists = await prisma.post.findFirst({
                where: { sourceUrl: `https://reddit.com${post.permalink}` },
            });
            if (exists) continue;

            // Fetch the top comments for context
            const comments = await fetchPostComments(post.permalink, 5);
            const commentText = comments
                .map((c) => `u/${c.author}: ${c.body}`)
                .join("\n");

            // Save to database with status "pending"
            await prisma.post.create({
                data: {
                    source: "reddit",
                    sourceUrl: `https://reddit.com${post.permalink}`,
                    sourceTitle: post.title,
                    rawContent: JSON.stringify({ post, comments }),
                    aiScore: null,
                    status: "pending",
                },
            });
        }
    }
}
