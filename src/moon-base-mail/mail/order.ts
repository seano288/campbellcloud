// What Came Next: put the story back in order. Level 1: he reads a three-sentence story, then taps its three pictures in order. Level 2:
// three sentences come mixed up, with no pictures, and only one order makes sense (each later sentence leans on an earlier one: "it",
// "there", a thing that has to happen first). Level 3: four sentences with first, next, then and last. The lines are written here in their
// true order; the questions (the whole order, what came first, what came last) are made from them (index.ts).
import { P } from './types';

export const ORDER = [
  // ---------- Level 1 ----------
  P('order', 1, 'Jo', ['Jo put on her suit.', 'Jo went out the hatch.', 'Jo got in the rover.'], [], { pics: ['suit', 'hatch', 'rover'] }),
  P('order', 1, 'Ben', ['Ben got some seeds.', 'He put them in a pot of dirt.', 'A little green plant came up!'], [], { pics: ['seeds', 'pot', 'plant'], story: 'seeds' }),
  P('order', 1, 'Ava', ['Ava got in the lander.', 'The lander went up into space.', 'Ava looked down at the moon.'], [], { pics: ['lander', 'liftoff', 'moon'] }),
  P('order', 1, 'Kit', ['Kit put on her boots.', 'She went out on the moon.', 'She put a flag in the dust.'], [], { pics: ['boots', 'moon', 'flag'] }),
  P('order', 1, 'Ben', ['Ben dug in the dust.', 'He found a rock.', 'He put the rock in his bag.'], [], { pics: ['dust', 'rock', 'bag'] }),
  P('order', 1, 'Sam', ['Pip the cat ran to the hatch.', 'Sam opened it.', 'Pip ran into the green dome.'], [], { pics: ['cat', 'hatch', 'greendome'], story: 'cat' }),
  P('order', 1, 'Jo', ['Jo made a cake.', 'She put a candle on it.', 'The crew ate it all up.'], [], { pics: ['cake', 'candle', 'crew'], story: 'party' }),
  P('order', 1, 'Dot', ['Dot got a can of red paint.', 'Dot painted the rover.', 'Then Dot went to bed.'], [], { pics: ['paint', 'rover', 'bed'] }),
  P('order', 1, 'Kit', ['The sun went down.', 'It got dark and cold.', 'Kit put on the lights.'], [], { pics: ['sun', 'night', 'light'] }),
  P('order', 1, 'Ava', ['Ava looked in the telescope.', 'She saw a big planet.', 'She called Sam to come and look.'], [], { pics: ['telescope', 'planet', 'Sam'] }),
  P('order', 1, 'Ben', ['The lander came down.', 'Ben got a box out.', 'In the box was a new rover!'], [], { pics: ['lander', 'box', 'rover'] }),
  P('order', 1, 'Jo', ['Jo put seeds in the dirt.', 'Little plants came up.', 'Then the plants had peppers!'], [], { pics: ['seeds', 'plant', 'pepper'], story: 'seeds' }),
  P('order', 1, 'Kit', ['Kit got up from bed.', 'She had pancakes.', 'She went to the green dome.'], [], { pics: ['bed', 'pancake', 'greendome'] }),

  // ---------- Level 2 ----------
  P('order', 2, 'Sam', ['The lander came down by the base.', 'Sam opened the hatch.', 'Out came a big box of mail!'], [], { story: 'mail' }),
  P('order', 2, 'Ben', ['Ben put on his suit and helmet.', 'He went out the hatch.', 'He came back in with a rock.'], []),
  P('order', 2, 'Kit', ['Kit sprayed the seeds with water.', 'Little green plants came up.', 'The plants got big.'], [], { story: 'seeds' }),
  P('order', 2, 'Jo', ['The dust storm came.', 'Dust got on the lander.', 'Dot cleaned the dust off.'], [], { story: 'storm' }),
  P('order', 2, 'Ava', ['Ava made a little hat for Dot.', 'She painted it red.', 'Dot put it on, and the crew all clapped.'], []),
  P('order', 2, 'Kit', ['The lights went out in the green dome.', 'Kit could not see.', 'Dot came with a lamp.'], []),
  P('order', 2, 'Sam', ['A letter came from Earth.', 'Sam opened it.', 'It was from his dad, and it made him happy.'], [], { story: 'mail' }),
  P('order', 2, 'Jo', ['Jo got out a big pan.', 'She made pancakes in it.', 'The crew ate them all up.'], []),
  P('order', 2, 'Ben', ['The rover went over a big rock.', 'One wheel came off!', 'Ben and Dot put it back on.'], []),
  P('order', 2, 'Kit', ['A little space rock came down by the base.', 'It made a little crater.', 'Kit went out to look at it.'], []),

  // ---------- Level 3 ----------
  P('order', 3, 'Kit', ['First, Kit got a pot of dirt.', 'Next, she put in three seeds.', 'Then she sprayed them with water.', 'Last, she put the pot in the light.'], [], { story: 'seeds' }),
  P('order', 3, 'Ben', ['First, Ben put on his suit.', 'Next, he put on his helmet.', 'Then he went out the hatch.', 'Last, he got in the rover.'], []),
  P('order', 3, 'Jo', ['First, Jo got the cake out.', 'Next, she put on the candles.', 'Then the crew sang to Kit.', 'Last, they all ate the cake.'], [], { story: 'party' }),
  P('order', 3, 'Sam', ['First, the lander came down.', 'Next, Sam opened the hatch.', 'Then Dot got the boxes out.', 'Last, Jo put the mail in the mail room.'], [], { story: 'mail' }),
  P('order', 3, 'Ben', ['First, the dust storm came.', 'Next, dust got on the domes.', 'Then the storm went away.', 'Last, Dot cleaned the domes.'], [], { story: 'storm' }),
  P('order', 3, 'Ava', ['First, Ava went to the telescope.', 'Next, she looked at the stars.', 'Then she found a new star!', 'Last, she called the crew to come and look.'], []),
  P('order', 3, 'Kit', ['First, Kit had dinner.', 'Next, she had a bath.', 'Then she got into bed.', 'Last, Pip the cat got on the bed too.'], [], { story: 'cat' }),
  P('order', 3, 'Dot', ['First, Dot got out the paint.', 'Next, he painted a big star on the rover.', 'Then he painted the moon on it.', 'Last, he put the paint away.'], []),
  P('order', 3, 'Ben', ['First, Ben dug up some ice.', 'Next, he put it in the rover.', 'Then he went back to the base.', 'Last, he made the ice into water.'], [], { story: 'ice' }),
  P('order', 3, 'Jo', ['First, Jo put the rocks on the table.', 'Next, she looked at them with a lamp.', 'Then she found a green rock!', 'Last, she put it in a box for the Commander.'], []),
] as const;
