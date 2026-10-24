# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One family's children, playing at home. The site hosts several small games, each in its own folder behind a landing page.

Time Flies is played by an early reader, about 6 to 7 years old. He reads numbers and short words but still leans on the recorded voice. He plays mostly on an iPad, sometimes on an iPhone, usually holding it in his hands, and he plays alone.

## Product Purpose

Time Flies teaches telling the time and calendar facts: analog clocks (whole hours, then quarter hours, then every five minutes), the days of the week, the months of the year and basic time facts (seconds in a minute and so on). Short mixed Rounds earn Bolts, which he spends in a 3D jet Hangar to build and fly his plane. It succeeds when he reads a clock face on his own and keeps coming back to play.

## Positioning

The game adapts to him. Each kind of question has its own Level, raised automatically on Mastery. Every Round mixes all the kinds he has opened, and a missed question comes back easier. Wrong answers are taught on the clock face itself rather than marked with a red X. The reward is a plane he owns and builds up, not points.

## Operating Context

- A child on a tablet or phone, often with the sound on. Every question, choice and reward is spoken, and buttons light up while they are read.
- Installed as a PWA from the family site. Safari and the Home Screen keep separate storage.
- A Round resumes after a reload.

## Capabilities and Constraints

- Preact and Vite, built as static files under `dist-site/time-flies`.
- Shares its engine with Monster Truck Money (`src/`): the Round, voice, celebration and save code, plus the shared styles in `src/styles.css`. Time Flies-only styling goes in `src/time-flies/time-flies.css`.
- Domain terms are defined in `GLOSSARY.md` (Round, Level, Mastery, Bolt, Mod, Goal, Trophy, the six Game Modes).
- He never picks a mode; Play always starts a mixed Round.

## Brand Commitments

- Time Flies and Monster Truck Money are siblings. Time Flies keeps the family look: Bungee lettering for titles, Nunito for reading, thick black outlines and chunky drop shadows. Its own character comes from flying and cockpit instruments, in layout, gauges, colour and materials.
- The analog clock is drawn as a cockpit instrument: a gunmetal bezel, a red short hand and a blue long hand.

## Product Principles

1. The voice comes first. Anything he must understand is spoken; text supports it but never replaces it.
2. Play is always the obvious thing. He should see the one big thing to tap within a second.
3. Teach rather than mark wrong. A miss shows him why, on the clock.
4. Rewards are things he owns (his plane, its parts, Trophies), never a score to lose.

## Accessibility & Inclusion

- An early reader: short words, sentence case for anything he reads, and digital times introduced alongside analog ones.
- Small hands on glass: tap targets at least 44pt, and nothing important hidden behind precise gestures alone.
- Respect the device's Reduce Motion setting.
