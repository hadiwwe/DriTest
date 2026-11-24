(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var fa=function(n){return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var mem={};
var Store={get:function(k,d){try{var v=localStorage.getItem('rq_'+k);if(v!=null)return JSON.parse(v)}catch(e){}return k in mem?mem[k]:d},
set:function(k,v){mem[k]=v;try{localStorage.setItem('rq_'+k,JSON.stringify(v))}catch(e){}},
del:function(k){delete mem[k];try{localStorage.removeItem('rq_'+k)}catch(e){}}};
var exams=function(){return window.availableExams||[]};
var exById=function(id){return exams().filter(function(e){return e.id===id})[0]};
var dur=function(e){return (e.duration||20)*60},pass=function(e){return e.passScore||Math.ceil(e.questions.length*26/30)};
var S=null,timer=null,rf='all';
function save(){if(S&&!S.done&&!S.pr)Store.set('session',{ex:S.ex,idx:S.idx,ans:S.ans,bm:S.bm,end:S.end})}
function go(h){location.hash=h}
function Q(){return S.ex.questions[S.idx]}
function pic(o,cls){return o.image?'<img class="'+(cls||'zm')+'" loading="lazy" src="'+esc(o.image)+'" alt="'+esc(o.text||'تصویر')+'" onerror="this.className=\'bad\'">':''}
function optH(o){return typeof o==='object'?pic(o)+(o.image?'':'<span>'+esc(o.text||'')+'</span>'):'<span>'+esc(o)+'</span>'}
function optT(o){return typeof o==='object'?(o.image?pic(o):esc(o.text||'')):esc(o)}
function ask(t,m,ok,yes,no){var d=$('#modal');d.innerHTML='<div class="card"><h2>'+esc(t)+'</h2><p class="mu">'+esc(m)+'</p><button class="btn pri" id="my" style="width:100%">'+esc(ok)+'</button><button class="btn" id="mn" style="width:100%;margin-top:8px">انصراف</button></div>';d.hidden=false;
var cl=function(){d.hidden=true;d.onkeydown=null};$('#my').onclick=function(){cl();yes&&yes()};$('#mn').onclick=function(){cl();no&&no()};
d.onkeydown=function(e){if(e.key==='Escape'){cl();no&&no()}};$('#my').focus()}
/* ---------- routing ---------- */
function route(){var r=location.hash||'#/';
if(r==='#/quiz'&&!S){var ss=Store.get('session',null);if(ss&&ss.ex&&ss.end>Date.now()){S=ss}else return go('#/')}
if(r==='#/result'&&!(S&&S.done))return go('#/');
if(S&&!S.done&&r!=='#/quiz'){return ask('خروج از آزمون؟','آزمون ذخیره می‌شود و بعداً می‌توانید ادامه دهید.','خروج',function(){stopTimer();S=null;render()},function(){go('#/quiz')})}
if(S&&S.done&&r!=='#/result')S=null;
render()}
function render(){var r=location.hash||'#/',q=r==='#/quiz',d=r==='#/result';
$('#tabs').hidden=q||d;$('#qbar').hidden=!q;$('#exitBtn').hidden=!(q||d);
Array.prototype.forEach.call(document.querySelectorAll('#tabs a'),function(a){a.getAttribute('data-t')===(r.indexOf('#/practice')===0?'#/practice':r)?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
if(q){renderQuiz();startTimer()}else{stopTimer();$('#view').innerHTML=d?resultH():r.indexOf('#/practice')===0?practiceH(r):r==='#/videos'?videosH():homeH();window.scrollTo(0,0)}}
function infoH(t,m){return '<div class="card"><h2>'+t+'</h2><p class="mu">'+m+'</p></div>'}
function videosH(){var v=window.VIDEOS||[];if(!v.length)return infoH('ویدیوها','هنوز ویدیویی اضافه نشده است. این بخش به اینترنت نیاز دارد و بقیهٔ برنامه آفلاین کار می‌کند.');
return v.map(function(x){return '<div class="card"><b>'+esc(x.title)+'</b><p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">مشاهده ویدیو (نیازمند اینترنت)</a></p></div>'}).join('')}
/* ---------- home ---------- */
function homeH(){var R=Store.get('res',{}),ss=Store.get('session',null),h='',ex=exams(),qc=ex.reduce(function(a,e){return a+e.questions.length},0);
h+='<div class="card hero"><h1 style="margin:0 0 6px;font-size:20px">قبولی در نوبت اول</h1><div class="row"><span>'+fa(ex.length)+' آزمون</span><span>'+fa(qc)+' سوال</span></div></div>';
h+='<div class="card"><label class="mu"><input type="checkbox" id="shuf"'+(Store.get('shuf',false)?' checked':'')+'> جابه‌جایی ترتیب گزینه‌ها (در آزمون‌ها)</label></div>';
if(ss&&ss.ex&&ss.end>Date.now()){h+='<div class="card row"><span>آزمون نیمه‌کاره: <b>'+esc(ss.ex.title)+'</b></span><button class="btn pri" data-act="resume">ادامه</button></div>'}else if(ss)Store.del('session');
ex.forEach(function(e){var o=R[e.id],st='<span class="chip">شروع نشده</span>';if(o&&o.last)st='<span class="chip '+(o.last.p?'ok':'no')+'">'+(o.last.p?'قبول':'مردود')+' ('+fa(o.last.c)+'/'+fa(o.last.t)+')</span>';
h+='<div class="card"><div class="row"><b>'+esc(e.title)+'</b>'+st+'</div><p class="mu">'+esc(e.description||'')+'</p><div class="row"><span class="mu">'+fa(e.questions.length)+' سوال · '+fa(dur(e)/60)+' دقیقه'+(o?' · بهترین: '+fa(o.best):'')+'</span><button class="btn pri" data-act="start" data-id="'+e.id+'">شروع</button></div></div>'});
return h||infoH('آزمونی یافت نشد','فایل‌های details/azmonN.js را بررسی کنید.')}
var PIN=/موارد|گزینه‌ها|گزینه ها|هر دو|تمام|همه/;
function cp(e,q,sh){var n=q.options.length,ord=[],i;for(i=0;i<n;i++)ord.push(i);if(sh){var fr=ord.filter(function(i){var o=q.options[i];return typeof o==='string'&&!PIN.test(o)}),v=fr.slice(),j,t;for(i=v.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));t=v[i];v[i]=v[j];v[j]=t}fr.forEach(function(p,k){ord[p]=v[k]})}
return {id:q.id,k:e.id+'-'+q.id,category:q.category,text:q.text,image:q.image,explanation:q.explanation,options:ord.map(function(i){return q.options[i]}),correct:ord.indexOf(q.correct)}}
function bank(){var m={};exams().forEach(function(e){e.questions.forEach(function(q){m[e.id+'-'+q.id]=cp(e,q,false)})});return m}
function begin(ex,pr){S={ex:ex,idx:0,ans:{},bm:[],pr:!!pr,end:Date.now()+(ex.duration||0)*60000};save();go('#/quiz');if(location.hash==='#/quiz')route()}
function start(id){var e=exById(id);if(!e)return;var sh=Store.get('shuf',false);begin({id:id,title:e.title,duration:e.duration||20,passScore:e.passScore||Math.ceil(e.questions.length*26/30),questions:e.questions.map(function(q){return cp(e,q,sh)})});return;S=null;go('#/quiz');if(location.hash==='#/quiz')route()}
function rnd(){var b=bank(),ks=Object.keys(b).sort(function(){return Math.random()-.5}),seen={},qs=[],sh=Store.get('shuf',false);ks.forEach(function(k){var q=b[k];if(qs.length<30&&!seen[q.text]){seen[q.text]=1;qs.push(q)}});begin({id:'rnd',title:'آزمون تصادفی',duration:20,passScore:26,questions:qs.map(function(q,i){var o=q;return o})})}
/* ---------- quiz ---------- */
function renderQuiz(){var e=S.ex,q=Q(),h='<div class="bar"><span>سوال <b>'+fa(S.idx+1)+'</b> از '+fa(e.questions.length)+'</span><span id="tm" class="tm" role="timer"></span><button class="ic" id="bmb" data-act="bm" aria-label="نشان‌کردن سوال"></button></div><div id="pal" class="pal"></div>';
h+='<section class="card"><span class="chip">'+esc(q.category)+'</span><h2>'+esc(q.text)+'</h2>'+(q.image?'<img class="zm qi" src="'+esc(q.image)+'" alt="تصویر سوال" onerror="this.className=\'bad\'">':'')+'<div>'+q.options.map(function(o,i){return '<button class="opt" data-act="opt" data-i="'+i+'" aria-pressed="false"><i>'+fa(i+1)+'</i>'+optH(o)+'</button>'}).join('')+'</div></section>';
$('#view').innerHTML=h;if(S.pr)$('#tm').hidden=true;sync();tick();window.scrollTo(0,0)}
function sync(){var e=S.ex,q=Q();
Array.prototype.forEach.call(document.querySelectorAll('.opt'),function(b,i){var on=S.ans[q.id]===i;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);var a=S.ans[q.id];if(S.pr&&a!==undefined){b.classList.toggle('good',i===q.correct);b.classList.toggle('wrong',i===a&&a!==q.correct)}});var xx=$('#xp');xx&&xx.remove();if(S.pr&&S.ans[q.id]!==undefined&&q.explanation)document.querySelector('.card .opt').parentNode.insertAdjacentHTML('afterend','<div class="ex" id="xp">'+esc(q.explanation)+'</div>');
var p=$('#pal');p.innerHTML=e.questions.map(function(x,i){var c=i===S.idx?'cur':S.ans[x.id]!==undefined?'ans':'';if(S.bm.indexOf(x.id)>-1)c+=' bm';return '<button class="'+c+'" data-act="pal" data-i="'+i+'" aria-label="سوال '+fa(i+1)+'">'+fa(i+1)+'</button>'}).join('');
var cur=p.querySelector('.cur');cur&&cur.scrollIntoView&&cur.scrollIntoView({inline:'center',block:'nearest'});
var b=S.bm.indexOf(q.id)>-1,m=$('#bmb');m.textContent=b?'★':'☆';m.classList.toggle('on',b);
$('#pv').disabled=S.idx===0;$('#nx').textContent=S.idx===e.questions.length-1?'پایان ›':'بعدی ›'}
function nav(i){var n=S.ex.questions.length;if(i<0)return;if(i>=n)return finishAsk();S.idx=i;save();renderQuiz()}
function startTimer(){stopTimer();timer=setInterval(tick,1000)}
function stopTimer(){clearInterval(timer);timer=null}
function tick(){if(!S||S.done||S.pr)return;var r=Math.max(0,Math.round((S.end-Date.now())/1000)),t=$('#tm');
if(t){t.textContent=fa(('0'+Math.floor(r/60)).slice(-2)+':'+('0'+r%60).slice(-2));t.classList.toggle('warn',r<300)}
if(r<=0){stopTimer();$('#modal').hidden=true;finish(true)}}
document.addEventListener('visibilitychange',tick);
function finishAsk(){var u=S.ex.questions.length-Object.keys(S.ans).length;ask('پایان و ثبت آزمون؟',u?'شما '+fa(u)+' سوال را بدون پاسخ رها کرده‌اید.':'به همهٔ سوالات پاسخ داده‌اید.','ثبت و مشاهده نتیجه',function(){finish(false)})}
function finish(auto){var e=S.ex,c=0,w=0,u=0,cats={},st=Store.get('st',{});stopTimer();
e.questions.forEach(function(q){var k=cats[q.category]||(cats[q.category]={t:0,c:0}),a=S.ans[q.id],sk=q.k||e.id+'-'+q.id,s=st[sk]||(st[sk]=[0,0]);k.t++;
if(a===undefined)u++;else if(a===q.correct){c++;k.c++;s[0]++}else{w++;s[1]++}});
var p=c>=pass(e);S.done=true;S.res={c:c,w:w,u:u,p:p,cats:cats,auto:!!auto};Store.del('session');Store.set('st',st);
if(S.pr){Store.set('st',st);rf='all';go('#/result');if(location.hash==='#/result')route();return}var R=Store.get('res',{}),o=R[e.id]||{tries:0,best:0};o.tries++;o.best=Math.max(o.best,c);o.last={c:c,t:e.questions.length,p:p,d:Date.now()};R[e.id]=o;Store.set('res',R);
var H=Store.get('hist',[]);H.push({id:e.id,c:c,t:e.questions.length,d:Date.now()});Store.set('hist',H.slice(-200));rf='all';go('#/result');if(location.hash==='#/result')route()}
/* ---------- result ---------- */
function resultH(){var e=S.ex,r=S.res,t=e.questions.length,pct=Math.round(r.c/t*100);
var h='<div class="card hero" style="background:'+(r.p?'linear-gradient(135deg,#059669,#0f766e)':'linear-gradient(135deg,#dc2626,#be123c)')+'"><h2 style="margin:0">'+(r.p?'تبریک! قبول شدید 🎉':'حد نصاب قبولی کسب نشد')+'</h2><p style="margin:4px 0">'+(r.auto?'زمان آزمون تمام شد. ':'')+'پاسخ صحیح: '+fa(r.c)+' از '+fa(t)+' ('+fa(pct)+'٪) · حد نصاب: '+fa(pass(e))+'</p><div class="row"><span>درست: '+fa(r.c)+'</span><span>نادرست: '+fa(r.w)+'</span><span>بدون پاسخ: '+fa(r.u)+'</span></div></div>';
h+='<div class="card"><b>تحلیل عملکرد دسته‌ها</b>'+Object.keys(r.cats).map(function(k){var x=r.cats[k],q=Math.round(x.c/x.t*100);return '<div class="row mu"><span>'+esc(k)+'</span><span>'+fa(x.c)+'/'+fa(x.t)+'</span></div><div class="pb"><div style="width:'+q+'%;background:'+(q>=80?'var(--ok)':q>=50?'var(--wa)':'var(--no)')+'"></div></div>'}).join('')+'</div>';
h+='<div class="row" style="margin-bottom:10px">'+(S.pr?'':'<button class="btn pri" style="flex:1" data-act="'+(e.id==='rnd'?'rnd':'start')+'" data-id="'+e.id+'">'+(e.id==='rnd'?'آزمون تصادفی جدید':'تکرار آزمون')+'</button><button class="btn" style="flex:1" data-act="share">اشتراک</button>')+'<button class="btn" style="flex:1" data-act="home">بازگشت به آزمون‌ها</button></div>';
h+='<div class="card"><b>مرور و پاسخ تشریحی</b><div class="tabs2">'+[['all','همه'],['wrong','اشتباهات'],['bm','نشان‌شده‌ها']].map(function(f){return '<button class="'+(rf===f[0]?'on':'')+'" data-act="flt" data-f="'+f[0]+'">'+f[1]+'</button>'}).join('')+'</div>'+reviewH()+'</div>';return h}
function reviewH(){var e=S.ex,h='';e.questions.forEach(function(q,i){var a=S.ans[q.id],ok=a===q.correct,bad=a!==undefined&&!ok;
if(rf==='wrong'&&ok)return;if(rf==='bm'&&S.bm.indexOf(q.id)<0)return;
h+='<div class="rv" style="border-top:1px solid var(--bd);padding:10px 0"><div class="row"><b>'+fa(i+1)+'. '+esc(q.text)+'</b><span class="chip '+(a===undefined?'':ok?'ok':'no')+'">'+(a===undefined?'بدون پاسخ':ok?'صحیح':'نادرست')+'</span></div>'+(q.image?'<img class="zm" loading="lazy" src="'+esc(q.image)+'" alt="تصویر سوال" onerror="this.className=\'bad\'">':'')+
'<div class="ok">✓ '+optT(q.options[q.correct])+'</div>'+(bad?'<div class="no">✗ '+optT(q.options[a])+'</div>':'')+(q.explanation?'<div class="ex">'+esc(q.explanation)+'</div>':'')+'</div>'});
return h||'<p class="mu">موردی برای نمایش نیست.</p>'}

/* ---------- practice ---------- */
var fl=[],fi=0,fv=false;
function stats(){var st=Store.get('st',{}),b=bank(),cats={},tot=0,ok=0;Object.keys(st).forEach(function(k){var q=b[k];if(!q)return;var c=cats[q.category]||(cats[q.category]={c:0,w:0});c.c+=st[k][0];c.w+=st[k][1];ok+=st[k][0];tot+=st[k][0]+st[k][1]});return {cats:cats,tot:tot,ok:ok,st:st,b:b}}
function lnk(h,t,d){return '<a class="card" href="'+h+'" style="display:block;text-decoration:none;color:inherit"><b>'+t+'</b><div class="mu">'+d+'</div></a>'}
var BK='<a class="btn" href="#/practice" style="display:inline-block;margin-bottom:10px">‹ بازگشت به تمرین‌ها</a>';
function practiceH(r){if(r==='#/practice/wrong')return BK+wrongH();if(r==='#/practice/facts')return BK+factsH();if(r==='#/practice/tips')return BK+tipsH();if(r==='#/practice/priority')return BK+PRI.html();
var s=stats(),h='<div class="grid"><div class="card row"><b>آزمون تصادفی ۳۰ سوالی</b><button class="btn pri" data-act="rnd">شروع</button></div>'+lnk('#/practice/wrong','۱) سوالات اشتباه من','به ترتیب بیشترین غلط')+lnk('#/practice/priority','۲) حق تقدم','آموزش و شبیه‌ساز تصادفی')+lnk('#/practice/facts','۳) سرعت و فاصله‌ها','فلش‌کارت و جدول مرجع')+lnk('#/practice/tips','۴) نکات آزمون شهری','قبل از حرکت، نکات طلایی، اشتباهات')+'<div class="card lk"><b>۵) بازی رانندگی</b><div class="mu">به‌زودی</div></div></div>';
h+='<div class="card"><b>آمار من</b>';if(!s.tot)return h+'<p class="mu">بعد از اولین آزمون یا تمرین، آمار اینجا نمایش داده می‌شود.</p></div>';
h+='<p class="mu">پاسخ‌ها: '+fa(s.tot)+' · دقت کلی: '+fa(Math.round(s.ok/s.tot*100))+'٪</p>';
Object.keys(s.cats).map(function(k){var c=s.cats[k];return {k:k,n:c.c+c.w,p:Math.round(c.c/(c.c+c.w)*100)}}).filter(function(x){return x.n>=3}).sort(function(a,b){return a.p-b.p}).slice(0,4).forEach(function(x){h+='<div class="row mu"><span>'+esc(x.k)+'</span><span>'+fa(x.p)+'٪</span></div><div class="pb"><div style="width:'+x.p+'%;background:'+(x.p>=80?'var(--ok)':x.p>=50?'var(--wa)':'var(--no)')+'"></div></div>'});
var H=Store.get('hist',[]).slice(-8);if(H.length){h+='<div class="mu">آخرین نتایج</div><div class="row" style="align-items:flex-end;height:60px">'+H.map(function(x){return '<div title="'+x.c+'/'+x.t+'" style="flex:1;margin:0 2px;height:'+Math.round(x.c/x.t*100)+'%;background:var(--pr);border-radius:4px"></div>'}).join('')+'</div>'}
return h+'</div>'}
function wrongList(){var s=stats(),l=[];Object.keys(s.st).forEach(function(k){if(s.st[k][1]>0&&s.b[k])l.push({q:s.b[k],w:s.st[k][1]})});return l.sort(function(a,b){return b.w-a.w})}
function wrongH(){var l=wrongList();if(!l.length)return infoH('سوالات اشتباه','هنوز سوال اشتباهی ثبت نشده است.');
return '<div class="card"><b>'+fa(l.length)+' سوال اشتباه</b><p><button class="btn pri" data-act="prw" style="width:100%">شروع تمرین ('+fa(Math.min(30,l.length))+' سوال پرغلط)</button></p></div>'+l.slice(0,30).map(function(x){return '<div class="card row"><span>'+esc(x.q.text)+'</span><span class="chip no">'+fa(x.w)+'×</span></div>'}).join('')}
function factsH(){if(!fl.length){fl=(window.FACTS||[]).slice().sort(function(){return Math.random()-.5});fi=0;fv=false}var f=fl[fi],h='<div class="card fc">'+(f?'<div class="mu">'+esc(f.c)+' · '+fa(fi+1)+'/'+fa(fl.length)+'</div><p><b>'+esc(f.q)+'</b></p>'+(fv?'<p class="ok" style="font-size:20px">'+esc(f.a)+'</p>'+nt(f.n)+'<button class="btn pri" data-act="nf">بعدی ›</button>':'<button class="btn pri" data-act="rv">نمایش پاسخ</button>'):'داده‌ای نیست')+'</div>',g={};
(window.FACTS||[]).forEach(function(x){(g[x.c]=g[x.c]||[]).push(x)});
Object.keys(g).forEach(function(c){h+='<details><summary>'+esc(c)+'</summary>'+g[c].map(function(x){return '<div class="row"><span>'+esc(x.q)+'</span><b>'+esc(x.a)+'</b></div>'+nt(x.n)}).join('')+'</details>'});return h}
function nt(n){return n?'<div class="'+(n[0]==='✓'?'ok':n[0]==='⚠'?'wn':'mu')+'" style="font-size:12px">'+esc(n)+'</div>':''}
function tipsH(){return (window.TIPS||[]).map(function(t){return '<details open><summary>'+esc(t[0])+'</summary><ul>'+t[1].map(function(i){return '<li>'+esc(i)+'</li>'}).join('')+'</ul></details>'}).join('')}
function share(){var e=S.ex,r=S.res,t=e.title+': '+fa(r.c)+' از '+fa(e.questions.length)+(r.p?' ✅ قبول':' ❌');if(navigator.share)navigator.share({text:t}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){ask('کپی شد',t,'باشه')})}
/* ---------- events ---------- */
document.addEventListener('click',function(ev){var t=ev.target;
if(t.classList&&t.classList.contains('zm')){$('#zoom').innerHTML='<img src="'+esc(t.src)+'" alt="'+esc(t.alt)+'">';$('#zoom').hidden=false;return}
var b=t.closest&&t.closest('[data-act]');if(!b)return;var a=b.getAttribute('data-act'),i=+b.getAttribute('data-i');
if(a==='start')start(+b.getAttribute('data-id'));
else if(a==='resume'){S=null;go('#/quiz');if(location.hash==='#/quiz')route()}
else if(a==='home')go(S&&S.pr?'#/practice':'#/')
else if(a==='opt'){if(S.pr&&S.ans[Q().id]!==undefined)return;S.ans[Q().id]=i;save();sync()}
else if(a==='pal')nav(i);
else if(a==='bm'){var id=Q().id,k=S.bm.indexOf(id);k>-1?S.bm.splice(k,1):S.bm.push(id);save();sync()}
else if(a==='pv'){PRI.tap(i);render()}else if(a==='pn'){PRI.next();render()}else if(a==='pc'){PRI.clear();render()}else if(a==='rnd')rnd();else if(a==='share')share();else if(a==='rv'){fv=true;render()}else if(a==='nf'){fi=(fi+1)%fl.length;fv=false;render()}
else if(a==='prw'){var l=wrongList().slice(0,30).map(function(x){return x.q});if(l.length)begin({id:'pr',title:'تمرین سوالات اشتباه',duration:0,questions:l},true)}
else if(a==='flt'){rf=b.getAttribute('data-f');render()}});
document.addEventListener('change',function(e){if(e.target.id==='shuf')Store.set('shuf',e.target.checked)});
$('#zoom').onclick=function(){this.hidden=true};
$('#pv').onclick=function(){nav(S.idx-1)};$('#nx').onclick=function(){nav(S.idx+1)};$('#fin').onclick=finishAsk;
$('#exitBtn').onclick=function(){go(S&&S.pr?'#/practice':'#/')};
$('#themeBtn').onclick=function(){var d=document.documentElement,n=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=n;Store.set('theme',n)};
window.addEventListener('hashchange',route);
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js').catch(function(){});
route();
})();
