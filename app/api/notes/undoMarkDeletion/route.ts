import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { noteId, newTag } = await req.json();

    const cookieData = await cookies()
    const session = await getIronSession<SessionData>(
      cookieData,
      sessionOptions
    );

    const authorId = session.userId;

    // need a note to delete and a user making tbe request
    if (!noteId || !authorId) {
      return NextResponse.json(
        { error: "Note ID and Author ID are required" },
        { status: 400 }
      );
    }

    if (newTag === undefined || typeof newTag !== "number") {
      return NextResponse.json(
        { message: "Invalid tag" },
        { status: 400 }
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    if (note.authorId !== authorId) {
      return NextResponse.json(
        { error: "Wrong user" },
        { status: 401 }
      );
    }

    // mark it for deletion
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { canDelete: false, tag: newTag },
    });

    return NextResponse.json(updatedNote, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to undo mark for deletion",
        details: error.message,
      },
      { status: 500 }
    );
  }
}