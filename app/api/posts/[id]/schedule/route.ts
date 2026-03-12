import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";

// PUT /api/posts/:id/schedule — manually set a posting time
// Used when you drag a post to a time slot on the Calendar page
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { scheduledAt } = await request.json();

        const post = await prisma.post.update({
            where: { id },
            data: { scheduledAt: new Date(scheduledAt) },
        });

        return NextResponse.json(post);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
