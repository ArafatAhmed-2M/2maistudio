/**
 * ModelSelector — Allows the user to browse and select from
 * available Leonardo.ai platform models. Displays model cards
 * with thumbnails, descriptions, and metadata.
 */

import { useState, useMemo } from "react";
import {
  Search,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  ImageIcon,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { LeonardoModel } from "../services/leonardo";

interface ModelSelectorProps {
  models: LeonardoModel[];
  selectedModelId: string;
  onSelectModel: (model: LeonardoModel) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onSelectModel,
  isLoading,
  error,
  onRefresh,
}: ModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFeatured, setFilterFeatured] = useState(false);

  // Find the currently selected model
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  // Filter models based on search & filter
  const filteredModels = useMemo(() => {
    let filtered = models;

    if (filterFeatured) {
      filtered = filtered.filter((m) => m.featured);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [models, searchQuery, filterFeatured]);

  // If there are no models yet (no API key or not fetched)
  if (models.length === 0 && !isLoading && !error) {
    return (
      <div className="mb-5 p-4 rounded-xl bg-dark-800/50 border border-white/5">
        <div className="flex items-center gap-3 text-gray-400">
          <Layers size={18} />
          <div>
            <p className="text-sm font-medium text-gray-300">AI Model</p>
            <p className="text-xs text-gray-500">
              Add your API key in Settings to load available models
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      {/* ── Error State ─────────────────────────────── */}
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-300">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-red-300 hover:text-white transition-colors flex-shrink-0 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading State ───────────────────────────── */}
      {isLoading && (
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-blue/10 flex items-center gap-3">
          <RefreshCw size={18} className="text-neon-blue animate-spin" />
          <div>
            <p className="text-sm font-medium text-gray-300">Loading Models...</p>
            <p className="text-xs text-gray-500">
              Fetching available models from Leonardo.ai
            </p>
          </div>
        </div>
      )}

      {/* ── Selected Model Preview (Collapsed State) ── */}
      {!isLoading && models.length > 0 && (
        <>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            <span className="gradient-text">Select AI Model</span>
          </label>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-3 rounded-xl bg-dark-800 border border-white/8 hover:border-neon-blue/30 transition-all flex items-center gap-3 group"
          >
            {/* Model thumbnail */}
            {selectedModel?.generated_image?.url ? (
              <img
                src={selectedModel.generated_image.url}
                alt={selectedModel.name}
                className="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-dark-600 border border-white/10 flex items-center justify-center flex-shrink-0">
                <ImageIcon size={18} className="text-gray-500" />
              </div>
            )}

            {/* Model info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">
                  {selectedModel?.name || "Select a model"}
                </p>
                {selectedModel?.featured && (
                  <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {selectedModel?.description
                  ? selectedModel.description.slice(0, 80) + (selectedModel.description.length > 80 ? "..." : "")
                  : "Choose from available platform models"}
              </p>
            </div>

            {/* Expand indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider hidden sm:block">
                {models.length} models
              </span>
              {isExpanded ? (
                <ChevronUp size={18} className="text-gray-400 group-hover:text-neon-blue transition-colors" />
              ) : (
                <ChevronDown size={18} className="text-gray-400 group-hover:text-neon-blue transition-colors" />
              )}
            </div>
          </button>

          {/* ── Expanded Model Picker ───────────────── */}
          {isExpanded && (
            <div className="mt-2 rounded-xl bg-dark-800/90 backdrop-blur-xl border border-white/8 overflow-hidden neon-glow">
              {/* Search & Filters */}
              <div className="p-3 border-b border-white/5 space-y-2">
                {/* Search bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search models..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-700 border border-white/5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-blue/30 transition-colors"
                    autoFocus
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterFeatured(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      !filterFeatured
                        ? "bg-neon-blue/15 text-neon-blue border border-neon-blue/20"
                        : "text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    All ({models.length})
                  </button>
                  <button
                    onClick={() => setFilterFeatured(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      filterFeatured
                        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                        : "text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    <Star size={10} className={filterFeatured ? "fill-yellow-400" : ""} />
                    Featured
                  </button>

                  {/* Refresh button */}
                  <button
                    onClick={onRefresh}
                    className="ml-auto px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-neon-blue transition-colors flex items-center gap-1"
                    title="Refresh models list"
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Model list */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {filteredModels.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    <Layers size={24} className="mx-auto mb-2 opacity-40" />
                    <p>No models found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredModels.map((model) => {
                    const isSelected = model.id === selectedModelId;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model);
                          setIsExpanded(false);
                          setSearchQuery("");
                        }}
                        className={`w-full p-3 flex items-center gap-3 transition-all border-b border-white/[0.03] last:border-b-0 ${
                          isSelected
                            ? "bg-neon-blue/8 border-l-2 border-l-neon-blue"
                            : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* Thumbnail */}
                        {model.generated_image?.url ? (
                          <img
                            src={model.generated_image.url}
                            alt={model.name}
                            className={`w-14 h-14 rounded-lg object-cover flex-shrink-0 border ${
                              isSelected ? "border-neon-blue/40" : "border-white/10"
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                              isSelected
                                ? "bg-neon-blue/10 border-neon-blue/30"
                                : "bg-dark-600 border-white/10"
                            }`}
                          >
                            <Sparkles
                              size={18}
                              className={isSelected ? "text-neon-blue" : "text-gray-500"}
                            />
                          </div>
                        )}

                        {/* Model details */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isSelected ? "text-neon-blue" : "text-white"
                              }`}
                            >
                              {model.name}
                            </p>
                            {model.featured && (
                              <Star
                                size={11}
                                className="text-yellow-400 fill-yellow-400 flex-shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {model.description || "No description available"}
                          </p>
                          {/* Tags row */}
                          <div className="flex items-center gap-2 mt-1">
                            {model.sdVersion && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-500 text-gray-400">
                                {model.sdVersion}
                              </span>
                            )}
                            {model.modelWidth && model.modelHeight && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-500 text-gray-400">
                                {model.modelWidth}×{model.modelHeight}
                              </span>
                            )}
                            {model.nsfw && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                                NSFW
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-neon-blue" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer stats */}
              <div className="p-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                <span>
                  Showing {filteredModels.length} of {models.length} models
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-neon-purple" />
                  Powered by Leonardo.ai
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
