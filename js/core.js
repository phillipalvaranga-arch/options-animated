'use strict';
/* ===== Options Academy core: state, math, drawing, quiz, voice, celebrations ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=(v,d=2)=>(v<0?'−$':'$')+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const smoney=(v,d=0)=>(v>0?'+':'')+money(v,d);
const r2=v=>Math.round(v*100)/100;
/* ---------- saved progress (this device only) ---------- */
const KEY='oa2';
const ST=Object.assign({done:{},quiz:{},mist:{},badges:{},cards:{},seen:0,exam:{best:null,tries:0},lab:0,voice:false,fixed:0,last:null},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>{localStorage.setItem(KEY,JSON.stringify(ST));if(window.hdr)hdr()};
/* ---------- timers cleared on every page change ---------- */
let TIMERS=[];const every=(f,ms)=>{const t=setInterval(f,ms);TIMERS.push(t);return t};
const later=(f,ms)=>{const t=setTimeout(f,ms);TIMERS.push(t);return t};
const clearTimers=()=>{TIMERS.forEach(t=>{clearInterval(t);clearTimeout(t)});TIMERS=[]};

/* ---------- MATH: Black-Scholes (r = 0, no dividends, for teaching) ---------- */
function Ncdf(x){/* Abramowitz-Stegun 26.2.17, error < 7.5e-8 */const t=1/(1+.2316419*Math.abs(x)),d=.3989422804*Math.exp(-x*x/2),p=d*t*(.31938153+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>0?1-p:p}
const npdf=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function bs(S,K,T,v,call=true,r=0){
  if(T<=0||v<=0){const iv=call?Math.max(S-K,0):Math.max(K-S,0);return{price:iv,delta:call?(S>K?1:0):(S<K?-1:0),gamma:0,theta:0,vega:0}}
  const sq=Math.sqrt(T),d1=(Math.log(S/K)+(r+v*v/2)*T)/(v*sq),d2=d1-v*sq;
  const price=call?S*Ncdf(d1)-K*Math.exp(-r*T)*Ncdf(d2):K*Math.exp(-r*T)*Ncdf(-d2)-S*Ncdf(-d1);
  return{price:Math.max(price,0),delta:call?Ncdf(d1):Ncdf(d1)-1,gamma:npdf(d1)/(S*v*sq),
    theta:(-(S*npdf(d1)*v)/(2*sq)-(call?1:-1)*r*K*Math.exp(-r*T)*Ncdf(call?d2:-d2))/365,vega:S*npdf(d1)*sq/100}}
/* legs: {t:'c'|'p'|'s', q:+1 long/-1 short, K:strike (or stock entry price), pr: premium per share, d: days to expiry, v: IV}
   value of a strategy (P/L in dollars, 100 shares per contract) when the stock is S and `el` days have passed */
function legPL(l,S,el=null){
  if(l.t==='s')return l.q*(S-l.K)*100;
  const left=el==null?0:(l.d||0)-el;
  const val=left<=0?(l.t==='c'?Math.max(S-l.K,0):Math.max(l.K-S,0)):bs(S,l.K,left/365,l.v||.3,l.t==='c').price;
  return l.q*(val-l.pr)*100}
const PL=(legs,S,el=null)=>legs.reduce((a,l)=>a+legPL(l,S,el),0);
const firstExp=legs=>{const ds=legs.filter(l=>l.t!=='s'&&l.d).map(l=>l.d);return ds.length?Math.min(...ds):null};
const isMulti=legs=>{const ds=new Set(legs.filter(l=>l.t!=='s').map(l=>l.d||0));return ds.size>1};
/* P/L at the (first) expiration */
const expPL=(legs,S)=>isMulti(legs)?PL(legs,S,firstExp(legs)):PL(legs,S,null);
/* breakevens: scan in 1-cent steps; payoff is straight between strikes, so interpolation is exact */
function breakevens(legs,lo=0.01,hi=null){
  const Ks=legs.map(l=>l.K);hi=hi||Math.max(...Ks)*3;const out=[];const step=isMulti(legs)?.05:.01;
  let prev=expPL(legs,lo),ps=lo;
  for(let s=lo+step;s<=hi;s+=step){const v=expPL(legs,s);
    if(Math.abs(v)<1e-9){if(!out.length||Math.abs(out[out.length-1]-s)>.02)out.push(r2(s))}
    else if(prev*v<0&&Math.abs(prev)>1e-9){const z=ps+(s-ps)*(-prev)/(v-prev);out.push(r2(z))}
    prev=v;ps=s}
  return [...new Set(out)]}
function extremes(legs){
  const Ks=legs.map(l=>l.K),hi=Math.max(...Ks)*3;let mx=-Infinity,mn=Infinity;
  for(let s=0;s<=hi;s+=.05){const v=expPL(legs,s);if(v>mx)mx=v;if(v<mn)mn=v}
  const big=Math.max(...Ks)*10,slope=expPL(legs,big+1)-expPL(legs,big);
  return{maxProfit:slope>1e-6?Infinity:r2(mx),maxLoss:slope<-1e-6?-Infinity:r2(mn)}}

/* ---------- SVG drawing kit ---------- */
const W=600;
const svg=(b,h=300,cls='')=>`<svg class="art ${cls}" viewBox="0 0 ${W} ${h}" xmlns="http://www.w3.org/2000/svg" role="img">${b}</svg>`;
const T=(x,y,s,c='#e8ecf5',z=18,cls='popin',dl=0,w=700)=>`<text x="${x}" y="${y}" fill="${c}" font-size="${z}" font-weight="${w}" text-anchor="middle" class="${cls}" style="animation-delay:${dl}s">${s}</text>`;
const D=dl=>`style="animation-delay:${dl}s"`;
function guy(x,y,col,name,mood='happy',dl=0,hat=''){
  const m=mood==='happy'?'M-12 8 Q0 20 12 8':mood==='sad'?'M-12 16 Q0 4 12 16':mood==='wow'?'M-6 10 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0':'M-10 12 L10 12';
  return `<g transform="translate(${x},${y})"><g class="popin" ${D(dl)}><g class="bob" ${D(dl)}>
  <rect x="-26" y="34" width="52" height="50" rx="18" fill="${col}"/><rect x="-40" y="44" width="16" height="10" rx="5" fill="${col}" class="wave"/>
  <circle r="34" fill="#f4c58f"/>${hat==='coach'?'<path d="M-36 -14 Q0 -60 36 -14 Z" fill="#22c55e"/><rect x="-40" y="-18" width="80" height="8" rx="4" fill="#15803d"/>':hat==='cap'?'<path d="M-34 -12 Q0 -54 34 -12 Z" fill="#3b82f6"/><rect x="0" y="-16" width="44" height="7" rx="3" fill="#1d4ed8"/>':'<path d="M-34 -8 Q-30 -44 0 -40 Q30 -44 34 -8 Q20 -28 0 -26 Q-20 -28 -34 -8Z" fill="#3b2a1a"/>'}
  <g class="blink"><circle cx="-12" cy="-4" r="5" fill="#111"/><circle cx="12" cy="-4" r="5" fill="#111"/></g>
  <path d="${m}" stroke="#111" stroke-width="3" fill="${mood==='wow'?'#111':'none'}" stroke-linecap="round"/></g>
  ${name?`<text y="104" fill="#cbd5ee" font-size="14" font-weight="700" text-anchor="middle">${name}</text>`:''}</g></g>`}
const coach=(x,y,mood='happy',dl=0)=>guy(x,y,'#16a34a','Coach Ray',mood,dl,'coach');
const newbie=(x,y,mood='happy',dl=0)=>guy(x,y,'#3b82f6','You',mood,dl,'cap');
function bubble(x,y,w,txt,dl=0,dir='l'){const lines=wrap(txt,Math.floor(w/8.6));const h=lines.length*19+16;
  return `<g class="popin" ${D(dl)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff"/><path d="M${dir==='l'?x+18:x+w-18} ${y+h} l${dir==='l'?-14:14} 14 l${dir==='l'?22:-22} -14Z" fill="#fff"/>
  ${lines.map((l,i)=>`<text x="${x+w/2}" y="${y+23+i*19}" font-size="15" font-weight="600" fill="#0b1020" text-anchor="middle">${l}</text>`).join('')}</g>`}
function wrap(t,n){const w=t.split(' '),o=[];let c='';w.forEach(x=>{if((c+' '+x).trim().length>n){o.push(c.trim());c=x}else c+=' '+x});if(c.trim())o.push(c.trim());return o}
const emo=(x,y,e,z=48,cls='popin',dl=0)=>`<text x="${x}" y="${y}" font-size="${z}" text-anchor="middle" class="${cls}" ${D(dl)}>${e}</text>`;
const arrow=(x1,y1,x2,y2,c='#facc15',dl=0,w=4)=>{const a=Math.atan2(y2-y1,x2-x1),h=12;return `<g class="draw" ${D(dl)}><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none" pathLength="1"/><path d="M${x2} ${y2} L${x2-h*Math.cos(a-.5)} ${y2-h*Math.sin(a-.5)} M${x2} ${y2} L${x2-h*Math.cos(a+.5)} ${y2-h*Math.sin(a+.5)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" pathLength="1"/></g>`};
const box=(x,y,w,h,fill,label,tc='#0b1020',z=16,dl=0,cls='popin')=>`<g class="${cls}" ${D(dl)}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}"/>${label?`<text x="${x+w/2}" y="${y+h/2+z/3}" fill="${tc}" font-size="${z}" font-weight="800" text-anchor="middle">${label}</text>`:''}</g>`;
function ticket(x,y,top,bot,col='#facc15',dl=0,cls='popin'){return `<g transform="translate(${x},${y})"><g class="${cls}" ${D(dl)}><path d="M0 0 h150 a12 12 0 0 0 0 24 v28 a12 12 0 0 0 0 24 h-150 a12 12 0 0 0 0 -24 v-28 a12 12 0 0 0 0 -24Z" fill="${col}"/><line x1="112" y1="6" x2="112" y2="70" stroke="#0b1020" stroke-dasharray="4 4"/>
  <text x="56" y="32" font-size="15" font-weight="800" text-anchor="middle" fill="#0b1020">${top}</text><text x="56" y="56" font-size="13" font-weight="700" text-anchor="middle" fill="#0b1020">${bot}</text><text x="132" y="44" font-size="18" text-anchor="middle">🎟️</text></g></g>`}
function coins(x,y,n=4,dl=0,lab='$'){let s='';for(let i=0;i<n;i++)s+=`<g class="dropin" ${D(dl+i*.18)}><ellipse cx="${x}" cy="${y-i*10}" rx="22" ry="8" fill="#eab308" stroke="#a16207" stroke-width="2"/></g>`;return s+`<text x="${x}" y="${y-n*10-4}" font-size="16" font-weight="800" fill="#facc15" text-anchor="middle" class="popin" ${D(dl+n*.18)}>${lab}</text>`}
function flyCoin(x1,y1,x2,y2,dl=0,dur=1.4){return `<g><circle r="12" fill="#eab308" stroke="#a16207" stroke-width="2" opacity="0"><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/><animateMotion dur="${dur}s" begin="${dl}s" repeatCount="indefinite" path="M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-70} ${x2} ${y2}"/></circle></g>`}
function flyDoc(x1,y1,x2,y2,dl=0,dur=1.6,e='📜'){return `<text font-size="30" text-anchor="middle" opacity="0">${e}<animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/><animateMotion dur="${dur}s" begin="${dl}s" repeatCount="indefinite" path="M${x1} ${y1} Q${(x1+x2)/2} ${Math.max(y1,y2)+60} ${x2} ${y2}"/></text>`}
/* line chart helper: pts = prices */
function lineChart(pts,{x0=60,x1=560,y0=40,y1=230,lo=null,hi=null,col='#4ade80',dl=0,K=null,Klab='Strike',dot=true}={}){
  lo=lo??Math.min(...pts,K??Infinity)-3;hi=hi??Math.max(...pts,K??-Infinity)+3;
  const X=i=>x0+(x1-x0)*i/(pts.length-1),Y=v=>y1-(y1-y0)*(v-lo)/(hi-lo||1);
  const d=pts.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  let s=`<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#334155"/>`;
  if(K!=null)s+=`<g class="popin" ${D(dl)}><line x1="${x0}" x2="${x1}" y1="${Y(K)}" y2="${Y(K)}" stroke="#facc15" stroke-dasharray="8 6" stroke-width="2"/><text x="${x0+4}" y="${Y(K)-6}" fill="#facc15" font-size="14" font-weight="700">${Klab} $${K}</text></g>`;
  s+=`<path d="${d}" stroke="${col}" stroke-width="4" fill="none" class="draw" pathLength="1" style="animation-delay:${dl}s;animation-duration:2.2s" stroke-linejoin="round"/>`;
  if(dot)s+=`<circle r="7" fill="${col}"><animateMotion dur="2.2s" begin="${dl}s" fill="freeze" path="${d}"/></circle>`;
  return{s,X,Y}}
function calendarIcon(x,y,top,big,dl=0){return `<g transform="translate(${x},${y})"><g class="popin" ${D(dl)}><rect x="-45" y="-40" width="90" height="90" rx="10" fill="#fff"/><rect x="-45" y="-40" width="90" height="26" rx="10" fill="#ef4444"/><text y="-21" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${top}</text><text y="30" font-size="34" font-weight="800" fill="#0b1020" text-anchor="middle">${big}</text></g></g>`}
function iceCube(x,y,lab,dl=0){return `<g transform="translate(${x},${y})"><g class="melt" ${D(dl)}><rect x="-80" y="-140" width="160" height="140" rx="18" fill="#93c5fd" opacity=".9"/><rect x="-60" y="-125" width="30" height="60" rx="10" fill="#fff" opacity=".5"/><text y="-60" font-size="22" font-weight="800" fill="#0b1020" text-anchor="middle">${lab}</text></g><ellipse cy="6" rx="90" ry="10" fill="#60a5fa" opacity=".6" class="puddle" ${D(dl)}/></g>`}
function gauge(x,y,val,lab,col='#4ade80',dl=0){/* val 0..1 */const a=-Math.PI+Math.PI*val;return `<g transform="translate(${x},${y})"><g class="popin" ${D(dl)}><path d="M-80 0 A80 80 0 0 1 80 0" stroke="#243056" stroke-width="16" fill="none"/><path d="M-80 0 A80 80 0 0 1 80 0" stroke="${col}" stroke-width="16" fill="none" pathLength="1" stroke-dasharray="${val} 1" class="grow"/>
 <line x1="0" y1="0" x2="${(66*Math.cos(a)).toFixed(1)}" y2="${(66*Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="5" stroke-linecap="round" class="needle"/><circle r="8" fill="#fff"/><text y="34" font-size="16" font-weight="800" fill="#e8ecf5" text-anchor="middle">${lab}</text></g></g>`}

/* ---------- Payoff diagram (static string or interactive) ---------- */
function payoffSVG(legs,o={}){
  const lo=o.lo??Math.round(Math.min(...legs.map(l=>l.K))*.75),hi=o.hi??Math.round(Math.max(...legs.map(l=>l.K))*1.25),h=o.h||320;
  const xs=[];const N=240;for(let i=0;i<=N;i++)xs.push(lo+(hi-lo)*i/N);legs.forEach(l=>{if(l.K>lo&&l.K<hi)xs.push(l.K)});xs.sort((a,b)=>a-b);
  const ys=xs.map(s=>expPL(legs,s));let ty=null;if(o.today!=null)ty=xs.map(s=>PL(legs,s,o.today));
  let yl=Math.min(...ys,...(ty||[]),-50),yh=Math.max(...ys,...(ty||[]),50);const pad=(yh-yl)*.14;yl-=pad;yh+=pad;
  const x0=64,x1=584,y0=24,y1=h-46;const X=s=>x0+(x1-x0)*(s-lo)/(hi-lo),Y=v=>y1-(y1-y0)*(v-yl)/(yh-yl);
  const d=xs.map((s,i)=>(i?'L':'M')+X(s).toFixed(1)+' '+Y(ys[i]).toFixed(1)).join('');
  const area=`M${X(xs[0])} ${Y(0)} `+xs.map((s,i)=>'L'+X(s).toFixed(1)+' '+Y(ys[i]).toFixed(1)).join(' ')+` L${X(xs[xs.length-1])} ${Y(0)} Z`;
  const id='c'+Math.random().toString(36).slice(2,8);let s=`<defs><clipPath id="${id}u"><rect x="0" y="0" width="${W}" height="${Y(0)}"/></clipPath><clipPath id="${id}d"><rect x="0" y="${Y(0)}" width="${W}" height="${h}"/></clipPath></defs>`;
  s+=`<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="#0c142b" rx="6"/>`;
  // grid & labels
  const ys0=niceStep((yh-yl)/5);for(let v=Math.ceil(yl/ys0)*ys0;v<=yh;v+=ys0){s+=`<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="#1e2a4a"/><text x="${x0-6}" y="${Y(v)+4}" font-size="14" fill="#7d8db0" text-anchor="end">${v<0?'−':''}$${Math.abs(Math.round(v)).toLocaleString('en-US')}</text>`}
  const step=niceStep((hi-lo)/6);for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)s+=`<text x="${X(v)}" y="${y1+16}" font-size="14" fill="#7d8db0" text-anchor="middle">$${+v.toFixed(2)}</text>`;
  s+=`<text x="${(x0+x1)/2}" y="${h-8}" font-size="15" fill="#9fb0d0" text-anchor="middle">Stock price at expiration →</text><text x="14" y="${(y0+y1)/2}" font-size="15" fill="#9fb0d0" text-anchor="middle" transform="rotate(-90 14 ${(y0+y1)/2})">Profit / loss ($)</text>`;
  s+=`<path d="${area}" fill="#22c55e33" clip-path="url(#${id}u)" class="fadein"/><path d="${area}" fill="#ef444433" clip-path="url(#${id}d)" class="fadein"/>`;
  s+=`<line x1="${x0}" x2="${x1}" y1="${Y(0)}" y2="${Y(0)}" stroke="#94a3b8" stroke-width="1.5"/>`;
  legs.filter(l=>l.t!=='s').forEach(l=>{if(l.K>=lo&&l.K<=hi)s+=`<line x1="${X(l.K)}" x2="${X(l.K)}" y1="${y0}" y2="${y1}" stroke="#facc1555" stroke-dasharray="4 4"/><text x="${X(l.K)}" y="${y0+12}" font-size="14" fill="#facc15" text-anchor="middle">K ${l.K}</text>`});
  if(ty){const td=xs.map((x,i)=>(i?'L':'M')+X(x).toFixed(1)+' '+Y(ty[i]).toFixed(1)).join('');s+=`<path d="${td}" stroke="#60a5fa" stroke-width="2.5" stroke-dasharray="6 5" fill="none"/>`}
  s+=`<path d="${d}" stroke="#facc15" stroke-width="4" fill="none" stroke-linejoin="round" ${o.anim===false?'':'class="draw" pathLength="1" style="animation-duration:1.8s"'}/>`;
  breakevens(legs,Math.max(lo,.01),hi).forEach(b=>{s+=`<g class="popin" style="animation-delay:1.6s"><circle cx="${X(b)}" cy="${Y(0)}" r="7" fill="#fff" stroke="#0b1020" stroke-width="2"/><text x="${X(b)}" y="${Y(0)+24}" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">BE $${b.toFixed(2)}</text></g>`});
  if(o.S0!=null)s+=`<line x1="${X(o.S0)}" x2="${X(o.S0)}" y1="${y0}" y2="${y1}" stroke="#a78bfa" stroke-width="2"/><text x="${X(o.S0)}" y="${y1-6}" font-size="14" fill="#a78bfa" text-anchor="middle">${o.S0lab||'now'} $${(+o.S0).toFixed(2)}</text>`;
  s+=`<g class="cursor" style="display:none"><line class="cl" y1="${y0}" y2="${y1}" stroke="#fff" stroke-width="2"/><circle class="cd" r="8" fill="#fff" stroke="#facc15" stroke-width="3"/><g class="ctag"><rect class="cr" rx="8" height="44" width="170" fill="#0b1020" stroke="#facc15"/><text class="ct1" font-size="13" fill="#e8ecf5" font-weight="700"/><text class="ct2" font-size="14" font-weight="800"/></g></g>`;
  return{html:svg(s,h,'payoff'),X,Y,lo,hi,x0,x1,y0,y1,h}}
const niceStep=r=>{const p=Math.pow(10,Math.floor(Math.log10(r))),m=r/p;return (m<1.5?1:m<3.5?2.5:m<7.5?5:10)*p};
/* interactive: drag a finger / mouse along the chart */
function payoffChart(el,legs,o={}){
  const P=payoffSVG(legs,o);el.innerHTML=P.html+`<div class="pl-read" aria-live="polite"></div>`;const sv=$('svg',el),read=$('.pl-read',el);
  const show=S=>{S=Math.min(P.hi,Math.max(P.lo,S));const v=expPL(legs,S),c=$('.cursor',sv);c.style.display='';const x=P.X(S),y=P.Y(v);
    $('.cl',c).setAttribute('x1',x);$('.cl',c).setAttribute('x2',x);$('.cd',c).setAttribute('cx',x);$('.cd',c).setAttribute('cy',y);
    const tx=Math.min(Math.max(x-85,P.x0),P.x1-170),tyy=Math.max(P.y0+2,Math.min(y-58,P.y1-50));$('.cr',c).setAttribute('x',tx);$('.cr',c).setAttribute('y',tyy);
    const t1=$('.ct1',c),t2=$('.ct2',c);t1.setAttribute('x',tx+10);t1.setAttribute('y',tyy+18);t1.textContent=`Stock at $${S.toFixed(2)}`;
    t2.setAttribute('x',tx+10);t2.setAttribute('y',tyy+37);t2.textContent=`P/L ${smoney(v,2)}`;t2.setAttribute('fill',v>=0?'#4ade80':'#f87171');
    read.innerHTML=`If the stock is <b>$${S.toFixed(2)}</b> at expiration, this trade ${v>=0?'makes':'loses'} <b class="${v>=0?'g':'r'}">${money(Math.abs(v))}</b> ${o.note||''}`;
    if(o.onMove)o.onMove(S,v)};
  const pt=e=>{const p=sv.createSVGPoint();const t=e.touches?e.touches[0]:e;p.x=t.clientX;p.y=t.clientY;const q=p.matrixTransform(sv.getScreenCTM().inverse());return P.lo+(P.hi-P.lo)*(q.x-P.x0)/(P.x1-P.x0)};
  let down=false;sv.style.touchAction='none';sv.style.cursor='ew-resize';
  sv.addEventListener('pointerdown',e=>{down=true;sv.setPointerCapture(e.pointerId);show(pt(e))});
  sv.addEventListener('pointermove',e=>{if(down||e.pointerType==='mouse')show(pt(e))});
  sv.addEventListener('pointerup',()=>down=false);
  show(o.start??(o.S0??(P.lo+P.hi)/2));
  return{show}}
function plSummary(legs){const be=breakevens(legs),x=extremes(legs);
  return `<div class="chips"><span class="chip g">Max profit: <b>${x.maxProfit===Infinity?'Unlimited':money(x.maxProfit)}</b></span><span class="chip r">Max loss: <b>${x.maxLoss===-Infinity?'Unlimited':money(Math.abs(x.maxLoss))}</b></span><span class="chip">Breakeven: <b>${be.map(b=>'$'+b.toFixed(2)).join(' and ')||'none'}</b></span></div>`}

/* ---------- Voice (Web Speech, optional) ---------- */
const Voice={ok:'speechSynthesis' in window,v:null,
  pick(){if(!this.ok)return;const vs=speechSynthesis.getVoices();this.v=vs.find(v=>/en-US/i.test(v.lang)&&/natural|google|aria|jenny|guy|samantha/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null},
  say(t){if(!this.ok||!ST.voice)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g,' ').replace(/[−]/g,'minus ').replace(/\s+/g,' '));if(!this.v)this.pick();if(this.v)u.voice=this.v;u.rate=.95;speechSynthesis.speak(u)},
  stop(){if(this.ok)speechSynthesis.cancel()}};
