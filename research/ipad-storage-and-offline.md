# iPad Safari storage and offline for a Home Screen web app

Answers `.scratch/monster-truck-garage/issues/01-ipad-storage-and-offline.md`.
Researched 2026-09-29. Current release is Safari 27.0 (iPadOS 27, WebKit post dated 2026-09-17). The Safari 27.0 notes list no changes to storage, service workers, Home Screen web apps or autoplay, so the Safari 17 and Safari 26 policies below still apply as far as the primary sources say.

## Short answer

- Once the game is launched from the Home Screen icon, its data is exempt from Safari's 7-day deletion rule. It gets the same large storage quota a Safari tab gets, and WebKit's heuristic for `navigator.storage.persist()` favours Home Screen web apps.
- A Safari tab and the Home Screen app keep separate storage. Only cookies are copied, and only once, when the icon is added. Progress saved in a tab does not show up in the app.
- A service worker with the Cache API gives offline support. 1–5 MB is far below the quota. On iPadOS 26 and later a manifest is optional, but it is still useful.
- Audio with sound needs a user gesture first. Plan for a "tap to start" screen.
- Moving to Capacitor changes the origin, so data in the web app's storage will not carry over. Use Capacitor Preferences or SQLite there.

## 1. Eviction and the 7-day rule

- ITP deletes "all cookies created in JavaScript and all other script-writeable storage after 7 days of no user interaction with the website". This covers IndexedDB, localStorage, sessionStorage, media keys, and service worker registrations and caches. Safari 13.1 / iOS and iPadOS 13.4 and later. Source: https://webkit.org/tracking-prevention/ and https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Home Screen web apps: "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use." WebKit calls deletion of a web app's data "a serious bug". The tracking-prevention page says Home Screen web apps' first-party domains are exempt from the 7-day cap. Source: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/, https://webkit.org/tracking-prevention/
- Separately, when the disk runs short, WebKit evicts origins in least-recently-used order. Origins with an active page or persistent-mode storage are excluded (Safari 17 / iPadOS 17 and later). Source: https://webkit.org/blog/14403/updates-to-storage-policy/
- Eviction removes all of an origin's data at once (IndexedDB, Cache API and so on). Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

### `navigator.storage.persist()`

- "WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App." (Safari 17 / iPadOS 17 and later.) Source: https://webkit.org/blog/14403/updates-to-storage-policy/
- Safari shows no prompt. It approves or denies based on interaction history. Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Needs a secure context (HTTPS, which GitHub Pages provides). MDN lists it as Baseline since December 2021. Source: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- Practical use: call `persist()` from inside the Home Screen app, and check `persisted()` in a parent or debug view. Persistent mode removes the one remaining eviction path (disk pressure).

## 2. Safari tab vs Home Screen app: separate storage

- WebKit engineer, bug 181849: "Home Screen apps are created as isolated entities without shared state with the browser." Status is still NEW; WebKit considers this behaviour by design. Source: https://bugs.webkit.org/show_bug.cgi?id=181849
- WWDC23 (iPadOS 17 era): only cookies are copied when a web app is created. "Since local storage is not copied when a web app is created…" and "From that point on, cookies are separate between Safari and the web app." Source: https://developer.apple.com/videos/play/wwdc2023/10120/ and https://webkit.org/blog/14205/news-from-wwdc23-webkit-features-in-safari-17-beta/
- Consequence: anything saved in localStorage or IndexedDB during a Safari tab session is lost to the app. Install the icon first and play only from it. If a transfer is ever needed, it would have to be manual, such as an export/import code.

## 3. Offline: service worker, manifest, quota

- Quota (Safari 17 / iPadOS 17 and later): browser apps get up to 60% of disk per origin and 80% overall. "When a web app is running standalone … it has the same origin quota and overall quota as when it is opened in a browser app." The quota covers localStorage, Cache API, IndexedDB, service workers and the File System API. Source: https://webkit.org/blog/14403/updates-to-storage-policy/
- `StorageManager.estimate()` reports usage and the origin quota. Source: https://webkit.org/blog/14403/updates-to-storage-policy/
- localStorage has its own cap of about 5 MiB per origin, so keep images and audio in the Cache API. Source: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- 1–5 MB of images and audio is a negligible share of that quota on any iPad.
- iPadOS 26 and later: "every website added to the Home Screen opens as a web app" by default, and no manifest is required. The user can switch off an "Open as Web App" toggle when adding the icon. Service workers keep working as before. Source: https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/, https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- A manifest is still worth adding for the name, icon, `display: standalone` and `id` (Safari 16.4 added `id`). Source: https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- Watch-out: if the toggle is off, the icon opens in Safari, and the data then falls under Safari's 7-day rule and Safari's storage (see section 2). The adult setting it up should leave "Open as Web App" on.

## 4. Audio without a first tap

- iOS allows autoplay only for media with no audio track or `muted` media. "If a <video> element gains an audio track or becomes un-muted without a user gesture, playback will pause." (iOS 10 and later.) Source: https://webkit.org/blog/6784/new-video-policies-for-ios/
- WebKit: "Websites should assume any use of <video> or <audio> requires a user gesture click to play." Source: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
- MDN: audible playback that starts without user interaction is blocked, and Web Audio `start()` outside a user input handler "is subject to autoplay rules". Source: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- Apple's older guide says the same for iOS, including iPad: `play()` works only when triggered by user action. The document is archived (2012), but it matches the current WebKit posts. Source: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html
- I found no primary source that exempts Home Screen web apps from this rule, and no primary source on whether `speechSynthesis.speak()` needs a gesture on current iPadOS. Test it on the device.
- Design implication: a big "Start" button (a truck to tap) that unlocks an `AudioContext` or plays the first voice line inside the tap handler. After that, later clips can play from game logic.

## 5. Moving to Capacitor later

- By default Capacitor on iOS serves the app from `capacitor://localhost` (`iosScheme` default `capacitor`, `hostname` default `localhost`). Source: https://capacitorjs.com/docs/config
- That is a different origin, and a different app container, from the GitHub Pages Home Screen web app. So localStorage and IndexedDB written by the web app will not be visible to the native app. This is an inference from the same-origin model and section 2's isolation; I found no doc that addresses it directly. Plan an export/import step, or accept a fresh start.
- Inside Capacitor, localStorage "must be considered transient". The OS can reclaim WebView storage when space runs low, and IndexedDB has similar issues on iOS. Source: https://capacitorjs.com/docs/guides/storage
- Recommended instead: the Preferences plugin (`UserDefaults` on iOS) for small key/value data such as progress and coin totals, or SQLite for larger data. Source: https://capacitorjs.com/docs/apis/preferences, https://capacitorjs.com/docs/guides/storage
- Design implication: put all saves behind a small storage module now (for example `load()`/`save()` of one JSON blob). The web build can use localStorage or IndexedDB and a later Capacitor build can swap in Preferences.

## Open items to verify on the device

- Whether `persist()` returns `true` inside the Home Screen app on the family iPad.
- Whether the first voice line needs a tap on current iPadOS, including `speechSynthesis` if it is used.
- Offline launch: install, open once online, then enable airplane mode and relaunch.
