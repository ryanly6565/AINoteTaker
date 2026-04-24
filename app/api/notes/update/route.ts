import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const { id, title, content, tags, format } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id: Number(id) },

      data: {
        title,
        content,
        format,

        ...(tags
          ? {
              tags: {
                set: tags.map((t: any) => ({
                  id: t.id,
                })),
              },
            }
          : {}),
      },
    });

    return NextResponse.json(updatedNote, { status: 200 });

  } catch (error: any) {
    console.log(error);

    return NextResponse.json(
      { error: "Failed to update note", details: error.message },
      { status: 500 }
    );
  }
}