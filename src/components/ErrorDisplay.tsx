/**
 * ErrorDisplay — Shows API or generation errors
 * with a dismissable alert style.
 */

import { AlertCircle, X, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  message,
  onDismiss,
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <AlertCircle
          size={20}
          className="text-red-400 flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-300">
            Generation Failed
          </p>
          <p className="text-sm text-red-400/80 mt-1 break-words whitespace-pre-line">{message}</p>

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-red-300 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-white/5 text-red-400/50 hover:text-red-300 transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
