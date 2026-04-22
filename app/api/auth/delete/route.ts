import {NextApiRequest, NextApiResponse} from "next";
import {PrismaClient} from "@prisma/client";
import {getIronSession} from "iron-session";
import {SessionData, sessionOptions} from "@/lib/lib";
import withAuth from "@/lib/withAuth";
import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    const prisma = new PrismaClient();
    const { userId } = await request.json()

    try {
        // Get user ID from session (already verified by withAuth middleware)
        if (!userId || isNaN(userId)) {
            return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
        }

        const session = await getIronSession<SessionData>(
            cookies(),
            sessionOptions
        );
        if (!session.user || session.user.id !== userId) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

        // Delete all notes associated with the user
        await prisma.note.deleteMany({
            where: {
                authorId: userId
            }
        });

        // Delete the user
        await prisma.user.delete({
            where: {
                id: userId
            }
        });

        // Clear the session
        session.destroy();

        return NextResponse.json(
        { message: "Account successfully deleted" },
        { status: 200 }
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json(
        { message: "An error occurred while deleting the account" },
        { status: 500 }
        );
    }
}