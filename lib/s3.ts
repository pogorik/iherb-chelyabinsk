import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Клиент и константы читают process.env лениво (при первом реальном вызове),
// а не в момент импорта модуля — иначе в скриптах, где .env.local
// подгружается через dotenv в начале файла, ES-модули всё равно поднимают
// (hoist) import этого файла раньше, и переменные окружения ещё пустые.
let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: process.env.S3_REGION ?? "ru-1",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
      // Нужно для S3-совместимых хранилищ вне AWS (в т.ч. Timeweb) — иначе SDK
      // строит виртуальный host-style URL, которого у них нет.
      forcePathStyle: true,
    });
  }
  return cachedClient;
}

function getBucket(): string {
  return process.env.S3_BUCKET ?? "product-images";
}

function getPublicBaseUrl(): string {
  return (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
}

export function generateObjectKey(originalFileName: string): string {
  const ext = originalFileName.split(".").pop()?.toLowerCase() || "jpg";
  return `${randomUUID()}.${ext}`;
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Если хранилище не поддерживает ACL на объект — уберите эту строку
      // и сделайте сам бакет публичным на чтение в панели Timeweb.
      ACL: "public-read",
    })
  );
  return `${getPublicBaseUrl()}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export function keyFromPublicUrl(url: string): string | null {
  const publicBaseUrl = getPublicBaseUrl();
  if (!publicBaseUrl || !url.startsWith(publicBaseUrl)) return null;
  return url.slice(publicBaseUrl.length + 1);
}
