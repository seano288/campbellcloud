// The facts tables are checked here for the ambiguities the brief names: one clear home, plainly wrong choices, no penguin beside a
// polar bear, no trick animals in the questions their trick touches, a picture for every animal, and no two choices that could both
// be right. The facts themselves are reviewed by a person (.scratch/wild-rescue/research/first-grade-science.md).
import { describe, expect, it } from 'vitest';
import { DRAWN } from '../art/drawn';
import { diagramParts } from '../art/Diagram';
import { animal, ANIMALS, arguable, HOMED, notWrongFor, poleOf, RESCUABLE, trickOf, type AnimalId } from './animals';
import { BABIES, DIFFERENT_NEVER, DIFFERENT_TRUE, SAME_ALWAYS, SAME_DIFFERENT, SAME_NEVER, SENTENCE_ICONS } from './babies';
import { HABITAT_IDS, HABITATS, VERY_DIFFERENT } from './habitats';
import { LIVING, NEED_ASKS, NEEDS, NOT_LIVING, SCENES } from './living';
import { ALSO_USES, DIAGRAMS, JOBS, WHYS } from './parts';
import { AFTER_Q, BEFORE, SEASON_IDS, WEAR, WEATHER, WEATHER_ASKED } from './sky';

const words = (s: string) => s.split(/\s+/).length;
const pictureOf = (id: AnimalId) => { const a = animal(id).art; return 'emoji' in a ? a.emoji : `drawn:${a.drawn}`; };

describe('the animals table', () => {
  it('gives every animal one picture, its own, and draws the ones that are not emoji', () => {
    const pics = ANIMALS.map(a => pictureOf(a.id));
    expect(new Set(pics).size).toBe(ANIMALS.length);
    for (const a of ANIMALS) if ('drawn' in a.art) expect(DRAWN[a.art.drawn], a.id).toBeTruthy();
    // the table the brief asks for: which are emoji and which are drawn
    const drawn = ANIMALS.filter(a => 'drawn' in a.art).map(a => a.id).sort();
    expect(drawn).toEqual(['arcticfox', 'dragonfly', 'fennec', 'ostrich', 'meerkat', 'rattlesnake', 'roadrunner', 'seaturtle', 'snowyowl', 'tortoise', 'walrus', 'woodpecker'].sort());
  });
  it('has unique ids and names, and "An" only before a vowel sound', () => {
    expect(new Set(ANIMALS.map(a => a.id)).size).toBe(ANIMALS.length);
    expect(new Set(ANIMALS.map(a => a.name)).size).toBe(ANIMALS.length);
    for (const a of ANIMALS) expect(a.a === 'An', a.name).toBe(/^[aeiou]/.test(a.name));
  });
  it('never lists an animal\'s own home as somewhere it only also lives', () => {
    for (const a of ANIMALS) {
      expect(notWrongFor(a).includes(a.home as never), a.id).toBe(false);
      for (const h of notWrongFor(a)) expect(HABITAT_IDS).toContain(h);
    }
  });
  it('keeps polar animals on their own side of the Earth: penguins south, the rest north, and only polar animals have a pole', () => {
    for (const a of ANIMALS) expect(poleOf(a) !== null, a.id).toBe(a.home === 'polar');
    expect(ANIMALS.filter(a => poleOf(a) === 'south').map(a => a.id)).toEqual(['penguin']);
    expect(poleOf(animal('polarbear'))).toBe('north');
  });
  it('has 45 animals to rescue, every one with a clear home, a call and a job, from every habitat', () => {
    expect(RESCUABLE).toHaveLength(45);
    for (const a of RESCUABLE) {
      expect(a.home, a.id).not.toBeNull();
      expect(a.rescue.call.toLowerCase(), a.id).toContain(a.name.split(' ').at(-1)!);
      expect(a.rescue.call.endsWith('!')).toBe(true);
    }
    for (const h of HABITAT_IDS) expect(RESCUABLE.filter(a => a.home === h).length, h).toBeGreaterThanOrEqual(5);
    for (const job of ['pull', 'lift', 'lead']) expect(RESCUABLE.some(a => a.rescue.job === job)).toBe(true);
  });
  it('keeps every "did you know" short, about that animal, and one sentence', () => {
    for (const a of HOMED) {
      expect(words(a.fact), a.fact).toBeLessThanOrEqual(13);
      expect(a.fact.toLowerCase(), a.id).toContain(a.name.split(' ').at(-1)!.slice(0, 3));
      expect((a.fact.match(/[.!?]/g) ?? []).length, a.fact).toBe(1);
    }
  });
  it('leaves animals that live all over out of the habitats', () => {
    for (const id of ['owl', 'rabbit', 'snail', 'eagle', 'cat', 'dog', 'duck', 'butterfly', 'snake'] as const) expect(animal(id).home, id).toBeNull();
  });
});

