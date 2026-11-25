// Where each selected clip is in this build's voice packs. tools/static-build.ts makes it for each game's build and dev server.
declare module 'virtual:voice-packs' {
  const index: import('./packs').VoicePackIndex;
  export default index;
}
