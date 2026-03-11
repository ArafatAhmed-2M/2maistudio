/**
 * Header — Top navigation bar with branding, API status indicator,
 * credit badge, and settings button.
 */

import { Settings, Cpu } from "lucide-react";
import { CreditBadge } from "./CreditDisplay";
import type { UserCredits } from "../services/leonardo";

interface HeaderProps {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  credits: UserCredits | null;
  isLoadingCredits: boolean;
  onOpenCredits: () => void;
}

export default function Header({
  hasApiKey,
  onOpenSettings,
  credits,
  isLoadingCredits,
  onOpenCredits,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/15">
              <Cpu size={22} className="text-neon-blue" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-[Orbitron] gradient-text leading-tight">
                2M AI Studio
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Image Generator
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Credit badge (visible when API key exists) */}
            {hasApiKey && (
              <CreditBadge
                credits={credits}
                isLoading={isLoadingCredits}
                onClick={onOpenCredits}
              />
            )}

            {/* API status badge */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium glass border ${
                hasApiKey
                  ? "border-green-500/20 text-green-400"
                  : "border-red-500/20 text-red-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  hasApiKey
                    ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                    : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                }`}
              />
              {hasApiKey ? "API Connected" : "No API Key"}
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl glass border border-white/5 hover:border-neon-blue/20 hover:bg-neon-blue/5 transition-all text-gray-400 hover:text-neon-blue"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
