import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),a=require('../docs/assets/analytics.js');
// Civil-date math must work across Nowruz, leap Esfand and DST, in any timezone.
assert.deepEqual(a.parts('2024-03-20'),{month:1,day:1,year:1403});
assert.equal(a.fromPersian(1403,1,1),'2024-03-20');
assert.equal(a.fromPersian(1403,12,30),'2025-03-20');
assert.equal(a.fromPersian(1404,12,30),null);
assert.equal(a.fromPersian(1405,7,26),'2026-10-18');
assert.equal(a.monthBounds('2025-03-15').end,'2025-03-20');
assert.equal(a.monthBounds('2026-03-15').end,'2026-03-20');
assert.equal(a.monthBounds('2026-04-03').end,'2026-04-20');
assert.equal(a.previous('2026-03-21','month').start,'2026-02-20');
assert.equal(a.period('2026-10-18','week').start,'2026-10-17');
assert.equal(a.period('2026-10-23','week').end,'2026-10-23');
assert.equal(a.period('2026-10-24','week').start,'2026-10-24');
assert.equal(a.shift('2024-03-10',1),'2024-03-11');
assert.equal(a.shift('2024-11-03',1),'2024-11-04');
assert(a.full('2026-10-18').includes('یکشنبه'));
assert(a.full('2026-10-18').includes('۱۴۰۵'));
for(let year=1399;year<=1410;year++)for(let month=1;month<=12;month++){
 const first=a.fromPersian(year,month),bounds=a.monthBounds(first);
 assert.equal(a.parts(first).day,1);assert.equal(a.parts(first).month,month);
 assert.equal(a.parts(bounds.end).day,month<7?31:month<12?30:a.parts(bounds.end).day);
 assert([29,30,31].includes(a.parts(bounds.end).day));assert.equal(a.parts(bounds.next).day,1);
 assert.equal(a.fromPersian(year,month,a.parts(bounds.end).day),bounds.end);
}
const food={base:100,kcal:200,protein:10,carb:20,fat:8,fiber:2,sugar:null};
const entry=(amount=100,values=food)=>({food:{...values},amount});
const days={
 '2026-10-10':{entries:[entry()],habits:[]},
 '2026-10-11':{entries:[entry()],habits:[]},
 '2026-10-17':{entries:[entry(150)],habits:[]},
 '2026-10-18':{entries:[],habits:[1]},
 '2026-10-19':{entries:[entry(100,{...food,kcal:0,protein:0})],habits:[]}
};
const before=JSON.stringify(days),current=a.summarize(days,a.period('2026-10-18','week'),'2026-10-20'),prior=a.summarize(days,a.previous('2026-10-18','week'),'2026-10-20');
assert.equal(current.rows.length,7);assert.equal(current.count,2);assert.equal(current.elapsed,4);
assert.equal(current.totals.kcal,300);assert.equal(current.average.kcal,150); // includes explicitly logged zero, excludes missing days
assert.equal(current.rows[1].logged,false);assert.equal(current.rows[2].logged,true);assert.equal(current.rows[6].future,true);
assert.equal(current.average.protein,7.5);assert.equal(current.average.missing.sugar,2);
assert.equal(a.difference(current,prior,'kcal'),-50);assert.equal(a.difference(current,prior,'sugar'),null);
const empty=a.summarize({},a.period('2026-10-18','week'));
assert.equal(empty.average.kcal,null);assert.equal(a.difference(current,empty,'kcal'),null);
assert.equal(JSON.stringify(days),before);
console.log('PASS: Jalali month/year/leap boundaries, Saturday weeks, timezone-safe days, 12-year roundtrips; recorded-only averages, genuine zeros, missing nutrients, snapshots unchanged. TZ='+process.env.TZ);
