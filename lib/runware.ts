import { v4 as uuidv4 } from "uuid";
import type {
  RunwareImageUploadTask,
  RunwareVideoInferenceTask,
  RunwareGetResponseTask,
  RunwareResponse,
} from "@/types/runware";

// Note: Verify the correct API endpoint in Runware documentation
// This may need to be adjusted based on Runware's actual API structure
const RUNWARE_API_URL = "https://api.runware.ai/v1";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runwareRequest(tasks: any[]): Promise<RunwareResponse> {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY is not set");
  }

  const response = await fetch(`${RUNWARE_API_URL}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(tasks),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Runware API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Upload an image to Runware. Accepts a data URI (data:image/...;base64,...),
 * raw base64 string, or a publicly accessible URL. Use data URI for private/signed URLs.
 */
export async function uploadImageToRunware(image: string): Promise<string> {
  const taskUUID = uuidv4();
  const task: RunwareImageUploadTask = {
    taskType: "imageUpload",
    taskUUID,
    image,
  };

  const response = await runwareRequest([task]);

  if (response.errors) {
    throw new Error(`Image upload failed: ${response.errors[0].message}`);
  }

  if (!response.data || !response.data[0]?.imageUUID) {
    throw new Error("Invalid response from Runware image upload");
  }

  return response.data[0].imageUUID;
}

async function pollRunwareTask(
  taskUUID: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000
): Promise<RunwareResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pollTask: RunwareGetResponseTask = {
      taskType: "getResponse",
      taskUUID,
    };

    const response = await runwareRequest([pollTask]);

    if (response.errors) {
      throw new Error(`Polling failed: ${response.errors[0].message}`);
    }

    if (response.data && response.data[0]?.videoURL) {
      return response;
    }

    // If no video URL yet, wait and retry
    await sleep(intervalMs);
  }

  throw new Error("Video generation timeout - exceeded max polling attempts");
}

/**
 * Fetch the current result for a Runware task by UUID. Returns the video URL if the job is complete.
 * Use this to recover a video when you have the task ID from the Runware dashboard.
 */
export async function getVideoUrlByTaskId(taskUUID: string): Promise<string> {
  const pollTask: RunwareGetResponseTask = {
    taskType: "getResponse",
    taskUUID: taskUUID.trim(),
  };
  const response = await runwareRequest([pollTask]);
  if (response.errors) {
    throw new Error(response.errors[0]?.message ?? "Runware request failed");
  }
  const videoURL = response.data?.[0]?.videoURL;
  if (!videoURL) {
    throw new Error("Video not ready yet or task not found. Check the task ID in Runware.");
  }
  return videoURL;
}

export interface GenerateKlingI2VParams {
  prompt: string;
  avatarImageUrl: string;
  productImageUrls: string[];
  durationSeconds: number; // Kling 3.0 supports 3–15 seconds
  seed?: number;
}

export async function generateKlingI2VVideo({
  prompt,
  avatarImageUrl,
  productImageUrls,
  durationSeconds,
  seed,
}: GenerateKlingI2VParams): Promise<string> {
  // Upload images to Runware
  const avatarImageId = await uploadImageToRunware(avatarImageUrl);
  const productImageIds = await Promise.all(
    productImageUrls.map((url) => uploadImageToRunware(url))
  );

  // Kling VIDEO 3.0 Standard: use inputs.frameImages (docs: https://runware.ai/docs/providers/klingai#kling-video-30-standard)
  const frameImages: Array<{ image: string; frame: string }> = [
    { image: avatarImageId, frame: "first" },
    ...productImageIds.map((id) => ({ image: id, frame: "first" })),
  ];

  const taskUUID = uuidv4();
  const task: RunwareVideoInferenceTask = {
    taskType: "videoInference",
    taskUUID,
    deliveryMethod: "async",
    model: "klingai:kling-video@3-standard",
    positivePrompt: prompt,
    duration: durationSeconds,
    // Kling VIDEO 3.0 Standard does not accept width/height in Runware.
    // Output dimensions are inferred from the input frame image(s) (or controlled via `resolution` if needed).
    fps: 24,
    outputType: "URL",
    outputFormat: "mp4",
    numberResults: 1,
    inputs: { frameImages },
    providerSettings: { klingai: { sound: true } },
    seed,
  };

  // Submit task
  const initialResponse = await runwareRequest([task]);

  if (initialResponse.errors) {
    throw new Error(`Video generation failed: ${initialResponse.errors[0].message}`);
  }

  // Poll for completion
  const finalResponse = await pollRunwareTask(taskUUID);

  if (!finalResponse.data || !finalResponse.data[0]?.videoURL) {
    throw new Error("Video generation completed but no video URL returned");
  }

  return finalResponse.data[0].videoURL;
}
