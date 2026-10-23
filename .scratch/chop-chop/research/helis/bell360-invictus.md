# Bell 360 Invictus (FARA competitive prototype)

Tags: **[src]** = from a fetched/search source (see section 10). **(derived)** = arithmetic on sourced numbers. **(est.)** = my estimate. Units: metres unless noted. Research date 2026-10-23.

Status in one line: a never-confirmed-flown FARA prototype. The Army cancelled FARA on 8 Feb 2024, and no source I found confirms a first flight.

---

## 1. Identity

- **Full name:** Bell 360 Invictus (also listed as "Bell 360"). **[src]** Wikipedia "Bell 360 Invictus"
- **Maker:** Bell Textron (Bell Flight), with Collins Aerospace (digital backbone / flight controls) and Sierra Nevada Corporation (mission systems, added April 2022). **[src]** Wikipedia; Bell Flight release 26 Apr 2022 (cited there)
- **Country:** United States. **[src]** Wikipedia
- **First flight:** None confirmed. Schedule slipped from 2022 to 2023 while waiting on the GE T901 engine. **[src]** War Thunder forum (low confidence). Wikipedia states no first flight date. See Known gaps.
- **In service:** Never. Competed for the US Army's Future Attack Reconnaissance Aircraft (FARA) and was cancelled. **[src]** Wikipedia; Janes headline, 12 Feb 2024
- **Role:** Reconnaissance and attack helicopter. **[src]** Wikipedia
- **Crew:** Two, pilot and gunner, in a **tandem** cockpit (one behind the other). **[src]** Wikipedia

### Kid-friendly voice lines (8, each under 12 words)

1. "Its big rotor has four blades that spin round and round!" Source: 4-blade rotor, Wikipedia.
2. "It has two seats, one behind the other, for pilot and gunner!" Source: tandem two-crew cockpit, Wikipedia.
3. "It has little wings that help it zoom along, like a plane!" Source: stub wing lift-sharing design, Wikipedia.
4. "Its wings help hold it up when it flies super fast!" Source: about 50% of lift at cruise from wings, Wikipedia.
5. "It can zoom along at about 210 miles per hour!" Source: cruise 210 mph (180 kn), Wikipedia.
6. "It has a second engine for extra power when it needs it!" Source: supplemental power unit, Wikipedia.
7. "It was built to carry a big 20-millimetre cannon!" Source: XM915 20 mm cannon shown on airframe, Aviation Week, 12 Jul 2022.
8. "Bell first showed its design to the world in 2019!" Source: unveiled Oct 2019, Textron press release, 2 Oct 2019.

Fiction note: no TV or film tie-in found.

---

## 2. Geometry for procedural modelling

