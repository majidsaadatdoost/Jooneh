'use strict';
let reportMode='week',reportAnchor=null,calendarAnchor=null;
const GOAL_KEYS=['kcal','protein','carb','fat','fiber','sugar'];
const GOAL_RANGES={kcal:[1200,5000],protein:[30,200],fiber:[15,50],carb:[0,1000],fat:[0,300],sugar:[0,500]};
function nutrientCards(t){return GOAL_KEYS.slice(1).map(k=>{
 const target=state.goals[k],hasTarget=Number.isFinite(target),unknown=t.missing[k]>0,label=k==='sugar'?'سقف شخصی':'هدف روزانه',remaining=hasTarget?target-t[k]:null;
 let status='';
 if(hasTarget){if(unknown)status='اطلاعات ناقص؛ فاصله تا '+label+' دقیق نیست';else if(remaining>0)status=`${fmt(remaining)} گرم تا ${label}`;else if(remaining<0)status=`${fmt(-remaining)} گرم بیشتر از ${label}`;else status=k==='sugar'?'برابر با سقف شخصی':'برابر با هدف انتخابی';}
 const percent=hasTarget?(target>0?Math.min(100,t[k]/target*100):t[k]>0?100:0):0;
 return `<div class="nutrient nutrient-card"><div class="nutrient-label"><b>${NAMES[k]}</b><span class="nutrient-progress"><strong><bdi>${showValue(t,k)}</bdi> گرم ثبت‌شده</strong>${hasTarget?`<small>${k==='sugar'?'سقف شخصی':'از هدف روزانهٔ'} <bdi>${fmt(target)}</bdi> گرم</small>`:'<small>هدف تنظیم نشده</small>'}</span></div>${hasTarget?`<div class="bar ${t[k]>target?'above-target':''}" aria-hidden="true"><i style="width:${percent}%"></i></div><small class="target-distance">${status}</small>`:'<button class="text-link" data-goto="settings">تنظیم هدف اختیاری ←</button>'}</div>`;
 }).join('');}
