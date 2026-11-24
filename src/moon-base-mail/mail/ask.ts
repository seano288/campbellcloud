// Read the Mail: a letter, then a spoken question about it. Level 1: three sentences, who, what or where, picture answers. Level 2: four
// or five sentences, when as well, short written answers. Level 3: why and how, where the answer is said in the letter.
// Wrong answers are things from the letter that answer a different question (mail.test.ts checks each one is in it).
import { P, q } from './types';

export const ASK = [
  // ---------- Level 1 ----------
  P('ask', 1, 'Sam', ['Sam put a big box in the dome.', 'Pip the cat sat on the box.', 'Then Pip had a nap in the rover.'], [
    q('Where did Sam put the box?', 'pic', 'dome', ['rover', 'cat'], 0, { so: 'So the box is in the dome.' }),
    q('Who sat on the box?', 'pic', 'cat', ['Sam', 'dome'], 1, { so: 'So Pip the cat sat on it.' }),
    q('What did Sam put in the dome?', 'pic', 'box', ['cat', 'Sam'], 0, { so: 'So Sam put a box in the dome.' }),
  ], { story: 'cat' }),
  P('ask', 1, 'Kit', ['Kit can not find her red mitten.', 'She looked under her bed.', 'Dot the robot looked in the rover.'], [
    q('What can Kit not find?', 'pic', 'mitten', ['bed', 'rover'], 0, { so: 'So Kit can not find her mitten.' }),
    q('Who looked in the rover?', 'pic', 'robot', ['Kit', 'mitten'], 2, { so: 'So Dot the robot looked in the rover.' }),
    q('Where did Kit look?', 'pic', 'bed', ['rover', 'mitten'], 1, { so: 'So Kit looked under her bed.' }),
  ], { story: 'mitten' }),
  P('ask', 1, 'Ava', ['Ava went out in her suit.', 'She got a big rock.', 'She put the rock in a bag.'], [
    q('What did Ava get?', 'pic', 'rock', ['bag', 'suit'], 1, { so: 'So Ava got a rock.' }),
    q('Where did Ava put the rock?', 'pic', 'bag', ['suit', 'rock'], 2, { so: 'So the rock is in a bag.' }),
  ]),
  P('ask', 1, 'Ben', ['Ben made pancakes for the crew.', 'Jo ate three!', 'Pip the cat got one too.'], [
    q('What did Ben make?', 'pic', 'pancake', ['cat', 'Jo'], 0, { so: 'So Ben made pancakes.' }),
    q('Who ate three?', 'pic', 'Jo', ['Ben', 'cat'], 1, { so: 'So Jo ate three.' }),
  ]),
  P('ask', 1, 'Jo', ['Jo has a new rover.', 'It is red and black.', 'Pip the cat got a ride in it.'], [
    q('What does Jo have?', 'pic', 'rover', ['cat', 'Jo'], 0, { so: 'So Jo has a rover.' }),
    q('Who got a ride?', 'pic', 'cat', ['Jo', 'rover'], 2, { so: 'So Pip the cat got a ride.' }),
  ], { story: 'cat' }),
  P('ask', 1, 'Ava', ['Ava and Ben went out to a big crater.', 'Ben dug up a black rock.', 'Ava got some dust in a bag.'], [
    q('Where did they go?', 'pic', 'crater', ['bag', 'rock'], 0, { so: 'So they went to a crater.' }),
    q('What did Ava get?', 'pic', 'dust', ['rock', 'crater'], 2, { so: 'So Ava got dust.' }),
    q('Who dug up a rock?', 'pic', 'Ben', ['Ava', 'crater'], 1, { so: 'So Ben dug up the rock.' }),
  ]),
  P('ask', 1, 'Dot', ['Dot the robot likes to help.', 'Dot helped Sam fix the lander.', 'Then Dot cleaned the hatch.'], [
    q('Who did Dot help?', 'pic', 'Sam', ['robot', 'lander'], 1, { so: 'So Dot helped Sam.' }),
    q('What did Dot clean?', 'pic', 'hatch', ['lander', 'Sam'], 2, { so: 'So Dot cleaned the hatch.' }),
  ]),
  P('ask', 1, 'Kit', ['Kit made a little man out of moon dust.', 'His hat is a red cup.', 'Pip the cat sat by him.'], [
    q('What did Kit make?', 'pic', 'dustman', ['cup', 'cat'], 0, { so: 'So Kit made a dust man.' }),
    q('What is his hat?', 'pic', 'cup', ['cat', 'dust'], 1, { so: 'So his hat is a cup.' }),
  ], { story: 'dustman' }),
  P('ask', 1, 'Ben', ['Ben has a bike in his dome.', 'He rides it after lunch.', 'Pip the cat rides with him in a box!'], [
    q('What does Ben ride?', 'pic', 'bike', ['box', 'cat'], [0, 1], { so: 'So Ben rides a bike.' }),
    q('Where is the bike?', 'pic', 'dome', ['box', 'cat'], 0, { so: 'So the bike is in his dome.' }),
  ]),
  P('ask', 1, 'Sam', ['Sam got a letter from Earth.', 'It was from his mom.', 'Sam put it on his bed.'], [
    q('Who was the letter from?', 'pic', 'mom', ['Sam', 'bed'], 1, { so: 'So it was from his mom.' }),
    q('Where did Sam put the letter?', 'pic', 'bed', ['letter', 'Earth'], 2, { so: 'So the letter is on his bed.' }),
  ]),
  P('ask', 1, 'Jo', ['Jo looked out at the Earth.', 'It was blue and white.', 'Pip the cat looked too.'], [
    q('What did Jo look at?', 'pic', 'Earth', ['cat', 'Jo'], 0, { so: 'So Jo looked at the Earth.' }),
    q('Who looked too?', 'pic', 'cat', ['Jo', 'Earth'], 2, { so: 'So Pip looked too.' }),
  ]),
  P('ask', 1, 'Ava', ['Ava fixed the big light on the dome.', 'Now the base is not dark.', 'Dot the robot is so happy!'], [
    q('What did Ava fix?', 'pic', 'light', ['dome', 'robot'], 0, { so: 'So Ava fixed the light.' }),
    q('Who is happy?', 'pic', 'robot', ['Ava', 'light'], 2, { so: 'So Dot is happy.' }),
  ]),
  P('ask', 1, 'Kit', ['Pip the cat is not in her bed.', 'She is not in the green dome.', 'Kit found her in the rover!'], [
    q('Where was Pip?', 'pic', 'rover', ['bed', 'greendome'], 2, { so: 'So Pip was in the rover.' }),
    q('Who found Pip?', 'pic', 'Kit', ['cat', 'rover'], 2, { so: 'So Kit found her.' }),
  ], { story: 'cat' }),
  P('ask', 1, 'Ben', ['The dust storm is over.', 'Now dust is all over the lander.', 'Ben and Dot sprayed it with water.'], [
    q('What has dust on it?', 'pic', 'lander', ['water', 'robot'], 1, { so: 'So the lander has dust on it.' }),
    q('Who sprayed it with Ben?', 'pic', 'robot', ['Ben', 'lander'], 2, { so: 'So Dot sprayed it with Ben.' }),
  ], { story: 'storm' }),

  // ---------- Level 2 ----------
  P('ask', 2, 'Kit', ['After lunch, I went to the green dome.', 'It was cold in there, so I put on my red mittens.', 'I sprayed the plants and looked at the peppers.', 'When I got back, I had one mitten!'], [
    q('When did Kit go to the green dome?', 'words', 'after lunch', ['to the green dome', 'when she got back'], 0, { so: 'So she went after lunch.' }),
    q('Where did Kit go?', 'words', 'the green dome', ['after lunch', 'the red mittens'], 0, { so: 'So Kit went to the green dome.' }),
    q('What did Kit put on?', 'words', 'red mittens', ['the plants', 'after lunch'], 1, { so: 'So she put on her red mittens.' }),
  ], { story: 'mitten' }),
  P('ask', 2, 'Jo', ['Dot said a dust storm is coming.', 'It will come at night.', 'After lunch, Sam and I put the rover in its dome.', 'Ben shut the hatch of the lander.'], [
    q('When will the storm come?', 'words', 'at night', ['after lunch', 'in its dome'], 1, { so: 'So the storm will come at night.' }),
    q('Who shut the hatch?', 'words', 'Ben', ['Sam', 'Dot'], 3, { so: 'So Ben shut the hatch.' }),
    q('Where did they put the rover?', 'words', 'in its dome', ['at night', 'the lander'], 2, { so: 'So the rover is in its dome.' }),
  ], { story: 'storm' }),
  P('ask', 2, 'Sam', ['The lander came at lunch.', 'It had a big box of mail in it.', 'I put the mail in the mail room.', 'Kit got three letters, and I got one.', 'We opened them after dinner.'], [
    q('When did the lander come?', 'words', 'at lunch', ['after dinner', 'in the mail room'], 0, { so: 'So it came at lunch.' }),
    q('Where did Sam put the mail?', 'words', 'in the mail room', ['in the lander', 'at lunch'], 2, { so: 'So the mail is in the mail room.' }),
    q('Who got three letters?', 'words', 'Kit', ['Sam', 'the lander'], 3, { so: 'So Kit got three letters.' }),
  ], { story: 'mail' }),
  P('ask', 2, 'Ava', ['At night, I went up to the top of the dome.', 'I looked out at the black sky.', 'I could see the Earth over the hills.', 'It was big and blue.'], [
    q('Where did Ava go?', 'words', 'the top of the dome', ['over the hills', 'out at the black sky'], 0, { so: 'So she went to the top of the dome.' }),
    q('What was big and blue?', 'words', 'the Earth', ['the sky', 'the dome'], [2, 3], { so: 'So the Earth was big and blue.' }),
  ]),
  P('ask', 2, 'Ben', ['Kit has a party after dinner.', 'I made a big cake for it after lunch.', 'Jo and Sam put up red and blue flags.', 'Pip the cat ate some of the cake!'], [
    q('Who made the cake?', 'words', 'Ben', ['Kit', 'Jo and Sam'], 1, { so: 'So Ben made the cake.' }),
    q('When is the party?', 'words', 'after dinner', ['after lunch', 'some of the cake'], 0, { so: 'So the party is after dinner.' }),
    q('What did Jo and Sam put up?', 'words', 'flags', ['a cake', 'a party'], 2, { so: 'So they put up flags.' }),
  ], { story: 'party' }),
  P('ask', 2, 'Jo', ['The rover will not go.', 'Dot looked at it in its dome.', 'There was a rock in one wheel.', 'Dot got the rock out with a stick.'], [
    q('What was in the wheel?', 'words', 'a rock', ['a stick', 'Dot'], 2, { so: 'So a rock was in the wheel.' }),
    q('Where did Dot look at the rover?', 'words', 'in its dome', ['in one wheel', 'with a stick'], 1, { so: 'So Dot looked at it in its dome.' }),
  ]),
  P('ask', 2, 'Kit', ['After lunch, Ben and I put a lamp in the green dome.', 'It made the green dome hot.', 'After three days, the seeds came up!', 'Now we have ten little plants.'], [
    q('When did the seeds come up?', 'words', 'after three days', ['after lunch', 'in the green dome'], 2, { so: 'So they came up after three days.' }),
    q('How many plants are there now?', 'words', 'ten', ['three', 'a lamp'], 3, { so: 'So they have ten plants.' }),
    q('What did they put in the green dome?', 'words', 'a lamp', ['ten plants', 'three days'], 0, { so: 'So they put in a lamp.' }),
  ], { story: 'seeds' }),
  P('ask', 2, 'Sam', ['Pip the cat was not at dinner.', 'Kit and I looked in all the domes.', 'Then we went out to the rover.', 'Pip was in the rover, on a hot box!'], [
    q('Where was Pip?', 'words', 'in the rover', ['at dinner', 'in all the domes'], 3, { so: 'So Pip was in the rover.' }),
    q('Who looked for Pip?', 'words', 'Kit and Sam', ['Pip', 'the rover'], 1, { so: 'So Kit and Sam looked.' }),
  ], { story: 'cat' }),
  P('ask', 2, 'Ava', ['Max came to the base in the lander.', 'He came at lunch.', 'He will sleep in the new dome.', 'Max can fix rockets!', 'Jo showed him the base.'], [
    q('Who came in the lander?', 'words', 'Max', ['Jo', 'the base'], 0, { so: 'So Max came.' }),
    q('Where will Max sleep?', 'words', 'in the new dome', ['at lunch', 'in the lander'], 2, { so: 'So he will sleep in the new dome.' }),
    q('What can Max fix?', 'words', 'rockets', ['the base', 'lunch'], 3, { so: 'So Max can fix rockets.' }),
  ], { story: 'max' }),
  P('ask', 2, 'Ben', ['Jo and I went to the ice in the dark crater.', 'We dug up some ice.', 'We put it in the rover.', 'Back at the base, we will make it into water.'], [
    q('Where did they dig up the ice?', 'words', 'in the dark crater', ['in the rover', 'back at the base'], 0, { so: 'So they dug it up in the dark crater.' }),
    q('What will they make the ice into?', 'words', 'water', ['the rover', 'a crater'], 3, { so: 'So the ice will be water.' }),
  ], { story: 'ice' }),
  P('ask', 2, 'Jo', ['Kit and I made lunch for the crew.', 'Kit made a big salad.', 'I made hot muffins.', 'Dot the robot ate a muffin, but robots can not eat!'], [
    q('Who made the salad?', 'words', 'Kit', ['Jo', 'Dot'], 1, { so: 'So Kit made the salad.' }),
    q('What did Jo make?', 'words', 'hot muffins', ['a big salad', 'the crew'], 2, { so: 'So Jo made hot muffins.' }),
    q('Who ate a muffin?', 'words', 'Dot', ['Kit', 'Jo'], 3, { so: 'So Dot ate a muffin.' }),
  ]),
  P('ask', 2, 'Kit', ['After dinner, Jo and I went to the telescope.', 'We looked at a big yellow planet.', 'Then we looked at a red planet.', 'I want to go there one day!'], [
    q('When did they go to the telescope?', 'words', 'after dinner', ['one day', 'a red planet'], 0, { so: 'So they went after dinner.' }),
    q('What did they look at first?', 'words', 'a yellow planet', ['a red planet', 'the telescope'], 1, { so: 'So first they looked at a big yellow planet.' }),
  ]),

  // ---------- Level 3 ----------
  P('ask', 3, 'Ben', ['Kit and I put seeds in pots of dirt.', 'We sprayed them with water.', 'But the seeds did not come up.', 'Dot said it was too cold in the green dome.', 'So we put in a lamp to make it hot.'], [
    q('Why did the seeds not come up?', 'words', 'it was too cold', ['they had no water', 'the pots had no dirt'], 3, { so: 'So the seeds did not come up because it was too cold.' }),
    q('How did they make the green dome hot?', 'words', 'they put in a lamp', ['they sprayed water', 'they put in seeds'], 4, { so: 'So a lamp made it hot.' }),
  ], { story: 'seeds' }),
  P('ask', 3, 'Sam', ['The dust storm came in the night.', 'Dust got in the hatch of the lander.', 'Now the hatch will not shut.', 'Ben fixed it with a brush.', 'He brushed out all the dust.'], [
    q('Why will the hatch not shut?', 'words', 'dust got in it', ['Ben fixed it', 'it was night'], [1, 2], { so: 'So the dust stopped it.' }),
    q('How did Ben fix the hatch?', 'words', 'he brushed out the dust', ['he shut the lander', 'the storm came'], [3, 4], { so: 'So he brushed it out.' }),
  ], { story: 'storm' }),
  P('ask', 3, 'Ava', ['My helmet was all white inside.', 'I could not see out of it.', 'Dot said my suit was too cold.', 'Dot made my suit hot, and now I can see.'], [
    q('Why could Ava not see?', 'words', 'her helmet was white', ['Dot made her suit hot', 'she was in her suit'], [0, 1], { so: 'So she could not see out of her helmet.' }),
    q('How did Dot help Ava?', 'words', 'he made her suit hot', ['he said it was cold', 'he got in her helmet'], 3, { so: 'So Dot made her suit hot.' }),
  ]),
  P('ask', 3, 'Kit', ['Our plants did not look good.', 'Sam said they did not get light.', 'So we put them up on top of the dome.', 'Now they are big and green.'], [
    q('Why did the plants not look good?', 'words', 'they did not get light', ['they are on top of the dome', 'they are big and green'], 1, { so: 'So they did not get light.' }),
    q('How did they help the plants?', 'words', 'put them up on top', ['looked at them', 'said they look good'], 2, { so: 'So they put them up in the light.' }),
  ], { story: 'seeds' }),
  P('ask', 3, 'Ben', ['Jo and I went out in two rovers.', 'My rover was slow, so Jo got to the flag first.', 'I had a big box of rocks in my rover.', 'Next time, I will get the rocks out!'], [
    q('Why was Ben slow?', 'words', 'he had a box of rocks', ['Jo got to the flag', 'he had two rovers'], [1, 2], { so: 'So the box of rocks made him slow.' }),
    q('How will Ben go fast next time?', 'words', 'get the rocks out', ['get a new flag', 'go out with Jo'], 3, { so: 'So he will get the rocks out.' }),
  ]),
  P('ask', 3, 'Jo', ['Pip the cat can not go out on the moon.', 'There is no air out there for a cat.', 'So Dot made Pip a little dome on wheels!', 'Now Pip rides in it in the green dome.'], [
    q('Why can Pip not go out on the moon?', 'words', 'there is no air', ['Dot made a dome', 'she rides in it'], 1, { so: 'So there is no air for a cat.' }),
    q('How does Pip ride?', 'words', 'in a dome on wheels', ['out on the moon', 'with Dot'], [2, 3], { so: 'So she rides in a little dome on wheels.' }),
  ], { story: 'cat' }),
  P('ask', 3, 'Sam', ['The lander came down too fast.', 'It went up, then down, then up!', 'Its legs are made to do it.', 'So no one got hurt.'], [
    q('Why did no one get hurt?', 'words', 'the legs are made for it', ['it came down too fast', 'the lander came down'], [2, 3], { so: 'So the legs kept the crew from getting hurt.' }),
    q('How did the lander come down?', 'words', 'too fast', ['with no legs', 'no one got hurt'], 0, { so: 'So it came down too fast.' }),
  ]),
  P('ask', 3, 'Kit', ['When we came in, our boots had dust on them.', 'Moon dust sticks to suits and boots.', 'So Dot made a dust brush by the hatch.', 'Now we brush our boots when we come in.'], [
    q('Why did Dot make a brush?', 'words', 'dust sticks to boots', ['they came in', 'it is by the hatch'], [1, 2], { so: 'So the dust sticks, and the brush gets it off.' }),
    q('How do they get the dust off?', 'words', 'with a brush', ['they come in', 'by the hatch'], 3, { so: 'So they brush their boots.' }),
  ]),
  P('ask', 3, 'Ben', ['We get water from ice.', 'The rover gets ice from a dark crater.', 'We make the ice hot.', 'Then the ice is water!'], [
    q('How do they make the ice into water?', 'words', 'they make it hot', ['from a dark crater', 'the rover gets it'], [2, 3], { so: 'So they make the ice hot.' }),
    q('Why does the rover go to the crater?', 'words', 'to get ice', ['to make it hot', 'to get dark'], 1, { so: 'So the rover gets ice there.' }),
  ], { story: 'ice' }),
  P('ask', 3, 'Ava', ['Kit was sad at lunch.', 'Her dog is on Earth, and she can not see him.', 'So Jo made a call to Earth.', 'Now Kit is happy, and her dog is too!'], [
    q('Why was Kit sad?', 'words', 'her dog is on Earth', ['Jo made a call to Earth', 'it was lunch'], 1, { so: 'So Kit was sad because her dog is on Earth.' }),
    q('How did Kit get happy?', 'words', 'Jo made a call to Earth', ['her dog is on Earth', 'she had lunch'], [2, 3], { so: 'So Jo made a call, and Kit got happy.' }),
  ]),
] as const;
