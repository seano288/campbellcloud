declare const __BUILD__: string | undefined;

/** Which version is running: the build's time (UTC) and commit, set by tools/static-build.ts. */
export function BuildLabel() {
  return <div class="build-label" aria-hidden="true">{typeof __BUILD__ === 'string' ? __BUILD__ : 'dev'}</div>;
}
