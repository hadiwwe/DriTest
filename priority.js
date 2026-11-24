/* شبیه‌ساز حق تقدم (مدل ساده‌شده، بدون چراغ راهنمایی) */
(function(){
var ROT={SE:'SW',SW:'NW',NW:'NE',NE:'SE'},BASE={S:['SE','NE'],R:['SE'],L:['SE','NE','NW']};
var TN={car:'سواری',moto:'موتورسیکلت',bike:'دوچرخه',amb:'آمبولانس'},DN=['شمال','شرق','جنوب','غرب'],MN={S:'مستقیم',R:'به راست',L:'به چپ'};
function quads(v){var q=BASE[v.t].slice(),n=(v.e+2)%4;while(n--)q=q.map(function(x){return ROT[x]});return q}
function conf(a,b){if((a.e+2)%4===b.e&&a.t==='L'&&b.t==='L')return false;var x=quads(a);return quads(b).some(function(y){return x.indexOf(y)>-1})}
function who(a,b){var m='خودروی امدادی در مأموریت بر همه حق تقدم دارد';
if(a.k==='amb'!==(b.k==='amb'))return {w:a.k==='amb'?a:b,r:m};
if(!!a.sg!==!!b.sg)return {w:a.sg?b:a,r:'دارندهٔ تابلو یا خط ایست / رعایت حق تقدم باید به وسیله‌ای که تابلو ندارد حق تقدم بدهد'};
if((a.e+2)%4===b.e){if(a.t==='L'&&b.t!=='L')return {w:b,r:'گردش به چپ باید به وسیلهٔ روبه‌رو (مستقیم یا راست‌گرد) حق تقدم بدهد'};if(b.t==='L'&&a.t!=='L')return {w:a,r:'گردش به چپ باید به وسیلهٔ روبه‌رو (مستقیم یا راست‌گرد) حق تقدم بدهد'};return null}
if((a.e+3)%4===b.e)return {w:b,r:'در تقاطع بدون علامت، حق تقدم با وسیلهٔ سمت راست است'};
if((b.e+3)%4===a.e)return {w:a,r:'در تقاطع بدون علامت، حق تقدم با وسیلهٔ سمت راست است'};return null}
function blockers(v,rem){return rem.filter(function(o){if(o===v||!conf(v,o))return false;var w=who(v,o);return w&&w.w===o})}
function order(vs){var rem=vs.slice(),g=[];while(rem.length){var f=rem.filter(function(v){return !blockers(v,rem).length});if(!f.length)return null;g.push(f);rem=rem.filter(function(v){return f.indexOf(v)<0})}return g}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function gen(){for(var t=0;t<300;t++){var m=Math.random()<.4?Math.floor(Math.random()*4):-1,en=[0,1,2,3].filter(function(e){return e!==m}).sort(function(){return Math.random()-.5}),n=2+Math.floor(Math.random()*Math.min(3,en.length-1)),vs=[],amb=Math.random()<.2;
en.slice(0,n).forEach(function(e,i){var ts=['S','R','L'].filter(function(t){var x=t==='S'?(e+2)%4:t==='R'?(e+3)%4:(e+1)%4;return x!==m}),v={e:e,t:pick(ts),k:pick(['car','car','moto','bike']),sg:0};if(amb&&i===0)v.k='amb';else if(Math.random()<.25)v.sg=pick(['stop','yield']);vs.push(v)});
var ok=false,bad=false;vs.forEach(function(a,i){vs.forEach(function(b,j){if(j>i&&conf(a,b)){ok=true;if(!who(a,b))bad=true}})});
if(ok&&!bad&&order(vs))return {m:m,vs:vs}}return null}
function rot(x,y,a){var r=a*Math.PI/180,dx=x-160,dy=y-160;return [160+dx*Math.cos(r)-dy*Math.sin(r),160+dx*Math.sin(r)+dy*Math.cos(r)]}
var COL=['#2563eb','#eab308','#16a34a','#9333ea','#ea580c'];
function body(v,i){if(v.k==='amb')return '<rect x="181" y="230" width="18" height="36" rx="4" fill="#fff" stroke="#999"/><rect x="185" y="246" width="10" height="3" fill="#dc2626"/><rect x="188.5" y="242.5" width="3" height="10" fill="#dc2626"/><circle cx="186" cy="233" r="2.5" fill="#dc2626"/><circle cx="194" cy="233" r="2.5" fill="#2563eb"/>';
if(v.k==='moto')return '<rect x="186" y="234" width="8" height="28" rx="3" fill="'+COL[i]+'"/><circle cx="190" cy="236" r="4" fill="#111"/>';
if(v.k==='bike')return '<circle cx="190" cy="238" r="5" fill="none" stroke="'+COL[i]+'" stroke-width="2"/><circle cx="190" cy="258" r="5" fill="none" stroke="'+COL[i]+'" stroke-width="2"/><line x1="190" y1="243" x2="190" y2="253" stroke="'+COL[i]+'" stroke-width="2"/>';
return '<rect x="182" y="232" width="16" height="32" rx="5" fill="'+COL[i]+'"/><rect x="185" y="238" width="10" height="7" fill="#bfdbfe"/>'}
function arrow(t){return t==='S'?'M190 226 L190 192':t==='R'?'M190 226 Q190 206 214 206':'M190 226 L190 198 Q190 178 164 178'}
function svg(sc,done){var s='<svg viewBox="0 0 320 320" role="img" aria-label="تقاطع" style="width:100%;max-width:340px;display:block;margin:auto;border-radius:14px"><defs><marker id="ar" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="#fbbf24"/></marker></defs><rect width="320" height="320" fill="#3f8f3f"/>';
[0,1,2,3].forEach(function(e){if(e===sc.m)return;var a=((e+2)%4)*90;s+='<g transform="rotate('+a+' 160 160)"><rect x="110" y="210" width="100" height="110" fill="#333" stroke="#bbb" stroke-width="4"/><line x1="160" y1="212" x2="160" y2="320" stroke="#eee" stroke-width="2" stroke-dasharray="14 10"/></g>'});
s+='<rect x="112" y="112" width="96" height="96" fill="#333"/>';
if(sc.m>=0){var a=((sc.m+2)%4)*90;s+='<g transform="rotate('+a+' 160 160)"><rect x="106" y="208" width="108" height="6" fill="#bbb"/></g>'}
sc.vs.forEach(function(v,i){var a=((v.e+2)%4)*90,d=done.indexOf(i)>-1,p=rot(190,292,a);
s+='<g data-act="pv" data-i="'+i+'" style="cursor:pointer;opacity:'+(d?.35:1)+'" role="button" aria-label="وسیلهٔ '+(i+1)+'"><g transform="rotate('+a+' 160 160)">'+(v.sg?'<line x1="160" y1="221" x2="210" y2="221" stroke="#fff" stroke-width="3"/>':'')+body(v,i)+'<path d="'+arrow(v.t)+'" fill="none" stroke="#fbbf24" stroke-width="3" marker-end="url(#ar)"/>'+
(v.sg==='stop'?'<polygon points="207,252 211,248 217,248 221,252 221,258 217,262 211,262 207,258" fill="#dc2626" stroke="#fff"/>':v.sg==='yield'?'<polygon points="206,250 222,250 214,264" fill="#fff" stroke="#dc2626" stroke-width="3"/>':'')+'</g><circle cx="'+p[0]+'" cy="'+p[1]+'" r="13" fill="#111" stroke="#fff"/><text x="'+p[0]+'" y="'+(p[1]+5)+'" fill="#fff" font-size="14" text-anchor="middle">'+(i+1)+'</text></g>'});
return s+'</svg>'}
function name(v,i){return 'وسیلهٔ '+(i+1)+' ('+TN[v.k]+' از '+DN[v.e]+'، '+MN[v.t]+(v.sg?'، '+(v.sg==='stop'?'تابلوی ایست':'تابلوی رعایت حق تقدم'):'')+')'}
window.Pri={gen:gen,svg:svg,order:order,blockers:blockers,who:who,name:name,
lessons:['خودروی امدادی (آمبولانس، آتش‌نشانی، پلیس) در مأموریت بر همهٔ وسایل حق تقدم دارد.','دارندهٔ تابلو یا خط ایست / رعایت حق تقدم باید به وسیله‌ای که تابلو ندارد حق تقدم بدهد.','در تقاطع بدون علامت، حق تقدم با وسیله‌ای است که در سمت راست قرار دارد.','وسیلهٔ گردش‌کننده به چپ باید به وسیلهٔ روبه‌رو (مستقیم یا راست‌گرد) حق تقدم بدهد.','اگر مسیر دو وسیله با هم تداخل ندارد، می‌توانند هم‌زمان عبور کنند.','نوع وسیله (سواری، موتورسیکلت، دوچرخه) در حق تقدم اثری ندارد؛ فقط امدادی استثناست.','چراغ راهنمایی یا فرمان پلیس بر همهٔ این قواعد مقدم است (این شبیه‌ساز بدون چراغ است).']};
})();
/* واسط کاربری شبیه‌ساز حق تقدم (به app.js متصل است) */
(function(){var P=window.Pri,st={sc:null,done:[],err:0,msg:''};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fa=function(n){return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})};
function fresh(){var s=null,k=0;while(!s&&k++<20)s=P.gen();st.sc=s;st.done=[];st.err=0;st.msg=''}
function reasons(sc){var r=[];sc.vs.forEach(function(v,i){P.blockers(v,sc.vs).forEach(function(o){var w=P.who(v,o);if(w&&r.indexOf(w.r)<0)r.push(w.r)})});return r}
window.PRI={
html:function(){if(!st.sc)fresh();var sc=st.sc,h='<div class="card"><b>آموزش حق تقدم</b><details><summary>قواعد (ضربه بزنید)</summary><ul>'+P.lessons.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></details></div>';
if(!sc)return h+'<div class="card">ساخت سناریو ممکن نشد؛ دوباره امتحان کنید.<p><button class="btn pri" data-act="pn">سناریوی جدید</button></p></div>';
var all=st.done.length===sc.vs.length;
h+='<div class="card"><p class="mu">وسایل را به ترتیب عبور (اول کسی که باید ابتدا برود) لمس کنید. اشتباهات: '+fa(st.err)+'</p>'+P.svg(sc,st.done)+'<div>'+sc.vs.map(function(v,i){var d=st.done.indexOf(i)>-1;return '<button class="btn" data-act="pv" data-i="'+i+'" style="margin:3px;'+(d?'opacity:.4':'')+'">'+esc(P.name(v,i))+(d?' ✓ ('+fa(st.done.indexOf(i)+1)+')':'')+'</button>'}).join('')+'</div>'+(st.msg?'<div class="ex no">'+esc(st.msg)+'</div>':'');
if(all)h+='<div class="ex"><b>✅ ترتیب درست است.</b><ul>'+reasons(sc).map(function(r){return '<li>'+esc(r)+'</li>'}).join('')+'</ul></div>';
return h+'<div class="row" style="margin-top:8px"><button class="btn" data-act="pc" style="flex:1">پاک کردن</button><button class="btn pri" data-act="pn" style="flex:1">'+(all?'سناریوی بعدی':'رد کردن')+'</button></div></div>'},
tap:function(i){var sc=st.sc;if(!sc||st.done.indexOf(i)>-1||st.done.length===sc.vs.length)return;
var rem=sc.vs.filter(function(v,k){return st.done.indexOf(k)<0}),v=sc.vs[i],bl=P.blockers(v,rem);
if(bl.length){st.err++;st.msg='❌ '+P.name(v,i)+': '+P.who(v,bl[0]).r}else{st.done.push(i);st.msg=''}},
next:function(){fresh()},clear:function(){st.done=[];st.msg=''}};
})();
