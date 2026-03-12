import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";
import { auth } from "@/lib/auth";

// POST /api/posts/:id/reject — reject a post
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Verify post ownership
        const post = await prisma.post.findUnique({
            where: { id, userId: session.user.id },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const updated = await prisma.post.update({
            where: { id },
            data: { status: "rejected" },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
