// Clue Finder: what the letter does not say outright. Level 1: picture answers ("Where is she going?"). Level 2: how someone feels, and
// which sentence tells you. Level 3: what will happen next. An inference's answer is never written in the letter, and nor are its wrong
// ones: they are sensible guesses that the clues rule out (mail.test.ts). Each inference names its clue words, lit one at a time in a
// lesson, and the thinking said after them. A second question about a detail lets a letter come back with a different question.
import { P, q } from './types';

const FEEL = (who: string) => `How does ${who} feel?`;

export const INFER = [
  // ---------- Level 1 ----------
  P('infer', 1, 'Ava', ['Ava put on her suit and her big boots.', 'She got her helmet.'], [
    q('Where is Ava going?', 'pic', 'outside', ['bed', 'dinner'], [0, 1], { clues: ['suit', 'boots', 'helmet'], think: 'You put those on to go outside.' }),
    q('What did Ava get?', 'pic', 'helmet', ['boots', 'suit'], 1, { so: 'So she got her helmet.' }),
  ]),
  P('infer', 1, 'Sam', ['Pip the cat sat by her dish.', 'There was no food in it.', 'Pip looked up at Sam.'], [
    q('What does Pip want?', 'pic', 'catfood', ['ball', 'bed'], [0, 1, 2], { clues: ['dish', 'no food', 'looked up at Sam'], think: 'Her dish has no food in it. Pip wants her dinner.' }),
    q('Where did Pip sit?', 'pic', 'dish', ['Sam', 'food'], 0, { so: 'So she sat by her dish.' }),
  ], { story: 'cat' }),
  P('infer', 1, 'Ben', ['Ben got into his bed.', 'The lights are out.', 'Pip the cat is by him.'], [
    q('What is Ben going to do?', 'pic', 'sleep', ['eat', 'dig'], [0, 1], { clues: ['bed', 'lights are out'], think: 'He is in bed, and the lights are out. He is going to sleep.' }),
    q('Who is by Ben?', 'pic', 'cat', ['bed', 'light'], 2, { so: 'So Pip is by him.' }),
  ], { story: 'cat' }),
  P('infer', 1, 'Kit', ['Kit has dirt on her hands.', 'She has a pot and some seeds.'], [
    q('What is Kit going to do?', 'pic', 'planting', ['cake', 'rover'], [0, 1], { clues: ['dirt', 'pot', 'seeds'], think: 'Dirt, a pot and seeds. She is going to plant them.' }),
    q('What is on her hands?', 'pic', 'dirt', ['pot', 'seeds'], 0, { so: 'So she has dirt on her hands.' }),
  ], { story: 'seeds' }),
  P('infer', 1, 'Jo', ['Jo got out of the water.', 'She is all wet.', 'Pip the cat did not go in!'], [
    q('Where was Jo?', 'pic', 'bath', ['bed', 'rover'], [0, 1], { clues: ['water', 'wet'], think: 'She got out of the water, and she is wet. She was in the bath.' }),
    q('Who did not go in?', 'pic', 'cat', ['water', 'Jo'], 2, { so: 'So Pip did not go in.' }),
  ]),
  P('infer', 1, 'Ava', ['Ava sat down at the table.', 'She has a fork.', 'Ben put a hot dish in front of her.'], [
    q('What will Ava do?', 'pic', 'eat', ['sleep', 'dig'], [0, 1, 2], { clues: ['table', 'fork', 'hot dish'], think: 'A table, a fork and a hot dish. She is going to eat.' }),
    q('What does Ava have?', 'pic', 'fork', ['table', 'Ben'], 1, { so: 'So she has a fork.' }),
  ]),
  P('infer', 1, 'Ben', ['Pip the cat ran under the bed.', 'She does not like the loud rocket.'], [
    q('How does Pip feel?', 'pic', 'scared', ['happy', 'sleepy'], [0, 1], { clues: ['ran under the bed', 'does not like the loud rocket'], think: 'She ran and hid from the loud rocket. Pip is scared.' }),
    q('Where did Pip go?', 'pic', 'bed', ['rocket', 'Ben'], 0, { so: 'So she went under the bed.' }),
  ], { story: 'cat' }),
  P('infer', 1, 'Sam', ['The base is dark.', 'The crew is in bed.', 'Pip the cat is in her bed too.'], [
    q('When is it?', 'pic', 'night', ['lunch', 'sunny'], [0, 1, 2], { clues: ['dark', 'in bed'], think: 'It is dark, and they are all in bed. It is night.' }),
    q('Where is the crew?', 'pic', 'bed', ['cat', 'rover'], 1, { so: 'So the crew is in bed.' }),
  ]),
  P('infer', 1, 'Jo', ['Dot has a can of paint and a brush.', 'He is looking at the rover.'], [
    q('What will Dot do?', 'pic', 'painting', ['sleep', 'eat'], [0, 1], { clues: ['paint', 'brush', 'rover'], think: 'Paint, a brush and the rover. Dot is going to paint the rover.' }),
    q('What is Dot looking at?', 'pic', 'rover', ['paint', 'brush'], 1, { so: 'So he is looking at the rover.' }),
  ]),

  // ---------- Level 2 ----------
  P('infer', 2, 'Kit', ['Kit looked in the rover for her mitten.', 'It was under a box.', 'Kit jumped up and down.'], [
    q(FEEL('Kit'), 'words', 'happy', ['sad', 'mad'], [1, 2], { clues: ['under a box', 'jumped up and down'], think: 'She found it, and she jumped up and down. Kit is happy.' }),
    q('Which sentence tells you how Kit feels?', 'line', '2', ['0', '1'], 2, { clues: ['jumped up and down'], think: 'You jump up and down when you are happy.' }),
  ], { story: 'mitten' }),
  P('infer', 2, 'Sam', ['The lander came with the mail.', 'There was no letter for Sam.', 'Sam sat in his room and did not eat dinner.'], [
    q(FEEL('Sam'), 'words', 'sad', ['happy', 'silly'], [1, 2], { clues: ['no letter', 'did not eat dinner'], think: 'He got no letter, and he did not eat. Sam is sad.' }),
    q('Which sentence tells you how Sam feels?', 'line', '2', ['0', '1'], 2, { clues: ['did not eat dinner'], think: 'He sat in his room and did not eat. That is what you do when you are sad.' }),
  ], { story: 'mail' }),
  P('infer', 2, 'Jo', ['Jo saw a lander come down.', 'Her dad was in it.', 'Jo ran to hug him.'], [
    q(FEEL('Jo'), 'words', 'happy', ['sad', 'scared'], [1, 2], { clues: ['Her dad was in it', 'ran to hug him'], think: 'Her dad came, and she ran to hug him. Jo is happy.' }),
    q('Which sentence tells you how Jo feels?', 'line', '2', ['0', '1'], 2, { clues: ['ran to hug him'], think: 'You run to hug someone when you are happy to see them.' }),
  ]),
  P('infer', 2, 'Kit', ['Ben sprayed the seeds with water.', 'At last, they came up!', 'Kit said, "Thank you, Ben!"'], [
    q(FEEL('Kit'), 'words', 'thankful', ['mad', 'tired'], [0, 2], { clues: ['sprayed the seeds', 'Thank you, Ben'], think: 'Ben sprayed her seeds, and she said thank you. Kit is thankful.' }),
    q('Which sentence tells you how Kit feels?', 'line', '2', ['0', '1'], 2, { clues: ['Thank you'], think: 'You say thank you when you are thankful.' }),
  ], { story: 'seeds' }),
  P('infer', 2, 'Ava', ['Ava was out on the moon.', 'A dust storm came, and she could not see the base!', 'She called Dot to come and help.'], [
    q(FEEL('Ava'), 'words', 'scared', ['happy', 'silly'], [1, 2], { clues: ['could not see the base', 'come and help'], think: 'She could not see the base, and she called for help. Ava is scared.' }),
    q('Who did Ava call?', 'words', 'Dot', ['the base', 'a dust storm'], 2, { so: 'So she called Dot.' }),
  ], { story: 'storm' }),
  P('infer', 2, 'Ben', ['Ben fixed the rover all day.', 'His arms hurt.', 'He went to bed right after dinner.'], [
    q(FEEL('Ben'), 'words', 'tired', ['silly', 'scared'], [0, 1, 2], { clues: ['all day', 'arms hurt', 'went to bed'], think: 'He worked all day, and he went to bed early. Ben is tired.' }),
    q('What did Ben fix?', 'words', 'the rover', ['his arms', 'dinner'], 0, { so: 'So he fixed the rover.' }),
  ]),
  P('infer', 2, 'Kit', ['Kit made a dust man.', 'Pip the cat jumped on it, and it came down.', 'Kit said, "Pip, it was my dust man!"'], [
    q(FEEL('Kit'), 'words', 'mad', ['happy', 'tired'], [1, 2], { clues: ['came down', 'it was my dust man'], think: 'Pip knocked it down, and Kit said so. Kit is mad.' }),
    q('Which sentence tells you how Kit feels?', 'line', '2', ['0', '1'], 2, { clues: ['it was my dust man'], think: 'She tells Pip off. She is mad.' }),
  ], { story: 'dustman' }),
  P('infer', 2, 'Jo', ['Dot put a pot on his head like a hat.', 'Then he hopped like a frog.', 'The crew could not stop laughing.'], [
    q('How does the crew feel?', 'words', 'happy', ['sad', 'scared'], [1, 2], { clues: ['could not stop laughing'], think: 'They could not stop laughing. The crew is happy.' }),
    q('Which sentence tells you how the crew feels?', 'line', '2', ['0', '1'], 2, { clues: ['laughing'], think: 'You laugh when you are happy.' }),
  ]),
  P('infer', 2, 'Ava', ['Ava looked out at the Earth.', 'Her mom and dad are there.', 'She has not seen them in a long time.'], [
    q(FEEL('Ava'), 'words', 'sad', ['mad', 'silly'], [1, 2], { clues: ['mom and dad', 'not seen them in a long time'], think: 'She has not seen her mom and dad for a long time. Ava is sad.' }),
    q('Who is on the Earth?', 'words', 'mom and dad', ['Ava', 'the moon'], 1, { so: 'So her mom and dad are there.' }),
  ]),

  // ---------- Level 3 ----------
  P('infer', 3, 'Sam', ['Pip likes to nap in hot spots.', 'The rover was in the sun all day.', 'Now the rover is hot.'], [
    q('What will Pip do next?', 'words', 'nap in the rover', ['play in the dust', 'go to the cold ice'], [0, 2], { clues: ['nap in hot spots', 'the rover is hot'], think: 'Pip likes hot spots, and the rover is hot.' }),
    q('Where was the rover all day?', 'words', 'in the sun', ['in its dome', 'with Pip'], 1, { so: 'So it was in the sun.' }),
  ], { story: 'cat' }),
  P('infer', 3, 'Kit', ['The plants are big now.', 'Little red peppers are on them.', 'Jo got a basket and went to the green dome.'], [
    q('What will Jo do next?', 'words', 'get the peppers', ['plant seeds', 'make a fire'], [1, 2], { clues: ['peppers are on them', 'basket'], think: 'The peppers are ready, and Jo has a basket for them.' }),
    q('What did Jo get?', 'words', 'a basket', ['the peppers', 'the plants'], 2, { so: 'So she got a basket.' }),
  ], { story: 'seeds' }),
  P('infer', 3, 'Sam', ['A dust storm is coming.', 'Jo is out in the rover.', 'Dot called Jo to come back.'], [
    q('What will Jo do next?', 'words', 'go back to the base', ['go to the crater', 'play in the dust'], [0, 2], { clues: ['dust storm is coming', 'come back'], think: 'A storm is coming, and Dot called her back.' }),
    q('Who called Jo?', 'words', 'Dot', ['the rover', 'a storm'], 2, { so: 'So Dot called her.' }),
  ], { story: 'storm' }),
  P('infer', 3, 'Ava', ['The sun went down.', 'Ava had her dinner.', 'Now she is in bed.'], [
    q('What will Ava do next?', 'words', 'go to sleep', ['have lunch', 'go out in the rover'], [0, 2], { clues: ['sun went down', 'in bed'], think: 'It is night, and she is in bed.' }),
    q('What did Ava have?', 'words', 'dinner', ['the sun', 'a bed'], 1, { so: 'So she had her dinner.' }),
  ]),
  P('infer', 3, 'Ben', ['Pip the cat likes to play with balls.', 'Ben kicked a red ball to her.'], [
    q('What will Pip do next?', 'words', 'run after the ball', ['have a nap', 'go in the lander'], [0, 1], { clues: ['likes to play with balls', 'kicked a red ball to her'], think: 'Pip likes balls, and one is coming to her.' }),
    q('What did Ben kick?', 'words', 'a red ball', ['Pip', 'a rock'], 1, { so: 'So he kicked a red ball.' }),
  ], { story: 'cat' }),
  P('infer', 3, 'Jo', ['Jo put the cake on the table.', 'The crew sat down at the table.', 'They all have forks.'], [
    q('What will the crew do next?', 'words', 'eat the cake', ['paint the cake', 'go to bed'], [0, 2], { clues: ['cake on the table', 'forks'], think: 'The cake is on the table, and they have forks.' }),
    q('Where is the cake?', 'words', 'on the table', ['with the forks', 'in a box'], 0, { so: 'So it is on the table.' }),
  ], { story: 'party' }),
  P('infer', 3, 'Sam', ['Sam made a kite.', 'He wants to fly it on the moon.', 'But there is no air on the moon.'], [
    q('What will happen next?', 'words', 'the kite will not fly', ['the kite will go up', 'the kite will get wet'], [1, 2], { clues: ['no air'], think: 'A kite needs air to fly, and there is no air on the moon.' }),
    q('What did Sam make?', 'words', 'a kite', ['the moon', 'air'], 0, { so: 'So Sam made a kite.' }),
  ]),
  P('infer', 3, 'Kit', ['The plants have had no water.', 'Kit got a can of water.'], [
    q('What will Kit do next?', 'words', 'spray the plants', ['paint the dome', 'eat the plants'], [0, 1], { clues: ['no water', 'can of water'], think: 'The plants need water, and she has some.' }),
    q('What did Kit get?', 'words', 'a can of water', ['the plants', 'no water'], 1, { so: 'So she got a can of water.' }),
  ], { story: 'seeds' }),
  P('infer', 3, 'Ben', ['Ben put rock on rock on rock.', 'It went up and up.', 'Then Pip the cat jumped on it!'], [
    q('What will happen next?', 'words', 'the rocks will come down', ['the rocks will go up', 'Pip will eat the rocks'], [1, 2], { clues: ['up and up', 'jumped on it'], think: 'It is a tall pile, and a cat just jumped on it.' }),
    q('Who jumped on the rocks?', 'words', 'Pip', ['Ben', 'a rock'], 2, { so: 'So Pip jumped on them.' }),
  ], { story: 'cat' }),
] as const;
