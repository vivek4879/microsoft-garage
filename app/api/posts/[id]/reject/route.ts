import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";

// POST /api/posts/:id/reject — reject a post
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const post = await prisma.post.update({
            where: { id },
            data: { status: "rejected" },
        });

        return NextResponse.json(post);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
