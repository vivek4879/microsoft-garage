import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";
import { suggestPostTime } from "@/lib/services/ai";
import { auth } from "@/lib/auth";

// POST /api/posts/:id/approve — approve a post for scheduling
// When you tap "Approve", this sets status to approved and
// asks the AI to suggest an optimal posting time
export async function POST(
    req: Request, // Changed 'request' to 'req'
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth(); // Added session retrieval
        if (!session?.user?.id) { // Added authorization check
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        // Verify post ownership
        const post = await prisma.post.findUnique({
            where: { id, userId: session.user.id },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const updated = await prisma.post.update({
            where: { id },
            data: { status: "approved" },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
