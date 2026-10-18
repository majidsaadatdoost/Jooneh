// Catalog preferences live inside the existing foods array. No data migration.
(function(root){
 const icons=['🍽️','🍚','🍲','🍛','🍢','🍗','🥩','🐟','🥚','🥣','🥗','🥪','🍞','🫓','🥛','🧀','🧈','🫒','🥜','🌰','🍫','🍪','🍰','🍦','🍿','🍟','🍎','🍌','🍊','🍇','🍓','🥒','🥕','🥔','🫘','☕','🧃'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 function resolve(builtins,personal,archived=false){const map=new Map(builtins.map(f=>[f.id,f]));for(const f of personal)map.set(f.id,f);return [...map.values()].filter(f=>Boolean(f.archived)===archived);}
 function upsert(personal,food){const result=personal.map(copy),i=result.findIndex(f=>f.id===food.id);if(i<0)result.push(copy(food));else result[i]=copy(food);return result;}
 function archive(personal,food){return upsert(personal,{...food,archived:true});}
 function restore(personal,id){return personal.map(f=>f.id===id?{...copy(f),archived:false}:copy(f));}
 function normalize(s){return String(s||'').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\u0640\u064b-\u065f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();}
 function matches(food,query){const hay=normalize([food.name,...(Array.isArray(food.aliases)?food.aliases:[])].join(' '));return normalize(query).split(' ').every(word=>hay.includes(word));}
 const api={icons,resolve,upsert,archive,restore,normalize,matches};if(typeof module!=='undefined')module.exports=api;else root.FoodCatalog=api;
})(typeof window!=='undefined'?window:globalThis);
