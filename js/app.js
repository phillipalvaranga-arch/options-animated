'use strict';
/* ===== Options Academy: views & router ===== */
const V=()=>$('#view');
const BADGES=[
['first','🎓','First step','Finish your first lesson',()=>Object.keys(ST.done).length>=1],
['five','🔥','On a roll','Finish 5 lessons',()=>Object.keys(ST.done).length>=5],
['ten','🚀','Halfway hero','Finish 10 lessons',()=>Object.keys(ST.done).length>=10],
['all','🏅','Course complete','Finish all 19 lessons',()=>LS.every(l=>ST.done[l.id])],
['perfect','💯','Perfect quiz','Score 100% on a lesson quiz',()=>Object.values(ST.quiz).some(v=>v===100)],
['greeks','Δ','Greek speaker','Finish The Greeks lesson',()=>!!ST.done.greeks],
['strat','♟️','Strategist','Finish the Strategies lesson',()=>!!ST.done.strategies],
['lab','🧪','Lab explorer','Use the Practice Lab',()=>ST.lab>=1],
['cards','🃏','Card shark','Review 25 flashcards',()=>ST.seen>=25],
['fixer','🔧','Mistake fixer','Fix 5 past mistakes',()=>ST.fixed>=5],
['exam','🏆','Options graduate','Score 80%+ on the final exam',()=>(ST.exam.best||0)>=80],
['ace','👑','Exam ace','Score 95%+ on the final exam',()=>(ST.exam.best||0)>=95]];
function checkBadges(){let got=[];BADGES.forEach(([k,e,n,d,f])=>{if(!ST.badges[k]&&f()){ST.badges[k]=Date.now();got.push([e,n])}});if(got.length){localStorage.setItem(KEY,JSON.stringify(ST));got.forEach(([e,n],i)=>setTimeout(()=>{toast(`<div style="font-size:44px" class="popin-h">${e}</div><b>Badge earned!</b><br>${n}`);confetti(120)},600+i*1500))}}
function hdr(){const d=LS.filter(l=>ST.done[l.id]).length;$('#prog').textContent=`✅ ${d}/${LS.length}`;$('#vbtn').classList.toggle('on',ST.voice);$('#vbtn').innerHTML=ST.voice?'🔊<span class="vl"> Voice on</span>':'🔈<span class="vl"> Voice off</span>'}
const DISC=`<div class="disc">⚠️ <b>Educational only, not financial advice.</b> All prices are made-up practice numbers or come from a math model. This app never connects to any broker (including Apex, TradingView and Tradovate) and it can <b>never</b> place orders.</div>`;

/* ---------- Home ---------- */
function tickerHTML(){const items=['CALL = right to BUY','PUT = right to SELL','1 contract = 100 shares','Δ delta','Θ theta melts daily','ν vega ↔ IV','Breakeven: call = K + premium','Put = K − premium','Risk small, learn big'];const s=items.map((t,i)=>`<span class="${i%2?'y':'g'}">● ${t}</span>`).join('');return `<div class="ticker"><div>${s}${s}</div></div>`}
function home(){const d=LS.filter(l=>ST.done[l.id]).length,pct=Math.round(d/LS.length*100);const next=LS.findIndex(l=>!ST.done[l.id]);const ni=next<0?0:next;
 V().innerHTML=tickerHTML()+`<div class="hero"><div><h1>Learn options the <span class="g">animated</span> way</h1><p>${LS.length} plain-English lessons for beginners, with animations, an optional voice, "Try it" simulators, quizzes and a final exam.</p>
 <div class="bar"><i style="width:${pct}%"></i></div><p class="mut">${d} of ${LS.length} lessons complete (${pct}%)</p><a class="btn" href="#/lesson/${ni}">${d?'▶ Continue: ':'▶ Start: '}${LS[ni].title}</a></div>
 <div class="stage">${svg(coach(120,110)+newbie(480,110,'happy',.4)+bubble(175,8,250,d?'Welcome back! Ready for more?':'Hi! I\'m Coach Ray. Let\'s learn options together!',.6)+lineChart([100,98,103,101,106,104,110,108,115],{x0:180,x1:420,y0:120,y1:250,lo:95,hi:118,col:'#4ade80',dl:1}).s,280)}</div></div>
 <h2 style="margin-top:18px">🧰 Practice tools</h2><div class="tools">${[['#/lab','🧪','Practice Lab'],['#/cards','🃏','Flashcards'],['#/exam','🏆','Final exam'],['#/mistakes','🔁',`My Mistakes (${Object.keys(ST.mist).length})`],['#/cheat','📄','Cheat sheet'],['#/glossary','📖','Glossary']].map(([h,e,n])=>`<a class="tool" href="${h}"><div>${e}</div>${n}</a>`).join('')}</div>
 <h2 style="margin-top:18px">📚 Lessons</h2><div class="grid">${LS.map((l,i)=>`<a class="lc" href="#/lesson/${i}" style="animation-delay:${i*.04}s"><div class="em">${l.emoji}</div><span class="st ${ST.done[l.id]?'g':'mut'}">${ST.done[l.id]?'✅ '+(ST.quiz[l.id]??'')+'%':(i+1)}</span><h3>${i+1}. ${l.title}</h3><p>${l.sub}</p></a>`).join('')}</div>${DISC}`}

