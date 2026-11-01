/**
 * Whether a scene's stage should show this frame. A scene rides up under the one before it
 * (margin -100svh), so it shows only once it is pinned; and while it scrolls away it is hidden
 * as soon as the next scene has it covered. On a computer the phone sits a little below the top
 * of the window, and a stage leaving would otherwise show in that gap above the phone.
 */
export function stageShown(stage: HTMLElement, section: HTMLElement) {
  const top = parseFloat(getComputedStyle(stage).top) || 0;
  if (section.getBoundingClientRect().top > top + 0.5) return false;
  const leaving = stage.getBoundingClientRect().top < top - 0.5;
  return !(leaving && section.nextElementSibling?.classList.contains("hf"));
}
