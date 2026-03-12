import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";
import { auth } from "@/lib/auth";

// GET /api/queue — returns pending/approved posts for the logged-in user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const posts = await prisma.post.findMany({
            where: {
                userId: session.user.id,
                status: { in: ["pending", "approved"] },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