/* ---------- Lesson player ---------- */
function lesson(i,step=0){const L=LS[i];if(!L)return home();ST.last=i;localStorage.setItem(KEY,JSON.stringify(ST));
 const steps=[...L.scenes.map((s,k)=>({k:'scene',s,n:k})),{k:'take'},{k:'try'},{k:'quiz'}];step=Math.max(0,Math.min(step,steps.length-1));const S=steps[step];
 const lab=S.k==='scene'?`Scene ${S.n+1} of ${L.scenes.length}`:S.k==='take'?'Key takeaways':S.k==='try'?'Try it yourself':'Mini quiz';
 V().innerHTML=`<div class="lhead"><h2>${L.emoji} ${i+1}. ${L.title}</h2><span class="pill">${lab}</span></div><div class="dots">${steps.map((x,k)=>`<i class="${k===step?'on':k<step?'dn':''}" data-k="${k}" title="${x.k}"></i>`).join('')}</div><div id="lbody"></div>
 <div class="navb"><button class="btn alt" id="bk" ${step===0&&i===0?'disabled':''}>← Back</button>${S.k==='scene'?'<button class="btn alt" id="rd">🔊 Read aloud</button>':''}<button class="btn" id="nx">${S.k==='quiz'?(ST.done[L.id]?'Next lesson →':'Skip quiz →'):'Next →'}</button></div>`;
 $$('.dots i').forEach(d=>d.onclick=()=>go(`#/lesson/${i}/${d.dataset.k}`));
 $('#bk').onclick=()=>step>0?go(`#/lesson/${i}/${step-1}`):go(`#/lesson/${i-1}/99`);
 $('#nx').onclick=()=>step<steps.length-1?go(`#/lesson/${i}/${step+1}`):(i<LS.length-1?go(`#/lesson/${i+1}`):go('#/exam'));
 const B=$('#lbody');
 if(S.k==='scene'){B.innerHTML=`<div class="stage" id="stg"></div><div class="say"><div class="av">🧑‍🏫</div><p>${S.s.t}</p></div><div class="simtag">🧪 Example numbers are made up for learning.</div>`;const st=$('#stg');
   if(S.s.run)S.s.run(st);else if(S.s.html)st.innerHTML=S.s.html();else st.innerHTML=S.s.a();
   $('#rd').onclick=()=>{const was=ST.voice;ST.voice=true;Voice.say(S.s.t);ST.voice=was};Voice.say(S.s.t)}
 else if(S.k==='take'){B.innerHTML=`<div class="stage">${svg(coach(110,120)+bubble(170,30,380,'Here\'s what to remember from this lesson! ✨',.3)+emo(470,230,'📝',60,'bob'),280)}</div><ul class="take">${L.take.map((t,k)=>`<li style="animation-delay:${.2+k*.25}s">✔️ ${t}</li>`).join('')}</ul>`;Voice.say('Key takeaways. '+L.take.join('. '))}
 else if(S.k==='try'){B.innerHTML=`<div class="tryit" id="tri"></div>`;L.tryit($('#tri'));Voice.say('Try it yourself.')}
 else{B.innerHTML=`<div id="qz"></div>`;runQuiz($('#qz'),L.quiz,{title:`Lesson ${i+1} quiz`,src:L.id,onDone:pct=>{const first=!ST.done[L.id];ST.done[L.id]=true;ST.quiz[L.id]=Math.max(ST.quiz[L.id]||0,pct);save();checkBadges();
   $('#nx').textContent=i<LS.length-1?'Next lesson →':'Final exam →';
   if(first)toast(`<div style="font-size:40px">🎉</div><b>Lesson ${i+1} complete!</b>`);
   $('#qz').insertAdjacentHTML('beforeend',`<div class="row" style="justify-content:center;margin-top:8px">${i<LS.length-1?`<a class="btn" href="#/lesson/${i+1}">Next: ${LS[i+1].title} →</a>`:'<a class="btn y" href="#/exam">🏆 Take the final exam</a>'}<a class="btn alt" href="#/">All lessons</a></div>`)}})}
 scrollTo(0,0)}

