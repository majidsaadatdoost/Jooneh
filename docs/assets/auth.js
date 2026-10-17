'use strict';
window.JoonehAuth=(()=>{
 let client=null,currentUser=null,resolveReady,rejectReady;
 const readyPromise=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 const el=id=>document.getElementById(id),notice=text=>el('authNotice').textContent=text;
 function showAuth(text){el('authPanel').hidden=false;el('journalMain').inert=true;notice(text);}
 function activate(user){if(currentUser&&currentUser.id!==user.id){location.reload();return;}currentUser=user;el('authPanel').hidden=true;resolveReady(user);}
 function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});}
 async function rpc(name,args={}){if(!client||!currentUser)throw Error('auth');const {data,error}=await client.rpc(name,args);if(error)throw error;return data;}
 async function read(query=''){try{await readyPromise;const params=new URLSearchParams(query);if(params.get('history')==='1')return response({history:await rpc('jooneh_history')});if(params.has('version'))return response(await rpc('jooneh_read_version',{p_revision:Number(params.get('version'))}));const result=await rpc('jooneh_read');return response({...result,account:{id:currentUser.id,email:currentUser.email.split("@")[0]}});}catch{return response({error:'storage_unavailable'},503);}}
 async function write(input){try{await readyPromise;const data=await rpc('jooneh_write',{p_revision:input.revision,p_mutation:input.mutationId,p_changes:input.changes});return response(data,data.error==='conflict'?409:200);}catch(e){return response({error:'save_failed'},e.code==='22023'?400:503);}}
 async function signOut(){const {error}=await client.auth.signOut();if(error){notice('خروج انجام نشد؛ دوباره تلاش کن.');return;}location.reload();}
 async function start(){const cfg=window.JOONEH_CONFIG||{};if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl)||!cfg.supabasePublishableKey||cfg.supabasePublishableKey.startsWith('sb_secret_')){showAuth('ذخیره آنلاین این نسخه هنوز راه‌اندازی نشده است. مدیر سایت باید اتصال دیتابیس و حساب کاربری را تکمیل کند.');el('cloudStatus').textContent='منتظر راه‌اندازی اتصال آنلاین';return;}
 if(!window.supabase){showAuth('بارگذاری بخش ورود انجام نشد؛ صفحه را دوباره باز کن.');return;}
 client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 el('loginForm').hidden=false;notice('ورود فقط برای حساب‌هایی است که مدیر سایت ایجاد کرده است.');
 client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){currentUser=null;el('journalMain').inert=true;location.reload();}else if(session?.user){activate(session.user);}});
 const {data,error}=await client.auth.getSession();if(error){showAuth('بررسی ورود ممکن نشد؛ دوباره تلاش کن.');return;}if(data.session?.user)activate(data.session.user);
 el('loginForm').addEventListener('submit',async e=>{e.preventDefault();el('loginSubmit').disabled=true;notice('در حال ورود…');try{const username=el('loginUsername').value.trim().toLowerCase();if(!/^[a-z0-9]+$/.test(username)){notice('نام کاربری را با حروف انگلیسی وارد کن.');return;}const {data,error}=await client.auth.signInWithPassword({email:username+'@jooneh.invalid',password:el('loginPassword').value});if(error){notice('ورود انجام نشد؛ نام کاربری، رمز و اتصال اینترنت را بررسی کن.');return;}el('loginPassword').value='';activate(data.user);}catch{notice('اتصال برقرار نشد؛ دوباره تلاش کن.');}finally{el('loginSubmit').disabled=false;}});
 el('passwordForm').addEventListener('submit',async e=>{e.preventDefault();const output=el('passwordNotice');if(el('newPassword').value!==el('confirmPassword').value){output.textContent='تکرار رمز با رمز جدید یکسان نیست.';return;}if(el('newPassword').value.length<12){output.textContent='رمز جدید باید حداقل ۱۲ کاراکتر باشد.';return;}el('passwordSubmit').disabled=true;output.textContent='در حال تغییر رمز…';try{const verified=await client.auth.signInWithPassword({email:currentUser.email,password:el('currentPassword').value});if(verified.error){output.textContent='رمز فعلی درست نیست یا اتصال برقرار نشد.';return;}const {error}=await client.auth.updateUser({password:el('newPassword').value});if(error){output.textContent='تغییر رمز انجام نشد؛ دوباره تلاش کن.';return;}['currentPassword','newPassword','confirmPassword'].forEach(id=>el(id).value='');output.textContent='رمز جدید ذخیره شد. برای ورودهای بعدی از همین رمز استفاده کن.';}catch{output.textContent='اتصال برقرار نشد؛ دوباره تلاش کن.';}finally{el('passwordSubmit').disabled=false;}});
 }
 // Scripts are loaded at the end of the document. No diary data is available
 // until the backend has authenticated and authorized the current user.
 queueMicrotask(()=>start().catch(()=>showAuth('اتصال به سرویس ورود برقرار نشد؛ دوباره تلاش کن.')));
 return {ready:()=>readyPromise,read,write,signOut};
})();