Overall (what's known):
- **Fuselage length:** not found. (est.) ~13 m, read as a guess from FARA-class size, not from a three-view. Low confidence; prefer a reference drawing.
- **Height to top of rotor hub:** not found. (est.) ~4 m. Low confidence.
- **Fuselage width:** not found. (est.) ~1.6 m.
- **Stub-wing span:** not found. (est.) ~5 m total.
- **Main rotor diameter:** 40 ft = **12.19 m**. Sourced as the FARA maximum, and Wikipedia gives "40 foot (12 m) diameter". **[src]** Wikipedia; Aviation Week. (derived: 40 ft × 0.3048 = 12.19 m.)

Main rotor:
- **Count:** 1 (single main rotor with a shrouded hub). **[src]** Wikipedia
- **Blade count:** **4**. **[src]** Wikipedia; Bell 525 rotor, four shorter blades (search summary, not re-verified)
- **Blade chord:** not found. (est.) ~0.5 m.
- **Rotation (seen from above):** not found. US single-rotor helicopters usually turn counter-clockwise from above. (est.) Verify against a Bell 525 reference before relying on it.
- **Hub height above ground:** not found. (est.) ~3.6 m.
- **Hub x from nose:** not found. (est.) ~45% of fuselage length, placed mid-fuselage with the hub on the centreline above the stub-wing root.
- **Note:** Wikipedia says the stub wings sit mid-mounted **below** the shrouded rotor hub. **[src]**

Anti-torque (tail rotor): **this is the one the brief asked me to verify. Verdict: the "canted ducted" tail rotor is out of date.**
- Bell first showed the Invictus with a **ducted tail rotor, canted at 20°** for extra hover lift. **[src]** search summary citing Defense News, 5 Aug 2021 (URL in section 10).
- Mid-build, Bell replaced it with an **open (unshrouded) tail rotor** to save weight, which left more weight for mission systems and weapons. **[src]** Aviation Week, 12 Jul 2022: "Bell changed the anti-torque system from a ducted to open rotor design to save weight"; Defense News 2021 and Vertical magazine coverage.
- Wikipedia still says "tilted and shrouded" and Bell's own page heading still says "Compact Ducted Tail Rotor". Both conflict with the 2021–2022 reporting. Treat the open-rotor change as the best-supported version, and use the Bell page only with care.
- Tail rotor **side:** not found. (est.) On the port side, the usual US single-rotor layout, but unverified.
- Tail rotor diameter, blades, height, x: not found. Open tail rotor blade count not sourced. (est.) ~2.4 m diameter, 4 blades, sitting at the tail boom's tip height, at about 90% of fuselage length from the nose.
- Pusher propeller: **none** found.

Fuselage (8 stations, nose to tail): **not found.** No three-view or station table in any source I reached. Suggested (est.) placeholder, to be replaced from a three-view:

| Station | x from nose (m) | Width (m) | Height (m) | Centre z above ground (m) |
|---|---|---|---|---|
| 1 nose | 0.0 | 0.2 | 0.5 | 1.6 |
| 2 | 1.0 | 1.0 | 1.3 | 1.7 |
| 3 canopy front | 2.5 | 1.5 | 1.6 | 1.9 |
| 4 cockpit | 4.0 | 1.6 | 1.7 | 2.0 |
| 5 mid | 6.5 | 1.6 | 1.8 | 2.1 |
| 6 engine bay | 9.0 | 1.5 | 1.6 | 2.2 |
| 7 boom root | 11.0 | 0.9 | 1.0 | 2.3 |
| 8 tail | 13.0 | 0.3 | 0.4 | 2.3 |

- Tail boom: length and diameter not found. Boom is short, since the tail rotor sits low. (est.)
- Engine housings: 1 main (GE T901) and 1 supplemental (P&W PW207D1). Exhaust direction not found. (est.) Main exhaust aft and top, SPU exhaust aft of the cabin.
- Canopy: tandem, pilot front, gunner rear. Raised rear seat. Shape not found. (est.) Sleek, faceted glass, like other 2019 FARA bids.

Top-view and side-view outlines: **not found**; no three-view in sources. Do not model from guesses without a reference.

Tail surfaces:
- Vertical fin: not found. (est.) One fin with the tail rotor, mounted high.
- Horizontal stabiliser: **active horizontal stabiliser** is mentioned. **[src]** Wikipedia. Span/chord not found.
- Endplates: not found.

Stub wings:
- Wings plural (mid-mounted, below the rotor hub), providing ~50% of lift at cruise. **[src]** Wikipedia; Bell claim, search summary.
- Span and chord: **not found**. (est.) span ~5 m, chord ~0.8 m.
- Hardpoints per side: not found; the airframe carries integrated launchers and a full weapons load. **[src]** Aviation Week. Count not given. (est.) 2 per side.

Landing gear:
- **Not found.** A FARA helicopter like this would be a skid or retractable-wheel design. (est.) Fixed skids, track ~2.5 m, height ~0.5 m, but unverified.

---

## 3. Distinctive features checklist (most recognisable first)

1. **Shrouded rotor hub with mid-mounted stub wings** under it: the wing shape is the signature. **[src]** Wikipedia
2. **Tandem two-seat cockpit,** pilot front, gunner rear: a sleek nose canopy. **[src]** Wikipedia
3. **Four-blade main rotor, about 12 m wide.** **[src]**
4. **Open (unshrouded) tail rotor** — NOT the canted ducted one in early images. **[src]** Aviation Week 2022
5. **Slim, low-slung fuselage with a short boom.** (est.)
6. **Single main engine at the back, with a supplemental power unit beside it.** **[src]**
7. **20 mm cannon** carried on the airframe (XM915 shown in 2022). **[src]**

What must be right for recognition: the stub wings under the hub, the tandem canopy, and the four-blade rotor. The tail rotor is the trickiest, because two configurations appear in published art.

---

## 4. Paint & liveries

**No sourced paint scheme found.** Every colour below is my estimate, and I did not verify it against any image.

Scheme 1, **Bell 2019 unveil (est.)**: matte grey. Body #6B7178, wings #5A6068, canopy #1B2430, rotor blades #3A3F45.
Scheme 2, **2022 Farnborough prototype (est.)**: light grey with a darker grey nose. Body #A9AEB4, nose #7A8088, markings #2B3037.
Scheme 3, **Army olive drab (est.)**: #5B5E3B body, #3E4129 wings, black exhaust.
Scheme 4, **Demo / airshow white (est.)**: #E8ECEF body, #C23B22 red trim on the boom.
Scheme 5, **Bell company blue (est.)**: #1F4E8C body, #E8ECEF stripes.

Where colour goes: body (paint), wings (stub wing), canopy (dark glass), tail boom, rotor (blade tip, a stripe).

Suggested mod ladder:
- **Free default:** Scheme 1, matte grey.
- **Upgrade 1 (Desert):** Scheme 3, olive drab.
- **Upgrade 2 (Airshow):** Scheme 4, white with red trim.
- **Upgrade 3 (Company):** Scheme 5, Bell blue.
- **Legendary:** Scheme 2, the 2022 prototype grey with dark nose, plus a gold stripe on the blade tips (est.).

---

## 5. Armament & stores

- **Gun:** 20 mm cannon. **Wikipedia** names it as "a 20 mm unspecified rotary cannon in a chin gun turret," tagged *citation needed*. **Aviation Week (2022)** says the XM915 20 mm cannon is shown on the airframe for the first time. **[src]** Turret or chin position: **not confirmed**.
- **Internal weapons bay:** **Not found.** No source mentions an internal bay. Wikipedia describes integrated launchers instead. I did not carry an internal-bay claim forward.
- **Rockets / missiles:** "integrated munitions launcher," able to carry current Army munitions. **[src]** search summary, Bell claim. Exact weapons not named.
- **Door guns, hoists, cargo hooks:** not found.
- **Hardpoint positions:** not found beyond the stub wings.

Kid-friendly weapons/stores mod ladder (no violence language):
1. **Plain:** no stores, just the cannon.
2. **Light:** add a small rocket pod on each stub wing (est.).
3. **Sensor:** add a camera ball under the nose (est., a reconnaissance role **[src]** Wikipedia).
4. **Full load:** all stores on, shown as "a full load" (**[src]** Aviation Week, the 2022 "full load of weapons" image).

---

## 6. Engines

- **Count:** 2. **[src]**
- **Main:** 1 × **General Electric T901** turboshaft, 3,000 shp (the FARA requirement, with ITEP as the programme). **[src]** Wikipedia; Aviation Week 2022. The engine was delayed, and the Bell prototype waited on it. **[src]**
- **Supplemental power unit (SPU):** 1 × **Pratt & Whitney PW207D1** turboshaft, **586 shp** (439 kW). **[src]** Wikipedia
- **Exhaust positions:** not found. (est.) main exhaust aft and top of the rear fuselage; SPU exhaust aft.
- **Top speed:** not found. **Cruise speed 210 mph (330 km/h, 180 kn).** **[src]** Wikipedia. The Army required at least 180 kn. **[src]** Bell listed >185 KTAS per a search summary, not verified.
- **Fact:** the wings carry about **50% of the helicopter's lift** at cruise, so the rotor can push forward instead of lifting. **[src]** Wikipedia (Bell claim). (derived: half the weight is held by the wings at speed.)

---

## 7. Other cool mods

- **Rotor-tip lights**, a wink to the 4 blades (est.).
- **Camera ball / sensor turret under the nose** (a reconnaissance role per Wikipedia). **[src]**
- **Searchlight** (est.), for the night recon mission.
- **Winch or sling load:** not sourced. Skip.
- **Active horizontal stabiliser** visible as a tail flap that moves in flight. **[src]** Wikipedia (fly-by-wire, active stab)
- **Fly-by-wire flight-control display** on the cockpit screen. **[src]** Wikipedia; Collins digital backbone.

---

## 8. Sound

- **Main rotor:** four blades. Low, rhythmic thump-thump at a steady beat, with a faint slap at the blade tip on descent. (est.)
- **Engine:** a turboshaft whine rising with power, plus a deeper hiss from the main engine exhaust. (est.)
- **SPU:** a higher, quicker whine when it kicks in, since it is a smaller engine. (est.)
- **Tail:** an open tail rotor gives a sharper, buzzy whir, not the hollow duct boom of a shrouded one. (est., derived from the open-rotor change **[src]**)

Synth ideas: four-blade thump at about 4 Hz (est.), turboshaft whine with pitch up under load, a wide breathy noise for the stub wings in airflow.

---

## 9. Fraction-friendly facts

- **Rotor blades: 4**, so each blade is **one quarter** of the main rotor. **[src]**
- **Seats: 2**, so the pilot is **one half** of the crew. **[src]**
- **Engines: 2** (main plus supplemental). The supplemental is **one half** of the engine count. **[src]** (derived)
- **Cannons: 1** (the 20 mm). **[src]**
- **Wings: 2** (est.), so each wing is **one half** of the lift-sharing pair. Wing count is plural in sources, not a number; mark as est.
- **Wheels: 0** if skids are used; not confirmed. (est.)
- **Main rotors: 1**, so the rotor is one whole. **[src]**
- **Doors:** not found.
- **Tail rotor blades:** not found.
- **Lift shared:** 50% by the wings at cruise, so the rotor carries **one half** of the lift at speed. **[src]** (derived)

---

## 10. Reference sources

### URLs used
- Wikipedia, "Bell 360 Invictus": https://en.wikipedia.org/wiki/Bell_360_Invictus (fetched 2026-10-23; main source for crew, rotor, engines, wings, weapons, speed, cancellation)
- Aviation Week, "Bell's 360 Invictus Crosses 90% Complete Milestone", 12 Jul 2022: https://aviationweek.com/shownews/farnborough-airshow/bells-360-invictus-crosses-90-complete-milestone (fetched; 90% complete, T901 wait, XM915 cannon, open tail rotor change)
- Aviation Week, "Mission Systems Weight Drove 360 Invictus Tail Change": https://aviationweek.com/defense/aircraft-propulsion/mission-systems-weight-drove-360-invictus-tail-change (search summary, paywalled)
- Defense News, "Bell changes design for the us armys future attack recon aircraft", 5 Aug 2021: https://www.defensenews.com/land/2021/08/05/bell-changes-design-for-the-us-armys-future-attack-recon-aircraft/ (search summary; ducted tail canted 20 degrees, change to open rotor)
- Vertical magazine, "bell 360 invictus half built new tail rotor coming": https://verticalmag.com/news/bell-360-invictus-half-built-new-tail-rotor-coming/ (search summary)
- Vertical magazine, "bells 360 invictus attack helicopter 30 percent complete": https://verticalmag.com/news/bells-360-invictus-attack-helicopter-30-percent-complete/ (search result title only; not fetched)
- Bell Experience page: https://experience.bellflight.com/bell-360 (search result only; not fetched, still says "Compact Ducted Tail Rotor")
- Janes, "US Army cancels FARA and UH-60V in revamp of aviation acquisition", 12 Feb 2024: https://www.janes.com/defence-news/air-platforms/latest/us-army-cancels-fara-and-uh-60v-in-revamp-of-aviation-acquisition-intends-to-purchase-additional-uh-60ms-and-ch-47fs (search result title; cancellation date confirmed by search summary)
- Defense News, "US Army spent billions on a new helicopter that now will never fly", 8 Feb 2024: cited in Wikipedia's references; **the URL I tried returned 404, so I could not read it.** Used only as a headline.
- War Thunder forum, "Bell Textron 360 Invictus": https://forum.warthunder.com/t/bell-textron-360-invictus-a-streamlined-stealthy-strike-package/328024 (fan forum, low confidence; used only for "Number Built: 1" and the 2023 first-flight slip)
- Textron press release, "Lethal. Sustainable. Bell Announces 360 Invictus", 2 Oct 2019 (cited in Wikipedia; not fetched)

### Three-view drawings found
- **None.** No three-view with station data was found in the sources I reached. Look at Bell's press pack or Wikimedia Commons for a 2019 unveil image before trusting any geometry in section 2.

### FARA cancellation (summary)
- **Decision:** the US Army cancelled FARA on **8 February 2024**, in an "Aviation Investment Rebalance" that also cut UH-60V. **[src]** Janes; Wikipedia; search summary of West Fair Online.
- **Reason given:** battlefield lessons from Ukraine. Cheap unmanned systems were the priority. **[src]** Wikipedia (Army Chief of Staff Randy George); search summary.

### Prototype progress
- **Oct 2019:** design unveiled, full-scale mock-up at AUSA. **[src]** Wikipedia
- **Mid 2022:** **75%** complete in January 2022, then **90%** complete by 12 Jul 2022 (Aviation Week), waiting on the GE T901. **[src]**
- **Schedule:** first flight slipped from 2022 to 2023 (War Thunder forum, low confidence). Search summary of Feb 2024 reporting says it was "substantially complete, pending first flight in late 2024." Not verified.
- **Engine status at cancellation:** search summary claims Bell had already installed the ITEP engine when the cancellation came. Not verified against a Bell or Army source.
- **Flight status:** **Not confirmed.** The Wikipedia reference to Defense News' "will never fly" headline suggests the prototype never flew, but I could not read the article. Treat as unknown.

### Known gaps
- Fuselage length, height, width, and width/height stations: **not found** (no three-view).
- Stub-wing span, chord, hardpoint count per side: **not found**.
- Main rotor blade chord, hub height, hub x, and rotation direction: **not found**.
- Tail rotor side, diameter, blade count, height: **not found**.
- Tail boom length: **not found**.
- Landing gear type (skids vs. wheels): **not found**.
- Paint and livery hex values: **all estimates**; no sourced colour scheme found.
- Internal weapons bay: **none found in any source.** Brief assumed it; I did not carry it forward.
- Canted, ducted, or open tail rotor: the **open** rotor replacement is best supported (2021–2022 reporting); Wikipedia and Bell's page still show older language.
- First flight date: **not confirmed.**
- Top speed: not separately sourced; cruise 210 mph (180 kn) is the only figure.
- Defense News 8 Feb 2024 article: not readable (404).