/* ---------- Practice Lab ---------- */
function labView(){ST.lab++;save();checkBadges();
 V().innerHTML=`<h2>🧪 Practice Lab</h2><p class="mut">Build an option, then use the "what-if" sliders to move the stock price, time and IV. Prices come from the Black-Scholes model (interest rates and dividends ignored).</p>${SIM}
 <div class="tryit"><h3>1️⃣ Build the trade</h3>${seg('lt',[['c','Call'],['p','Put']],'c')}${seg('ls',[['1','Buy (long)'],['-1','Sell (short)']],'1')}
 <div class="grid2"><label>Stock price today ($)<input id="lS" type="number" class="inp" value="100" min="1" step="0.5"></label><label>Contracts<input id="lN" type="number" class="inp" value="1" min="1" max="50"></label></div>
 ${slider('lK','Strike (% of stock price)',70,130,1,105)}${slider('lD','Days to expiration',1,365,1,45)}${slider('lV','Implied volatility',5,150,1,30)}<div id="lE" class="big"></div></div>
 <div class="tryit" style="margin-top:10px"><h3>2️⃣ What if…</h3>${slider('wS','New stock price (% change)',-40,40,.5,5)}${slider('wT','Days passed',0,45,1,10)}${slider('wV','IV change (points)',-40,40,1,0)}<div class="row"><button class="btn y" id="lPlay">▶ Time machine (play days passing)</button></div>
 <div id="lO"></div><div id="lC"></div><div id="lG"></div></div>`;
 let anim=null;const f=()=>{const t=segVal(V(),'lt'),q=+segVal(V(),'ls'),S0=Math.max(1,val('lS')),n=Math.max(1,Math.min(50,val('lN'))),K=r2(S0*val('lK')/100),D0=val('lD'),v0=val('lV')/100;
  $('#wT').max=D0;const el=Math.min(val('wT'),D0),S1=r2(S0*(1+val('wS')/100)),v1=Math.max(.01,v0+val('wV')/100),left=D0-el;
  setv('lK',`$${K.toFixed(2)} (${val('lK')}%)`);setv('lD',D0);setv('lV',(v0*100).toFixed(0)+'%');setv('wS',`$${S1.toFixed(2)} (${val('wS')>0?'+':''}${val('wS')}%)`);setv('wT',`${el} (${left} left)`);setv('wV',`${val('wV')>0?'+':''}${val('wV')} → ${(v1*100).toFixed(0)}%`);
  const g0=bs(S0,K,D0/365,v0,t==='c'),p0=r2(g0.price),g1=bs(S1,K,left/365,v1,t==='c'),p1=g1.price,pl=q*(p1-p0)*100*n;
  $('#lE').innerHTML=`${q>0?'You pay':'You collect'} about <b class="y">$${p0.toFixed(2)}</b> per share = <b>${money(p0*100*n)}</b> for ${n} contract${n>1?'s':''}. Breakeven at expiration: <b>$${(t==='c'?K+p0:K-p0).toFixed(2)}</b>.`;
  $('#lO').innerHTML=`<div class="gk"><div><b>Option price then → now</b><span>$${p0.toFixed(2)} → <span class="y">$${p1.toFixed(2)}</span></span></div><div><b>Your P/L now</b><span class="${pl>=0?'g':'r'}">${smoney(pl,2)}</span><i>${(pl/(p0*100*n)*100).toFixed(0)}% of premium</i></div><div><b>Δ Delta</b><span>${(q*g1.delta).toFixed(3)}</span><i>${smoney(q*g1.delta*100*n,2)} per $1</i></div><div><b>Γ Gamma</b><span>${(q*g1.gamma).toFixed(4)}</span></div><div><b>Θ Theta</b><span>${(q*g1.theta).toFixed(3)}</span><i>${smoney(q*g1.theta*100*n,2)} per day</i></div><div><b>ν Vega</b><span>${(q*g1.vega).toFixed(3)}</span><i>${smoney(q*g1.vega*100*n,2)} per IV point</i></div></div>`;
  const legs=[{t,q:q*n,K,pr:p0,d:D0,v:v1}];const P=payoffSVG(legs,{lo:r2(S0*.6),hi:r2(S0*1.4),h:320,today:el,S0:S1,S0lab:'now',anim:false});
  $('#lC').innerHTML=P.html+`<p class="mut">Yellow = P/L at expiration. Blue dashed = model P/L with ${left} days left at ${(v1*100).toFixed(0)}% IV. Purple line = the "what-if" stock price.</p>`;
  $('#lG').innerHTML=plSummary(legs)};
 bindSeg(V(),f);onAll(V(),f);
 $('#lPlay').onclick=()=>{if(anim){clearInterval(anim);anim=null;$('#lPlay').textContent='▶ Time machine (play days passing)';return}$('#wT').value=0;$('#lPlay').textContent='⏸ Stop';anim=every(()=>{const w=$('#wT');if(!w){return}if(+w.value>=+w.max){clearInterval(anim);anim=null;$('#lPlay').textContent='▶ Time machine (play days passing)';return}w.value=+w.value+Math.max(1,Math.round(w.max/40));f()},120)}}

