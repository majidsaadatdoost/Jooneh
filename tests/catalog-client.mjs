import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
const baseFood={id:'old-custom',name:'غذای قبلی من',emoji:'🍽️',category:'غذاهای من',base:100,unit:'گرم',kcal:200,protein:10,carb:20,fat:8,fiber:2,sugar:null,source:'اطلاعات واردشده توسط شما',note:'داده قدیمی'};
let remote={version:1,foods:[baseFood],favorites:['old-custom','rice'],goals:{protein:50},profile:{},days:{'2026-10-18':{entries:[{id:'old-entry',meal:'ناهار',amount:135,food:structuredClone(baseFood)}],habits:[1]}}};
let revision=7,writes=[];const original=JSON.stringify(remote),originalDays=JSON.stringify(remote.days);
const els={},toolbar={},events={};
for(const [,id]of fs.readFileSync('docs/index.html','utf8').matchAll(/id="([^"]+)"/g))els[id]={value:'',hidden:false,style:{},firstChild:{textContent:''},textContent:'',innerHTML:'',checked:false,dataset:{},classList:{toggle(){},add(){},remove(){}},events:{},addEventListener(t,f){this.events[t]=f},setAttribute(){},showModal(){this.open=true},close(){this.open=false},reportValidity(){return true},reset(){},click(){this.onclick?.()}};
els.mealSelect.value='ناهار';
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const c={console,Intl,Date,Math,Number,String,JSON,Set,Map,Object,Array,Blob,URL,Response,crypto:webcrypto,setTimeout:()=>1,clearTimeout(){},confirm:()=>true,scrollTo(){},addEventListener(t,f){events[t]=f},localStorage:{getItem:()=>null,setItem(){throw Error('No diary in browser storage')}},document:{getElementById:id=>{assert(els[id],'Missing DOM ID '+id);return els[id]},querySelector:s=>s==='.cloud-toolbar'?toolbar:null,querySelectorAll:()=>[],addEventListener(t,f){events['document:'+t]=f},createElement:()=>({click(){}})},JoonehAuth:{ready:async()=>({id:'test-only'}),read:async()=>response({state:structuredClone(remote),revision,account:{email:'test'}}),write:async input=>{writes.push(structuredClone(input));assert.equal(input.revision,revision);for(const change of input.changes){if(change.key==='meta'){assert.deepEqual(Object.keys(change.value).sort(),['favorites','foods','goals','profile','version']);Object.assign(remote,structuredClone(change.value));}else if(change.value===null)delete remote.days[change.key.slice(4)];else remote.days[change.key.slice(4)]=structuredClone(change.value);}revision++;return response({revision});}}};c.window=c;vm.createContext(c);
for(const f of ['core.js','reference-foods.js','data.js','catalog.js','app.js'])vm.runInContext(fs.readFileSync('docs/assets/'+f,'utf8'),c,{filename:f});
const run=s=>vm.runInContext(s,c);const tick=()=>new Promise(r=>setImmediate(r));async function settled(){for(let i=0;i<30;i++){await tick();if(!run('cloudBusy'))return;}throw Error('Queue not settled')}
await settled();assert(run('cloudReady'));assert.equal(writes.length,0);assert.equal(JSON.stringify(remote),original);assert(run('validBackup(state)'));run("changeDay('2026-10-18')");
assert(els.nutrients.innerHTML.includes('۱۳٫۵'));assert(els.nutrients.innerHTML.includes('از هدف روزانهٔ'));assert(!els.nutrients.innerHTML.includes(' / '));
run("openFoodEditor(state.foods[0])");els.customKcal.value='250';els.customProtein.value='15';run("selectedIcon='🥜'");els.customForm.events.submit({preventDefault(){}});await settled();
assert.equal(remote.foods[0].id,'old-custom');assert.equal(remote.foods[0].kcal,250);assert.equal(remote.foods[0].emoji,'🥜');assert.equal(JSON.stringify(remote.days),originalDays);assert(writes.at(-1).changes.every(x=>x.key==='meta'));
run("archiveFood('old-custom')");await settled();assert.equal(run("allFoods().some(f=>f.id==='old-custom')"),false);assert.equal(run("allFoods(true).some(f=>f.id==='old-custom')"),true);assert.equal(JSON.stringify(remote.days),originalDays);
run("state.foods=FoodCatalog.restore(state.foods,'old-custom');save()");await settled();assert(run("allFoods().some(f=>f.id==='old-custom')"));
run("openFoodEditor(allFoods().find(f=>f.id==='rice'))");els.customKcal.value='145';els.customForm.events.submit({preventDefault(){}});await settled();assert.equal(run("allFoods().filter(f=>f.id==='rice').length"),1);assert.equal(run("FOODS.find(f=>f.id==='rice').kcal"),130);assert.equal(run("allFoods().find(f=>f.id==='rice').kcal"),145);assert.equal(JSON.stringify(remote.days),originalDays);
run("openFoodEditor(allFoods().find(f=>f.id==='rice'),true)");els.customForm.events.submit({preventDefault(){}});await settled();assert.equal(remote.foods.length,3);assert.notEqual(remote.foods[2].id,'rice');assert.equal(JSON.stringify(remote.days),originalDays);
// Actual entry handler must use the new food snapshot, without changing old entries.
run("openEntry(allFoods().find(f=>f.id==='old-custom'))");els.entryAmount.value='100';els.entryMeal.value='شام';els.entryForm.events.submit({preventDefault(){}});await settled();assert.equal(remote.days['2026-10-18'].entries[0].food.kcal,200);assert.equal(remote.days['2026-10-18'].entries[1].food.kcal,250);
assert(run('validBackup(JSON.parse(JSON.stringify(state)))'));assert(run("FoodCatalog.matches(FOODS.find(f=>f.id==='ir-ghormeh'),'قرمه سبزی')"));assert(run("FoodCatalog.matches(FOODS.find(f=>f.id==='ir-koobideh'),'كباب')"));
// A fresh account cannot inherit another account's overrides.
assert.equal(run("FoodCatalog.resolve(FOODS,[]).find(f=>f.id==='rice').kcal"),130);
assert(run('FOODS.every(validFood)'));assert.equal(run('new Set(FOODS.map(f=>f.id)).size'),run('FOODS.length'));
for(const f of run('FOODS')){run(`sourceDetails(${JSON.stringify(f.id)})`);assert(els.sourceBody.innerHTML.length>0);}
console.log('PASS: boot makes no writes; old state loads unchanged; custom and built-in edit/copy/archive/restore preserve diary snapshots; only explicit actions save; new entries use edited values; account isolation; Persian search; readable decimal progress; all source dialogs.');
console.log('Foods:',run('FOODS.length'),'USDA:',run("FOODS.filter(f=>f.provenance?.kind==='usda').length"),'recipes:',run("FOODS.filter(f=>f.provenance?.kind==='recipe').length"));
