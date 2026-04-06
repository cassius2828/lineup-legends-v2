import { RATING_MIN, RATING_MAX, RATING_COLORS } from "~/lib/constants";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
}

export function getRatingColor(rating: number): string {
  const r = Math.max(RATING_MIN, Math.min(RATING_MAX, rating));
  let i = 0;
  while (i < RATING_COLORS.length - 1 && RATING_COLORS[i + 1]!.at < r) i++;
  const low = RATING_COLORS[i]!;
  const high = RATING_COLORS[i + 1] ?? low;
  const t = low.at === high.at ? 1 : (r - low.at) / (high.at - low.at);
  const [r1, g1, b1] = hexToRgb(low.hex);
  const [r2, g2, b2] = hexToRgb(high.hex);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}
