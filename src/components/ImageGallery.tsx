/**
 * ImageGallery — Displays the generated image(s) with
 * download functionality, model info, and metadata display.
 */

import { Download, Image as ImageIcon, Clock, Sparkles, Maximize2, X, Layers } from "lucide-react";
import { useState } from "react";

export interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  generatedAt: number; // timestamp
  elapsedSeconds: number;
  modelName?: string; // name of the model used
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  if (images.length === 0) return null;

  /** Download image by fetching and creating a blob link */
  const handleDownload = async (image: GalleryImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `2m-ai-studio-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(image.url, "_blank");
    }
  };

  /** Format elapsed time */
  const formatElapsed = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <>
      <section className="w-full max-w-4xl mx-auto mt-12">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-neon-blue/15 to-neon-purple/15 border border-neon-blue/15">
            <ImageIcon size={20} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-[Orbitron]">
              Result Gallery
            </h2>
            <p className="text-sm text-gray-400">
              {images.length} image{images.length !== 1 && "s"} generated
            </p>
          </div>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group glass-strong rounded-2xl overflow-hidden neon-glow transition-all duration-300 hover:neon-glow-strong"
            >
              {/* Image container */}
              <div className="relative aspect-square overflow-hidden bg-dark-800">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleDownload(image)}
                      className="flex-1 btn-gradient py-2.5 px-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      onClick={() => setLightboxImage(image)}
                      className="py-2.5 px-3 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-colors"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Image metadata */}
              <div className="p-4">
                <p className="text-sm text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                  {image.prompt}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatElapsed(image.elapsedSeconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    1024×1024
                  </span>
                  {image.modelName && (
                    <span className="flex items-center gap-1">
                      <Layers size={12} />
                      {image.modelName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 rounded-full glass hover:bg-white/10 transition-colors text-white z-10"
          >
            <X size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.prompt}
              className="w-full h-full object-contain rounded-xl"
            />

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
              <p className="text-sm text-gray-200 mb-1">
                {lightboxImage.prompt}
              </p>
              {lightboxImage.modelName && (
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Layers size={11} />
                  Generated with {lightboxImage.modelName}
                </p>
              )}
              <button
                onClick={() => handleDownload(lightboxImage)}
                className="btn-gradient py-2 px-4 rounded-lg font-semibold text-white text-sm inline-flex items-center gap-2"
              >
                <Download size={14} />
                Download Full Size
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
