import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    // NOTE: Need to check whether user owns note
    const { id, title, content, tag, format } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { title, content, tag, format },
    });

    return NextResponse.json(updatedNote, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update note", details: error.message },
      { status: 500 }
    );
  }
}