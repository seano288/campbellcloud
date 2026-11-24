// The Fact File: true reports about space, from the base. Level 1: find a fact the report says. Level 2: use the labels on its picture
// (art/diagrams.tsx). Level 3: "Does the report say this?" yes, no, or not in the report. Every fact is listed with its source in the
// spec (.scratch/moon-base-mail/spec.md); a fact we were not sure of was left out. The pictures of the lander, the suit and the rover are
// of the kind of machine the reports describe, not of a real one.
import { P, q } from './types';

const SAY = 'Does the report say this?';
const NOT = 'not in the report';
const yes = (says: string, at: number | readonly number[]) => q(SAY, 'yn', 'yes', ['no', NOT], at, { says });
const no = (says: string, at: number | readonly number[]) => q(SAY, 'yn', 'no', ['yes', NOT], at, { says });
const notSaid = (says: string) => q(SAY, 'yn', NOT, ['yes', 'no'], [], { says });

export const FACT = [
  // ---------- Level 1 ----------
  P('fact', 1, 'Base', ['The moon is a big ball of rock.', 'It goes around the Earth.', 'There is no air on the moon.'], [
    q('What goes around the Earth?', 'words', 'the moon', ['the sun', 'the air'], 1, { so: 'So the moon goes around the Earth.' }),
    q('What is the moon made of?', 'words', 'rock', ['air', 'Earth'], 0, { so: 'So the moon is rock.' }),
  ]),
  P('fact', 1, 'Base', ['There are craters all over the moon.', 'A crater is a big hole in the ground.', 'Rocks from space made the craters.'], [
    q('What made the craters?', 'words', 'space rocks', ['the ground', 'a big hole'], 2, { so: 'So rocks from space made them.' }),
    q('What is a crater?', 'words', 'a big hole', ['a space rock', 'the moon'], 1, { so: 'So a crater is a hole.' }),
  ]),
  P('fact', 1, 'Base', ['The sun is a star.', 'It is so hot!', 'The sun makes light for the Earth and the moon.'], [
    q('What is the sun?', 'words', 'a star', ['the moon', 'the Earth'], 0, { so: 'So the sun is a star.' }),
    q('What does the sun make?', 'words', 'light', ['the moon', 'stars'], 2, { so: 'So the sun makes light.' }),
  ]),
  P('fact', 1, 'Base', ['The moon does not make light.', 'It shines with light from the sun.', 'The sun is a star, but the moon and Earth are not.'], [
    q('Where does the moon get its light?', 'words', 'from the sun', ['from the Earth', 'from the dark'], 1, { so: 'So its light is from the sun.' }),
    q('Which one is a star?', 'words', 'the sun', ['the moon', 'the Earth'], 2, { so: 'So the sun is a star.' }),
  ]),
  P('fact', 1, 'Base', ['On the moon, the sky is black.', 'It is black in the day and at night.', 'The moon has no air, so the sky is not blue.'], [
    q('What color is the sky on the moon?', 'words', 'black', ['blue', 'air'], [0, 1], { so: 'So the sky is black.' }),
    q('Why is the sky black on the moon?', 'words', 'it has no air', ['it is night', 'the day'], 2, { so: 'So it is black because there is no air.' }),
  ]),
  P('fact', 1, 'Base', ['Gravity pulls us down.', 'The moon is little, so its gravity is little.', 'So you can jump up high on the moon.'], [
    q('What does gravity do?', 'words', 'pulls us down', ['jumps up high', 'makes us hot'], 0, { so: 'So gravity pulls us down.' }),
    q('Where can you jump up high?', 'words', 'on the moon', ['on Earth', 'in gravity'], 2, { so: 'So you can jump high on the moon.' }),
  ]),
  P('fact', 1, 'Base', ['The moon is hot in the day.', 'At night, it gets so cold!', 'So the crew go out in suits.'], [
    q('When is the moon cold?', 'words', 'at night', ['in the day', 'in suits'], 1, { so: 'So it is cold at night.' }),
    q('When is the moon hot?', 'words', 'in the day', ['at night', 'in suits'], 0, { so: 'So it is hot in the day.' }),
  ]),
  P('fact', 1, 'Base', ['The moon has no wind and no rain.', 'So footprints on the moon do not go away.', 'The first footprints on the moon are there now.'], [
    q('Why do footprints on the moon not go away?', 'words', 'no wind and no rain', ['they are the first', 'the moon is cold'], [0, 1], { so: 'So with no wind and no rain, they stay.' }),
    q('What is still there?', 'words', 'footprints', ['wind and rain', 'the moon'], 2, { so: 'So the first footprints are there now.' }),
  ]),
  P('fact', 1, 'Base', ['The Earth is a planet.', 'It goes around the sun.', 'The moon goes around the Earth.'], [
    q('What is the Earth?', 'words', 'a planet', ['a star', 'the sun'], 0, { so: 'So the Earth is a planet.' }),
    q('What does the Earth go around?', 'words', 'the sun', ['the moon', 'a planet'], 1, { so: 'So the Earth goes around the sun.' }),
  ]),
  P('fact', 1, 'Base', ['There is ice on the moon.', 'It is in dark craters, where the sun does not shine.', 'Crews can make the ice into water.'], [
    q('Where is the ice?', 'words', 'in dark craters', ['in the sun', 'in the water'], 1, { so: 'So the ice is in dark craters.' }),
    q('What can the ice be made into?', 'words', 'water', ['craters', 'the sun'], 2, { so: 'So the ice can be water.' }),
  ], { story: 'ice' }),

  // ---------- Level 2: the labelled picture ----------
  P('fact', 2, 'Base', ['This is a lander.', 'Its legs sit on the ground.', 'The crew go down the ladder.', 'The rocket under it slows it down.'], [
    q('Which part sits on the ground?', 'label', 'legs', ['ladder', 'rocket', 'hatch'], 1, { so: 'So the legs sit on the ground.' }),
    q('Which part do the crew go down?', 'label', 'ladder', ['legs', 'rocket', 'hatch'], 2, { so: 'So the crew go down the ladder.' }),
    q('Which part slows the lander down?', 'label', 'rocket', ['legs', 'ladder', 'hatch'], 3, { so: 'So the rocket slows it down.' }),
  ], { diagram: 'lander' }),
  P('fact', 2, 'Base', ['A lander has a hatch.', 'The crew get in and out at the hatch.', 'Its rocket fires to make it go up and down.'], [
    q('Which part do the crew get in at?', 'label', 'hatch', ['legs', 'ladder', 'rocket'], 1, { so: 'So the crew get in at the hatch.' }),
    q('Which part fires?', 'label', 'rocket', ['hatch', 'legs', 'ladder'], 2, { so: 'So the rocket fires.' }),
  ], { diagram: 'lander' }),
  P('fact', 2, 'Base', ['This is a moon suit.', 'The backpack has air in it.', 'The helmet has gold on it to stop the sun.', 'The boots are big and thick.'], [
    q('Which part has air in it?', 'label', 'backpack', ['helmet', 'boots', 'hands'], 1, { so: 'So the backpack has the air.' }),
    q('Which part stops the sun?', 'label', 'helmet', ['backpack', 'boots', 'hands'], 2, { so: 'So the helmet stops the sun.' }),
    q('Which part is big and thick?', 'label', 'boots', ['helmet', 'backpack', 'hands'], 3, { so: 'So the boots are big and thick.' }),
  ], { diagram: 'suit' }),
  P('fact', 2, 'Base', ['A moon suit is white.', 'The white helps it not get hot in the sun.', 'The crew can get rocks with the thick hands of the suit.'], [
    q('Which part can get rocks?', 'label', 'hands', ['helmet', 'backpack', 'boots'], 2, { so: 'So the hands get rocks.' }),
    q('Which part goes on the head?', 'label', 'helmet', ['hands', 'backpack', 'boots'], 0, { so: 'So the helmet goes on the head.' }),
  ], { diagram: 'suit' }),
  P('fact', 2, 'Base', ['This is a moon rover.', 'Its wheels can go over rocks and dust.', 'The dish on it talks to Earth.', 'The box on the back is for rocks.'], [
    q('Which part talks to Earth?', 'label', 'dish', ['wheels', 'box', 'light'], 2, { so: 'So the dish talks to Earth.' }),
    q('Which part goes over rocks?', 'label', 'wheels', ['dish', 'box', 'light'], 1, { so: 'So the wheels go over rocks.' }),
    q('Which part is for rocks?', 'label', 'box', ['dish', 'wheels', 'light'], 3, { so: 'So the box is for rocks.' }),
  ], { diagram: 'rover' }),
  P('fact', 2, 'Base', ['Here are the sun, the Earth and the moon.', 'The sun is a star.', 'The Earth goes around the sun.', 'The moon goes around the Earth.'], [
    q('Which one is a star?', 'label', 'sun', ['Earth', 'moon'], 1, { so: 'So the sun is a star.' }),
    q('Which one goes around the Earth?', 'label', 'moon', ['sun', 'Earth'], 3, { so: 'So the moon goes around the Earth.' }),
    q('Which one does the Earth go around?', 'label', 'sun', ['moon', 'Earth'], 2, { so: 'So the Earth goes around the sun.' }),
  ], { diagram: 'sky' }),
  P('fact', 2, 'Base', ['Here is the ground on the moon.', 'A crater is a hole made by a space rock.', 'Dust is all over the ground.', 'You can see footprints in the dust.'], [
    q('Which part is a hole?', 'label', 'crater', ['dust', 'footprint', 'rock'], 1, { so: 'So the crater is a hole.' }),
    q('Which part did a boot make?', 'label', 'footprint', ['crater', 'dust', 'rock'], 3, { so: 'So a boot made the footprint.' }),
    q('Which part made the crater?', 'label', 'rock', ['footprint', 'dust', 'crater'], 1, { so: 'So a space rock made the crater.' }),
  ], { diagram: 'ground' }),
  P('fact', 2, 'Base', ['This is a telescope.', 'Light comes in at the big end.', 'You look in at the little end.', 'It makes stars look big.'], [
    q('Where does the light come in?', 'label', 'big end', ['little end', 'legs'], 1, { so: 'So light comes in at the big end.' }),
    q('Where do you look in?', 'label', 'little end', ['big end', 'legs'], 2, { so: 'So you look in at the little end.' }),
  ], { diagram: 'telescope' }),
  P('fact', 2, 'Base', ['From space, the Earth looks blue and white.', 'The blue is water.', 'The white is ice and clouds.'], [
    q('Which part is water?', 'label', 'blue', ['white', 'space'], 1, { so: 'So the blue is water.' }),
    q('Which part is ice?', 'label', 'white', ['blue', 'space'], 2, { so: 'So the white is ice.' }),
  ], { diagram: 'earth' }),

  // ---------- Level 3: does the report say this? ----------
  P('fact', 3, 'Base', ['The moon is a ball of rock.', 'It has no air.', 'The Earth is big, and the moon is little.', 'Crews went to the moon in rockets.'], [
    yes('The moon is made of rock.', 0), no('There is air on the moon.', 1), notSaid('Crews can dig up moon rocks.'),
  ]),
  P('fact', 3, 'Base', ['Gravity pulls us down.', 'The moon has gravity too.', 'But moon gravity is little.', 'So on the moon, you can jump up high.'], [
    yes('There is gravity on the moon.', 1), no('On the moon, you can not jump.', 3), notSaid('Gravity on the sun is big.'),
  ]),
  P('fact', 3, 'Base', ['Plants grow in light.', 'They get water from the dirt.', 'Crews have made plants grow in space.', 'Crews can grow them in a dome.'], [
    yes('Plants grow in light.', 0), no('Plants can not grow in space.', 2), notSaid('Plants can grow big.'),
  ]),
  P('fact', 3, 'Base', ['The sun is a star.', 'It is the star we see in the day.', 'The sun is so big, the Earth looks little next to it.', 'Do not look at the sun!'], [
    yes('The sun is a star.', 0), no('It is good to look at the sun.', 3), notSaid('The sun is far from us.'),
  ]),
  P('fact', 3, 'Base', ['The Earth is a planet.', 'It goes around the sun.', 'It has air and water.', 'From the moon, the Earth looks blue.'], [
    yes('The Earth goes around the sun.', 1), no('The Earth is a star.', 0), notSaid('The moon goes around the Earth.'),
  ]),
  P('fact', 3, 'Base', ['Craters are all over the moon.', 'Rocks from space made the craters.', 'Some craters are big, and some are little.', 'Some craters are dark inside all the time.'], [
    yes('Some craters are little.', 2), no('All craters are big.', 2), notSaid('Craters have ice in them.'),
  ]),
  P('fact', 3, 'Base', ['Dust is all over the moon.', 'Moon dust is sharp, not soft.', 'It sticks to suits and boots.', 'Crews brush it off.'], [
    yes('Moon dust sticks to boots.', 2), no('Moon dust is soft.', 1), notSaid('Dust gets in the rover too.'),
  ]),
  P('fact', 3, 'Base', ['A day on the moon is long.', 'The sun is up for days and days.', 'Then the night is long too.', 'At night it gets so cold.'], [
    yes('The night on the moon is long.', 2), no('The sun is up for a little time.', 1), notSaid('There are stars at night.'),
  ]),
  P('fact', 3, 'Base', ['A telescope makes stars look big.', 'Some telescopes are on the ground.', 'Some telescopes are in space.', 'You look in at the little end.'], [
    yes('Some telescopes are in space.', 2), no('A telescope makes stars look little.', 0), notSaid('Telescopes are black.'),
  ]),
] as const;
