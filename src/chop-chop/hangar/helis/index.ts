// Every Helicopter's spec, by id.
import type { HeliId } from '../catalog';
import type { HeliSpec } from '../three/spec';
import { ah1 } from './ah1';
import { ah64 } from './ah64';
import { airwolf } from './airwolf';
import { b360 } from './b360';
import { blue } from './blue';
import { ch47 } from './ch47';
import { ch53 } from './ch53';
import { ka52 } from './ka52';
import { lynx } from './lynx';
import { mh6 } from './mh6';
import { mi24 } from './mi24';
import { mi26 } from './mi26';
import { rah66 } from './rah66';
import { raider } from './raider';
import { tiger } from './tiger';
import { uh1 } from './uh1';
import { uh60 } from './uh60';

export const HELIS: Record<HeliId, HeliSpec> = { uh60, mh6, ah1, uh1, lynx, tiger, ah64, mi24, ka52, ch47, ch53, mi26, rah66, b360, raider, blue, airwolf };
