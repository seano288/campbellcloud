// The recorded voice reaches the browser packed into a few files per game (tools/voice-packs.ts builds them): each pack is
// its clips' mp3 files laid end to end, so a clip is a slice of a pack. The host ignores Range requests, so a pack is
// fetched whole the first time any of its clips is wanted and kept as a Blob, which the browser can keep outside the
// page's memory, and each clip is sliced from it when it's needed.

export interface VoicePackIndex {
  /** Each pack's file name in voice/ and its size in bytes. */
  readonly packs: readonly { readonly file: string; readonly bytes: number }[];
  /** Each clip's file name, and where its bytes are: which pack, how far in, how many. */
  readonly clips: Readonly<Record<string, readonly [pack: number, offset: number, length: number]>>;
}

/** Gives a clip's bytes by its file name, or null when its pack can't be had right now (try again later). */
export function packedClips(index: VoicePackIndex, get: (url: string) => Promise<Response> = url => fetch(url)) {
  const packs = new Map<number, Promise<Blob>>();

  function pack(n: number) {
    let loading = packs.get(n);
    if (!loading) {
      const { file, bytes } = index.packs[n]!;
      const fetched = get(`./voice/${file}`).then(async response => {
        if (!response.ok) throw new Error(`voice pack ${file}: HTTP ${response.status}`);
        const blob = await response.blob();
        if (blob.size !== bytes) throw new Error(`voice pack ${file}: ${blob.size} bytes, expected ${bytes}`);
        return blob;
      });
      packs.set(n, loading = fetched);
      // a pack that failed (the Wi-Fi dropped) is fetched again next time, or its clips would stay silent until a reload
      fetched.catch(() => { if (packs.get(n) === fetched) packs.delete(n); });
    }
    return loading;
  }

  return async (file: string): Promise<ArrayBuffer | null> => {
    const clip = index.clips[file];
    if (!clip) return null;
    const [n, offset, length] = clip;
    let blob: Blob;
    try { blob = await pack(n); } catch { return null; }
    return blob.slice(offset, offset + length).arrayBuffer();
  };
}
