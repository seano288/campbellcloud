# Brief: Food Truck (needs and wants, goods and services, spending; build a food truck and serve)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Food Truck. Slug: `food-truck`. The name is a working name for the parent to confirm; an original, catchier one is welcome.

## Why this game

Treasure Fleet is the site's only social-studies game, and it covers maps. First-grade social studies also teaches how people get what they need: needs and wants, goods and services, jobs, and choosing what to spend on (the TEKS Grade 1 economics strand and its like in other states). Monster Truck Money taught him to count coins and pay an exact price. This game picks up after it: what to buy, whether he has enough, and what is left.

## What he learns

Research the first-grade economics standards before fixing the kinds, and record which standard each kind serves. Money here is whole dollars only, drawn as $1 coins and $5 and $10 notes. Monster Truck Money owns cents and coin names (`src/money`), and this game must not repeat its three Game Modes.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Need or Want** `need` | start | two pictures: "Tap the one you need" (water or a toy) | sort four things into need and want | "You have $5. You need lunch and you want a toy. Which do you buy first?" |
| **Goods and Services** `goods` | start | "A good is a thing you can hold. Tap the good" (a pizza or a haircut) | sort four into goods and services | "Who gives a service?" / "Who makes a good?" three workers |
| **Jobs** `job` | Goods and Services L2 | "Who helps when you are sick?" 2 workers | match a worker to the tool they use | "Who made the bread?" and "Who bought the bread?" (a maker and a buyer in one picture) |
| **Add It Up** `total`: a menu with prices | start | two things, total to $10 | two things, total to $20 | three things, total to $20 |
| **Enough?** `enough` | Add It Up L2 | "You have $8. The taco is $5. Do you have enough?" 👍 or 👎 | "You have $6. Which of these can you buy?" three things, one in reach | buy it and say what is left: "You have $12. The pizza is $7. How much is left?" |
| **Save Up** `save` | Enough? L2 | "The horn costs $10. You have $6. How many more do you need?" | "You earn $2 a day. How many days until you have $10?" | "You have $9. If you buy the gum for $3, can you still buy the ball for $7?" |

Rules the tests must enforce:

- Exactly one choice is right, in every kind. Save Up never asks an opinion ("should you spend or save?"); it only asks what the numbers decide.
- Need or Want uses only clear cases, from a hand-checked table: food, water, a home, clothes and medicine are needs; toys, sweets and games are wants. Nothing a family could argue about (a phone, a car, a bike, a pet).
- Goods and Services uses only clear cases. Nothing that is both (a restaurant meal is a good and a service; leave it out).
- Jobs shows no worker in a way that suggests who can do the job. Mix the people drawn.
- In "Which of these can you buy?" exactly one thing costs his money or less.
- Totals and what is left stay within 20. He reads numbers, so number buttons are not read out.

## Teaching a miss

- **Need or Want:** "You can't live without water. A toy is fun, but you can live without it." The need moves to a shelf marked with a heart.
- **Goods and Services:** the good is picked up and carried off; the service is shown being done to someone.
- **Jobs:** the worker is shown doing the job with the tool.
- **Add It Up:** the two prices become rows of $1 coins that slide together and are counted on from the bigger one.
- **Enough?:** his coins line up under the price's coins, one to one. Coins left over mean enough, and they are what is left. A gap means not enough.
- **Save Up:** the same two rows, with the missing coins drawn as empty circles and counted.

## Voice

New clips: the kind names, the things and workers in the pictures, the food names and the customers' names. The dollar amounts chain from the number clips, as prices do in Monster Truck Money.

## The reward: the Truck, the Service and the Spots

- **The loop.** A finished Round earns Bolts and one Service. Bolts buy trucks and parts. Each Service gives him stars from happy customers, and stars open new Spots.
- **Bolts are not money.** The glossary keeps them apart on purpose so that spending never becomes a sum. Nothing in the reward is priced in dollars and customers do not pay him in money.
- **The Truck.** Truck kinds, each with its own food and its own way of making it: taco, pizza, burger, ice cream, noodles, donuts, smoothies, hot dogs, pancakes, popcorn. Slots on each: Grill, Sign, Awning, Speaker, Lights, Paint, and a Mascot on the roof.
- **Parts matter.** A bigger Grill cooks two orders at once. The Speaker's jingle brings customers faster. The Awning lets more of them wait. Lights open the night Spots.
- **The Service (action, 2D canvas).** Customers walk up with an order shown as a picture (a taco with three toppings). He drags the parts together, cooks it with a hold, and hands it over. About 60 seconds. It is his hands doing the making, which is the fun.
- **It cannot be failed.** A wrong ingredient bounces back to its tray. Customers never get cross and never leave. There is no clock he can lose to; the Service just ends with a cheer and a count of the people he fed.
- **Spots.** Sixteen to start: the park, the beach, the school fair, the stadium, the zoo, the night market, a snowy mountain, the airport.
- **Regulars and show off.** About 40 customers to collect in a sticker book, each with a name and a favourite order. The book and his row of trucks are the screen he shows people.

Plan for about 150 things to earn from the first build (see the build guide). Economy defaults for the parent to confirm: one Service per Round, the first one free; a new Regular on almost every early Service; no price over 100 Bolts.

## Look

Street-fair colours: awning stripes, warm bulb yellow, ketchup red and mint. Trucks and food are drawn in code. Icon: a food truck from the side with its hatch open and a $ on its sign.

## Risks

- The theme. He has asked for robots, rovers and race cars, never food. Ask the parent whether a food truck appeals to him before building; the same six kinds would sit just as well under a bike shop, a pit-lane parts shop or a space trading post.
- Need or Want and Goods and Services depend on tables with no arguable cases. The parent should read every row.
- Add It Up overlaps Math Bots' addition. It is here as money practice, but keep its share of a Round small; the new learning is in the other five kinds.
- Dragging small ingredients with small fingers. Keep every piece at least 44pt and snap generously.
