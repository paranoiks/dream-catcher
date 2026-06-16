// Bundle each Lambda handler to dist/<name>/index.js (CJS). The AWS SDK v3 is
// provided by the nodejs20.x runtime, so it's left external; jose is bundled.
import { build } from 'esbuild';

const handlers = [
  { name: 'social', entry: 'src/handlers/social.ts' },
  { name: 'email-auth', entry: 'src/handlers/email-auth.ts' },
  { name: 'custom-auth', entry: 'src/handlers/custom-auth.ts' },
];

await Promise.all(
  handlers.map((h) =>
    build({
      entryPoints: [h.entry],
      outfile: `dist/${h.name}/index.js`,
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      sourcemap: false,
      minify: true,
      external: ['@aws-sdk/*'],
    }),
  ),
);

console.log('built:', handlers.map((h) => h.name).join(', '));
