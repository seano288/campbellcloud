export interface VoiceCollection<P extends string> {
  readonly id: string;
  readonly phrases: readonly P[];
  readonly clips: Readonly<Record<P, string>>;
}

export function defineCollection<const P extends readonly string[]>(
  id: string,
  phrases: P & (string extends P[number] ? never : unknown),
  clips: Readonly<Record<NoInfer<P[number]>, string>>,
): VoiceCollection<P[number]> {
  return { id, phrases: [...new Set(phrases)], clips };
}

export function composeVoice<const C extends readonly VoiceCollection<string>[]>(...collections: C): VoiceCollection<C[number]['phrases'][number]> {
  const clips: Record<string, string> = {};
  for (const collection of collections) {
    for (const phrase of collection.phrases) {
      const file = collection.clips[phrase];
      if (!file) throw new Error(`Missing recording mapping for "${phrase}" in ${collection.id}`);
      if (clips[phrase] && clips[phrase] !== file) throw new Error(`Conflicting recording for "${phrase}" in ${collection.id}`);
      clips[phrase] = file;
    }
  }
  return { id: collections.map(c => c.id).join('+'), phrases: [...new Set(collections.flatMap(c => c.phrases))], clips: clips as Record<C[number]['phrases'][number], string> };
}
