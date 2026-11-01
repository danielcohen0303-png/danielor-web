// lucide's "pointer": a hand, index finger up, its tip at (8, 2)
const HAND = [
  "M22 14a8 8 0 0 1-8 8",
  "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1",
  "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10",
  "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
];

/**
 * The move that plays a film, shown rather than said (AC site, 30.10): a
 * finger presses, slides up and lifts on a touch screen, a mouse wheel turns
 * elsewhere (CSS picks one). Each is drawn twice, a dark stroke under the
 * light one, so it reads over any picture with no filter.
 */
export default function SwipeCue({ label }: { label: string }) {
  return (
    <span className="swipe-cue">
      <span aria-hidden className="swipe-cue-icon">
        <span className="swipe-cue-finger">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {HAND.map((d) => (
              <path key={`u${d}`} d={d} stroke="rgba(0,0,0,0.45)" strokeWidth="4" />
            ))}
            {HAND.map((d) => (
              <path key={d} d={d} stroke="currentColor" strokeWidth="1.7" />
            ))}
          </svg>
          <i className="swipe-cue-touch" />
        </span>
        <svg className="swipe-cue-mouse" viewBox="0 0 24 36" fill="none">
          <rect x="2" y="2" width="20" height="32" rx="10" stroke="currentColor" strokeWidth="1.7" />
          <rect className="swipe-cue-wheel" x="11" y="8" width="2" height="7" rx="1" />
        </svg>
      </span>
      <span className="swipe-cue-label">{label}</span>
    </span>
  );
}
