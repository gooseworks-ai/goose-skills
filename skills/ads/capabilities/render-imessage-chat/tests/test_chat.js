// Browser regressions for configurable identity, hardware placement and reveals.
// Run: node --test tests/test_chat.js (Playwright Chromium, no network or paid API).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('node:module').createRequire(require.resolve('../scripts/record-chat'))('playwright');
const { buildDocument, buildTimeline, validateThread, checkLayout } = require('../scripts/record-chat');
const fixture = () => ({ mode:'dm', header:{style:'conversation',unread:0}, participants:[
  {id:'me',self:true,name:'Me'}, {id:'peer',name:'Zoë Chen'},
], messages:[
  {id:'typing',type:'typing',from:'peer'}, {id:'ask',type:'text',from:'peer',text:'got a link? 👀'},
  {id:'reply',type:'text',from:'me',text:'yes! 👨‍👩‍👧‍👦 right here',delivered:true},
] });

test('missing names, duplicate IDs and invalid typing fail before rendering', () => {
  let t=fixture(); t.participants[1].name=''; assert.throws(()=>validateThread(t),/name for peer/);
  t=fixture(); t.messages[2].id='ask'; assert.throws(()=>validateThread(t),/unique id/);
  t=fixture(); t.messages[0].from='me'; assert.throws(()=>validateThread(t),/received message/);
  t=fixture(); t.messages[1].from='unknown'; assert.throws(()=>validateThread(t),/same participant/);
});

test('configuration changes the header name and initial, without a demo identity', async () => {
  for (const name of ['Akhil','Maya','Zoë Chen']) {
    const t=fixture(); t.participants[1].name=name;
    const {html}=buildDocument({thread:t},__dirname);
    assert.ok(html.includes(name)); assert.ok(!html.includes('Rachel')); assert.ok(!html.includes('Sam'));
    assert.ok(!html.includes('badge-pill">0'));
  }
});

test('frame bounds, island inset, light chrome, typing and newest messages', async () => {
  const browser=await chromium.launch({timeout:15000});
  try {
    for (const theme of ['dark','light']) for (const [width,height] of [[1080,1920],[750,1624]]) {
      const t=fixture();
      t.messages.push(...Array.from({length:14},(_,i)=>({id:`long${i}`,type:'text',from:i%2?'peer':'me',
        text:'This longer message wraps safely inside the phone, including https://example.test/a-very-long-word-without-spaces.'})));
      const doc=buildDocument({thread:t,theme,width,height},__dirname);
      const p=await browser.newPage({viewport:{width,height}}); await p.setContent(doc.html);
      await p.evaluate(t=>window.__renderAt(t),doc.total);
      assert.deepEqual(await checkLayout(p),[]);
      const bounds=await p.evaluate(()=>{
        const rect=e=>e.getBoundingClientRect().toJSON();
        return {phone:rect(document.querySelector('.iphone-frame')),screen:rect(document.querySelector('.screen')),
          island:rect(document.querySelector('.dynamic-island')),last:rect(document.querySelector('[data-anim-id="long13"]')),
          conversation:rect(document.querySelector('.conversation')),color:getComputedStyle(document.querySelector('.facetime-btn')).color};
      });
      assert.ok(bounds.phone.top>15 && bounds.phone.bottom<height-15);
      assert.ok(bounds.phone.left>15 && bounds.phone.right<width-15);
      assert.ok(bounds.island.top>bounds.screen.top+8);
      assert.ok(bounds.island.bottom<bounds.screen.top+height*0.1);
      assert.equal(bounds.color,theme==='light'?'rgb(0, 0, 0)':'rgb(255, 255, 255)');
      assert.ok(bounds.last.top>=bounds.conversation.top);
      assert.ok(bounds.last.bottom<=bounds.conversation.bottom+1);
      const send=doc.timeline.find(e=>e.id==='reply');
      await p.evaluate(t=>window.__renderAt(t),send.t-1/30);
      assert.equal(await p.locator('[data-composer-text]').textContent(),t.messages[2].text);
      assert.equal(await p.locator('[data-anim-id="reply"]').getAttribute('data-pending'),'1');
      await p.evaluate(t=>window.__renderAt(t),send.t+0.3);
      assert.equal(await p.locator('[data-anim-id="typing"]').evaluate(e=>getComputedStyle(e).display),'none');
      await p.close();
    }
  } finally {await browser.close();}
});

test('group names appear with the first real message, and repeat after another sender', async () => {
  const t=fixture(); t.mode='group'; t.title='Weekend plans'; t.participants.push({id:'third',name:'Arjun'});
  t.messages=[{id:'ta',type:'typing',from:'peer'}, {id:'a1',type:'text',from:'peer',text:'one'},
    {id:'a2',type:'text',from:'peer',text:'two'}, {id:'b1',type:'text',from:'third',text:'three'},
    {id:'a3',type:'text',from:'peer',text:'four'}];
  const doc=buildDocument({thread:t},__dirname),browser=await chromium.launch();
  try {
    const p=await browser.newPage(); await p.setContent(doc.html);
    await p.evaluate(()=>window.__renderAt(0.8));
    assert.equal(await p.locator('.sender-name:visible').count(),0);
    const a1=doc.timeline.find(e=>e.id==='a1'); await p.evaluate(t=>window.__renderAt(t),a1.t+0.3);
    assert.deepEqual(await p.locator('.sender-name:visible').allTextContents(),['Zoë Chen']);
    await p.evaluate(t=>window.__renderAt(t),doc.total);
    assert.deepEqual(await p.locator('.sender-name:visible').allTextContents(),['Zoë Chen','Arjun','Zoë Chen']);
  } finally {await browser.close();}
});

test('timeline uses output frames and holds the ending beyond the crossfade',()=>{
  const doc=buildTimeline(fixture());
  for (const e of doc.timeline) assert.ok(Math.abs(e.t*30-Math.round(e.t*30))<1e-7);
  const last=doc.timeline.filter(e=>e.sfx).at(-1);
  assert.ok(doc.total-last.t-0.3>=0.5);
  assert.equal(doc.timeline.filter(e=>e.sfx).length,2);
  assert.throws(()=>buildDocument({thread:fixture(),zoom:8},__dirname),/does not fit/);
});
