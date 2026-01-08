"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function YouTubeEmbed({ url, className }: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractVideoId(url), [url]);

  if (!videoId) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        "aspect-video", // 16:9 aspect ratio
        className
      )}
    >
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

interface YouTubeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function YouTubeInput({
  value,
  onChange,
  placeholder = "https://www.youtube.com/watch?v=...",
  className,
  disabled = false,
}: YouTubeInputProps) {
  const videoId = useMemo(() => extractVideoId(value), [value]);
  const isValid = value === "" || videoId !== null;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !isValid && value && "border-destructive focus-visible:ring-destructive"
        )}
      />
      {value && !isValid && (
        <p className="text-sm text-destructive">
          Invalid YouTube URL. Please enter a valid YouTube link.
        </p>
      )}
      {videoId && (
        <div className="max-w-md">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <YouTubeEmbed url={value} />
        </div>
      )}
    </div>
  );
}
