import { NextResponse } from "next/server";
import { triggerDiscoveryNow } from "@/lib/services/scheduler";

// POST /api/discover — manually trigger the full pipeline
// Called when you click "Trigger Discovery" in the dashboard
export async function POST() {
    try {
        const result = await triggerDiscoveryNow();
        return NextResponse.json({
            message: "Discovery complete!",
            ...result,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
