/**
 * Leonardo.ai API Service
 * Handles all communication with the Leonardo.ai REST API
 * for image generation, status polling, model fetching, and credit tracking.
 *
 * ── IMPORTANT NOTES ──
 * - Leonardo.ai API uses Bearer token auth
 * - The /generations endpoint is strict about payload fields
 * - Not all models support all sd_version values
 * - The API may return 403 if unsupported params are sent
 */

// The Leonardo.ai API base URL
const API_BASE = "https://cloud.leonardo.ai/api/rest/v1";

// Default fallback model ID: Leonardo Kino XL
export const DEFAULT_MODEL_ID = "aa77f04e-3eec-4034-9c07-d0f619684628";

// ── Types ────────────────────────────────────────────────────────

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  modelId: string;
  width?: number;
  height?: number;
  sdVersion?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  modelId: string;
  ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  duration?: number; // in seconds
  resolution?: string; // e.g., "720p", "1080p"
}

export interface GeneratedImage {
  id: string;
  url: string;
  nsfw: boolean;
  likeCount: number;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  nsfw: boolean;
  duration?: number;
  resolution?: string;
}

export interface GenerationResult {
  id: string;
  status: "PENDING" | "COMPLETE" | "FAILED";
  generatedImages: GeneratedImage[];
}

export interface VideoGenerationResult {
  id: string;
  status: "PENDING" | "COMPLETE" | "FAILED";
  generatedVideos: GeneratedVideo[];
}

/** A model available on the Leonardo.ai platform */
export interface LeonardoModel {
  id: string;
  name: string;
  description: string;
  nsfw: boolean;
  featured: boolean;
  generated_image?: {
    id: string;
    url: string;
  } | null;
  imageCount?: number;
  modelHeight?: number;
  modelWidth?: number;
  status?: string;
  type?: string;
  sdVersion?: string;
  createdAt?: string;
}

/** A video model available on the Leonardo.ai platform */
export interface LeonardoVideoModel {
  id: string;
  name: string;
  description: string;
  nsfw: boolean;
  featured: boolean;
  thumbnail_url?: string | null;
  status?: string;
  type?: string;
  createdAt?: string;
  supportedResolutions?: string[];
  maxDuration?: number; // in seconds
}

/** User credit / subscription information */
export interface UserCredits {
  apiConcurrencySlots: number;
  apiPaidTokens: number;         // Paid API credits remaining
  apiSubscriptionTokens: number; // Subscription-based API credits remaining
  apiPlanTokenRenewalDate: string | null;
  tokenRenewalDate: string | null;
  subscriptionTokens: number;    // Web subscription tokens
  paidTokens: number;            // Paid web tokens
  unverifiedStripePaidTokens: number;
  user: {
    id: string;
    username: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
}

// ── LocalStorage key management ──────────────────────────────────

const API_KEY_STORAGE = "2m_ai_studio_api_key";
const MODELS_CACHE_STORAGE = "2m_ai_studio_models_cache";
const SELECTED_MODEL_STORAGE = "2m_ai_studio_selected_model";

/** Save the API key to localStorage */
export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

/** Retrieve the API key from localStorage */
export function getApiKey(): string | null {
  const key = localStorage.getItem(API_KEY_STORAGE);
  return key && key.trim() ? key.trim() : null;
}

/** Remove the API key from localStorage */
export function removeApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE);
}

/** Save fetched models to localStorage for caching */
export function cacheModels(models: LeonardoModel[]): void {
  localStorage.setItem(MODELS_CACHE_STORAGE, JSON.stringify(models));
}

