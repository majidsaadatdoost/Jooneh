/* Read-only calendar and journal summaries. ISO storage keys stay unchanged. */
(function(root){
'use strict';
const nutrition=typeof module!=='undefined'?require('./core.js'):root.Nutrition;
const partsFormatter=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'});
const fullFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
const monthFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long'});
const shortFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',day:'numeric'});
const weekdayFormatter=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long'});
const date=iso=>new Date(iso+'T12:00:00');
function shift(iso,n){const d=date(iso);d.setDate(d.getDate()+n);return nutrition.localDay(d);}
function parts(iso){return Object.fromEntries(partsFormatter.formatToParts(date(iso)).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));}
function monthBounds(iso){const p=parts(iso),start=shift(iso,1-p.day);let next=shift(start,29);while(parts(next).month===p.month)next=shift(next,1);return {start,end:shift(next,-1),next,year:p.year,month:p.month};}
function period(iso,mode){if(mode==='month')return monthBounds(iso);const start=shift(iso,-((date(iso).getDay()+1)%7));return {start,end:shift(start,6),next:shift(start,7)};}
function previous(iso,mode){return period(shift(period(iso,mode).start,-1),mode);}
function fromPersian(year,month,day=1){
 if(!Number.isInteger(year)||year<1200||year>1600||!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>31)return null;
 let lo=Math.floor(Date.UTC(year+621,2,1)/86400000),hi=Math.floor(Date.UTC(year+622,3,1)/86400000);
 const target=year*10000+month*100+day;
 while(lo<=hi){const mid=Math.floor((lo+hi)/2),iso=new Date(mid*86400000).toISOString().slice(0,10),p=parts(iso),value=p.year*10000+p.month*100+p.day;if(value===target)return iso;if(value<target)lo=mid+1;else hi=mid-1;}return null;
}
function summarize(days,bounds,today=nutrition.localDay()){
 const rows=[];for(let iso=bounds.start;iso<=bounds.end;iso=shift(iso,1)){const entries=days[iso]?.entries||[];rows.push({iso,logged:entries.length>0,future:iso>today,totals:nutrition.totals(entries)});}
 const recorded=rows.filter(r=>r.logged),totals={missing:{}},average={missing:{}};
 for(const k of nutrition.keys){totals[k]=recorded.reduce((sum,r)=>sum+r.totals[k],0);totals.missing[k]=recorded.reduce((sum,r)=>sum+r.totals.missing[k],0);average[k]=recorded.length?totals[k]/recorded.length:null;average.missing[k]=totals.missing[k];}
 return {rows,count:recorded.length,elapsed:rows.filter(r=>!r.future).length,totals,average};
}
function difference(current,prior,key){if(!current.count||!prior.count||current.average.missing[key]||prior.average.missing[key])return null;return current.average[key]-prior.average[key];}
const api={date,shift,parts,monthBounds,period,previous,fromPersian,summarize,difference,full:iso=>fullFormatter.format(date(iso)),short:iso=>shortFormatter.format(date(iso)),monthTitle:iso=>monthFormatter.format(date(iso)),weekday:iso=>weekdayFormatter.format(date(iso))};
if(typeof module!=='undefined')module.exports=api;else root.JournalAnalytics=api;
})(typeof window!=='undefined'?window:globalThis);
