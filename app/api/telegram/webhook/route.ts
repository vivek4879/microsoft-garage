import { NextResponse } from "next/server";
import { handleTelegramCallback } from "@/lib/services/telegram";

// POST /api/telegram/webhook — receives button taps from Telegram
// When you tap ✅ Approve or ❌ Reject on your phone,
// Telegram sends a request HERE with the action info
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Telegram sends callback_query when inline buttons are tapped
        if (body.callback_query) {
            await handleTelegramCallback(
                body.callback_query.data,
                body.callback_query.id
            );
        }

        // Telegram expects a 200 OK response
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("Telegram webhook error:", error);
        return NextResponse.json({ ok: true }); // always return 200 to Telegram
    }
}
