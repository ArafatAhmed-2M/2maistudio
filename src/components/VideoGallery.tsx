/**
 * VideoGallery — Displays generated videos in a responsive grid
 * with playback controls and download options.
 */

import { Download, Play, Clock, Film } from "lucide-react";

export interface GalleryVideo {
  id: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  generatedAt: number;
  elapsedSeconds: number;
  modelName: string;
  duration?: number;
  resolution?: string;
}

interface VideoGalleryProps {
  videos: GalleryVideo[];
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
  if (videos.length === 0) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleDownload = async (url: string, videoId: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `video-${videoId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download video:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
          <Film size={20} className="text-neon-purple" />
        </div>
        <h2 className="text-xl font-bold text-white">Generated Videos</h2>
        <span className="text-sm text-gray-500">({videos.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden hover:border-neon-purple/30 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/5"
          >
            {/* Video Player */}
            <div className="relative aspect-video bg-dark-900">
              <video
                src={video.url}
                poster={video.thumbnail_url}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Video Info */}
            <div className="p-4 space-y-3">
              {/* Prompt */}
              <p className="text-sm text-gray-300 line-clamp-2 min-h-[2.5rem]">
                {video.prompt}
              </p>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>{formatDuration(video.duration)}</span>
                </div>
                <span>{formatTimeAgo(video.generatedAt)}</span>
              </div>

              {/* Model & Generation Time */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs text-neon-purple font-medium truncate max-w-[150px]">
                  {video.modelName}
                </span>
                <span className="text-xs text-gray-600">
                  {video.elapsedSeconds}s
                </span>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(video.url, video.id)}
                className="w-full mt-2 py-2 rounded-lg bg-dark-700 hover:bg-neon-purple/10 border border-white/5 hover:border-neon-purple/30 text-gray-300 hover:text-neon-purple transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Download size={14} />
                Download Video
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