describe('the habitats', () => {
  it('pairs only habitats that are very different, both ways round', () => {
    for (const h of HABITAT_IDS) for (const o of VERY_DIFFERENT[h]) expect(VERY_DIFFERENT[o], `${h}/${o}`).toContain(h);
  });
  it('can ask Level 1 about every animal with a home, with a very different habitat that is plainly wrong for it', () => {
    for (const a of HOMED) expect(VERY_DIFFERENT[a.home].filter(h => !arguable(a, h)).length, a.id).toBeGreaterThan(0);
  });
  it('words each habitat the same way everywhere', () => {
    expect(HABITATS.map(h => h.id)).toEqual([...HABITAT_IDS]);
    for (const h of HABITATS) { expect(h.about.endsWith('.')).toBe(true); expect(h.lives).toMatch(/^(in|on) /); }
  });
});

describe('Animal Parts', () => {
  it('draws every part a diagram asks about, as its own tap target', () => {
    for (const d of DIAGRAMS) {
      expect(diagramParts(d.animal).sort(), d.animal).toEqual([...d.parts].sort());
      for (const a of d.asks) expect(d.parts as readonly string[]).toContain(a.part);
      // two questions on one diagram never share an answer, so a lesson about a wrong part is about another question
      expect(new Set(d.asks.map(a => a.part)).size).toBe(d.asks.length);
    }
  });
  it('offers wrong jobs that are not the right one, and never "To fly." for a bird that cannot', () => {
    for (const w of WHYS) {
      expect(w.wrong.length).toBeGreaterThanOrEqual(2);
      expect(w.wrong as readonly string[]).not.toContain(w.right);
      for (const j of [w.right, ...w.wrong]) expect(JOBS[j]).toBeTruthy();
      if (trickOf(animal(w.animal)) === 'cannot-fly') expect(w.wrong as readonly string[]).not.toContain('fly');
      expect(w.lesson.toLowerCase()).toContain(animal(w.animal).name.split(' ').at(-1)!);
    }
    // the elephant's trunk is a snorkel too, the fennec fox hears with its ears and the rabbit's ears cool it: never offered as wrong
    expect(WHYS.find(w => w.animal === 'elephant')!.wrong as readonly string[]).not.toContain('breathe');
    expect(WHYS.find(w => w.animal === 'fennec')!.wrong as readonly string[]).not.toContain('hear');
    expect(WHYS.find(w => w.animal === 'rabbit')!.wrong as readonly string[]).not.toContain('cool');
    expect(new Set(WHYS.map(w => w.q)).size).toBe(WHYS.length);
  });
  it('keeps bats, whales, dolphins, penguins and ostriches out of "which animal also" questions', () => {
    for (const u of ALSO_USES) {
      expect(u.wrong as readonly string[]).not.toContain(u.right);
      expect(u.shown).not.toBe(u.right);
      for (const id of [u.shown, u.right, ...u.wrong]) expect(['whale', 'dolphin', 'penguin', 'ostrich'], id).not.toContain(id);
    }
  });
});

