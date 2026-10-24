import { createServerFn } from "@tanstack/react-start";
import { assertAdmin } from "@/lib/admin";
import { authMiddleware } from "@/lib/auth/middleware";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

export function refuseBlogImage(input: { slug?: string; type?: string; bytes?: number }): string | null {
  const slug = (input.slug ?? "").trim();
  if (!slug) return "Give the post an address before adding a picture.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "The address needs letters or numbers.";
  if (!TYPES.has(input.type ?? "")) return "Use a WebP, JPEG, or PNG picture.";
  if (!Number.isFinite(input.bytes) || (input.bytes ?? 0) < 1) return "That picture is empty.";
  if ((input.bytes ?? 0) > MAX_BYTES) return "Keep the picture under 2 MB.";
  return null;
}

export function blogImageKey(slug: string, now = new Date(), rand = "00000000"): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${slug}/${year}${month}${day}-${rand}.webp`;
}

function r2Settings():
  | { account: string; access: string; secret: string; bucket: string; base: string }
  | null {
  const account = process.env.R2_ACCOUNT_ID ?? "";
  const access = process.env.R2_ACCESS_KEY_ID ?? "";
  const secret = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.R2_BUCKET ?? "";
  const base = (process.env.R2_PUBLIC_BASE ?? "").replace(/\/$/, "");
  if (!account || !access || !secret || !bucket || !base.startsWith("https://")) return null;
  return { account, access, secret, bucket, base };
}

export const presignBlogImage = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; type?: string; bytes?: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ data, context }): Promise<{ ok: true; putUrl: string; url: string } | { ok: false; error: string }> => {
    await assertAdmin(context.userId);
    const error = refuseBlogImage(data);
    if (error) return { ok: false, error };
    const settings = r2Settings();
    if (!settings) return { ok: false, error: "Picture upload is not set up on this host." };
    const { randomBytes } = await import("node:crypto");
    const key = blogImageKey(data.slug!.trim(), new Date(), randomBytes(4).toString("hex"));
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${settings.account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: settings.access, secretAccessKey: settings.secret },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
    const putUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: settings.bucket,
        Key: key,
        ContentType: "image/webp",
        ContentLength: data.bytes,
      }),
      { expiresIn: 300 },
    );
    return { ok: true, putUrl, url: `${settings.base}/${key}` };
  });
