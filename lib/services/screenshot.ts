import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { prisma } from "./db";

// Puppeteer launches an INVISIBLE Chrome browser, loads the URL,
// takes a screenshot, and saves it. No human interaction needed.
// This is how meme pages create those "screenshot of a tweet" posts.

// Ensure the screenshots directory exists
const SCREENSHOT_DIR = path.join(process.cwd(), "public", "screenshots");

function ensureDir() {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
}

// Takes a screenshot of a URL and returns the public path
// Why Puppeteer over a simple screenshot API? Full control —
// we can set viewport size, wait for content to load, crop specific
// elements, and handle cookie popups.
export async function captureScreenshot(
    url: string,
    postId: string
): Promise<string> {
    ensureDir();

    const browser = await puppeteer.launch({
        headless: true, // no visible browser window
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();

        // Set viewport to mobile-ish size (looks better on Instagram)
        await page.setViewport({ width: 600, height: 800 });

        // Navigate to the URL and wait for content to fully load
        await page.goto(url, {
            waitUntil: "networkidle2", // wait until no more network requests
            timeout: 15000,
        });

        // Wait a bit for any animations/lazy-loaded content
        await new Promise((r) => setTimeout(r, 2000));

        const filename = `${postId}.png`;
        const filepath = path.join(SCREENSHOT_DIR, filename);

        // Take the screenshot
        await page.screenshot({
            path: filepath,
            fullPage: false, // just the visible viewport, not the entire page
            type: "png",
        });

        // Return the public URL path (relative to /public)
        return `/screenshots/${filename}`;
    } finally {
        // ALWAYS close the browser — even if something fails
        // Otherwise you'd leak Chrome processes and eat all your RAM
        await browser.close();
    }
}

// Takes screenshots for all posts that don't have one yet
export async function screenshotPendingPosts(): Promise<void> {
    const posts = await prisma.post.findMany({
        where: {
            screenshotUrl: null,
            status: "pending",
            aiScore: { gte: 7 }, // only screenshot high-scoring posts
        },
    });

    for (const post of posts) {
        try {
            const screenshotUrl = await captureScreenshot(
                post.sourceUrl,
                post.id
            );

            await prisma.post.update({
                where: { id: post.id },
                data: { screenshotUrl },
            });

            console.log(`📸 Screenshot saved for: ${post.sourceTitle}`);
        } catch (error) {
            console.error(`Failed to screenshot ${post.sourceUrl}:`, error);
            // Don't crash the whole batch if one fails
        }
    }
}
