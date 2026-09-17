// app/api/upload/route.ts
// Local production file upload handler for documents and student assets
import { NextResponse, type NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireStudent } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const user = await requireStudent();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentId = formData.get("studentId") as string | null;
    const type = formData.get("type") as string | null;

    if (!file || !studentId) {
      return NextResponse.json(
        { success: false, error: "Dosya veya öğrenci kimliği eksik." },
        { status: 400 }
      );
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu 10 MB sınırını aşıyor." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const subPath = `uploads/documents/${studentId}/${type || "OTHER"}`;
    const uploadDir = join(process.cwd(), "public", subPath);

    await mkdir(uploadDir, { recursive: true });

    const fullFilePath = join(uploadDir, cleanName);
    await writeFile(fullFilePath, buffer);

    const fileUrl = `/${subPath}/${cleanName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    console.error("Local file upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Dosya kaydedilirken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
