/**
 * PromptInput — The main prompt entry area with text area,
 * model selector, credit warning, optional negative prompt, and generate button.
 */

import { useState } from "react";
import { Wand2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import ModelSelector from "./ModelSelector";
import { CreditWarning } from "./CreditDisplay";
import type { LeonardoModel, UserCredits } from "../services/leonardo";

interface PromptInputProps {
  onGenerate: (prompt: string, negativePrompt: string) => void;
  isGenerating: boolean;
  hasApiKey: boolean;
  // Model-related props
  models: LeonardoModel[];
  selectedModelId: string;
  onSelectModel: (model: LeonardoModel) => void;
  isLoadingModels: boolean;
  modelError: string | null;
  onRefreshModels: () => void;
  // Credit props
  credits: UserCredits | null;
}

// Inspirational prompt examples
const EXAMPLE_PROMPTS = [
  "A futuristic cyberpunk city at sunset, neon lights, flying cars, ultra detailed, 8k",
  "An enchanted forest with glowing mushrooms and fireflies, fantasy art, magical atmosphere",
  "A majestic dragon perched on a crystal mountain, epic fantasy, cinematic lighting",
  "An astronaut floating in a nebula, surrounded by colorful cosmic clouds, photorealistic",
  "A steampunk mechanical owl with copper gears and glowing eyes, detailed illustration",
];

export default function PromptInput({
  onGenerate,
  isGenerating,
  hasApiKey,
  models,
  selectedModelId,
  onSelectModel,
  isLoadingModels,
  modelError,
  onRefreshModels,
  credits,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if user has enough API credits to generate
  const totalApiTokens = credits
    ? credits.apiSubscriptionTokens + credits.apiPaidTokens
    : null;
  const hasCredits = totalApiTokens === null || totalApiTokens > 0;

  /** Handle the generate button click */
  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating || !hasApiKey) return;
    onGenerate(prompt.trim(), negativePrompt.trim());
  };

  /** Use an example prompt */
  const useExample = (example: string) => {
    setPrompt(example);
  };

  /** Handle keyboard shortcut (Ctrl+Enter to generate) */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleGenerate();
    }
  };

  // Find selected model for display info
  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-strong rounded-2xl p-6 md:p-8 neon-glow">
        {/* Missing API key warning */}
        {!hasApiKey && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <AlertTriangle
              size={20}
              className="text-yellow-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-yellow-300">
                Missing API Key
              </p>
              <p className="text-xs text-yellow-400/70 mt-0.5">
                Please open Settings and enter your Leonardo.ai API key to start
                generating images.
              </p>
            </div>
          </div>
        )}

        {/* Model Selector */}
        <ModelSelector
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
          isLoading={isLoadingModels}
          error={modelError}
          onRefresh={onRefreshModels}
        />

        {/* Main prompt label */}
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          <span className="gradient-text">Describe your image</span>
        </label>

        {/* Prompt text area */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to create in detail..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/8 text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-blue/40 focus:ring-1 focus:ring-neon-blue/15 transition-all resize-none text-sm leading-relaxed"
        />

        {/* Character count & shortcut info */}
        <div className="flex justify-between items-center mt-1.5 mb-4">
          <p className="text-xs text-gray-500">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-dark-600 text-gray-400 text-[10px]">
              Ctrl+Enter
            </kbd>{" "}
            to generate
          </p>
          <span className="text-xs text-gray-500">{prompt.length} chars</span>
        </div>

        {/* Advanced options toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-neon-blue transition-colors mb-4"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Negative Prompt (Advanced)
        </button>

        {/* Negative prompt (collapsible) */}
        {showAdvanced && (
          <div className="mb-4">
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid in the image (e.g., blurry, low quality, distorted)..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/8 text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/40 focus:ring-1 focus:ring-neon-purple/15 transition-all resize-none text-sm"
            />
          </div>
        )}

        {/* Credit warning (shown when credits are low or zero) */}
        <CreditWarning credits={credits} />

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating || !hasApiKey || !hasCredits}
          className="w-full btn-gradient py-3.5 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-base mt-3"
        >
          <Wand2 size={20} />
          {isGenerating
            ? "Generating..."
            : !hasCredits
            ? "No Credits Available"
            : selectedModel
            ? `Generate with ${selectedModel.name}`
            : "Generate Image"}
        </button>

        {/* Selected model info badge + credit display */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {selectedModel && (
            <>
              <span>Model: {selectedModel.name}</span>
              {selectedModel.sdVersion && <span>• {selectedModel.sdVersion}</span>}
              <span>• {selectedModel.modelWidth || 1024}×{selectedModel.modelHeight || 1024}</span>
            </>
          )}
          {totalApiTokens !== null && (
            <span className={`${totalApiTokens <= 0 ? "text-red-400" : totalApiTokens < 100 ? "text-yellow-400" : "text-emerald-400"}`}>
              • {totalApiTokens.toLocaleString()} API tokens
            </span>
          )}
        </div>

        {/* Example prompts */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                onClick={() => useExample(example)}
                className="text-xs px-3 py-1.5 rounded-lg glass border border-white/5 text-gray-400 hover:text-neon-blue hover:border-neon-blue/20 transition-all truncate max-w-[250px]"
                title={example}
              >
                {example.slice(0, 45)}...
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
