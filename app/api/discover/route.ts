import { NextResponse } from "next/server";
import { triggerDiscoveryNow } from "@/lib/services/scheduler";
import { auth } from "@/lib/auth";

// POST /api/discover — manually trigger the full pipeline for the current user
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await triggerDiscoveryNow(session.user.id);
        return NextResponse.json({
            message: "Discovery complete!",
            ...result,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
