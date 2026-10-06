import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
async function loadSource(path, mocks = {}, extra = '') {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    name => name in mocks ? mocks[name] : require(name), module, module.exports,
  );
  return module.exports;
}
const { Reports } = await loadSource('app/admin/AdminClient.tsx', { 'next/link': () => null }, '\nexport { Reports };');
function render(manage) {
  return renderToStaticMarkup(React.createElement(Reports, {
    workspace: null, overview: null, manage, openModal() {}, remove() {},
  }));
}

test('Intelligence renders for a platform administrator without workspace membership', async () => {
  const daily = [{ day: '2026-09-24', responses: 7, trusted: 7 }];
  const channels = [{ channel: 'email', responses: 7, links: 1, opens: 10 }];
  const route = await loadSource('app/api/admin/manage/route.ts', {
    'cloudflare:workers': { env: { DB: { prepare(sql) {
      return {
        bind() { return this; },
        async first() { return sql.includes('platform_admins') ? { role: 'admin' } : null; },
        async all() { return { results: sql.includes('GROUP BY day') ? daily : sql.includes('GROUP BY channel') ? channels : [] }; },
      };
    } } } },
    '../../../chatgpt-auth': { getChatGPTUser: async () => ({ email: 'admin@example.com' }) },
    '../../../lib/contact-vault': {},
  });
  const response = await route.GET(new Request('https://pollrr.ai/api/admin/manage'));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.analytics, { daily, channels });
  assert.deepEqual(data.reports, []);
  const html = render(data);
  assert.match(html, /2026-09-24: 7/);
  assert.match(html, /email/);
  assert.match(html, /Saved reports/);
});

test('Intelligence tolerates loading and older platform responses without analytics', () => {
  for (const data of [null, { platform: true, organizations: [], platformPolls: [] }, { analytics: {}, reports: [] }]) {
    assert.match(render(data), /No responses in this period/);
  }
});
