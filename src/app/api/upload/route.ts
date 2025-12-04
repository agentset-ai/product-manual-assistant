import { getNamespace } from "@/lib/agentset";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName, contentType, fileSize } = await req.json();

    // Validate required fields
    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, contentType, fileSize" },
        { status: 400 }
      );
    }

    // Validate file size (max 200MB)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds maximum limit of 200MB" },
        { status: 400 }
      );
    }

    // Validate content type (PDF only)
    if (contentType !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const ns = getNamespace();

    // Create presigned URL for upload
    const uploadResult = await ns.uploads.create({
      fileName,
      contentType,
      fileSize,
    });

    return NextResponse.json({
      url: uploadResult.url,
      key: uploadResult.key,
    });
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}