/* ---------- Flashcards ---------- */
function cards(){const deck=GLOSS.filter(g=>g[2]);const box=t=>ST.cards[t]||0;const mastered=deck.filter(g=>box(g[0])>=3).length;
 const pick=()=>{const w=deck.map(g=>Math.pow(.35,box(g[0])));let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<deck.length;i++){r-=w[i];if(r<=0)return deck[i]}return deck[0]};
 let rev=false;V().innerHTML=`<h2>🃏 Flashcards</h2><p class="mut">Tap the card to flip it. "Got it" moves a card up a level, and "Again" brings it back sooner. Mastered = level 3+.</p><div class="bar"><i id="fbar" style="width:${mastered/deck.length*100}%"></i></div><p class="mut"><span id="fm">${mastered}</span> of ${deck.length} mastered • ${ST.seen} cards reviewed</p>
 ${seg('fmode',[['t','Show word first'],['d','Show meaning first']],'t')}<div id="fcw"></div>`;
 let cur=pick();const show=()=>{const front=rev?cur[1]:cur[0],back=rev?cur[0]:cur[1];$('#fcw').innerHTML=`<div class="flip" tabindex="0"><div class="fi"><div class="ff" style="${rev?'font-size:19px':''}">${front}</div><div class="fbk">${back}</div></div></div><p class="mut" style="text-align:center">Level ${box(cur[0])} • tap the card to flip</p><div class="row" style="justify-content:center"><button class="btn r" id="fa">↺ Again</button><button class="btn" id="fg">✓ Got it</button><button class="btn alt" id="fs">🔊</button></div>`;
  $('.flip').onclick=e=>e.currentTarget.classList.toggle('on');$('#fs').onclick=()=>{const w=ST.voice;ST.voice=true;Voice.say(cur[0]+'. '+cur[1]);ST.voice=w};
  const nxt=up=>{ST.cards[cur[0]]=up?Math.min(5,box(cur[0])+1):0;ST.seen++;save();checkBadges();const m=deck.filter(g=>box(g[0])>=3).length;$('#fm').textContent=m;$('#fbar').style.width=m/deck.length*100+'%';if(up&&m===deck.length)confetti();let n=pick(),tries=0;while(n===cur&&tries++<5)n=pick();cur=n;show()};
  $('#fa').onclick=()=>nxt(false);$('#fg').onclick=()=>nxt(true)};
 bindSeg(V(),()=>{rev=segVal(V(),'fmode')==='d';show()});show()}

/* ---------- Final exam ---------- */
function exam(){V().innerHTML=`<h2>🏆 Final exam</h2><div class="stage">${svg(`<text x="300" y="170" font-size="120" text-anchor="middle" class="bob">🏆</text>`+T(300,260,'40 questions from all 19 lessons','#facc15',20,'popin',.4),280)}</div>
 <p>You'll get <b>40 questions</b>, randomly picked from a bank of ${EXAM.length} exam questions plus every lesson quiz. Each answer is explained right away, and at the end you\'ll review every mistake. Score <b>80%+</b> to earn the 🏆 Options Graduate badge.</p>
 <p class="mut">Best score: <b>${ST.exam.best==null?'not taken yet':ST.exam.best+'%'}</b> • Attempts: ${ST.exam.tries}</p><button class="btn y" id="ex0">Start the exam</button><div id="exq"></div>`;
 $('#ex0').onclick=()=>{const pool=shuffle(EXAM).concat(shuffle(LS.flatMap(l=>l.quiz)));const qs=[...new Map(pool.map(q=>[q.id,q])).values()].slice(0,40);
  $('#ex0').remove();runQuiz($('#exq'),shuffle(qs),{title:'Final exam',src:'exam',onDone:pct=>{ST.exam.tries++;ST.exam.best=Math.max(ST.exam.best||0,pct);save();checkBadges();if(pct>=80){confetti(200);toast('<div style="font-size:44px">🎓</div><b>You passed!</b>')}}})}}

