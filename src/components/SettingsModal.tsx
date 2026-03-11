/**
 * SettingsModal — Allows the user to input and manage their
 * Leonardo.ai API key, persisted in localStorage.
 * When a key is saved, it validates the key first, then
 * triggers model fetching and credit checking.
 * Includes a full credit panel with detailed account information.
 */

import { useState, useEffect } from "react";
import {
  X,
  Key,
  Eye,
  EyeOff,
  Save,
  Trash2,
  CheckCircle,
  ExternalLink,
  Layers,
  RefreshCw,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
  clearCachedModels,
  testApiKey,
} from "../services/leonardo";
import { CreditPanel } from "./CreditDisplay";
import type { UserCredits } from "../services/leonardo";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange: () => void;
  onFetchModels: () => void;
  onFetchCredits: () => void;
  modelCount: number;
  isLoadingModels: boolean;
  // Credit props
  credits: UserCredits | null;
  isLoadingCredits: boolean;
  creditError: string | null;
  creditLastChecked: number | null;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onKeyChange,
  onFetchModels,
  onFetchCredits,
  modelCount,
  isLoadingModels,
  credits,
  isLoadingCredits,
  creditError,
  creditLastChecked,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedUsername, setValidatedUsername] = useState<string | null>(null);

  // Load existing key on mount
  useEffect(() => {
    if (isOpen) {
      const existing = getApiKey();
      if (existing) {
        setApiKey(existing);
        setHasExistingKey(true);
      }
      setValidationError(null);
      setValidatedUsername(null);
    }
  }, [isOpen]);

  /** Save the key to localStorage with validation, then fetch models and credits */
  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationError(null);
    setValidatedUsername(null);

    // Save the key first (needed for the test call)
    saveApiKey(apiKey);
    onKeyChange();

    // Validate by making a test API call
    const result = await testApiKey();

    if (result.valid) {
      setHasExistingKey(true);
      setSaved(true);
      setValidatedUsername(result.username || null);

      // Automatically fetch models and credits when key is validated
      setTimeout(() => {
        onFetchModels();
        onFetchCredits();
      }, 300);

      setTimeout(() => setSaved(false), 3000);
    } else {
      // Key is invalid — remove it
      removeApiKey();
      setHasExistingKey(false);
      onKeyChange();
      setValidationError(
        result.error ||
          "Invalid API key. Please check your key and try again."
      );
    }

    setIsValidating(false);
  };

  /** Remove the key from localStorage */
  const handleRemove = () => {
    removeApiKey();
    clearCachedModels();
    setApiKey("");
    setHasExistingKey(false);
    setValidationError(null);
    setValidatedUsername(null);
    onKeyChange();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6 md:p-8 neon-glow max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/20">
            <Key size={22} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-[Orbitron]">
              API Settings
            </h2>
            <p className="text-sm text-gray-400">
              Configure your Leonardo.ai API key
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="mb-6 p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/10">
          <p className="text-sm text-gray-300 leading-relaxed">
            You need a Leonardo.ai API key to generate images. Get yours from
            the{" "}
            <a
              href="https://app.leonardo.ai/api-access"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue hover:underline inline-flex items-center gap-1"
            >
              Leonardo.ai Dashboard
              <ExternalLink size={12} />
            </a>
          </p>
        </div>

        {/* Validation Error Display */}
        {validationError && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="text-red-400 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-red-400">
                  API Key Validation Failed
                </p>
                <p className="text-xs text-red-300/70 mt-1 whitespace-pre-line">
                  {validationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validated Username Success */}
        {validatedUsername && saved && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">
                  API Key Verified!
                </p>
                <p className="text-xs text-green-300/70 mt-0.5">
                  Connected as{" "}
                  <span className="font-semibold">{validatedUsername}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Key Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setValidationError(null);
              }}
              placeholder="Enter your Leonardo.ai API key..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-dark-800 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/20 transition-all font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              disabled={isValidating}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Your key is stored locally in your browser and never sent to our
            servers.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || isValidating}
            className="flex-1 btn-gradient py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isValidating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validating...
              </>
            ) : saved ? (
              <>
                <CheckCircle size={18} />
                Verified & Saved!
              </>
            ) : (
              <>
                <Save size={18} />
                Save & Verify Key
              </>
            )}
          </button>

          {hasExistingKey && (
            <button
              onClick={handleRemove}
              disabled={isValidating}
              className="py-3 px-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <Trash2 size={18} />
              Remove
            </button>
          )}
        </div>

        {/* ── Credit Balance Section ─────────────── */}
        {hasExistingKey && (
          <div className="mt-6">
            <CreditPanel
              credits={credits}
              isLoading={isLoadingCredits}
              error={creditError}
              onRefresh={onFetchCredits}
              lastChecked={creditLastChecked}
            />
          </div>
        )}

        {/* Models Status section */}
        {hasExistingKey && (
          <div className="mt-4 p-4 rounded-xl bg-dark-800/50 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers size={16} className="text-neon-purple" />
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Platform Models
                  </p>
                  <p className="text-xs text-gray-500">
                    {isLoadingModels
                      ? "Fetching models..."
                      : modelCount > 0
                      ? `${modelCount} models loaded`
                      : "No models loaded yet"}
                  </p>
                </div>
              </div>
              <button
                onClick={onFetchModels}
                disabled={isLoadingModels}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neon-blue hover:bg-neon-blue/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  size={12}
                  className={isLoadingModels ? "animate-spin" : ""}
                />
                {isLoadingModels ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              hasExistingKey
                ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]"
                : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
            }`}
          />
          <span className="text-xs text-gray-400">
            {hasExistingKey ? "API key configured & verified" : "No API key set"}
          </span>
        </div>
      </div>
    </div>
  );
}
