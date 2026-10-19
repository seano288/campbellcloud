// Everything Purrdoku says: cheeky, often sarcastic, lines for each cat laid down. tools/make_voice.py records a clip
// for each one (in Purrdoku's own voice), the build fails if one is missing, and say() accepts only these.

/** After each right cat. */
export const CHEERS = [
  // puns
  'Purr-fection!', 'Meow-velous!', 'Paw-some!', "You've got to be kitten me!", 'Right meow!', 'Clawsome!',
  'Unfurgettable!', 'Feline fine!',
  // sarcastic
  'Oh wow. A cat. In a box. Groundbreaking.', 'Congratulations. You did the one thing.', 'Wow. Alert the newspapers.',
  "Oh, look who's a genius now.", 'Sure, that one. Obviously.', "I guess that's correct.", 'Fine. Yes. Correct. Happy?',
  'Wow, you clicked a square. Incredible.', 'Took you long enough.', "Oh, so now you're trying.",
  "Was that skill or luck? Don't answer.", 'Lucky guess. Probably.', "Alright, alright, don't let it go to your head.",
  'Calm down, Einstein.', "Somebody's feeling clever.", "The cat would like you to know he's not impressed. He is, though.",
  "I suppose that'll do.", 'Hold the applause. Actually, no, applaud.', 'Ten points. The points mean nothing.',
  'Mm-hmm. Very nice. Anyway.', "Let's not make a big thing of it.", 'Even a broken clock finds a cat twice a day.',
  // show-off
  'Show-off!', "Okay, now you're just bragging.", 'Is this cheating? It feels like cheating.', 'Who taught you that?!',
  "Somebody's been practising.", "Stop it, you're making the rest of us look bad.", 'Absolute unit!',
  'The cat approves. Reluctantly.', "Even the dog's impressed. And he's not even here.",
  'Five stars from the cat. He gives everyone five stars.',
] as const;

/** Instead of a cheer, on every third right cat in a row on a board. */
export const STREAKS = [
  "Oh great, now you're on a streak. Unbearable.", "Okay, slow down, the cats can't keep up!", "Fine, you're good. We get it.",
  'Combo! The cats are filing a complaint.', "Do you want a trophy? Because there's no trophy.",
] as const;

/** When the last cat solves the board. */
export const WINS = [
  "Every cat's asleep. Shhh! Don't ruin it.", 'Nap time achieved. Took forever, but sure.', "Purr-fect board! Don't get used to it.",
  'The cats would give you a slow blink. That\'s cat for "fine."', "Wow, you finished. The cats are thrilled. Can't you tell?",
] as const;

/** After a wrong cat. */
export const OOPS = [
  'Nope. Bold choice, though.', 'Hiss! The cat says "absolutely not."', 'Interesting strategy. Wrong, but interesting.',
  'Oh no. Anyway.', 'The cat is disappointed. Not surprised, just disappointed.',
] as const;

export const PHRASES = [...CHEERS, ...STREAKS, ...WINS, ...OOPS] as const;
export type Phrase = (typeof PHRASES)[number];
