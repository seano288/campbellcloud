# Brief: Coaster Crew (pushes, pulls and motion; build a roller coaster and ride it)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Coaster Crew. Slug: `coaster-crew`. The name is a working name for the parent to confirm.

## Why this game

The site's science so far is animals and the sky (Wild Rescue) and light and sound (Deep Light). Nothing covers how things move: pushes and pulls, speed, hills, rough and smooth ground, magnets. That is NGSS K-PS2-1 and K-PS2-2, with a first look at 3-PS2-1 to 3-PS2-3, and most states teach it again in first or second grade.

A roller coaster is this subject built large. A car that starts higher goes faster, and it cannot climb a hill taller than the one it came down. He will learn that in the Rounds and then find it is true of the coaster he builds.

## What he learns

Start the research from NGSS K-PS2-1, K-PS2-2 and 3-PS2-1 to 3-PS2-3 and the matching TEKS Grade 1 and Grade 2 force and motion strands, and confirm the exact standard numbers there rather than from memory. Record which standard each kind serves. Use plain words in the game ("push", "pull", "speeds up", "slows down", "rough", "smooth"); school words (force, friction, attract, repel) can be met at Level 3 if the research supports it.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Push or Pull** `push`: what makes it move | start | is it a push or a pull: kicking a ball, opening a drawer, towing a wagon | which way will it go: an arrow shows the push | a big push and a small one on the same cart: which goes farther |
| **Hills** `hill`: height and speed | start | two carts on two hills: which is faster at the bottom | will it get over the next hill: a lower one, or a taller one | choose which of three start heights gets it over |
| **Heavy and Light** `heavy`: the same push on different loads | Push or Pull L2 | an empty cart and a full one get the same push: which goes farther | which needs the bigger push to get going | which is harder to stop |
| **Rough and Smooth** `rough`: what the ground does | Hills L2 | ice, carpet, grass, sand: on which does it slide farthest | which ground stops the cart first | pick the ground for the job: stop at the station, or coast a long way |
| **Bump** `bump`: what happens when things meet | Rough and Smooth L2 | a rolling ball meets a still one: what happens to the still one | a ball meets a wall: which way does it go now | a push from the side on a moving ball: which way now |
| **Magnets** `magnet`: pulling without touching | Heavy and Light L2 | will the magnet pull it: a steel paper clip, a wooden block | two magnets: these ends pull together, these push apart | a magnet works through paper, and pulls harder when it is near |

Every question shows the thing itself, drawn and moving. After he answers, right or wrong, the scene plays so he sees what happens.

Rules the tests must enforce:

- Exactly one choice is right, and the scene that plays agrees with it. One motion model draws every scene and the coaster, so a question cannot say one thing and the reward another.
- **No question depends on weight making something fall or roll downhill faster.** That is the commonest wrong idea in this subject and it is false. Heavy and Light is only about pushing, getting going and stopping on flat ground.
- Hills compares heights that differ clearly. No two hills within a fifth of each other.
- Magnets uses only things nobody would argue about, from a hand-checked table: steel paper clips, iron nails, a steel spoon marked as steel; wood, plastic, paper, glass, rubber. No coins, no drink cans, no jewellery, no "metal" without saying which.
- Rough and Smooth never pairs two surfaces that are close (grass and carpet).
- Bump is drawn from above on a flat table, so gravity plays no part.

## Teaching a miss

Play it, slowly, and say what happened.

- **Push or Pull:** the hand pushes or pulls, an arrow grows from it, and the thing moves along the arrow.
- **Hills:** both carts run side by side with a height bar beside each. "This one started higher, so it is going faster."
- **Heavy and Light:** both carts get the same push, shown as the same arrow, and the full one barely moves.
- **Rough and Smooth:** the cart slides on each ground in turn, and the rough one is shown close up, catching the wheels.
- **Bump:** the meeting plays in slow motion with arrows before and after.
- **Magnets:** the magnet moves in and the thing jumps to it, or does not.

A second miss gets the fuller lesson: he does it himself with a finger, pushing the cart or moving the magnet, and the voice says what he is seeing.

## Currency: Tickets

A park runs on tickets. Riders hand them over at the gate of each ride, and he spends them on track, rides and cars.