function openCalendar(){calendarAnchor=day;renderCalendar();$('calendarDialog').showModal();}
function renderCalendar(){
 const a=JournalAnalytics,b=a.monthBounds(calendarAnchor||day),first=(a.date(b.start).getDay()+1)%7,today=Nutrition.localDay();
 $('calendarTitle').textContent=a.monthTitle(b.start);
 const months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
 $('calendarMonth').innerHTML=months.map((name,i)=>`<option value="${i+1}" ${b.month===i+1?'selected':''}>${name}</option>`).join('');$('calendarMonth').value=String(b.month);
 const years=new Set(Array.from({length:201},(_,i)=>1300+i));years.add(b.year);Object.keys(state.days).forEach(d=>years.add(a.parts(d).year));
 $('calendarYear').innerHTML=[...years].sort((x,y)=>y-x).map(y=>`<option value="${y}" ${y===b.year?'selected':''}>${fmt(y).replace(/٬/g,'')}</option>`).join('');$('calendarYear').value=String(b.year);
 let html='<span aria-hidden="true"></span>'.repeat(first);
 for(let d=b.start;d<=b.end;d=a.shift(d,1)){const logged=state.days[d]?.entries.length>0;html+=`<button data-calendar-day="${d}" class="${d===day?'selected':''} ${d===today?'calendar-today':''}" aria-label="${esc(a.full(d))}${logged?'، دارای ثبت غذا':''}" aria-pressed="${d===day}">${fmt(a.parts(d).day)}<i ${logged?'':'hidden'} aria-hidden="true"></i></button>`;}
 $('calendarDays').innerHTML=html;
}
function setCalendarMonth(){const d=JournalAnalytics.fromPersian(+$('calendarYear').value,+$('calendarMonth').value);if(d){calendarAnchor=d;renderCalendar();}}
function moveCalendar(n){const a=JournalAnalytics,b=a.monthBounds(calendarAnchor||day);calendarAnchor=n<0?a.shift(b.start,-1):b.next;renderCalendar();}
function reportValue(summary,k,average=false){if(!summary.count)return '—';const values=average?summary.average:summary.totals;return `<bdi>${showValue(values,k)}</bdi>`;}
function renderAnalytics(){
 const a=JournalAnalytics,anchor=reportAnchor||day,b=a.period(anchor,reportMode),priorBounds=a.previous(anchor,reportMode),current=a.summarize(state.days,b),prior=a.summarize(state.days,priorBounds),unit=k=>k==='kcal'?'کیلوکالری':'گرم',metric=$('trendMetric').value||'kcal';
 $('weeklyView').classList.toggle('active',reportMode==='week');$('monthlyView').classList.toggle('active',reportMode==='month');$('weeklyView').setAttribute('aria-pressed',String(reportMode==='week'));$('monthlyView').setAttribute('aria-pressed',String(reportMode==='month'));
 $('periodTitle').textContent=reportMode==='month'?a.monthTitle(b.start):'هفتهٔ '+a.short(b.start);$('periodDates').textContent=a.full(b.start)+' تا '+a.full(b.end);
 const allCount=Object.values(state.days).filter(d=>d.entries.length).length;
 $('analyticsCoverage').textContent=`${fmt(current.count)} روز دارای ثبت غذا از ${fmt(current.rows.length)} روز این بازه · ${fmt(allCount)} روز ثبت‌شده در کل دفترچه`;
 $('firstPeriod').hidden=!allCount;
 $('analyticsSummary').innerHTML=`<article class="panel"><span>روزهای دارای ثبت غذا</span><strong>${fmt(current.count)}</strong><small>از ${fmt(current.rows.length)} روز بازه</small></article><article class="panel"><span>میانگین کالری ثبت‌شده</span><strong>${reportValue(current,'kcal',true)}</strong><small>کیلوکالری در روزِ دارای ثبت</small></article><article class="panel"><span>میانگین پروتئین ثبت‌شده</span><strong>${reportValue(current,'protein',true)}</strong><small>گرم در روزِ دارای ثبت</small></article><article class="panel"><span>جمع کالری ثبت‌شده</span><strong>${reportValue(current,'kcal')}</strong><small>کیلوکالری در این بازه</small></article>`;
 const target=state.goals[metric],hasTarget=Number.isFinite(target),max=Math.max(1,hasTarget?target:0,...current.rows.filter(r=>r.logged).map(r=>r.totals[metric]))*1.18;
 $('trendLegend').textContent=`${NAMES[metric]} · ${unit(metric)}${hasTarget?` · خط نقطه‌چین: ${metric==='sugar'?'سقف شخصی':'هدف روزانه'} فعلی ${fmt(target)} ${unit(metric)}`:' · هدفی برای این مورد تنظیم نشده'} · ارتفاع نمودار با مقدارها تنظیم می‌شود.`;
 $('trendChart').style.minWidth=(current.rows.length*64)+'px';
 $('trendChart').innerHTML=current.rows.map(r=>{
 const value=r.logged?showValue(r.totals,metric):'—',description=r.logged?`${value} ${unit(metric)}`:r.future?'هنوز نرسیده':'بدون ثبت غذا';
 return `<button class="trend-day ${r.logged?'':'unlogged'}" data-report-day="${r.iso}" aria-label="${esc(a.full(r.iso))}، ${description}"><span class="trend-plot">${hasTarget?`<i class="goal-line" style="bottom:${target/max*100}%"></i>`:''}<span class="trend-fill ${r.totals.missing[metric]?'incomplete':''}" style="height:${r.logged?r.totals[metric]/max*100:0}%"></span><b class="trend-value" style="bottom:calc(${r.logged?r.totals[metric]/max*100:0}% + 5px)"><bdi>${value}</bdi></b></span><small>${a.weekday(r.iso)}</small><span>${fmt(a.parts(r.iso).day)}</span>${r.logged?'':`<small class="missing-label">${r.future?'آینده':'ثبت نشده'}</small>`}</button>`;
 }).join('');
 $('comparisonCaption').textContent=`این بازه: ${fmt(current.count)} روز دارای ثبت غذا؛ بازه قبل (${a.full(priorBounds.start)} تا ${a.full(priorBounds.end)}): ${fmt(prior.count)} روز. تعداد روزهای ثبت‌شده ممکن است متفاوت باشد؛ افزایش یا کاهش به‌تنهایی خوب یا بد نیست.`;
 $('comparisonRows').innerHTML=GOAL_KEYS.map(k=>{const delta=a.difference(current,prior,k),goal=state.goals[k];let change=delta===null?'قابل محاسبه نیست':Math.abs(delta)<.05?'تقریباً برابر':`${fmt(Math.abs(delta))} ${unit(k)} ${delta>0?'بیشتر':'کمتر'}`;return `<tr><th scope="row">${NAMES[k]}</th><td>${reportValue(current,k,true)} ${current.count?unit(k):''}</td><td>${reportValue(prior,k,true)} ${prior.count?unit(k):''}</td><td>${change}</td><td>${Number.isFinite(goal)?`${k==='sugar'?'سقف شخصی: ':''}${fmt(goal)} ${unit(k)}`:'تنظیم نشده'}</td></tr>`;}).join('');
 $('dailyReportRows').innerHTML=current.rows.map(r=>`<tr><th scope="row"><button class="text-link" data-report-day="${r.iso}">${a.full(r.iso)}</button></th>${r.logged?GOAL_KEYS.map(k=>`<td><bdi>${showValue(r.totals,k)}</bdi></td>`).join(''):`<td colspan="6" class="muted">${r.future?'هنوز نرسیده؛ غذایی ثبت نشده':'غذایی ثبت نشده؛ در میانگین حساب نمی‌شود'}</td>`}</tr>`).join('');
}
function moveReport(n){const a=JournalAnalytics,b=a.period(reportAnchor||day,reportMode);reportAnchor=n<0?a.shift(b.start,-1):b.next;renderAnalytics();}
function bindReports(){
 $('dayPicker').onclick=openCalendar;
 $('calendarPrevious').onclick=()=>moveCalendar(-1);$('calendarNext').onclick=()=>moveCalendar(1);$('calendarMonth').onchange=setCalendarMonth;$('calendarYear').onchange=setCalendarMonth;
 $('calendarToday').onclick=()=>{changeDay(Nutrition.localDay());$('calendarDialog').close();};
 $('weeklyView').onclick=()=>{reportMode='week';renderAnalytics();};$('monthlyView').onclick=()=>{reportMode='month';renderAnalytics();};
 $('previousPeriod').onclick=()=>moveReport(-1);$('nextPeriod').onclick=()=>moveReport(1);$('currentPeriod').onclick=()=>{reportAnchor=Nutrition.localDay();renderAnalytics();};
 $('firstPeriod').onclick=()=>{reportAnchor=Object.keys(state.days).filter(d=>state.days[d].entries.length).sort()[0]||day;renderAnalytics();};
 $('trendMetric').onchange=renderAnalytics;
}
