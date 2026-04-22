import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Extract userId from session and fetch notes
    const cookieStore = await cookies();

    const session = await getIronSession<SessionData>(
        cookieStore,
        sessionOptions
    );

    const userId = session.userId;

    const notes = await prisma.note.findMany({
      where: {
        authorId: userId,
      },
    });

    return NextResponse.json(notes, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch notes", details: error.message },
      { status: 500 }
    );
  }
}