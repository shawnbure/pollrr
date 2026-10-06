import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
test('creator cookies reject unsigned, modified, and cross-secret identities', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pollrr-cookie-'));
  const output = join(directory, 'cookie.mjs');
  globalThis.__pollrrCookieTestEnv = { CREATOR_SESSION_SECRET: crypto.randomUUID() + crypto.randomUUID() };
  try {
    await build({ entryPoints: ['app/lib/creator-cookie.ts'], outfile: output, bundle: true, format: 'esm', platform: 'node', plugins: [{ name: 'test-bindings', setup(builder) {
      builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: 'binding', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const env = globalThis.__pollrrCookieTestEnv;' }));
    } }] });
    const { signCreatorId, verifyCreatorId } = await import(pathToFileURL(output));
    const id = crypto.randomUUID();
    const signed = await signCreatorId(id);
    assert.equal(await verifyCreatorId(signed), id);
    assert.equal(await verifyCreatorId(id), null);
    assert.equal(await verifyCreatorId(signed.replace(id, crypto.randomUUID())), null);
    assert.equal(await verifyCreatorId(signed + '.extra'), null);
    globalThis.__pollrrCookieTestEnv.CREATOR_SESSION_SECRET = crypto.randomUUID() + crypto.randomUUID();
    assert.equal(await verifyCreatorId(signed), null);
    globalThis.__pollrrCookieTestEnv.CREATOR_SESSION_SECRET = '';
    await assert.rejects(signCreatorId(id), /CREATOR_SESSION_SECRET/);
  } finally { delete globalThis.__pollrrCookieTestEnv; await rm(directory, { recursive: true, force: true }); }
});