/* ---------- My Mistakes ---------- */
function mistakes(){const ids=Object.keys(ST.mist).filter(id=>QBANK[id]);
 V().innerHTML=`<h2>🔁 My Mistakes</h2><p class="mut">Every question you miss lands here. Get it right on a retry and it\'s removed. Fixed so far: <b>${ST.fixed}</b></p><div id="mq"></div>`;
 if(!ids.length){$('#mq').innerHTML=`<div class="stage">${svg(coach(300,110,'happy')+T(300,260,'No mistakes waiting. Nice work! 🎉','#4ade80',20,'popin',.3),280)}</div><p><a class="btn" href="#/">Back to lessons</a> <a class="btn alt" href="#/exam">Take the exam</a></p>`;return}
 $('#mq').innerHTML=`<p><b>${ids.length}</b> question${ids.length>1?'s':''} to retry.</p><ul>${ids.slice(0,40).map(id=>`<li>${QBANK[id].q} <span class="mut">(${QBANK[id].lesson!=null?'Lesson '+(QBANK[id].lesson+1):'Exam'})</span></li>`).join('')}</ul><button class="btn y" id="mgo">Retry my mistakes</button>`;
 $('#mgo').onclick=()=>runQuiz($('#mq'),shuffle(ids.map(id=>QBANK[id])),{title:'Mistake retry',src:'retry',onDone:()=>{checkBadges();$('#mq').insertAdjacentHTML('beforeend','<p style="text-align:center"><a class="btn alt" href="#/mistakes">Back to My Mistakes</a></p>')}})}

/* ---------- Progress & badges ---------- */
function progress(){const d=LS.filter(l=>ST.done[l.id]).length;const qs=Object.values(ST.quiz);const avg=qs.length?Math.round(qs.reduce((a,b)=>a+b,0)/qs.length):0;checkBadges();
 V().innerHTML=`<h2>🏆 My progress</h2><div class="stats"><div><b>${d}/${LS.length}</b>lessons done</div><div><b>${avg}%</b>avg quiz score</div><div><b>${ST.exam.best??'—'}${ST.exam.best!=null?'%':''}</b>best exam</div><div><b>${Object.keys(ST.badges).length}/${BADGES.length}</b>badges</div><div><b>${Object.keys(ST.mist).length}</b>mistakes to retry</div><div><b>${ST.seen}</b>cards reviewed</div></div>
 <h3>Badges</h3><div class="badges">${BADGES.map(([k,e,n,desc])=>`<div class="bd ${ST.badges[k]?'on':''}"><div>${e}</div><b>${n}</b><small>${desc}</small></div>`).join('')}</div>
 <h3>Lessons</h3><table class="mtab">${LS.map((l,i)=>`<tr><td style="text-align:left"><a href="#/lesson/${i}">${i+1}. ${l.title}</a></td><td class="${ST.done[l.id]?'g':'mut'}">${ST.done[l.id]?'✅ '+ST.quiz[l.id]+'%':'—'}</td></tr>`).join('')}</table>
 <p class="mut">Progress is saved on this device only. Each browser keeps its own copy, so Edge and Chrome are separate.</p><button class="btn r" id="rst">Reset all progress</button>`;
 $('#rst').onclick=()=>{if(confirm('Erase all progress, badges and mistakes on this device?')){localStorage.removeItem(KEY);location.reload()}}}

/* ---------- Practice hub ---------- */
function practice(){V().innerHTML=`<h2>🎯 Practice</h2><div class="tools">${[['#/lab','🧪','Practice Lab','Build any option and play "what if"'],['#/cards','🃏','Flashcards',GLOSS.filter(g=>g[2]).length+' key words'],['#/exam','🏆','Final exam','40 questions + review'],['#/mistakes','🔁','My Mistakes',Object.keys(ST.mist).length+' to retry'],['#/cheat','📄','Cheat sheet','Printable one-pager'],['#/glossary','📖','Glossary',GLOSS.length+' terms']].map(([h,e,n,s])=>`<a class="tool" href="${h}"><div>${e}</div>${n}<br><small class="mut">${s}</small></a>`).join('')}</div>${DISC}`}

