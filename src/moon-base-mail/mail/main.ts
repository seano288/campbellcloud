// Big Idea: what the letter is mostly about. Level 1: the picture that fits the whole letter (the wrong ones are each in one sentence, or
// not in it). Level 2: the best title of three (the wrong ones name a detail). Level 3: one sentence does not belong, and he taps it.
// Each letter also has a question about a key detail, so it can come back with a different question.
import { P, q } from './types';

const ABOUT = 'What is the letter mostly about?';
const TITLE = 'Which is the best title?';
const ODD = 'Which one does not belong? Tap it.';

export const MAIN = [
  // ---------- Level 1 ----------
  P('main', 1, 'Kit', ['The plants in the green dome are big now.', 'Ben sprayed them with water.', 'Now one plant has a red pepper on it!'], [
    q(ABOUT, 'pic', 'plant', ['Ben', 'water'], [0, 1, 2]),
    q('What is on one plant?', 'pic', 'pepper', ['Ben', 'water'], 2, { so: 'So one plant has a pepper.' }),
  ], { topic: 'the plants', story: 'seeds' }),
  P('main', 1, 'Sam', ['Pip is the base cat.', 'Pip likes to nap in the rover.', 'Pip likes fish for dinner.'], [
    q(ABOUT, 'pic', 'cat', ['rover', 'fish'], [0, 1, 2]),
    q('What does Pip like for dinner?', 'pic', 'fish', ['rover', 'cat'], 2, { so: 'So Pip likes fish.' }),
  ], { topic: 'Pip the cat', story: 'cat' }),
  P('main', 1, 'Jo', ['Our rover is big and red.', 'It has big black wheels.', 'Ben and I ride it to the crater.'], [
    q(ABOUT, 'pic', 'rover', ['crater', 'Ben'], [0, 1, 2]),
    q('Where do they ride the rover?', 'pic', 'crater', ['rover', 'Ben'], 2, { so: 'So they ride it to the crater.' }),
  ], { topic: 'the rover' }),
  P('main', 1, 'Ava', ['I can see the Earth from the base.', 'The Earth looks blue and white.', 'My mom is on the Earth.'], [
    q(ABOUT, 'pic', 'Earth', ['mom', 'base'], [0, 1, 2]),
    q('Who is on the Earth?', 'pic', 'mom', ['Ava', 'base'], 2, { so: 'So her mom is on the Earth.' }),
  ], { topic: 'the Earth' }),
  P('main', 1, 'Jo', ['We have a big telescope.', 'It is on top of the dome.', 'With it, we can see stars and planets.'], [
    q(ABOUT, 'pic', 'telescope', ['dome', 'planet'], [0, 1, 2]),
    q('Where is the telescope?', 'pic', 'dome', ['planet', 'star'], 1, { so: 'So it is on top of the dome.' }),
  ], { topic: 'the telescope' }),
  P('main', 1, 'Ben', ['Lunch is in the big dome.', 'We had salad and muffins.', 'Dot sat with us, but he did not eat.'], [
    q(ABOUT, 'pic', 'lunch', ['robot', 'dome'], [0, 1, 2]),
    q('What did they have?', 'pic', 'muffin', ['robot', 'dome'], 1, { so: 'So they had muffins.' }),
  ], { topic: 'lunch' }),
  P('main', 1, 'Kit', ['A dust storm is coming.', 'Dust will go all over the lander.', 'We will all sit inside the dome.'], [
    q(ABOUT, 'pic', 'storm', ['dome', 'crew'], [0, 1, 2]),
    q('Where will they sit?', 'pic', 'dome', ['lander', 'storm'], 2, { so: 'So they will sit in the dome.' }),
  ], { topic: 'the dust storm', story: 'storm' }),
  P('main', 1, 'Sam', ['The mail came in the lander.', 'There was a letter for Kit.', 'There was a box for Ben.'], [
    q(ABOUT, 'pic', 'mail', ['lander', 'box'], [0, 1, 2]),
    q('What did Ben get?', 'pic', 'box', ['letter', 'lander'], 2, { so: 'So Ben got a box.' }),
  ], { topic: 'the mail', story: 'mail' }),
  P('main', 1, 'Ava', ['Dot is our robot.', 'Dot can fix the lander.', 'Dot can paint the domes too.'], [
    q(ABOUT, 'pic', 'robot', ['lander', 'paint'], [0, 1, 2]),
    q('What can Dot fix?', 'pic', 'lander', ['paint', 'dome'], 1, { so: 'So Dot can fix the lander.' }),
  ], { topic: 'Dot the robot' }),

  // ---------- Level 2 ----------
  P('main', 2, 'Ben', ['A dust storm came at lunch.', 'Dust got on the domes and the lander.', 'We all sat in the big dome.', 'Then the storm went away.'], [
    q(TITLE, 'words', 'the dust storm', ['lunch', 'the big lander'], [0, 1, 2, 3]),
    q('When did the storm come?', 'words', 'at lunch', ['in the big dome', 'on the domes'], 0, { so: 'So it came at lunch.' }),
  ], { topic: 'the dust storm', story: 'storm' }),
  P('main', 2, 'Kit', ['We have a new dome.', 'It has a garden in it.', 'There are trees and a little pond.', 'I like to sit in it.'], [
    q(TITLE, 'words', 'the garden dome', ['a little pond', 'Kit likes to sit'], [0, 1, 2, 3]),
    q('What is in the garden?', 'words', 'trees and a pond', ['a new dome', 'a place to sit'], 2, { so: 'So there are trees and a pond.' }),
  ], { topic: 'the garden dome' }),
  P('main', 2, 'Ben', ['The rover did not go.', 'I looked at its wheels.', 'I fixed a wheel.', 'Then the rover went!'], [
    q(TITLE, 'words', 'Ben fixes the rover', ['the wheels', 'a ride to Earth'], [0, 1, 2, 3]),
    q('What did Ben do first?', 'words', 'looked at the wheels', ['fixed a wheel', 'went in the rover'], 1, { so: 'So first he looked at the wheels.' }),
  ], { topic: 'fixing the rover' }),
  P('main', 2, 'Jo', ['I called my dad on Earth.', 'He has a new dog.', 'We talked for a long time.', 'Then I went to bed happy.'], [
    q(TITLE, 'words', 'a call to Earth', ['the new dog', 'bed'], [0, 1, 2, 3]),
    q('Who has a new dog?', 'words', 'her dad', ['Jo', 'the bed'], 1, { so: 'So her dad has the dog.' }),
  ], { topic: 'a call to Earth' }),
  P('main', 2, 'Ava', ['I went for a walk on the moon.', 'I went up a hill.', 'I looked into a big crater.', 'Then I walked back to the base.'], [
    q(TITLE, 'words', 'a walk on the moon', ['the big crater', 'the base'], [0, 1, 2, 3]),
    q('What did Ava look into?', 'words', 'a big crater', ['a hill', 'the base'], 2, { so: 'So she looked into a crater.' }),
  ], { topic: 'a walk on the moon' }),
  P('main', 2, 'Sam', ['There is no rain on the moon.', 'But there is ice in dark craters.', 'We dig up the ice.', 'We make it into water for the base.'], [
    q(TITLE, 'words', 'getting water', ['rain', 'dark craters'], [0, 1, 2, 3]),
    q('Where is the ice?', 'words', 'in dark craters', ['in the rain', 'in the water'], 1, { so: 'So the ice is in dark craters.' }),
  ], { topic: 'getting water', story: 'ice' }),
  P('main', 2, 'Kit', ['Jo and I played a jumping game.', 'Jo jumped over a big rock.', 'I jumped over the rover!', 'Then we sat down in the dust.'], [
    q(TITLE, 'words', 'the jumping game', ['a big rock', 'sitting in the dust'], [0, 1, 2, 3]),
    q('What did Kit jump over?', 'words', 'the rover', ['a big rock', 'the dust'], 2, { so: 'So Kit jumped over the rover.' }),
  ], { topic: 'the jumping game' }),
  P('main', 2, 'Ben', ['We got a new flag in the mail.', 'It is blue with a white star.', 'Dot put it up by the hatch.'], [
    q(TITLE, 'words', 'the new flag', ['the hatch', 'a white star'], [0, 1, 2]),
    q('Where did Dot put the flag?', 'words', 'by the hatch', ['a white star', 'in the mail'], 2, { so: 'So the flag is by the hatch.' }),
  ], { topic: 'the new flag' }),
  P('main', 2, 'Jo', ['Pip the cat has a new ball.', 'It has a bell in it.', 'Pip kicks it all over the dome.', 'Now the dome is not quiet!'], [
    q(TITLE, 'words', 'a ball for Pip', ['the quiet dome', 'a bell'], [0, 1, 2, 3]),
    q('What is in the ball?', 'words', 'a bell', ['a dome', 'Pip'], 1, { so: 'So a bell is in it.' }),
  ], { topic: 'Pip and her ball', story: 'cat' }),

  // ---------- Level 3 ----------
  P('main', 3, 'Jo', ['A big telescope came in the lander.', 'Ben and I put it in the top of the dome.', 'Now we can look at planets and stars.', 'Pip had fish for lunch.', 'We looked at the stars all night.'], [
    q(ODD, 'line', '3', ['0', '1', '2', '4'], [0, 1, 2, 4]),
    q('Where did they put the telescope?', 'words', 'in the dome', ['in the lander', 'by the stars'], 1, { so: 'So it is in the dome.' }),
  ], { topic: 'the telescope', odd: 3 }),
  P('main', 3, 'Kit', ['I have a garden in the green dome.', 'I have peppers and peaches in it.', 'The lander has big legs.', 'I spray the plants after lunch.'], [
    q(ODD, 'line', '2', ['0', '1', '3'], [0, 1, 3]),
    q('When does Kit spray the plants?', 'words', 'after lunch', ['in the green dome', 'big legs'], 3, { so: 'So she sprays them after lunch.' }),
  ], { topic: 'the garden', odd: 2 }),
  P('main', 3, 'Ben', ['The dust storm came at night.', 'Dust went all over the domes.', 'Jo likes to sing.', 'When it was over, Dot cleaned up the dust.'], [
    q(ODD, 'line', '2', ['0', '1', '3'], [0, 1, 3]),
    q('Who cleaned up the dust?', 'words', 'Dot', ['Jo', 'the domes'], 3, { so: 'So Dot cleaned it up.' }),
  ], { topic: 'the dust storm', odd: 2, story: 'storm' }),
  P('main', 3, 'Sam', ['Pip is a black and white cat.', 'She likes to nap in hot spots.', 'She plays with a red ball.', 'The lander came at lunch.'], [
    q(ODD, 'line', '3', ['0', '1', '2'], [0, 1, 2]),
    q('What does Pip play with?', 'words', 'a red ball', ['hot spots', 'the lander'], 2, { so: 'So she plays with a red ball.' }),
  ], { topic: 'Pip the cat', odd: 3, story: 'cat' }),
  P('main', 3, 'Jo', ['Ava and I went out in the rover.', 'We went down a big hill.', 'Kit made a cake for dinner.', 'Then the rover went into a crater and back out!'], [
    q(ODD, 'line', '2', ['0', '1', '3'], [0, 1, 3]),
    q('Who went out in the rover?', 'words', 'Ava and Jo', ['Kit', 'a cake'], 0, { so: 'So Ava and Jo went out.' }),
  ], { topic: 'a ride in the rover', odd: 2 }),
  P('main', 3, 'Ava', ['From the moon, the Earth looks big.', 'It is blue and white.', 'Ben fixed a wheel.', 'I like to look at it after dinner.'], [
    q(ODD, 'line', '2', ['0', '1', '3'], [0, 1, 3]),
    q('When does Ava like to look at the Earth?', 'words', 'after dinner', ['a wheel', 'blue and white'], 3, { so: 'So she looks after dinner.' }),
  ], { topic: 'the Earth', odd: 2 }),
  P('main', 3, 'Sam', ['The lander came with mail.', 'I got a letter from my mom.', 'Kit got a box of candy.', 'The rover has big wheels.', 'Jo got a letter too.'], [
    q(ODD, 'line', '3', ['0', '1', '2', '4'], [0, 1, 2, 4]),
    q('What did Kit get?', 'words', 'a box of candy', ['a letter', 'big wheels'], 2, { so: 'So Kit got candy.' }),
  ], { topic: 'the mail', odd: 3, story: 'mail' }),
  P('main', 3, 'Kit', ['We had a party for Ben.', 'Jo made a big cake.', 'We all sang a song for him.', 'The ice is in a dark crater.'], [
    q(ODD, 'line', '3', ['0', '1', '2'], [0, 1, 2]),
    q('Who made the cake?', 'words', 'Jo', ['Ben', 'a crater'], 1, { so: 'So Jo made the cake.' }),
  ], { topic: 'the party', odd: 3, story: 'party' }),
  P('main', 3, 'Ava', ['Max is new at the base.', 'He came in the lander.', 'He sleeps in the new dome.', 'Pip the cat likes fish.', 'Max can fix rockets.'], [
    q(ODD, 'line', '3', ['0', '1', '2', '4'], [0, 1, 2, 4]),
    q('Where does Max sleep?', 'words', 'in the new dome', ['in the lander', 'rockets'], 2, { so: 'So he sleeps in the new dome.' }),
  ], { topic: 'Max', odd: 3, story: 'max' }),
] as const;
