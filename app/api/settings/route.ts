import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/db";
import { auth } from "@/lib/auth";

// GET /api/settings — Load user configuration from DB
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let settings = await prisma.settings.findUnique({
            where: { userId: session.user.id },
        });

        if (!settings) {
            // Create default settings if new user
            settings = await prisma.settings.create({
                data: {
                    userId: session.user.id,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/settings — Update user configuration
export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const settings = await prisma.settings.upsert({
            where: { userId: session.user.id },
            update: body,
            create: {
                ...body,
                userId: session.user.id,
            },
        });
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