- One Ticket, many Tickets. Add `TICKET` to `src/currency/kind.ts`.
- The icon is a red paper ticket with scalloped ends and a star punched in the middle, tilted a little.
- When a Round ends, the tickets come out of a ticket booth in a strip and tear off one by one onto the pile.
- A Ticket is never a price in money, and no ride shows a cost in dollars.
- Food Truck's glossary uses "ticket" for a customer's order. The two games never meet, but say which one you mean in `GLOSSARY.md`.

## Voice

Every question is spoken. Answer pictures are not read out. New clips: the kind names, the names of the track pieces and rides, and the currency lines with "Tickets" (the earned line, the need line and the whole-ten prices; see the build guide's "Currency").

## The reward: the Coaster, the Ride and the Park

He builds a roller coaster one piece at a time and rides it. Flat 2D, from the side.

- **The loop.** A finished Round earns Tickets and one Ride. Tickets buy track pieces, cars, and other rides for the park.
- **Building.** The coaster is a row of pieces joined end to end: a lift hill, drops, humps, a loop, a corkscrew, a tunnel, a splash pool, a banked turn, a booster, brakes and the station. He picks the next piece from a tray, and it snaps on. There is no free drawing.
- **The coaster obeys the Rounds.** The car's speed comes from the height it has fallen, less a little lost to the track. If he adds a hill taller than the car can climb, the builder shows the car slowing and rolling back, and offers the two honest fixes: a taller first hill or a booster. That moment is the lesson, so do not hide it by letting any track work.
- **The Ride (action, 2D canvas, about 45 seconds).** He holds a lever to let the car go at the top of the lift, leans it with a finger to keep the riders' hands up, and taps for the camera at the big drop. The view follows the car.
- **It cannot be failed.** The car is on rails. Too little lean only makes the riders squeal. A coaster that would roll back cannot be opened for a Ride; the builder says why and what to add.
- **The Park (from above).** The coaster sits in a park that he fills: a carousel, a Ferris wheel, bumper cars, a log flume, a drop tower, swings, food stands, paths, trees and a gate. Small visitors walk about and queue.
- **Show off.** "Watch it run": the park working by itself, with his coaster going round. A Thrill number for each coaster (its tallest drop, its top speed, its loops) with his best ever kept.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 50 track pieces in several styles (wood, steel, mine train, space), 20 cars and trains, 30 paints, 30 park rides, 40 stands and pieces of scenery, 20 themes for the station, visitors' hats and balloons, and trophies. Economy defaults for the parent to confirm: one Ride per Round, the first one free on a starter coaster; the first new piece within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Goal) and add the new ones (Ticket, Ride, Piece, Park, Thrill) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Guest Coasters, made on the spot.** A Guest Coaster is always on offer to ride. Each is generated from its number: its pieces, its length, its style and its weather. The same number always gives the same coaster, each is a little longer or wilder, and a test checks that every one runs from end to end without rolling back. Every fifth one gives a track piece or a car that is never sold.
- **The coaster has no end.** He can always buy one more piece, and a second and third coaster on new ground. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **The park has no edge.** Another plot of land can always be bought, with room for more rides.
- **Trains made from parts.** A car is a body, a front, a colour, a stripe and a set of riders, each chosen separately.
- **The rider counter.** Every Ride adds its riders to a total on the gate's board, with a new park rank at each milestone and no last one.
- **Competition:** none against a rival. His own Thrill record is enough.

## Look

A fairground on a summer evening: candy red and white, bulb yellow, a teal sky going pink. Track is drawn as two rails on chunky supports, with the family's black outlines. Icon: a coaster car at the top of a hill with a ticket for a flag.

Keep it apart from Sentence Express, which also has track and a train. There the track is a wooden toy on a table and the train is a sentence. Here the track is tall, the car is fast and the view is from the side.

## Risks

- A wrong idea taught here will stay with him. The motion model and every question need a second read by someone who knows the physics, and the heavier-falls-faster trap needs its own test.
- The builder is the hardest screen on the site for small hands. Pieces must snap, the tray must show only pieces that fit, and one tap must take the last piece off.
- Rolling back is a lesson only if it is kind. It must never feel like a failed build: nothing is lost, and the fix is one tap away.
- The Ride has little to do, since the car is on rails. If it bores him, add things to collect along the track before adding anything he can fail.
- Magnets have the most room for a disputed fact. When unsure, leave the thing out of the table.
- Following a long track with a moving view may stutter on the iPad 9. Draw only the pieces on screen.
