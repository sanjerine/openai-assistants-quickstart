import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request, { params }) {
  const { fileId } = params;

  try {
    // Get the file content from OpenAI
    const fileContent = await openai.files.content(fileId);

    // Convert to blob
    const buffer = await fileContent.arrayBuffer();
    const blob = new Blob([buffer]);

    // Get file metadata to determine filename and content type
    const fileInfo = await openai.files.retrieve(fileId);

    // Return the file with appropriate headers
    return new NextResponse(blob, {
      headers: {
        "Content-Type": fileInfo.content_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${
          fileInfo.filename || "download"
        }"`,
      },
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json(
      { error: "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
