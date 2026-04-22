import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Ensure only POST requests are handled
  try {
    // Validate input
    const { noteId, format = 'pdf' } = await req.json();
    
    // Validate noteId
    if (!noteId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Note ID is required' 
      }, { status: 400 });
    }

    // Fetch note details from database
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    // Check if note exists
    if (!note) {
      return NextResponse.json({ 
        success: false, 
        message: 'Note not found' 
      }, { status: 404 });
    }

    let fileBase64, filename;

    // Generate file based on format
    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(note.title || 'Untitled Note', 10, 10);

      doc.setFontSize(12);
      doc.text(note.content || '', 10, 20);

      fileBase64 = doc.output('datauristring');
      filename = `${note.title || 'note'}.pdf`;
    } else if (format === 'txt') {
      const txtContent = `${note.title || 'Untitled Note'}\n\n${note.content || ''}`;
      fileBase64 = `data:text/plain;base64,${Buffer.from(txtContent, 'utf-8').toString('base64')}`;
      filename = `${note.title || 'note'}.txt`;
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid format. Use "pdf" or "txt".' 
      }, { status: 400 });
    }

    // Return successful response
    return NextResponse.json({ 
      success: true,
      file: fileBase64, 
      filename 
    });

  } catch (error: any) {
    console.error('Export Note Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    }, { status: 500 });
  }
}