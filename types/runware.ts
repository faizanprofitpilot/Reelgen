export interface RunwareTask {
  taskType: string;
  taskUUID: string;
  includeCost?: boolean;
  [key: string]: any;
}

export interface RunwareImageUploadTask extends RunwareTask {
  taskType: "imageUpload";
  /** Data URI (data:image/png;base64,...), base64 string, or publicly accessible URL */
  image: string;
}

export interface RunwareVideoInferenceTask extends RunwareTask {
  taskType: "videoInference";
  deliveryMethod: "async";
  model: string;
  positivePrompt: string;
  duration: number;
  fps?: number;
  width?: number;
  height?: number;
  outputType: "URL";
  outputFormat: "mp4" | "webm" | "mov";
  numberResults?: number;
  /** Top-level for some models; for Kling 3.0 use inputs.frameImages */
  frameImages?: Array<{ image: string; frame: string }>;
  /** Kling 3.0 Standard/Pro use inputs.frameImages */
  inputs?: {
    frameImages?: Array<{ image: string; frame: string }>;
  };
  providerSettings?: { klingai?: { sound?: boolean } };
  seed?: number;
}

export interface RunwareGetResponseTask extends RunwareTask {
  taskType: "getResponse";
  taskUUID: string;
}

export interface RunwareResponse {
  data?: Array<{
    taskType: string;
    taskUUID: string;
    imageUUID?: string;
    imageURL?: string;
    videoURL?: string;
    cost?: number;
  }>;
  errors?: Array<{
    message: string;
    code?: string;
  }>;
}
