import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const compile = async (name: string) => (await transform(await readFile(new URL(name, import.meta.url), 'utf8'), {
  loader: 'ts', format: 'cjs', target: 'es2022', minifyWhitespace: true, legalComments: 'none',
})).code;
const [model, view, shell] = await Promise.all([
  compile('model.ts'), compile('view.ts'), readFile(new URL('shell.template.html', import.meta.url), 'utf8'),
]);
const html = shell
  .replace('{{MODEL}}', () => `const model = (() => { const module = { exports: {} };\n${model}\nreturn module.exports; })();`)
  .replace('{{VIEW}}', () => `(() => { const module = { exports: {} }; const require = () => model;\n${view}\n})();`);
await writeFile(new URL('swap-prototype.html', import.meta.url), html);
console.log('Built self-contained swap-prototype.html');
