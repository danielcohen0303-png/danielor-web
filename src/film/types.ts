// Shared shapes for the scroll-film engine. A film is one pinned section
// whose scroll progress (0..1) drives a clip; everything else (captions,
// side elements) hangs off the same progress.

export type EngineKind = "frames" | "video" | "hybrid";

export type FilmMedia = {
  /** folder under /public, e.g. /film/test/v1 */
  base: string;
  frames: number;
  fps: number;
  /** frame folders, relative to base */
  framesPhone: string;
  framesDesk: string;
  /** video files, relative to base */
  video: string;
  videoLite?: string;
  /** frame rate of the video file (60 when interpolated) */
  videoFps: number;
};

export type Caption = {
  /** film progress (0..1) where it fades in, and where it is gone */
  from: number;
  to: number;
  el: HTMLElement;
};

/** Anything that turns film progress into a picture. */
export interface Renderer {
  /** draw (or seek to) this progress; returns the progress actually on screen */
  render(p: number, dir: 1 | -1): number;
  /** time the first picture was on screen, ms from navigation start */
  firstPaint: number | null;
  bytes(): number;
  destroy(): void;
}
