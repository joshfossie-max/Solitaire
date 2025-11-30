// run-scratch.cjs
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});
require('./src/moves/scratch.ts');
