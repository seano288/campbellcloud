// Which part of a recording to keep: the speech, with a little air after it.
const QUIET = 0.012, LEAD_S = 0.02, GAP_S = { piece: 0.09, sentence: 0.3 } as const;

export function keepRange(samples: ArrayLike<number>, rate: number, end: keyof typeof GAP_S): [number, number] {
  const n = samples.length, loud = (i: number) => Math.abs(samples[i]!) > QUIET;
  let first = 0, last = n - 1;
  while (first < n && !loud(first)) first++;
  while (last > first && !loud(last)) last--;
  if (first >= n) return [0, n];
  return [Math.max(0, first - Math.round(LEAD_S * rate)), Math.min(n, last + Math.round(GAP_S[end] * rate))];
}
