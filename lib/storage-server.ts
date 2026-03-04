import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getSignedUrlServer(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
