import { build } from 'vite';
import { staticBuild } from '../static-build';
import { clockGarageBuild, clockRepeatBuild, moneyRepeatBuild } from './builds';

for (const selection of [clockRepeatBuild, clockGarageBuild, moneyRepeatBuild]) {
  await build(staticBuild<string>(selection));
}
