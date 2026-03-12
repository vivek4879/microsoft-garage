import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";

// GET /api/queue — returns all pending posts for the dashboard
// The Queue page calls this to show content cards
export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            where: {
                status: { in: ["pending", "approved"] },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
