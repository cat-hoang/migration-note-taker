import { NextResponse } from "next/server";
import { extractPdf, extractDocx } from "@/lib/extractors";
import { Buffer } from "buffer";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type;
    const name = file.name.toLowerCase();

    let text: string;

    if (mime === "text/plain" || name.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else if (mime === "application/pdf" || name.endsWith(".pdf")) {
      text = await extractPdf(buffer);
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      text = await extractDocx(buffer);
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload .txt, .pdf, or .docx" }, { status: 415 });
    }

    // Normalise line endings
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
