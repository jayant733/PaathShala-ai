import { useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageCardProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  source?: string;
  /** Optional explicit gradient seed for a deterministic placeholder. */
  seed?: string;
}

const PALETTES: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#22d3ee', '#3b82f6'],
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function GradientPlaceholder({ title, seed }: { title: string; seed: string }) {
  const [c1, c2] = PALETTES[hashStr(seed) % PALETTES.length];
  return (
    <div
      className="relative w-full h-full min-h-[160px] flex items-end overflow-hidden rounded-xl"
      style={{ background: `linear-gradient(135deg, ${c1}33, ${c2}22), linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {/* subtle grid */}
      <div className="absolute inset-0 grid-backdrop opacity-40" />
      <div className="relative z-10 p-4 w-full">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-2">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <p className="font-title-sm text-title-sm text-white font-semibold leading-tight drop-shadow">{title}</p>
      </div>
    </div>
  );
}

/**
 * Image visual inside a response. Renders a real image when `imageUrl` is
 * supplied (with a shimmer + fallback to a gradient placeholder on error),
 * otherwise a deterministic gradient placeholder derived from the seed/query.
 */
export default function ImageCard({ imageUrl, title = '', description, source, seed }: ImageCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  const seedKey = seed || title || 'visual';

  return (
    <figure className="group rounded-2xl overflow-hidden border border-surface-container-highest/40 bg-surface-container-lowest/60 shadow-sm">
      <div className="relative">
        {imageUrl && !imgError ? (
          <div className="relative w-full aspect-video overflow-hidden">
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest/40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onLoad={() => setImgLoading(false)}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <GradientPlaceholder title={title} seed={seedKey} />
        )}
      </div>

      {(title || description || source) && (
        <figcaption className="px-4 py-3">
          {title && <p className="font-label-md text-label-md text-on-surface font-semibold">{title}</p>}
          {description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{description}</p>}
          {source && (
            <p className="font-label-sm text-label-sm text-on-surface-variant/60 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">image</span> {source}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
