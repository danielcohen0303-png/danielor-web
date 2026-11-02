// Downloads with a fixed number of parallel requests, and measures the
// connection on the way (the video engine picks the sharp or lite file by it).
//
// Frame sequences don't fetch by themselves: they register as owners and the
// loader hands each free slot to the most urgent file any owner still needs
// (lower prio first). One loader shared by every scene of a page means the
// scene on screen always comes first, and while it is complete the next scene
// downloads in the background instead of all scenes fighting for the line
// (Daniel, 02.11: on a computer the picture stuck the first time through).

export type FetchOwner = {
  /** the next file this owner still needs and how urgent it is (lower first), or null */
  next(): { url: string; prio: number } | null;
  got(url: string, b: Blob): void;
};

export class AssetLoader {
  private inflight = new Map<string, Promise<Blob>>();
  /** files fetched ahead and kept until a scene asks for them (the phone's videos) */
  private kept = new Map<string, Blob>();
  private fails = new Map<string, number>();
  private owners = new Set<FetchOwner>();
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

  /** gave up on it (two failed tries) */
  failed(url: string) {
    return (this.fails.get(url) ?? 0) >= 2;
  }

  /** fetch a file now and keep it, for a scene that will ask for it later */
  keep(url: string) {
    if (this.kept.has(url)) return Promise.resolve(this.kept.get(url)!);
    return this.blob(url, "low").then((b) => (this.kept.set(url, b), b));
  }

  blob(url: string, priority?: "high" | "low"): Promise<Blob> {
    const ready = this.kept.get(url);
    if (ready) return Promise.resolve(ready);
    const known = this.inflight.get(url);
    if (known) return known;
    const t0 = performance.now();
    const init: RequestInit & { priority?: "high" | "low" } = { signal: this.ctl.signal };
    if (priority) init.priority = priority;
    const job = fetch(url, init)
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
      .catch((e) => {
        this.fails.set(url, (this.fails.get(url) ?? 0) + 1);
        throw e;
      })
      .finally(() => this.inflight.delete(url));
    this.inflight.set(url, job);
    return job;
  }

  register(o: FetchOwner) {
    this.owners.add(o);
    this.dispatch();
  }

  unregister(o: FetchOwner) {
    this.owners.delete(o);
  }

  /** fill the free slots with the most urgent files the owners still need */
  dispatch() {
    while (this.hasSlot()) {
      let best: { o: FetchOwner; url: string; prio: number } | null = null;
      for (const o of this.owners) {
        const w = o.next();
        if (w && (!best || w.prio < best.prio)) best = { o, ...w };
      }
      if (!best || this.inflight.has(best.url)) return;
      const { o, url, prio } = best;
      this.blob(url, prio < 1e6 ? "high" : "low")
        .then((b) => o.got(url, b))
        .catch(() => {})
        .finally(() => this.dispatch());
    }
  }

  destroy() {
    this.ctl.abort();
    this.inflight.clear();
    this.owners.clear();
  }
}
