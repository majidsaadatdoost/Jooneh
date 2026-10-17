'use strict';
window.JoonehAuth=(()=>{
 let client=null,currentUser=null,resolveReady,rejectReady;
 const readyPromise=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 const el=id=>document.getElementById(id),notice=text=>el('authNotice').textContent=text;
 function showAuth(text){el('authPanel').hidden=false;el('journalMain').inert=true;notice(text);}
 function activate(user){if(currentUser&&currentUser.id!==user.id){location.reload();return;}currentUser=user;el('authPanel').hidden=true;resolveReady(user);}
 function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});}
 async function rpc(name,args={}){if(!client||!currentUser)throw Error('auth');const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
 async function read(query=''){try{await readyPromise;const params=new URLSearchParams(query);if(params.get('history')==='1')return response({history:await rpc('jooneh_history')});if(params.has('version'))return response(await rpc('jooneh_read_version',{p_revision:Number(params.get('version'))}));const result=await rpc('jooneh_read');return response({...result,account:{id:currentUser.id,email:currentUser.email}});}catch{return response({error:'storage_unavailable'},503);}}
 async function write(input){try{await readyPromise;const data=await rpc('jooneh_write',{p_revision:input.revision,p_mutation:input.mutationId,p_changes:input.changes});return response(data,data.error==='conflict'?409:200);}catch(e){return response({error:'save_failed'},e.code==='22023'?400:503);}}
 async function signOut(){const {error}=await client.auth.signOut();if(error){notice('خروج انجام نشد؛ دوباره تلاش کن.');return;}location.reload();}
 async function start(){const cfg=window.JOONEH_CONFIG||{};if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl)||!cfg.supabasePublishableKey||cfg.supabasePublishableKey.startsWith('sb_secret_')){showAuth('ذخیره آنلاین این نسخه هنوز راه‌اندازی نشده است. مدیر سایت باید اتصال دیتابیس و حساب کاربری را تکمیل کند.');el('cloudStatus').textContent='منتظر راه‌اندازی اتصال آنلاین';return;}
 if(!window.supabase){showAuth('بارگذاری بخش ورود انجام نشد؛ صفحه را دوباره باز کن.');return;}
 client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 el('loginForm').hidden=false;notice('ورود فقط برای حساب‌هایی است که مدیر سایت ایجاد کرده است.');
 let recovering=location.hash.includes('type=recovery');
 client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){recovering=true;showAuth('یک رمز جدید با حداقل ۱۲ کاراکتر تعیین کن.');el('loginForm').hidden=true;el('passwordForm').hidden=false;}else if(event==='SIGNED_OUT'){currentUser=null;el('journalMain').inert=true;location.reload();}else if(session?.user&&!recovering){activate(session.user);}});
 const {data,error}=await client.auth.getSession();if(error){showAuth('بررسی ورود ممکن نشد؛ دوباره تلاش کن.');return;}if(data.session?.user&&!recovering)activate(data.session.user);
 el('loginForm').addEventListener('submit',async e=>{e.preventDefault();el('loginSubmit').disabled=true;notice('در حال ورود…');try{const {data,error}=await client.auth.signInWithPassword({email:el('loginEmail').value.trim(),password:el('loginPassword').value});if(error){notice('ورود انجام نشد؛ ایمیل، رمز و اتصال اینترنت را بررسی کن.');return;}el('loginPassword').value='';activate(data.user);}catch{notice('اتصال برقرار نشد؛ دوباره تلاش کن.');}finally{el('loginSubmit').disabled=false;}});
 el('forgotPassword').onclick=async()=>{if(!el('loginEmail').reportValidity()||!el('loginEmail').value)return;const {error}=await client.auth.resetPasswordForEmail(el('loginEmail').value.trim(),{redirectTo:location.origin+location.pathname});notice(error?'ارسال درخواست ممکن نشد؛ بعداً تلاش کن.':'اگر این ایمیل حساب فعالی داشته باشد، راهنمای بازیابی رمز ارسال می‌شود.');};
 el('passwordForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await client.auth.updateUser({password:el('newPassword').value});if(error){notice('تغییر رمز انجام نشد؛ اعتبار لینک و قدرت رمز را بررسی کن.');return;}el('newPassword').value='';history.replaceState(null,'',location.pathname);location.reload();});
 }
 // Scripts are loaded at the end of the document. No diary data is available
 // until the backend has authenticated and authorized the current user.
 queueMicrotask(()=>start().catch(()=>showAuth('اتصال به سرویس ورود برقرار نشد؛ دوباره تلاش کن.')));
 return {ready:()=>readyPromise,read,write,signOut};
})();
