import { getIronSession } from "iron-session";
import { defaultSession, SessionData, sessionOptions } from "@/lib/lib";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint used to fetch the user's session status.
 */
export async function GET(request: NextRequest) {
    const session = await getIronSession<SessionData>(
        cookies(),
        sessionOptions
    );

    if (!session.userId) {
        return NextResponse.json(defaultSession, { status: 200 });
    }

    return NextResponse.json(session, { status: 200 });
}