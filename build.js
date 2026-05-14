import { build } from 'esbuild';
import { chmodSync } from 'node:fs';

await build({
  entryPoints: ['bin/localrun.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/localrun.js',
  packages: 'external',
  loader: { '.jsx': 'jsx' },
});

chmodSync('dist/localrun.js', 0o755);
console.log('Built dist/localrun.js');
