import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";
import { suggestPostTime } from "@/lib/services/ai";

// POST /api/posts/:id/approve — approve a post for scheduling
// When you tap "Approve", this sets status to approved and
// asks the AI to suggest an optimal posting time
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get AI-suggested posting hour
        const suggestedHour = await suggestPostTime();

        // Schedule for today at the suggested hour (or tomorrow if past)
        const scheduledAt = new Date();
        scheduledAt.setHours(suggestedHour, 0, 0, 0);
        if (scheduledAt < new Date()) {
            scheduledAt.setDate(scheduledAt.getDate() + 1);
        }

        const post = await prisma.post.update({
            where: { id },
            data: { status: "approved", scheduledAt },
        });

        return NextResponse.json(post);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
