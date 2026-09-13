const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist/games/spot');
function boot(saved = {}) {
  const nodes = new Map(), registered = new Map(); let result;
  const node = () => ({textContent:'', innerHTML:'', open:false, children:[], handlers:{},
    style:{setProperty(){}}, classList:{add(){}},
    addEventListener(name, fn){this.handlers[name]=fn;},
    querySelector(){return node();}, appendChild(n){this.children.push(n);}, setAttribute(){},
    getBoundingClientRect(){return {left:100,top:200,width:450,height:300};}, close(){this.open=false;}, showModal(){this.open=true;}
  });
  const get = id => {if (!nodes.has(id)) nodes.set(id,node());return nodes.get(id);};
  const Kid = {$:get, store:{game:()=>saved,saveGame:(id,value)=>{result=value;}},
    audio:{chime(){}},stars(){},toast(){},wireSoundButton(){}};
  const context = vm.createContext({window:{Kid}, document:{createElement:node,querySelectorAll:()=>[],modelContext:{registerTool(t){registered.set(t.name,t);}}},setTimeout:()=>1,clearTimeout(){}});
  ['differences.js','spot.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context));
  return {Kid,get,registered,snapshot:()=>JSON.parse(JSON.stringify(result))};
}

test('十關皆有十個不同位置，至少六個非顏色變化', () => {
  const {Kid} = boot(); assert.equal(Kid.spotDifferences.length,10);
  for (const rows of Kid.spotDifferences) {
    assert.equal(rows.length,10);
    assert.ok(rows.filter(r=>r[5]!=='color').length>=6);
    assert.ok(new Set(rows.map(r=>r[5])).size>=3);
    assert.equal(new Set(rows.map(r=>r[0]+','+r[1])).size,10);
    rows.forEach(([x,y,rx,ry,label])=>{assert.ok(x>=0&&x<=100&&y>=0&&y<=100);assert.ok(rx>0&&ry>0&&label);});
  }
});

test('舊答案索引封存，新版另記進度，重新載入仍保留新舊紀錄', () => {
  const old={current:3,found:[[0,2,8],[],[1]]};
  const first=boot(old);const saved=first.snapshot();
  assert.deepEqual(saved.previousEdition,{edition:'original',...old});
  assert.ok(saved.found.every(r=>r.length===0));
  saved.found[3]=[0,4,7];
  const next=boot(saved).snapshot();
  assert.deepEqual(next,saved);
});

test('實際 click handler：100 個答案中心可命中，重複點擊不重複計分', () => {
  const {Kid,get,registered,snapshot}=boot();
  Kid.spotDifferences.forEach((rows,level)=>{
    registered.get('spot_choose_level').execute({level:level+1});
    rows.forEach(([x,y],index)=>{
      const scene=get(index%2?'scene-a':'scene-b');
      const e={detail:1,target:{closest:()=>null},currentTarget:scene,clientX:100+450*x/100,clientY:200+300*y/100};
      scene.handlers.click(e);
      assert.equal(Number(get('found-count').textContent),index+1);
      scene.handlers.click(e);
      assert.equal(Number(get('found-count').textContent),index+1);
    });
    assert.equal(snapshot().found[level].length,10);
  });
});
