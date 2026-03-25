/**
 * App.tsx — Main entry point for '2M AI Studio'
 *
 * Orchestrates the entire image generation workflow:
 * 1. User configures their Leonardo.ai API key in Settings (validated on save)
 * 2. Models are automatically fetched from the Leonardo.ai API
 * 3. Credits are fetched and displayed (checked after every generation)
 * 4. User selects a model, enters a prompt and clicks Generate
 * 5. App sends a MINIMAL generation request to avoid 403 errors
 * 6. Polls for completion every 10 seconds
 * 7. Credits are re-checked after each generation completes
 * 8. Generated image is displayed in the gallery with download option
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Heart } from "lucide-react";

// Components
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import PromptInput from "./components/PromptInput";
import ProcessingAnimation from "./components/ProcessingAnimation";
import ImageGallery, { type GalleryImage } from "./components/ImageGallery";
import VideoGallery, { type GalleryVideo } from "./components/VideoGallery";
import ErrorDisplay from "./components/ErrorDisplay";
import SettingsModal from "./components/SettingsModal";
import CreditToast from "./components/CreditToast";

// Services
import {
  getApiKey,
  startGeneration,
  checkGenerationStatus,
  fetchPlatformModels,
  fetchUserCredits,
  getCachedModels,
  getSelectedModel,
  saveSelectedModel,
  DEFAULT_MODEL_ID,
  type LeonardoModel,
  type UserCredits,
  type LeonardoVideoModel,
  type VideoGenerationRequest,
  type GeneratedVideo,
  fetchVideoModels,
  startVideoGeneration,
  checkVideoGenerationStatus,
} from "./services/leonardo";

// ── Polling configuration ────────────────────────────────────────
const POLL_INTERVAL_MS = 10_000; // Check every 10 seconds
const MAX_POLL_ATTEMPTS = 60;    // Max ~10 minutes of polling

// ── Application State Types ──────────────────────────────────────
type GenerationStatus = "idle" | "submitting" | "polling" | "error";

export default function App() {
  // Core state
  const [hasApiKey, setHasApiKey] = useState(!!getApiKey());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Generating your image...");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<GalleryVideo[]>([]);

  // Mode selection: 'image' or 'video'
  const [mode, setMode] = useState<'image' | 'video'>('image');

  // Model state
  const [models, setModels] = useState<LeonardoModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    getSelectedModel() || DEFAULT_MODEL_ID
  );
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Video model state
  const [videoModels, setVideoModels] = useState<LeonardoVideoModel[]>([]);
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>("");
  const [selectedVideoRatio, setSelectedVideoRatio] = useState<string>('16:9');
  const [isLoadingVideoModels, setIsLoadingVideoModels] = useState(false);
  const [videoModelError, setVideoModelError] = useState<string | null>(null);

  // ── Credit state ─────────────────────────────────────────────────
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditLastChecked, setCreditLastChecked] = useState<number | null>(null);
  // Track credits before generation for the toast notification
  const [creditsBefore, setCreditsBefore] = useState<number | null>(null);
  const [creditsAfter, setCreditsAfter] = useState<number | null>(null);
  const [showCreditToast, setShowCreditToast] = useState(false);

  // Ref to track the last prompt for retry functionality
  const lastPromptRef = useRef<{ prompt: string; negative: string }>({
    prompt: "",
    negative: "",
  });

  // Polling ref to allow cleanup
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  // ── Credit Fetching ─────────────────────────────────────────────

  /**
   * Fetch the user's credit balance from Leonardo.ai.
   * Called on mount, after API key changes, and after every generation.
   * Returns the credits for use in post-generation comparison.
   */
  const handleFetchCredits = useCallback(async (): Promise<UserCredits | null> => {
    if (!getApiKey()) return null;

    setIsLoadingCredits(true);
    setCreditError(null);

    try {
      const userCredits = await fetchUserCredits();
      setCredits(userCredits);
      setCreditLastChecked(Date.now());
      return userCredits;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch credit balance";
      setCreditError(message);
      console.error("Failed to fetch credits:", err);
      return null;
    } finally {
      setIsLoadingCredits(false);
    }
  }, []);

  // ── Model Fetching ──────────────────────────────────────────────

  /**
   * Fetch platform models from Leonardo.ai API.
   * Called when API key is saved or on manual refresh.
   */
  const handleFetchModels = useCallback(async () => {
    if (!getApiKey()) return;

    setIsLoadingModels(true);
    setModelError(null);

    try {
      const fetchedModels = await fetchPlatformModels();
      setModels(fetchedModels);

      // If the currently selected model isn't in the list,
      // auto-select the first featured model or the first model
      const currentExists = fetchedModels.some((m) => m.id === selectedModelId);
      if (!currentExists && fetchedModels.length > 0) {
        const featured = fetchedModels.find((m) => m.featured);
        const fallback = featured || fetchedModels[0];
        setSelectedModelId(fallback.id);
        saveSelectedModel(fallback.id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch models";
      setModelError(message);
      console.error("Failed to fetch models:", err);
    } finally {
      setIsLoadingModels(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch video models from Leonardo.ai API.
   */
  const handleFetchVideoModels = useCallback(async () => {
    if (!getApiKey()) return;

    setIsLoadingVideoModels(true);
    setVideoModelError(null);

    try {
      const fetchedVideoModels = await fetchVideoModels();
      setVideoModels(fetchedVideoModels);

      // Auto-select first video model if none selected
      if (fetchedVideoModels.length > 0 && !selectedVideoModelId) {
        const featured = fetchedVideoModels.find((m) => m.featured);
        const fallback = featured || fetchedVideoModels[0];
        setSelectedVideoModelId(fallback.id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch video models";
      setVideoModelError(message);
      console.error("Failed to fetch video models:", err);
    } finally {
      setIsLoadingVideoModels(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoModelId]);

  /**
   * On initial mount: load cached models and fetch fresh data if API key exists.
   * Also fetch credits on mount.
   */
  useEffect(() => {
    if (getApiKey()) {
      const cached = getCachedModels();
      if (cached && cached.length > 0) {
        setModels(cached);
        // Still refresh in the background for freshness
        handleFetchModels();
      } else {
        handleFetchModels();
      }

      // Fetch credits on mount
      handleFetchCredits();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Handle model selection */
  const handleSelectModel = useCallback((model: LeonardoModel) => {
    setSelectedModelId(model.id);
    saveSelectedModel(model.id);
  }, []);

  /** Refresh the API key status (called from Settings modal) */
  const refreshApiKeyStatus = useCallback(() => {
    setHasApiKey(!!getApiKey());
    // If key was removed, clear models and credits
    if (!getApiKey()) {
      setModels([]);
      setModelError(null);
      setCredits(null);
      setCreditError(null);
      setCreditLastChecked(null);
    }
  }, []);

  /** Clean up polling on unmount */
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  // Get selected model details for display
  const selectedModel = models.find((m) => m.id === selectedModelId);

  /**
   * Main generation handler for images.
   * Sends a MINIMAL request to Leonardo.ai and initiates the polling loop.
   *
   * ── KEY FIX FOR 403 ──
   * We now pass the full model object to startGeneration so it can
   * calculate correct dimensions and avoid sending unsupported parameters.
   */
  const handleGenerate = useCallback(
    async (prompt: string, negativePrompt: string) => {
      if (mode === 'video') {
        handleGenerateVideo(prompt);
        return;
      }

      // Reset state
      setError(null);
      setStatus("submitting");
      setGenerationStartTime(Date.now());
      setStatusMessage("Sending request to Leonardo.ai...");
      abortRef.current = false;
      setShowCreditToast(false);

      // Save current credits for comparison after generation
      const currentTotal = credits
        ? credits.apiSubscriptionTokens + credits.apiPaidTokens
        : null;
      setCreditsBefore(currentTotal);

      // Save for retry
      lastPromptRef.current = { prompt, negative: negativePrompt };

      try {
        // Step 1: Send the generation request with selected model
        // Pass the full model object so startGeneration can determine
        // correct dimensions and avoid 403 errors
        const generationId = await startGeneration(
          {
            prompt,
            negativePrompt,
            modelId: selectedModelId,
          },
          selectedModel // Pass model object for dimension calculation
        );

        if (abortRef.current) return;

        // Step 2: Begin polling loop
        setStatus("polling");
        setStatusMessage("AI is processing your prompt...");

        let attempts = 0;
        const startTime = Date.now();

        const poll = async () => {
          if (abortRef.current) return;

          attempts++;

          try {
            const result = await checkGenerationStatus(generationId);

            if (abortRef.current) return;

            if (result.status === "COMPLETE") {
              // ✅ Success — image is ready
              const elapsed = Math.floor((Date.now() - startTime) / 1000);

              if (result.generatedImages.length > 0) {
                const newImages: GalleryImage[] = result.generatedImages.map(
                  (img) => ({
                    id: img.id,
                    url: img.url,
                    prompt,
                    generatedAt: Date.now(),
                    elapsedSeconds: elapsed,
                    modelName: selectedModel?.name || "Unknown Model",
                  })
                );

                setImages((prev) => [...newImages, ...prev]);
              }

              setStatus("idle");

              // ── Re-check credits after generation ──────────────
              const updatedCredits = await handleFetchCredits();
              if (updatedCredits && currentTotal !== null) {
                const newTotal =
                  updatedCredits.apiSubscriptionTokens +
                  updatedCredits.apiPaidTokens;
                setCreditsAfter(newTotal);
                setShowCreditToast(true);

                // Auto-hide toast after 8 seconds
                setTimeout(() => {
                  setShowCreditToast(false);
                }, 8000);
              }

              return;
            }

            if (result.status === "FAILED") {
              // ❌ Generation failed on server side
              setError(
                "Image generation failed on the server. This may be due to content moderation or a server issue. Please try a different prompt."
              );
              setStatus("error");

              // Still check credits even on failure
              handleFetchCredits();
              return;
            }

            // ⏳ Still pending — continue polling
            if (attempts >= MAX_POLL_ATTEMPTS) {
              setError(
                "Generation timed out after 10 minutes. Please try again."
              );
              setStatus("error");
              handleFetchCredits();
              return;
            }

            // Schedule next poll with contextual messages
            setStatusMessage(
              attempts < 3
                ? "AI is processing your prompt..."
                : attempts < 6
                ? "Rendering in progress..."
                : "Almost done — finalizing your image..."
            );

            pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          } catch (pollError) {
            if (abortRef.current) return;
            // Network errors during polling — retry a few times
            if (attempts < MAX_POLL_ATTEMPTS) {
              setStatusMessage("Connection hiccup — retrying...");
              pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
            } else {
              setError(
                pollError instanceof Error
                  ? pollError.message
                  : "An unexpected error occurred while checking generation status."
              );
              setStatus("error");
              handleFetchCredits();
            }
          }
        };

        // Start first poll after a short delay
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (submitError) {
        if (abortRef.current) return;

        const errMsg =
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit generation request. Please try again.";

        setError(errMsg);
        setStatus("error");

        // Check credits after submission failure too
        handleFetchCredits();
      }
    },
    [selectedModelId, selectedModel, credits, handleFetchCredits, mode]
  );

  /**
   * Video generation handler.
   */
  const handleGenerateVideo = useCallback(
    async (prompt: string) => {
      // Reset state
      setError(null);
      setStatus("submitting");
      setGenerationStartTime(Date.now());
      setStatusMessage("Sending video generation request to Leonardo.ai...");
      abortRef.current = false;
      setShowCreditToast(false);

      // Save current credits for comparison
      const currentTotal = credits
        ? credits.apiSubscriptionTokens + credits.apiPaidTokens
        : null;
      setCreditsBefore(currentTotal);

      // Save for retry
      lastPromptRef.current = { prompt, negative: "" };

      try {
        if (!selectedVideoModelId) {
          throw new Error("Please select a video model");
        }

        // Step 1: Send the video generation request
        const generationId = await startVideoGeneration({
          prompt,
          modelId: selectedVideoModelId,
          ratio: selectedVideoRatio as '16:9' | '9:16' | '1:1' | '4:3' | '3:4',
          duration: 5, // Default 5 seconds
        });

        if (abortRef.current) return;

        // Step 2: Begin polling loop
        setStatus("polling");
        setStatusMessage("AI is generating your video...");

        let attempts = 0;
        const startTime = Date.now();

        const pollVideo = async () => {
          if (abortRef.current) return;

          attempts++;

          try {
            const result = await checkVideoGenerationStatus(generationId);

            if (abortRef.current) return;

            if (result.status === "COMPLETE") {
              // ✅ Success — video is ready
              const elapsed = Math.floor((Date.now() - startTime) / 1000);

              if (result.generatedVideos.length > 0) {
                const newVideos: GalleryVideo[] = result.generatedVideos.map(
                  (vid) => ({
                    id: vid.id,
                    url: vid.url,
                    thumbnail_url: vid.thumbnail_url,
                    prompt,
                    generatedAt: Date.now(),
                    elapsedSeconds: elapsed,
                    modelName: videoModels.find(m => m.id === selectedVideoModelId)?.name || "Unknown Model",
                    duration: vid.duration,
                    resolution: vid.resolution,
                  })
                );

                setVideos((prev) => [...newVideos, ...prev]);
              }

              setStatus("idle");

              // Re-check credits after generation
              const updatedCredits = await handleFetchCredits();
              if (updatedCredits && currentTotal !== null) {
                const newTotal =
                  updatedCredits.apiSubscriptionTokens +
                  updatedCredits.apiPaidTokens;
                setCreditsAfter(newTotal);
                setShowCreditToast(true);

                setTimeout(() => {
                  setShowCreditToast(false);
                }, 8000);
              }

              return;
            }

            if (result.status === "FAILED") {
              setError(
                "Video generation failed on the server. This may be due to content moderation or a server issue. Please try a different prompt."
              );
              setStatus("error");
              handleFetchCredits();
              return;
            }

            // ⏳ Still pending — continue polling
            if (attempts >= MAX_POLL_ATTEMPTS) {
              setError(
                "Video generation timed out after 10 minutes. Please try again."
              );
              setStatus("error");
              handleFetchCredits();
              return;
            }

            setStatusMessage(
              attempts < 3
                ? "AI is generating your video..."
                : attempts < 6
                ? "Rendering video frames..."
                : "Almost done — finalizing your video..."
            );

            pollingRef.current = setTimeout(pollVideo, POLL_INTERVAL_MS);
          } catch (pollError) {
            if (abortRef.current) return;
            if (attempts < MAX_POLL_ATTEMPTS) {
              setStatusMessage("Connection hiccup — retrying...");
              pollingRef.current = setTimeout(pollVideo, POLL_INTERVAL_MS);
            } else {
              setError(
                pollError instanceof Error
                  ? pollError.message
                  : "An unexpected error occurred while checking video generation status."
              );
              setStatus("error");
              handleFetchCredits();
            }
          }
        };

        pollingRef.current = setTimeout(pollVideo, POLL_INTERVAL_MS);
      } catch (submitError) {
        if (abortRef.current) return;

        const errMsg =
          submitError instanceof Error
            ? submitError.message
            : "Failed to submit video generation request. Please try again.";

        setError(errMsg);
        setStatus("error");
        handleFetchCredits();
      }
    },
    [selectedVideoModelId, videoModels, credits, handleFetchCredits]
  );

  /** Retry the last failed generation */
  const handleRetry = () => {
    const { prompt, negative } = lastPromptRef.current;
    if (prompt) {
      handleGenerate(prompt, negative);
    }
  };

  /** Cancel a running generation */
  const handleCancel = useCallback(() => {
    abortRef.current = true;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus("idle");
    setStatusMessage("");
  }, []);

  const isGenerating = status === "submitting" || status === "polling";

  return (
    <div className="min-h-screen bg-dark-900 grid-bg">
      {/* ── Header ─────────────────────────────────── */}
      <Header
        hasApiKey={hasApiKey}
        onOpenSettings={() => setSettingsOpen(true)}
        credits={credits}
        isLoadingCredits={isLoadingCredits}
        onOpenCredits={() => setSettingsOpen(true)}
      />

      {/* ── Main Content ───────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Hero Section */}
        <HeroSection
          modelCount={models.length}
          selectedModelName={selectedModel?.name}
        />

        {/* Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-xl bg-dark-800/50 border border-white/5 p-1">
            <button
              onClick={() => setMode('image')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'image'
                  ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Image Generation
            </button>
            <button
              onClick={() => setMode('video')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'video'
                  ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Video Generation
            </button>
          </div>
        </div>

        {/* Prompt Input with Model Selector and Credit Warning */}
        {mode === 'image' ? (
          <PromptInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            hasApiKey={hasApiKey}
            models={models}
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
            isLoadingModels={isLoadingModels}
            modelError={modelError}
            onRefreshModels={handleFetchModels}
            credits={credits}
          />
        ) : (
          <div className="space-y-4">
            <VideoModeSelector
              models={videoModels}
              selectedModelId={selectedVideoModelId}
              selectedRatio={selectedVideoRatio}
              onSelectModel={(model) => setSelectedVideoModelId(model.id)}
              onSelectRatio={(ratio) => setSelectedVideoRatio(ratio)}
              isLoading={isLoadingVideoModels}
              error={videoModelError}
              onRefresh={handleFetchVideoModels}
            />
            <PromptInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              hasApiKey={hasApiKey}
              models={[]}
              selectedModelId=""
              onSelectModel={() => {}}
              isLoadingModels={false}
              modelError={null}
              onRefreshModels={() => {}}
              credits={credits}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <ErrorDisplay
            message={error}
            onDismiss={() => {
              setError(null);
              setStatus("idle");
            }}
            onRetry={handleRetry}
          />
        )}

        {/* Processing Animation */}
        {isGenerating && (
          <div className="mt-10">
            <ProcessingAnimation
              startTime={generationStartTime}
              statusMessage={statusMessage}
            />
            {/* Cancel button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
              >
                Cancel Generation
              </button>
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {mode === 'image' && <ImageGallery images={images} />}

        {/* Video Gallery */}
        {mode === 'video' && <VideoGallery videos={videos} />}
      </main>

      {/* ── Credit Toast Notification ────────────── */}
      <CreditToast
        visible={showCreditToast}
        creditsBefore={creditsBefore}
        creditsAfter={creditsAfter}
        onClose={() => setShowCreditToast(false)}
      />

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
            Built with <Heart size={14} className="text-red-400 fill-current" />{" "}
            by{" "}
            <span className="font-semibold gradient-text">2M AI Studio</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Powered by Leonardo.ai
            {selectedModel ? ` • ${selectedModel.name}` : ""}
            {models.length > 0 ? ` • ${models.length} models available` : ""}
            {credits
              ? ` • ${(credits.apiSubscriptionTokens + credits.apiPaidTokens).toLocaleString()} API tokens`
              : ""}
          </p>
        </div>
      </footer>

      {/* ── Settings Modal ─────────────────────────── */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onKeyChange={refreshApiKeyStatus}
        onFetchModels={handleFetchModels}
        onFetchCredits={handleFetchCredits}
        modelCount={models.length}
        isLoadingModels={isLoadingModels}
        credits={credits}
        isLoadingCredits={isLoadingCredits}
        creditError={creditError}
        creditLastChecked={creditLastChecked}
      />
    </div>
  );
}
