/**
 * HeroSection — The top branding area of the application,
 * featuring the '2M AI Studio' logo, tagline, and dynamic
 * model information.
 */

import { Sparkles, Zap, Layers } from "lucide-react";

interface HeroSectionProps {
  modelCount?: number;
  selectedModelName?: string;
}

export default function HeroSection({
  modelCount = 0,
  selectedModelName,
}: HeroSectionProps) {
  return (
    <section className="relative text-center py-16 md:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo badge */}
      <div className="relative inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full glass border border-neon-blue/15 text-sm text-neon-blue animate-float">
        <Zap size={14} className="fill-current" />
        <span className="font-medium">Powered by Leonardo.ai</span>
      </div>

      {/* Main title */}
      <h1 className="relative text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-[Orbitron] mb-4 tracking-tight">
        <span className="gradient-text">2M AI</span>
        <br />
        <span className="text-white">Studio</span>
      </h1>

      {/* Tagline */}
      <p className="relative text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
        Transform your imagination into stunning visuals with the power of{" "}
        <span className="text-neon-blue font-medium">AI-driven</span> image
        generation
      </p>

      {/* Feature badges */}
      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {selectedModelName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass border border-neon-blue/15 text-neon-blue">
            <Sparkles size={10} />
            {selectedModelName}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass border border-white/5 text-gray-300">
          <Sparkles size={10} className="text-neon-purple" />
          1024×1024
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass border border-white/5 text-gray-300">
          <Sparkles size={10} className="text-neon-purple" />
          High Quality
        </span>
        {modelCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium glass border border-neon-purple/15 text-neon-purple">
            <Layers size={10} />
            {modelCount} Models Available
          </span>
        )}
      </div>
    </section>
  );
}
