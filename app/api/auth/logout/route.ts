import {getIronSession} from "iron-session";
import {sessionOptions, SessionData} from "@/lib/lib";
import { cookies } from "next/headers";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await getIronSession<SessionData>(
      cookies(),
      sessionOptions
    );
    session.destroy()
    await session.save();
    return NextResponse.json({ isLoggedIn: false }, { status: 200 })

}
