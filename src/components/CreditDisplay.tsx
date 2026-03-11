/**
 * CreditDisplay — Shows the user's Leonardo.ai credit balance
 * with a beautiful visual indicator. Displays API tokens (subscription + paid),
 * username, renewal date, and a color-coded status bar.
 *
 * Shown in the header and optionally in the settings modal.
 */

import { useState } from "react";
import {
  Coins,
  RefreshCw,
  User,
  Calendar,
  Zap,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import type { UserCredits } from "../services/leonardo";

// ── Header Badge (Compact) ──────────────────────────────────────

interface CreditBadgeProps {
  credits: UserCredits | null;
  isLoading: boolean;
  onClick?: () => void;
}

/**
 * A compact credit badge for the header bar.
 * Shows total API tokens with a color-coded indicator.
 */
export function CreditBadge({ credits, isLoading, onClick }: CreditBadgeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/5 text-xs">
        <RefreshCw size={12} className="text-neon-blue animate-spin" />
        <span className="text-gray-400 hidden sm:inline">Loading...</span>
      </div>
    );
  }

  if (!credits) return null;

  const totalApiTokens = credits.apiSubscriptionTokens + credits.apiPaidTokens;
  const totalWebTokens = credits.subscriptionTokens + credits.paidTokens;

  // Color coding based on credit level
  const getColor = () => {
    if (totalApiTokens <= 0) return { text: "text-red-400", bg: "bg-red-400", border: "border-red-500/20", glow: "shadow-[0_0_6px_rgba(248,113,113,0.6)]" };
    if (totalApiTokens < 100) return { text: "text-yellow-400", bg: "bg-yellow-400", border: "border-yellow-500/20", glow: "shadow-[0_0_6px_rgba(250,204,21,0.6)]" };
    return { text: "text-emerald-400", bg: "bg-emerald-400", border: "border-emerald-500/20", glow: "shadow-[0_0_6px_rgba(52,211,153,0.6)]" };
  };

  const color = getColor();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass border ${color.border} hover:bg-white/5 transition-all group cursor-pointer`}
      title={`API Tokens: ${totalApiTokens.toLocaleString()} | Web Tokens: ${totalWebTokens.toLocaleString()}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${color.bg} ${color.glow}`} />
      <Coins size={13} className={`${color.text}`} />
      <span className={`text-xs font-semibold ${color.text} tabular-nums`}>
        {totalApiTokens.toLocaleString()}
      </span>
      <span className="text-[10px] text-gray-500 hidden sm:inline">tokens</span>
    </button>
  );
}

// ── Full Credit Panel ─────────────────────────────────────────────

interface CreditPanelProps {
  credits: UserCredits | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  lastChecked: number | null; // timestamp
}

/**
 * A detailed credit panel that can be placed in settings or as
 * an expandable section. Shows all token types, renewal dates, etc.
 */
export function CreditPanel({
  credits,
  isLoading,
  error,
  onRefresh,
  lastChecked,
}: CreditPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Error state ──────────────────────────────
  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-300">
              Failed to load credits
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs text-red-300 hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────
  if (isLoading && !credits) {
    return (
      <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-blue/10 flex items-center gap-3">
        <RefreshCw size={18} className="text-neon-blue animate-spin" />
        <div>
          <p className="text-sm font-medium text-gray-300">Checking credits...</p>
          <p className="text-xs text-gray-500">Fetching your account balance</p>
        </div>
      </div>
    );
  }

  if (!credits) return null;

  // Compute totals
  const totalApiTokens = credits.apiSubscriptionTokens + credits.apiPaidTokens;
  const totalWebTokens = credits.subscriptionTokens + credits.paidTokens;

  // Color coding
  const getLevel = () => {
    if (totalApiTokens <= 0) return "critical";
    if (totalApiTokens < 100) return "low";
    if (totalApiTokens < 500) return "medium";
    return "high";
  };
  const level = getLevel();

  const colorMap = {
    critical: {
      bar: "bg-red-500",
      text: "text-red-400",
      bg: "bg-red-500/5",
      border: "border-red-500/15",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
      label: "No Credits",
      icon: AlertTriangle,
    },
    low: {
      bar: "bg-yellow-500",
      text: "text-yellow-400",
      bg: "bg-yellow-500/5",
      border: "border-yellow-500/15",
      glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
      label: "Low Balance",
      icon: TrendingDown,
    },
    medium: {
      bar: "bg-neon-blue",
      text: "text-neon-blue",
      bg: "bg-neon-blue/5",
      border: "border-neon-blue/15",
      glow: "shadow-[0_0_15px_rgba(0,212,255,0.15)]",
      label: "Good",
      icon: Zap,
    },
    high: {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/15",
      glow: "shadow-[0_0_15px_rgba(52,211,153,0.15)]",
      label: "Excellent",
      icon: Sparkles,
    },
  };

  const config = colorMap[level];
  const StatusIcon = config.icon;

  // Format renewal date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format last checked time
  const formatLastChecked = (): string => {
    if (!lastChecked) return "";
    const seconds = Math.floor((Date.now() - lastChecked) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className={`rounded-xl ${config.bg} border ${config.border} ${config.glow} overflow-hidden transition-all`}>
      {/* ── Main Summary ─────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg bg-gradient-to-br from-neon-blue/15 to-neon-purple/15 border border-white/5`}>
              <Coins size={18} className={config.text} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Credit Balance</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusIcon size={11} className={config.text} />
                <span className={`text-[11px] font-medium ${config.text}`}>
                  {config.label}
                </span>
                {lastChecked && (
                  <span className="text-[10px] text-gray-600">
                    • Updated {formatLastChecked()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-neon-blue transition-all disabled:opacity-50"
            title="Refresh credits"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── Token Summary Cards ─────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* API Tokens */}
          <div className="p-3 rounded-lg bg-dark-800/60 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-neon-blue" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                API Tokens
              </p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${config.text}`}>
              {totalApiTokens.toLocaleString()}
            </p>
          </div>

          {/* Web Tokens */}
          <div className="p-3 rounded-lg bg-dark-800/60 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="text-neon-purple" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                Web Tokens
              </p>
            </div>
            <p className="text-xl font-bold tabular-nums text-gray-300">
              {totalWebTokens.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Visual Progress Bar ─────────────────── */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">API Credit Level</span>
            <span className={`text-[10px] font-medium ${config.text}`}>
              {totalApiTokens.toLocaleString()} tokens
            </span>
          </div>
          <div className="h-2 rounded-full bg-dark-700 overflow-hidden">
            <div
              className={`h-full rounded-full ${config.bar} transition-all duration-700 ease-out`}
              style={{
                width: `${Math.min(100, Math.max(3, (totalApiTokens / Math.max(totalApiTokens, 5000)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* ── Expand / Collapse Button ────────────── */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-neon-blue transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} /> Hide Details
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Show Details
            </>
          )}
        </button>
      </div>

      {/* ── Expanded Details ──────────────────────── */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2.5 animate-fade-in-up">
          {/* Username */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <User size={13} />
              <span className="text-xs">Username</span>
            </div>
            <span className="text-xs text-white font-medium">
              {credits.user.username || "N/A"}
            </span>
          </div>

          {/* API Subscription Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap size={13} />
              <span className="text-xs">API Subscription Tokens</span>
            </div>
            <span className="text-xs text-neon-blue font-semibold tabular-nums">
              {credits.apiSubscriptionTokens.toLocaleString()}
            </span>
          </div>

          {/* API Paid Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Coins size={13} />
              <span className="text-xs">API Paid Tokens</span>
            </div>
            <span className="text-xs text-neon-purple font-semibold tabular-nums">
              {credits.apiPaidTokens.toLocaleString()}
            </span>
          </div>

          {/* Web Subscription Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles size={13} />
              <span className="text-xs">Web Subscription Tokens</span>
            </div>
            <span className="text-xs text-gray-300 tabular-nums">
              {credits.subscriptionTokens.toLocaleString()}
            </span>
          </div>

          {/* Web Paid Tokens */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Coins size={13} />
              <span className="text-xs">Web Paid Tokens</span>
            </div>
            <span className="text-xs text-gray-300 tabular-nums">
              {credits.paidTokens.toLocaleString()}
            </span>
          </div>

          {/* Concurrency Slots */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap size={13} />
              <span className="text-xs">Concurrency Slots</span>
            </div>
            <span className="text-xs text-gray-300 tabular-nums">
              {credits.apiConcurrencySlots}
            </span>
          </div>

          {/* API Plan Token Renewal Date */}
          {credits.apiPlanTokenRenewalDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={13} />
                <span className="text-xs">API Token Renewal</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                {formatDate(credits.apiPlanTokenRenewalDate)}
              </span>
            </div>
          )}

          {/* Token Renewal Date */}
          {credits.tokenRenewalDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={13} />
                <span className="text-xs">Token Renewal</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                {formatDate(credits.tokenRenewalDate)}
              </span>
            </div>
          )}

          {/* Insufficient credits warning */}
          {totalApiTokens <= 0 && (
            <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-300">
                    No API credits remaining
                  </p>
                  <p className="text-[11px] text-red-400/70 mt-0.5">
                    You won't be able to generate images. Please purchase more credits or wait for renewal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {totalApiTokens > 0 && totalApiTokens < 100 && (
            <div className="mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <TrendingDown size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-yellow-300">
                    Low credit balance
                  </p>
                  <p className="text-[11px] text-yellow-400/70 mt-0.5">
                    You have {totalApiTokens} API tokens remaining. Consider purchasing more to avoid interruption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline Credit Check Warning ──────────────────────────────────

interface CreditWarningProps {
  credits: UserCredits | null;
}

/**
 * A small inline warning shown near the generate button
 * when credits are critically low or zero.
 */
export function CreditWarning({ credits }: CreditWarningProps) {
  if (!credits) return null;

  const totalApiTokens = credits.apiSubscriptionTokens + credits.apiPaidTokens;

  if (totalApiTokens <= 0) {
    return (
      <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
        <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-300">
            No API credits remaining
          </p>
          <p className="text-[11px] text-red-400/60">
            Generation will fail. Please add credits to your Leonardo.ai account.
          </p>
        </div>
        <span className="text-xs font-bold text-red-400 tabular-nums flex-shrink-0">
          0
        </span>
      </div>
    );
  }

  if (totalApiTokens < 100) {
    return (
      <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/15">
        <TrendingDown size={15} className="text-yellow-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-yellow-300">
            Low credit balance
          </p>
          <p className="text-[11px] text-yellow-400/60">
            Only {totalApiTokens} API tokens remaining.
          </p>
        </div>
        <span className="text-xs font-bold text-yellow-400 tabular-nums flex-shrink-0">
          {totalApiTokens}
        </span>
      </div>
    );
  }

  return null;
}
