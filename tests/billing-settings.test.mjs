import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
async function load(path, mocks, extra = '') {
  const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source + extra, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
  } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
async function setup() {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0016_billing_vault.sql', '0017_billing_publishable_keys.sql'])
    db.exec(await readFile(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  db.exec("INSERT INTO billing_credentials (mode,api_key_ciphertext,publishable_key_ciphertext,webhook_secret_ciphertext,updated_at) VALUES ('test','original-test-key','original-test-publishable','original-test-webhook',1),('live','original-live-key',NULL,NULL,1)");
  const route = await load('app/api/admin/billing/route.ts', {
    'cloudflare:workers': { env: { DB: {
      prepare(sql) { return { bind(...args) { return { sql, args, first: async () => ({role:'admin'}) }; } }; },
      async batch(statements) {
        db.exec('BEGIN');
        try { for(const {sql,args} of statements) db.prepare(sql).run(...args); db.exec('COMMIT'); }
        catch(error) { db.exec('ROLLBACK'); throw error; }
      },
    } } },
    '../../../chatgpt-auth': { getChatGPTUser: async () => ({ email:'admin@example.com' }) },
    '../../../lib/billing-config': {
      encryptBillingSecret: async value => `encrypted:${value}`,
      stripeConfig: async () => { throw Error('Must not read/decrypt untouched settings'); },
    },
  });
  return { db, post: body => route.POST(new Request('https://pollrr.ai/api/admin/billing', {method:'POST',body:JSON.stringify(body)})) };
}
test('saving live leaves every test field and unchanged live field byte-for-byte intact', async () => {
  const {db,post}=await setup();
  const before=db.prepare("SELECT * FROM billing_credentials WHERE mode='test'").get();
  assert.equal((await post({livePublishableKey:'pk_live_new',testApiKey:'  '})).status,200);
  assert.deepEqual(db.prepare("SELECT * FROM billing_credentials WHERE mode='test'").get(),before);
  const live=db.prepare("SELECT * FROM billing_credentials WHERE mode='live'").get();
  assert.equal(live.api_key_ciphertext,'original-live-key');
  assert.equal(live.publishable_key_ciphertext,'encrypted:pk_live_new');
  db.close();
});
test('invalid live input does not partially save valid test input',async()=>{
  const {db,post}=await setup();
  assert.equal((await post({testApiKey:'sk_test_new',liveApiKey:'sk_test_wrong_mode'})).status,400);
  assert.equal(db.prepare("SELECT api_key_ciphertext FROM billing_credentials WHERE mode='test'").get().api_key_ciphertext,'original-test-key');
  db.close();
});
test('blank settings are a no-op and both environments can be updated together',async()=>{
  const {db,post}=await setup();
  const before=db.prepare('SELECT * FROM billing_credentials ORDER BY mode').all();
  await post({testApiKey:'',liveApiKey:''});
  assert.deepEqual(db.prepare('SELECT * FROM billing_credentials ORDER BY mode').all(),before);
  await post({testApiKey:'rk_test_new',liveApiKey:'rk_live_new'});
  assert.deepEqual(db.prepare('SELECT api_key_ciphertext FROM billing_credentials ORDER BY mode').all().map(r=>r.api_key_ciphertext),['encrypted:rk_live_new','encrypted:rk_test_new']);
  db.close();
});
test('empty credential inputs show saved status without disclosing stored values',async()=>{
  const {BillingFields}=await load('app/admin/AdminClient.tsx',{'next/link':()=>null},'\nexport { BillingFields };');
  const html=renderToStaticMarkup(React.createElement(BillingFields,{mode:'test',values:{},set(){},ready:{apiKey:true,publishableKey:true,webhook:false}}));
  assert.equal((html.match(/Saved securely/g)||[]).length,2);
  assert.match(html,/Not configured/);
  assert.doesNotMatch(html,/original-test-key/);
});