describe('Alive or Not', () => {
  it('never mixes living and not living things, or repeats a picture', () => {
    const ids = [...LIVING, ...NOT_LIVING].map(t => t.id), icons = [...LIVING, ...NOT_LIVING].map(t => t.icon);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(icons).size).toBe(icons.length);
    for (const t of NOT_LIVING) expect(t.line).toContain('not living');
    for (const t of LIVING) expect(t.line).not.toContain('not');
  });
  it('asks what a plant needs without food, soil or shelter, and what an animal needs without sunlight', () => {
    const plant = [...NEED_ASKS.plant.right, ...NEED_ASKS.plant.wrong] as string[], beast = [...NEED_ASKS.animal.right, ...NEED_ASKS.animal.wrong] as string[];
    for (const no of ['food', 'shelter', 'soil']) expect(plant).not.toContain(no);
    expect(beast).not.toContain('sun');
    expect(NEED_ASKS.plant.right).toEqual(['sun', 'water', 'air']);
    expect(NEED_ASKS.animal.right).toEqual(['food', 'water', 'air', 'shelter']);
    for (const ask of Object.values(NEED_ASKS)) for (const w of ask.wrong) expect(ask.right as readonly string[]).not.toContain(w);
  });
  it('has one missing need in each scene, and the wrong choices are either there in the picture or needed by nothing', () => {
    for (const s of SCENES) {
      expect(s.wrong as readonly string[]).not.toContain(s.right);
      const nothing = ['candy', 'toys', 'tv', 'shoes', 'sunglasses'];
      expect(s.wrong.filter(w => nothing.includes(w))).toHaveLength(1);
      for (const w of s.wrong) expect(NEEDS[w]).toBeTruthy();
    }
  });
});

describe('Babies', () => {
  it('gives each baby name one parent, so "This is a calf" has one answer', () => {
    expect(new Set(BABIES.map(b => b.baby)).size).toBe(BABIES.length);
    for (const b of BABIES) {
      expect(b.wrong as readonly string[]).not.toContain(b.parent);
      expect(b.wrong.length).toBeGreaterThanOrEqual(2);
      // no wrong parent has a baby by the same name somewhere else in the table
      for (const w of b.wrong) expect(BABIES.filter(x => x.parent === w).map(x => x.baby), `${b.baby}/${w}`).not.toContain(b.baby);
    }
  });
  it('draws the babies that look different and their middle step; the ones that look alike are their parent, small', () => {
    for (const b of BABIES) {
      if (b.alike) expect('art' in b).toBe(false);
      else { expect(DRAWN[(b as { art: string }).art], b.baby).toBeTruthy(); expect(DRAWN[(b as { middle: string }).middle], b.baby).toBeTruthy(); }
    }
    expect(BABIES.filter(b => !b.alike).map(b => b.baby)).toEqual(['tadpole', 'caterpillar', 'chick', 'cygnet']);
  });
  it('asks "the same / different" only of furry four-legged pairs, where the true and false sentences hold for every one', () => {
    for (const p of SAME_DIFFERENT) {
      const b = BABIES.find(x => x.baby === p.baby)!;
      expect(b.alike).toBe(true);
      expect(['cat', 'dog', 'sheep', 'horse', 'cow', 'lion', 'pig']).toContain(b.parent);
      for (const t of p.alsoTrue) expect(SAME_NEVER as readonly string[]).not.toContain(t);
    }
    for (const s of [SAME_ALWAYS, ...SAME_NEVER, ...DIFFERENT_TRUE, ...DIFFERENT_NEVER, ...SAME_DIFFERENT.flatMap(p => p.alsoTrue)]) expect(SENTENCE_ICONS[s], s).toBeTruthy();
  });
});

describe('Sky and Seasons', () => {
  it('never asks for the cloudy picture, which rainy and snowy pictures also are', () => {
    expect(WEATHER_ASKED as readonly string[]).not.toContain('cloudy');
    expect(WEATHER.cloudy.q).toBeNull();
  });
  it('goes round the year in order', () => {
    for (const s of SEASON_IDS) expect(BEFORE[s]).toBe(SEASON_IDS[(SEASON_IDS.indexOf(s) + 3) % 4]);
    expect(AFTER_Q.spring).toBe('What season comes after winter?');
  });
  it('dresses for the weather with no right answer offered as wrong', () => {
    for (const w of Object.values(WEAR)) for (const x of w.wrong) expect(w.right as readonly string[]).not.toContain(x);
  });
});
