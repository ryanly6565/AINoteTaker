import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/lib";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { title, content, tags } = await request.json();

    const cookieData = await cookies()
    const session = await getIronSession<SessionData>(
      cookieData,
      sessionOptions
    );

    const authorId = session.userId;

    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newNote = await prisma.note.create({
      data: {
        title: title || "Untitled Note",
        content: content || "",
        tags: {
          connect: tags.map(tag => ({ id: tag.id }))
        },
        authorId,
        canDelete: false,
      },
    });

    return NextResponse.json(newNote, { status: 201 });

  } catch (error: any) {
    console.error("Error creating note:", error);

    return NextResponse.json(
      { error: "Failed to create note", details: error.message },
      { status: 500 }
    );
  }
}