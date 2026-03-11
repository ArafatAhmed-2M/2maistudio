/**
 * ProcessingAnimation — A futuristic loading indicator shown
 * while the AI model is generating an image. Displays elapsed
 * time and a pulsing orbital animation.
 */

import { useEffect, useState } from "react";
import { Loader2, Cpu, Sparkles } from "lucide-react";

interface ProcessingAnimationProps {
  startTime: number; // Timestamp when generation started
  statusMessage?: string;
}

export default function ProcessingAnimation({
  startTime,
  statusMessage = "Generating your image...",
}: ProcessingAnimationProps) {
  const [elapsed, setElapsed] = useState(0);

  // Update the elapsed timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  /** Format seconds into MM:SS */
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Orbital animation container */}
      <div className="relative w-32 h-32 mb-8">
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/20 neon-glow">
            <Cpu size={28} className="text-neon-blue" />
          </div>
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 orbit">
          <div className="w-3 h-3 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,212,255,0.6)]" />
        </div>
        <div className="absolute inset-0 orbit-reverse">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
        </div>

        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border border-neon-blue/20 pulse-ring" />
        <div
          className="absolute -inset-3 rounded-full border border-neon-purple/10 pulse-ring"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute -inset-6 rounded-full border border-neon-blue/5 pulse-ring"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Status message */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Loader2 size={18} className="text-neon-blue animate-spin" />
          <p className="text-lg font-semibold text-white">{statusMessage}</p>
        </div>

        {/* Timer display */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-neon-blue/10">
          <Sparkles size={14} className="text-neon-purple" />
          <span className="text-neon-blue font-mono font-bold text-lg tracking-wider">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Helpful tips */}
        <p className="mt-4 text-sm text-gray-400 max-w-sm">
          {elapsed < 15
            ? "Sending request to Leonardo.ai..."
            : elapsed < 30
            ? "The AI model is processing your prompt..."
            : elapsed < 60
            ? "Rendering in progress. This usually takes 1–3 minutes."
            : elapsed < 120
            ? "Still working — complex prompts may take longer."
            : "Almost there... Hang tight!"}
        </p>

        {/* Progress bar simulation */}
        <div className="mt-6 w-64 mx-auto h-1 rounded-full bg-dark-600 overflow-hidden">
          <div className="h-full rounded-full shimmer bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue" />
        </div>
      </div>
    </div>
  );
}
