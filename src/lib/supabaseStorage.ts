import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

const client =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
    : null;

/**
 * Uploads a base64 data: URL avatar to Supabase Storage and returns its
 * public URL. If Supabase isn't configured, or the input isn't a data URL
 * (e.g. it's already a public URL), it's returned unchanged so profile
 * updates keep working before Supabase is set up.
 */
export async function uploadAvatarIfDataUrl(userId: string, avatarUrl: string | undefined): Promise<string | undefined> {
  if (!avatarUrl || !client || !avatarUrl.startsWith("data:")) return avatarUrl;

  const match = avatarUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return avatarUrl;

  const [, mimeType, base64Data] = match;
  const extension = mimeType.split("/")[1] ?? "jpg";
  const path = `${userId}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await client.storage
    .from(env.supabaseAvatarBucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    console.warn(`Supabase avatar upload failed, keeping data URL: ${error.message}`);
    return avatarUrl;
  }

  const { data } = client.storage.from(env.supabaseAvatarBucket).getPublicUrl(path);
  return data.publicUrl;
}
