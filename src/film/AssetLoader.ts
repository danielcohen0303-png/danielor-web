// Downloads with a fixed number of parallel requests, and measures the
// connection on the way (the video engine picks the sharp or lite file by it).

export class AssetLoader {
  private inflight = new Map<string, Promise<Blob>>();
  private ctl = new AbortController();
  loaded = 0;
  /** last measured speed, kbit/s (0 until a file of 200KB+ has arrived) */
  kbps = 0;

  constructor(private slots = 6) {}

  hasSlot() {
    return this.inflight.size < this.slots;
  }

  pending(url: string) {
    return this.inflight.has(url);
  }

  blob(url: string): Promise<Blob> {
    const known = this.inflight.get(url);
    if (known) return known;
    const t0 = performance.now();
    const job = fetch(url, { signal: this.ctl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.blob();
      })
      .then((b) => {
        this.loaded += b.size;
        const ms = performance.now() - t0;
        if (b.size > 200_000 && ms > 0) this.kbps = Math.round((b.size * 8) / ms);
        return b;
      })
      .finally(() => this.inflight.delete(url));
    this.inflight.set(url, job);
    return job;
  }

  destroy() {
    this.ctl.abort();
    this.inflight.clear();
  }
}
