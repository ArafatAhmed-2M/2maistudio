/**
 * CreditToast — A floating toast notification that appears after
 * each generation completes, showing the credit usage (before vs after).
 * Slides in from the bottom-right with a smooth animation.
 */

import { Coins, X, ArrowDown, TrendingDown, AlertTriangle, Sparkles } from "lucide-react";

interface CreditToastProps {
  visible: boolean;
  creditsBefore: number | null;
  creditsAfter: number | null;
  onClose: () => void;
}

export default function CreditToast({
  visible,
  creditsBefore,
  creditsAfter,
  onClose,
}: CreditToastProps) {
  if (!visible || creditsBefore === null || creditsAfter === null) return null;

  const tokensUsed = creditsBefore - creditsAfter;
  const isLow = creditsAfter < 100;
  const isEmpty = creditsAfter <= 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up max-w-sm w-full">
      <div
        className={`glass-strong rounded-2xl p-4 border ${
          isEmpty
            ? "border-red-500/25 shadow-[0_0_25px_rgba(239,68,68,0.2)]"
            : isLow
            ? "border-yellow-500/25 shadow-[0_0_25px_rgba(234,179,8,0.2)]"
            : "border-neon-blue/25 shadow-[0_0_25px_rgba(0,212,255,0.2)]"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`p-2 rounded-lg ${
              isEmpty
                ? "bg-red-500/15 border border-red-500/20"
                : isLow
                ? "bg-yellow-500/15 border border-yellow-500/20"
                : "bg-neon-blue/15 border border-neon-blue/20"
            }`}
          >
            <Coins
              size={16}
              className={
                isEmpty
                  ? "text-red-400"
                  : isLow
                  ? "text-yellow-400"
                  : "text-neon-blue"
              }
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Credit Update</p>
            <p className="text-[11px] text-gray-400">After generation</p>
          </div>
        </div>

        {/* Credit usage details */}
        <div className="flex items-center gap-3 mb-3">
          {/* Before */}
          <div className="flex-1 p-2.5 rounded-lg bg-dark-800/60 border border-white/5 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
              Before
            </p>
            <p className="text-sm font-bold text-gray-300 tabular-nums">
              {creditsBefore.toLocaleString()}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center flex-shrink-0">
            <ArrowDown size={14} className="text-gray-500" />
            {tokensUsed > 0 && (
              <span className="text-[10px] font-bold text-red-400 mt-0.5 tabular-nums">
                -{tokensUsed}
              </span>
            )}
          </div>

          {/* After */}
          <div
            className={`flex-1 p-2.5 rounded-lg border text-center ${
              isEmpty
                ? "bg-red-500/8 border-red-500/15"
                : isLow
                ? "bg-yellow-500/8 border-yellow-500/15"
                : "bg-emerald-500/8 border-emerald-500/15"
            }`}
          >
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">
              Remaining
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                isEmpty
                  ? "text-red-400"
                  : isLow
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}
            >
              {creditsAfter.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Visual progress bar showing remaining credits */}
        <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isEmpty
                ? "bg-red-500"
                : isLow
                ? "bg-yellow-500"
                : "bg-gradient-to-r from-neon-blue to-emerald-400"
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  2,
                  (creditsAfter / Math.max(creditsBefore, 1)) * 100
                )
              )}%`,
            }}
          />
        </div>

        {/* Status message */}
        <div className="flex items-center gap-1.5">
          {isEmpty ? (
            <>
              <AlertTriangle size={11} className="text-red-400" />
              <p className="text-[11px] text-red-400 font-medium">
                No credits remaining — generation will be unavailable
              </p>
            </>
          ) : isLow ? (
            <>
              <TrendingDown size={11} className="text-yellow-400" />
              <p className="text-[11px] text-yellow-400 font-medium">
                Low balance — consider adding more credits
              </p>
            </>
          ) : (
            <>
              <Sparkles size={11} className="text-emerald-400" />
              <p className="text-[11px] text-gray-400">
                {tokensUsed > 0
                  ? `${tokensUsed} token${tokensUsed !== 1 ? "s" : ""} used for this generation`
                  : "Credit balance updated"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