if(Voice.ok)speechSynthesis.onvoiceschanged=()=>Voice.pick();

/* ---------- Celebrations ---------- */
function confetti(n=90){const cv=document.createElement('canvas');cv.className='confetti';document.body.appendChild(cv);const x=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;
  const cols=['#4ade80','#facc15','#60a5fa','#f87171','#a78bfa','#fb923c'];const ps=[...Array(n)].map(()=>({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*.5,vx:(Math.random()-.5)*4,vy:2+Math.random()*4,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,c:cols[Math.floor(Math.random()*6)],w:6+Math.random()*8}));
  let f=0;(function tick(){x.clearRect(0,0,cv.width,cv.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);x.restore()});if(++f<170)requestAnimationFrame(tick);else cv.remove()})()}
function toast(html,ms=3200){const t=document.createElement('div');t.className='toast';t.innerHTML=html;document.body.appendChild(t);setTimeout(()=>t.classList.add('out'),ms);setTimeout(()=>t.remove(),ms+500)}

/* ---------- Quiz engine (one question at a time, explains wrong picks) ---------- */
/* question: {id, q, o:[[text, whyWrong?],...], a: index, ex: why the right answer is right} */
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function runQuiz(el,qs,{title='Mini quiz',onDone,src='quiz',mixOptions=true,review=true}={}){
  let i=0,score=0;const log=[];
  const prep=qs.map(q=>{const idx=q.o.map((_,k)=>k);const order=mixOptions&&!q.keep?shuffle(idx):idx;return{q,order}});
  function show(){const {q,order}=prep[i];
    el.innerHTML=`<div class="quiz"><div class="qhead"><span>${title}</span><span>Question ${i+1} of ${qs.length}</span></div><div class="qbar"><i style="width:${i/qs.length*100}%"></i></div>
    <h3 class="qq">${q.q}</h3><div class="opts">${order.map(k=>`<button class="opt" data-k="${k}">${q.o[k][0]}</button>`).join('')}</div><div class="fb"></div></div>`;
    Voice.say(q.q);
    $$('.opt',el).forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.a;$$('.opt',el).forEach(x=>{x.disabled=true;if(+x.dataset.k===q.a)x.classList.add('right')});
      if(!ok)b.classList.add('wrong');if(ok)score++;log.push({q,pick:k,ok});
      if(q.id){if(ok){if(ST.mist[q.id]){delete ST.mist[q.id];ST.fixed++}}else ST.mist[q.id]={src,at:Date.now()};save()}
      $('.fb',el).innerHTML=`<div class="fbbox ${ok?'ok':'no'}">${ok?'<b>✅ Correct!</b> ':'<b>❌ Not quite.</b> '}${!ok&&q.o[k][1]?`<p><b>Why "${q.o[k][0]}" is wrong:</b> ${q.o[k][1]}</p>`:''}<p>${ok?'':'<b>The right answer is "'+q.o[q.a][0]+'".</b> '}${q.ex}</p></div>
        <button class="btn nextq">${i<qs.length-1?'Next question →':'See my score'}</button>`;
      if(ok){b.classList.add('bump')}else{b.classList.add('shake')}
      $('.nextq',el).onclick=()=>{i++;i<qs.length?show():finish()};$('.nextq',el).focus()})}
  function finish(){const pct=Math.round(score/qs.length*100);
    el.innerHTML=`<div class="quiz done-q"><div class="bigscore ${pct>=80?'g':pct>=60?'y':'r'}">${pct}%</div><p>You got <b>${score} of ${qs.length}</b> right. ${pct===100?'Perfect! 🏆':pct>=80?'Great job! 🎉':pct>=60?'Good effort — review the misses below.':'No worries — every mistake is a lesson. Try again!'}</p>
    ${review&&log.some(l=>!l.ok)?`<h4>Review what you missed</h4>${log.filter(l=>!l.ok).map(l=>`<div class="rev"><p class="qq">${l.q.q}</p><p class="r">You picked: ${l.q.o[l.pick][0]}${l.q.o[l.pick][1]?' — '+l.q.o[l.pick][1]:''}</p><p class="g">Correct: ${l.q.o[l.q.a][0]}</p><p class="mut">${l.q.ex}</p></div>`).join('')}<p class="mut">These were saved to <a href="#/mistakes">My Mistakes</a> so you can retry them.</p>`:''}
    <div class="row"><button class="btn again">↻ Try again</button></div></div>`;
    el.scrollIntoView({behavior:'smooth',block:'start'});$('.again',el).onclick=()=>runQuiz(el,qs,{title,onDone,src,mixOptions,review});
    if(pct>=80)confetti();if(onDone)onDone(pct,score,log)}
  show()}
/* ---------- small UI helpers for "Try it" ---------- */
const slider=(id,label,min,max,step,val)=>`<label class="sl"><span>${label}: <b id="${id}v"></b></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
const val=id=>+document.getElementById(id).value;
const setv=(id,t)=>{const e=document.getElementById(id+'v');if(e)e.textContent=t};
const onAll=(el,f)=>{$$('input,select',el).forEach(i=>i.addEventListener('input',f));f()};
const seg=(name,opts,on)=>`<div class="seg" data-n="${name}">${opts.map(([v,l])=>`<button type="button" data-v="${v}" class="${v===on?'on':''}">${l}</button>`).join('')}</div>`;
function segVal(el,name){return $(`.seg[data-n="${name}"] .on`,el).dataset.v}
function bindSeg(el,f){$$('.seg button',el).forEach(b=>b.onclick=()=>{$$('button',b.parentNode).forEach(x=>x.classList.remove('on'));b.classList.add('on');f()})}
const SIM='<div class="simtag">🧪 Simulation with made-up practice numbers — not real prices, not advice.</div>';
