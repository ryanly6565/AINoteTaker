import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { noteId } = await req.json();

    const cookieData = await cookies()
    const session = await getIronSession<SessionData>(
      cookieData,
      sessionOptions
    );

    const authorId = session.userId;

    // need a note to delete and a user making tbe request
    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.authorId !== authorId) {
      return NextResponse.json({ error: "Wrong user" }, { status: 401 });
    }

    if (note.canDelete === false) {
      return NextResponse.json({
        error: "Note is not currently deletable",
      }, { status: 401 });
    }

    // delete it
    const deleteUser = await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json(deleteUser, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete", details: error.message },
      { status: 500 }
    );
  }
}