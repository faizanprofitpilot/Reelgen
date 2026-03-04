import { createClient } from "@/lib/supabase/client";

export async function uploadProductImages(
  projectId: string,
  files: File[]
): Promise<string[]> {
  const supabase = createClient();
  const paths: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `projects/${projectId}/product/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    paths.push(filePath);
  }

  return paths;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
