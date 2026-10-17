(function(root){
const keys=['kcal','protein','carb','fat','fiber','sugar'];
function totals(entries){const out={missing:{}};for(const k of keys){out[k]=0;out.missing[k]=0;for(const e of entries){if(e.food[k]==null)out.missing[k]++;else out[k]+=e.food[k]*e.amount/e.food.base;}}return out;}
function estimate(weight,height,age,activity){if(![weight,height,age,activity].every(Number.isFinite)||age<18||age>100||weight<35||weight>250||height<120||height>210||![1.2,1.375,1.55].includes(activity))return null;const resting=10*weight+6.25*height-5*age-161;const maintain=resting*activity;return {resting,maintain,low:Math.max(1200,maintain-350),high:Math.max(1200,maintain-200)};}
function localDay(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const api={keys,totals,estimate,localDay};if(typeof module!=='undefined')module.exports=api;else root.Nutrition=api;
})(typeof window!=='undefined'?window:globalThis);