/* ---------- Cheat sheet ---------- */
function cheat(){V().innerHTML=`<div class="row noprint" style="justify-content:space-between"><h2>📄 Options cheat sheet</h2><button class="btn" onclick="print()">🖨️ Print / Save as PDF</button></div><p class="mut noprint">Tip: on a phone or tablet, use Chrome's ⋮ menu → Share → Print.</p>
 <h2 style="display:none" class="ponly">Options Academy: Cheat Sheet</h2><div class="cheat">${CHEAT.map(([h,ls])=>`<section><h3>${h}</h3><ul>${ls.map(x=>`<li>${x}</li>`).join('')}</ul></section>`).join('')}</div><p style="font-size:12px">Educational only, not financial or tax advice. Example numbers are hypothetical.</p>`}

/* ---------- Glossary ---------- */
function glossary(){V().innerHTML=`<h2>📖 Glossary</h2><input id="gq" class="inp" placeholder="🔍 Search a word, e.g. theta, assignment, spread…" autocomplete="off"><dl class="gl" id="gl"></dl>`;
 const f=()=>{const q=$('#gq').value.toLowerCase().trim();const list=[...GLOSS].sort((a,b)=>a[0].localeCompare(b[0])).filter(g=>!q||(g[0]+' '+g[1]).toLowerCase().includes(q));$('#gl').innerHTML=list.map(g=>`<dt>${g[0]}</dt><dd>${g[1]}</dd>`).join('')||'<p class="mut">No match. Try another word.</p>'};$('#gq').oninput=f;f()}

/* ---------- About ---------- */
function about(){V().innerHTML=`<h2>ℹ️ About Options Academy</h2>${DISC}<div class="card"><p><b>What this is:</b> a beginner course that teaches how options work, in plain English, with animations, practice simulators, quizzes and an exam.</p><p><b>Safety:</b> this app has no login, asks for no account numbers and no personal information, and it never connects to Apex, TradingView, Tradovate or any broker. It cannot place trades.</p><p><b>The numbers:</b> examples use made-up prices. Simulators use the Black-Scholes model with interest rates and dividends ignored. Real option prices also depend on supply, demand, rates and dividends.</p><p><b>Voice:</b> tap 🔈 in the top bar to have lessons read aloud. It uses your device's built-in voice.</p><p><b>Your progress</b> is saved only in this browser on this device.</p><p><b>Learn more from official sources:</b> <a href="https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document" target="_blank" rel="noopener">OCC: Characteristics and Risks of Standardized Options</a> • <a href="https://www.investor.gov/introduction-investing/investing-basics/investment-products/options" target="_blank" rel="noopener">Investor.gov: Options</a> • <a href="https://www.cmegroup.com/education.html" target="_blank" rel="noopener">CME Group education</a> • <a href="https://www.irs.gov/publications/p550" target="_blank" rel="noopener">IRS Publication 550</a></p></div>`}

/* ---------- Router ---------- */
function go(h){if(location.hash===h)route();else location.hash=h}
function route(){clearTimers();Voice.stop();const h=location.hash.replace(/^#\/?/,'').split('/');const v=h[0]||'';
 $$('nav.bn a').forEach(a=>a.classList.toggle('on',a.dataset.v===(v==='lesson'||!v?'home':['cards','exam','mistakes','cheat','practice'].includes(v)?'practice':v)));
 try{({'':home,lesson:()=>{const i=+h[1]||0;const n=h[2]==='99'?LS[i].scenes.length+2:+h[2]||0;lesson(i,n)},lab:labView,cards,exam,mistakes,progress,practice,cheat,glossary,about}[v]||home)()}catch(e){console.error(e);V().innerHTML='<p>Something went wrong. <a href="#/">Go home</a></p>'}
 if(v!=='lesson')scrollTo(0,0);hdr()}
addEventListener('hashchange',route);
$('#vbtn').onclick=()=>{ST.voice=!ST.voice;save();if(!Voice.ok){toast('Voice isn\'t supported in this browser.');ST.voice=false;save();return}if(ST.voice)Voice.say('Voice is on. I will read each scene to you.');else Voice.stop()};
route();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
