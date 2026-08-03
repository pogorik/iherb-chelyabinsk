import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { generateObjectKey, uploadFile, deleteFile, keyFromPublicUrl } from "@/lib/s3";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Выберите файл изображения (JPG, PNG, WEBP)." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Файл слишком большой (максимум 5 МБ)." }, { status: 400 });
  }

  const key = generateObjectKey(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(key, buffer, file.type);

  return NextResponse.json({ url });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const key = keyFromPublicUrl(url);
  if (!key) return NextResponse.json({ error: "Unknown file" }, { status: 400 });

  await deleteFile(key);
  return NextResponse.json({ ok: true });
}
