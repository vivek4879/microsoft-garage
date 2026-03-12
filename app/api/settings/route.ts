import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";

// GET /api/settings — fetch current settings
export async function GET() {
    try {
        let settings = await prisma.settings.findFirst();

        // If no settings exist yet, create defaults
        if (!settings) {
            settings = await prisma.settings.create({ data: {} });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/settings — update settings
// Called when the user changes AI model, post frequency, etc.
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        let settings = await prisma.settings.findFirst();

        if (!settings) {
            settings = await prisma.settings.create({ data: body });
        } else {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: body,
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