/** Retrieve cached models from localStorage */
export function getCachedModels(): LeonardoModel[] | null {
  const cached = localStorage.getItem(MODELS_CACHE_STORAGE);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/** Clear cached models */
export function clearCachedModels(): void {
  localStorage.removeItem(MODELS_CACHE_STORAGE);
}

/** Save selected model ID */
export function saveSelectedModel(modelId: string): void {
  localStorage.setItem(SELECTED_MODEL_STORAGE, modelId);
}

/** Get selected model ID */
export function getSelectedModel(): string | null {
  return localStorage.getItem(SELECTED_MODEL_STORAGE);
}

// ── API Helper ───────────────────────────────────────────────────

/**
 * Makes an authenticated request to the Leonardo.ai API.
 * Throws descriptive errors for common failure scenarios.
 *
 * IMPORTANT: The API requires lowercase 'authorization' in some environments
 * and the key must be passed as 'Bearer <key>' format.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "API key not configured. Please add your Leonardo.ai API key in Settings."
    );
  }

  const url = `${API_BASE}${endpoint}`;

  // Build headers — only include Content-Type for requests with body
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${apiKey}`,
  };

  // Only set content-type for POST/PUT/PATCH requests
  if (options.body) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  // Handle common HTTP error codes with user-friendly messages
  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      // ignore read errors
    }

    let errorMessage = `API Error (${response.status})`;

    switch (response.status) {
      case 401:
        errorMessage =
          "Invalid API Key. Please check your Leonardo.ai API key in Settings.";
        break;
      case 403:
        errorMessage =
          "Access forbidden. This could be caused by:\n• Invalid or expired API key\n• Your plan doesn't support API access\n• The selected model requires a higher plan\n\nPlease verify your API key in Settings, or try a different model.";
        break;
      case 402:
        errorMessage =
          "Insufficient credits. Please add more credits to your Leonardo.ai account.";
        break;
      case 429:
        errorMessage =
          "Rate limit exceeded. Please wait a moment and try again.";
        break;
      case 500:
      case 502:
      case 503:
        errorMessage =
          "Leonardo.ai server error. Please try again in a few moments.";
        break;
      default:
        try {
          const parsed = JSON.parse(errorBody);
          errorMessage =
            parsed.error?.message ||
            parsed.error ||
            parsed.message ||
            parsed.code ||
            errorMessage;
        } catch {
          if (errorBody) {
            errorMessage += `: ${errorBody.substring(0, 200)}`;
          }
        }
    }

    console.error(`Leonardo API error [${response.status}]:`, errorBody);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ── Core API Methods ─────────────────────────────────────────────

/**
 * Fetches the user's credit balance and subscription info.
 * Calls GET /me to retrieve the authenticated user's data.
 */
export async function fetchUserCredits(): Promise<UserCredits> {
  const data = await apiRequest<{
    user_details: Array<{
      apiConcurrencySlots: number;
      apiPaidTokens: number;
      apiSubscriptionTokens: number;
      apiPlanTokenRenewalDate: string | null;
      tokenRenewalDate: string | null;
      subscriptionTokens: number;
      paidTokens: number;
      unverifiedStripePaidTokens: number;
      user: {
        id: string;
        username: string;
      };
    }>;
  }>("/me", {
    method: "GET",
  });

  if (!data.user_details || data.user_details.length === 0) {
    throw new Error("Could not retrieve user information.");
  }

  const details = data.user_details[0];

  return {
    apiConcurrencySlots: details.apiConcurrencySlots ?? 0,
    apiPaidTokens: details.apiPaidTokens ?? 0,
    apiSubscriptionTokens: details.apiSubscriptionTokens ?? 0,
    apiPlanTokenRenewalDate: details.apiPlanTokenRenewalDate ?? null,
    tokenRenewalDate: details.tokenRenewalDate ?? null,
    subscriptionTokens: details.subscriptionTokens ?? 0,
    paidTokens: details.paidTokens ?? 0,
    unverifiedStripePaidTokens: details.unverifiedStripePaidTokens ?? 0,
    user: {
      id: details.user?.id ?? "",
      username: details.user?.username ?? "Unknown",
    },
  };
}

/**
 * Fetches all available platform models from Leonardo.ai.
 * Returns an array of models sorted by featured + name.
 */
export async function fetchPlatformModels(): Promise<LeonardoModel[]> {
  const data = await apiRequest<{
    custom_models: LeonardoModel[];
  }>("/platformModels", {
    method: "GET",
  });

  const models = data.custom_models || [];

  // Sort: featured first, then by name
  models.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  // Cache the models
  cacheModels(models);

  return models;
}

/**
 * Fetches all available video generation models from Leonardo.ai.
 * Returns an array of video models sorted by featured + name.
 */
export async function fetchVideoModels(): Promise<LeonardoVideoModel[]> {
  const data = await apiRequest<{
    video_models: LeonardoVideoModel[];
  }>("/video-models", {
    method: "GET",
  });

  const models = data.video_models || [];

  // Sort: featured first, then by name
  models.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return models;
}

/**
 * Determine safe dimensions for a model.
 * Leonardo.ai is very strict about width/height.
 * - SDXL models: typically 1024x1024
 * - SD 1.5 models: typically 512x512
 * - SD 2.1 models: typically 768x768
 * - If model provides dimensions, use those (but clamp to multiples of 8)
 */
function getModelDimensions(
  model: LeonardoModel | undefined,
  requestWidth?: number,
  requestHeight?: number
): { width: number; height: number } {
  // If explicit dimensions provided in request, use them
  if (requestWidth && requestHeight) {
    // Ensure they're multiples of 8 (Leonardo requirement)
    return {
      width: Math.round(requestWidth / 8) * 8,
      height: Math.round(requestHeight / 8) * 8,
    };
  }

  // If model has specific dimensions, use them
  if (model?.modelWidth && model?.modelHeight) {
    return {
      width: Math.round(model.modelWidth / 8) * 8,
      height: Math.round(model.modelHeight / 8) * 8,
    };
  }

  // Fallback based on SD version
  const sdVersion = model?.sdVersion || "";
  if (sdVersion.includes("SDXL") || sdVersion.includes("LIGHTNING") || sdVersion.includes("PHOENIX")) {
    return { width: 1024, height: 1024 };
  }
  if (sdVersion.includes("v2")) {
    return { width: 768, height: 768 };
  }
  if (sdVersion.includes("v1")) {
    return { width: 512, height: 512 };
  }

  // Ultimate fallback
  return { width: 1024, height: 1024 };
}

/**
 * Initiates an image generation request.
 * Returns the generation ID used for polling.
 *
 * ── KEY FIX FOR 403 ERROR ──
 * The Leonardo.ai API is strict about the payload.
 * - We must NOT send unsupported fields
 * - `sd_version` is often rejected; let the API infer from model
 * - `alchemy`, `presetStyle` can cause 403 on free/basic plans
 * - We keep the payload minimal: prompt, modelId, width, height, num_images
 */
export async function startGeneration(
  request: GenerationRequest,
  model?: LeonardoModel
): Promise<string> {
  const modelId = request.modelId || DEFAULT_MODEL_ID;
  const dims = getModelDimensions(model, request.width, request.height);

  // ── Build a MINIMAL payload to avoid 403 errors ──
  // Leonardo.ai rejects requests with unsupported or plan-restricted fields.
  // Only include what's absolutely necessary.
  const payload: Record<string, unknown> = {
    prompt: request.prompt,
    modelId: modelId,
    width: dims.width,
    height: dims.height,
    num_images: 1,
  };

  // Only add negative prompt if user provided one
  if (request.negativePrompt && request.negativePrompt.trim()) {
    payload.negative_prompt = request.negativePrompt.trim();
  }

  console.log("Generation payload:", JSON.stringify(payload, null, 2));

  const data = await apiRequest<{
    sdGenerationJob: { generationId: string };
  }>("/generations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data.sdGenerationJob?.generationId) {
    throw new Error(
      "No generation ID returned from the API. The request may have been rejected."
    );
  }

  return data.sdGenerationJob.generationId;
}

/**
 * Polls the status of a generation by its ID.
 * Returns the current status and any generated images.
 */
export async function checkGenerationStatus(
  generationId: string
): Promise<GenerationResult> {
  const data = await apiRequest<{
    generations_by_pk: {
      id: string;
      status: "PENDING" | "COMPLETE" | "FAILED";
      generated_images: Array<{
        id: string;
        url: string;
        nsfw: boolean;
        likeCount: number;
      }>;
    };
  }>(`/generations/${generationId}`, {
    method: "GET",
  });

  if (!data.generations_by_pk) {
    throw new Error("Generation not found. It may have expired.");
  }

  const gen = data.generations_by_pk;

  return {
    id: gen.id,
    status: gen.status,
    generatedImages: (gen.generated_images || []).map((img) => ({
      id: img.id,
      url: img.url,
      nsfw: img.nsfw,
      likeCount: img.likeCount,
    })),
  };
}

/**
 * Initiates a video generation request.
 * Returns the generation ID used for polling.
 */
export async function startVideoGeneration(
  request: VideoGenerationRequest
): Promise<string> {
  const payload: Record<string, unknown> = {
    prompt: request.prompt,
    modelId: request.modelId,
  };

  // Add optional parameters if provided
  if (request.ratio) {
    payload.ratio = request.ratio;
  }
  if (request.duration) {
    payload.duration = request.duration;
  }
  if (request.resolution) {
    payload.resolution = request.resolution;
  }

  console.log("Video generation payload:", JSON.stringify(payload, null, 2));

  const data = await apiRequest<{
    videoGenerationJob: { generationId: string };
  }>("/video-generations", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!data.videoGenerationJob?.generationId) {
    throw new Error(
      "No generation ID returned from the API. The request may have been rejected."
    );
  }

  return data.videoGenerationJob.generationId;
}

/**
 * Polls the status of a video generation by its ID.
 * Returns the current status and any generated videos.
 */
export async function checkVideoGenerationStatus(
  generationId: string
): Promise<VideoGenerationResult> {
  const data = await apiRequest<{
    video_generations_by_pk: {
      id: string;
      status: "PENDING" | "COMPLETE" | "FAILED";
      generated_videos: Array<{
        id: string;
        url: string;
        thumbnail_url?: string;
        nsfw: boolean;
        duration?: number;
        resolution?: string;
      }>;
    };
  }>(`/video-generations/${generationId}`, {
    method: "GET",
  });

  if (!data.video_generations_by_pk) {
    throw new Error("Video generation not found. It may have expired.");
  }

  const gen = data.video_generations_by_pk;

  return {
    id: gen.id,
    status: gen.status,
    generatedVideos: (gen.generated_videos || []).map((vid) => ({
      id: vid.id,
      url: vid.url,
      thumbnail_url: vid.thumbnail_url,
      nsfw: vid.nsfw,
      duration: vid.duration,
      resolution: vid.resolution,
    })),
  };
}

/**
 * Test the API key by making a simple GET /me request.
 * Returns true if the key is valid, false otherwise.
 */
export async function testApiKey(): Promise<{
  valid: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const credits = await fetchUserCredits();
    return {
      valid: true,
      username: credits.user.username,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Invalid API key",
    };
  }
}
