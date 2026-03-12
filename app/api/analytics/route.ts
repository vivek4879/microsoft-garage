import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";

// GET /api/analytics — fetch engagement stats for the dashboard
export async function GET() {
    try {
        // Get all posted content with their analytics
        const posts = await prisma.post.findMany({
            where: { status: "posted" },
            include: { analytics: true },
            orderBy: { postedAt: "desc" },
        });

        // Calculate summary stats
        const totalPosts = posts.length;
        const totalLikes = posts.reduce(
            (sum: number, p: any) => sum + (p.analytics[0]?.likes || 0), 0
        );
        const totalComments = posts.reduce(
            (sum: number, p: any) => sum + (p.analytics[0]?.comments || 0), 0
        );
        const totalReach = posts.reduce(
            (sum: number, p: any) => sum + (p.analytics[0]?.reach || 0), 0
        );

        return NextResponse.json({
            summary: { totalPosts, totalLikes, totalComments, totalReach },
            posts,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
