// Every Aircraft's spec, by id.
import type { JetId } from '../catalog';
import type { JetSpec } from '../three/spec';
import { a10 } from './a10';
import { a4 } from './a4';
import { av8b } from './av8b';
import { f117 } from './f117';
import { f14 } from './f14';
import { f15 } from './f15';
import { f16 } from './f16';
import { f18 } from './f18';
import { f20 } from './f20';
import { f22 } from './f22';
import { f35 } from './f35';
import { f4 } from './f4';
import { f4u } from './f4u';
import { p38 } from './p38';
import { p51 } from './p51';
import { sr71 } from './sr71';
import { v22 } from './v22';
import { x29 } from './x29';

export const JETS: Record<JetId, JetSpec> = { p51, f16, f18, f4u, p38, a4, a10, f4, f14, f15, f20, av8b, v22, f117, x29, f35, f22, sr71 };
