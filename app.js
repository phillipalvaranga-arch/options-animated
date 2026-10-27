const $=s=>document.querySelector(s),V=$('#view');
const P=JSON.parse(localStorage.oaProg||'{}');const save=()=>{localStorage.oaProg=JSON.stringify(P);hdr()};
// ---------- math ----------
const N=x=>{const t=1/(1+.2316419*Math.abs(x)),d=.3989423*Math.exp(-x*x/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p};
const n=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
function bs(S,K,T,v,call=true,r=0){T=Math.max(T,1e-6);const d1=(Math.log(S/K)+(r+v*v/2)*T)/(v*Math.sqrt(T)),d2=d1-v*Math.sqrt(T);
const price=call?S*N(d1)-K*Math.exp(-r*T)*N(d2):K*Math.exp(-r*T)*N(-d2)-S*N(-d1);
return{price,delta:call?N(d1):N(d1)-1,gamma:n(d1)/(S*v*Math.sqrt(T)),theta:-(S*n(d1)*v)/(2*Math.sqrt(T))/365,vega:S*n(d1)*Math.sqrt(T)/100}}
// legs: t:'c'|'p'|'s', q:+1 long/-1 short, K, pr(premium per share)
const pay=(legs,S)=>legs.reduce((a,l)=>a+l.q*((l.t=='s'?S-l.K:l.t=='c'?Math.max(S-l.K,0):Math.max(l.K-S,0))-(l.t=='s'?0:l.pr)),0)*100;
const STRATS={
 'Long Call':{legs:[{t:'c',q:1,K:100,pr:3}],d:'Buy a call. Max loss = premium paid. Profit if price rises above strike + premium.'},
 'Long Put':{legs:[{t:'p',q:1,K:100,pr:3}],d:'Buy a put. Max loss = premium paid. Profit if price falls below strike − premium.'},
 'Covered Call':{legs:[{t:'s',q:1,K:100},{t:'c',q:-1,K:105,pr:2}],d:'Own 100 shares and sell a call. Collect premium; upside is capped at the strike.'},
 'Cash-Secured Put':{legs:[{t:'p',q:-1,K:95,pr:2}],d:'Sell a put with cash set aside to buy 100 shares at the strike if assigned.'},
 'Bull Call Spread':{legs:[{t:'c',q:1,K:100,pr:3},{t:'c',q:-1,K:110,pr:1}],d:'Buy a call, sell a higher call. Limited risk, limited reward.'},
 'Bear Put Spread':{legs:[{t:'p',q:1,K:100,pr:3},{t:'p',q:-1,K:90,pr:1}],d:'Buy a put, sell a lower put. Limited risk, limited reward.'},
 'Long Straddle':{legs:[{t:'c',q:1,K:100,pr:3},{t:'p',q:1,K:100,pr:3}],d:'Buy a call and a put at the same strike. Needs a BIG move either way.'},
 'Iron Condor':{legs:[{t:'p',q:1,K:85,pr:.5},{t:'p',q:-1,K:90,pr:1.5},{t:'c',q:-1,K:110,pr:1.5},{t:'c',q:1,K:115,pr:.5}],d:'Sell an OTM put spread and an OTM call spread. Profits if price stays in a range.'}};
// ---------- scene helpers ----------
const W=600,H=300;
const svg=(b,h=H)=>`<svg viewBox="0 0 ${W} ${h}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
const T=(x,y,s,c='#e8ecf5',z=18,cls='popin',dl=0)=>`<text x="${x}" y="${y}" fill="${c}" font-size="${z}" font-weight="700" text-anchor="middle" class="${cls}" style="animation-delay:${dl}s">${s}</text>`;
function guy(x,y,col,name,mood='happy',dl=0){const m=mood=='happy'?'M-12 8 Q0 20 12 8':mood=='sad'?'M-12 16 Q0 4 12 16':'M-10 12 L10 12';
return `<g transform="translate(${x},${y})"><g class="bob" style="animation-delay:${dl}s"><rect x="-26" y="34" width="52" height="50" rx="18" fill="${col}"/><circle r="34" fill="#ffd9a8"/>
<g class="blink"><circle cx="-12" cy="-6" r="5" fill="#111"/><circle cx="12" cy="-6" r="5" fill="#111"/></g><path d="${m}" stroke="#111" stroke-width="3" fill="none"/>
<path d="M-34 -10 Q0 -50 34 -10 Q20 -30 0 -32 Q-20 -30 -34 -10" fill="#3b2a1a"/></g>${T(0,110,name,'#cbd5ee',16)}</g>`}
const coins=(x1,x2,y,n=4,lab='$')=>Array.from({length:n},(_,i)=>`<g><circle r="13" fill="#facc15" stroke="#a16207" stroke-width="2"/><text y="5" font-size="14" text-anchor="middle" font-weight="800" fill="#713f12">${lab}</text>
<animateMotion dur="2.4s" begin="${i*.6}s" repeatCount="indefinite" path="M${x1} ${y} Q${(x1+x2)/2} ${y-70} ${x2} ${y}"/></g>`).join('');
const doc=(x1,x2,y,lab='📜')=>`<text font-size="30" text-anchor="middle">${lab}<animateMotion dur="2.4s" repeatCount="indefinite" path="M${x1} ${y} Q${(x1+x2)/2} ${y+60} ${x2} ${y}"/></text>`;
function trade(a,b,ca='#3b82f6',cb='#ef4444',cap='',coinLab='$',docLab='📜'){return svg(guy(120,110,ca,a)+guy(480,110,cb,b,'happy',.5)+coins(170,430,110,4,coinLab)+doc(430,170,140,docLab)+T(300,280,cap,'#facc15',17))}
function chartPath(pts,x0=60,x1=560,y0=40,y1=240,lo,hi){lo=lo??Math.min(...pts);hi=hi??Math.max(...pts);
const X=i=>x0+(x1-x0)*i/(pts.length-1),Y=v=>y1-(y1-y0)*(v-lo)/(hi-lo||1);return{d:pts.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(''),X,Y}}
function priceScene(pts,K,lab,col='#4ade80',extra=''){const lo=Math.min(...pts,K)-3,hi=Math.max(...pts,K)+3,c=chartPath(pts,60,560,40,240,lo,hi);
return svg(`<rect x="60" y="40" width="500" height="200" fill="#0b1226" rx="8"/><line x1="60" x2="560" y1="${c.Y(K)}" y2="${c.Y(K)}" stroke="#facc15" stroke-dasharray="8 6" stroke-width="2"/>
${T(520,c.Y(K)-8,'Strike '+K,'#facc15',14,'')}<path d="${c.d}" stroke="${col}" stroke-width="4" fill="none" class="draw"/>
<circle r="8" fill="${col}" class="pulse"><animateMotion dur="2.2s" fill="freeze" path="${c.d}"/></circle>${T(300,280,lab,'#e8ecf5',17,'popin',2)}${extra}`)}
function payoffSVG(legs,S=null,anim=true){const xs=[];for(let s=70;s<=130;s+=1)xs.push(s);const ys=xs.map(s=>pay(legs,s));let lo=Math.min(...ys,-100),hi=Math.max(...ys,100);const pad=(hi-lo)*.12;lo-=pad;hi+=pad;
const X=s=>50+500*(s-70)/60,Y=v=>250-210*(v-lo)/(hi-lo);const d=xs.map((s,i)=>(i?'L':'M')+X(s)+' '+Y(ys[i])).join('');
let fills='';const z=Y(0);fills=`<clipPath id="up"><rect x="0" y="0" width="600" height="${z}"/></clipPath><clipPath id="dn"><rect x="0" y="${z}" width="600" height="300"/></clipPath>
<path d="${d}L550 ${z}L50 ${z}Z" fill="#4ade8033" clip-path="url(#up)"/><path d="${d}L550 ${z}L50 ${z}Z" fill="#f8717133" clip-path="url(#dn)"/>`;
let dot='';if(S!=null){const v=pay(legs,S);dot=`<line x1="${X(S)}" x2="${X(S)}" y1="40" y2="250" stroke="#60a5fa" stroke-dasharray="4 4"/><circle cx="${X(S)}" cy="${Y(v)}" r="10" fill="${v>=0?'#4ade80':'#f87171'}" class="pulse"/>
<text x="${X(S)}" y="${Y(v)-16}" fill="#fff" font-size="16" font-weight="800" text-anchor="middle">${v>=0?'+$':'-$'}${Math.abs(v).toFixed(0)}</text>`}
else dot=`<circle r="9" fill="#60a5fa" class="pulse"><animateMotion dur="4s" repeatCount="indefinite" path="${d}"/></circle>`;
return svg(`${fills}<line x1="50" x2="550" y1="${z}" y2="${z}" stroke="#64748b"/><text x="40" y="${z+5}" fill="#94a3b8" font-size="12" text-anchor="end">$0</text>
<path d="${d}" stroke="#e8ecf5" stroke-width="4" fill="none" class="${anim?'draw':''}"/>${[70,85,100,115,130].map(s=>`<text x="${X(s)}" y="272" fill="#94a3b8" font-size="12" text-anchor="middle">$${s}</text>`).join('')}
<text x="300" y="292" fill="#94a3b8" font-size="12" text-anchor="middle">Stock price at expiration →</text><text x="300" y="25" fill="#4ade80" font-size="14" text-anchor="middle">Profit ↑   Loss ↓</text>${dot}`)}
function bars(parts,cap){let x=150,b='';parts.forEach((p,i)=>{b+=`<rect x="${x}" y="${250-p.h}" width="120" height="${p.h}" rx="10" fill="${p.c}" class="popin" style="animation-delay:${i*.6}s;transform-origin:bottom"/>${T(x+60,240-p.h,p.l,'#fff',16,'popin',i*.6+.3)}`;x+=180});return svg(b+T(300,285,cap,'#facc15',17,'popin',1.5))}
const big=(emo,lines)=>svg(`<text x="300" y="130" font-size="90" text-anchor="middle" class="bob">${emo}</text>`+lines.map((l,i)=>T(300,190+i*32,l[0],l[1]||'#e8ecf5',20,'popin',.4+i*.5)).join(''));
function meltScene(){return svg(`<g transform="translate(300,60)"><rect x="-90" y="0" width="180" height="170" rx="20" fill="#93c5fd" opacity=".85" class="melt"/><text y="100" font-size="34" text-anchor="middle" fill="#0b1020" font-weight="800">PREMIUM</text></g>
<ellipse cx="300" cy="238" rx="120" ry="10" fill="#60a5fa55" class="pulse"/>${guy(90,120,'#3b82f6','Buyer','sad')}${guy(510,120,'#ef4444','Seller','happy',.4)}${T(300,285,'Each day, time value melts away — faster near expiration','#facc15',16)}`)}
function ivScene(){let w='';for(let i=0;i<3;i++)w+=`<path d="M40 150 Q120 ${150-40-i*25} 200 150 T360 150 T520 150 T600 150" stroke="${['#4ade80','#facc15','#f87171'][i]}" stroke-width="4" fill="none" opacity=".8"><animate attributeName="d" dur="${2+i}s" repeatCount="indefinite" values="M0 150 Q80 ${150-30-i*35} 160 150 T320 150 T480 150 T640 150;M0 150 Q80 ${150+30+i*35} 160 150 T320 150 T480 150 T640 150;M0 150 Q80 ${150-30-i*35} 160 150 T320 150 T480 150 T640 150"/></path>`;
return svg(w+T(300,40,'Bigger expected swings = higher implied volatility','#e8ecf5',18)+T(300,270,'Higher IV → more expensive options (calls AND puts)','#facc15',17,'popin',1))}
function contractScene(){let s='';for(let i=0;i<100;i++){s+=`<circle cx="${330+(i%10)*24}" cy="${50+Math.floor(i/10)*21}" r="8" fill="#4ade80" class="popin" style="animation-delay:${i*.02}s"/>`}
return svg(`<text x="140" y="170" font-size="110" text-anchor="middle" class="bob">📜</text>${T(140,250,'1 contract','#facc15',22)}<text x="275" y="160" font-size="40" fill="#fff" class="pulse" text-anchor="middle">=</text>${s}${T(440,285,'100 shares','#4ade80',20,'popin',2)}`)}
function moneyScene(){const z=[['ITM','In the money','#4ade80',60],['ATM','At the money','#facc15',250],['OTM','Out of the money','#f87171',440]];
return svg(z.map((q,i)=>`<rect x="${q[3]}" y="60" width="160" height="130" rx="14" fill="${q[2]}22" stroke="${q[2]}" class="popin" style="animation-delay:${i*.5}s"/>${T(q[3]+80,115,q[0],q[2],30,'popin',i*.5)}${T(q[3]+80,150,q[1],'#e8ecf5',15,'popin',i*.5)}`).join('')+
`<text font-size="30" text-anchor="middle">🏃<animateMotion dur="5s" repeatCount="indefinite" path="M520 240 L80 240 L520 240"/></text>`+T(300,285,'CALL with strike $100: stock $110 = ITM, $100 = ATM, $90 = OTM','#cbd5ee',15))}
function greekScene(sym,txt,col){return svg(`<text x="300" y="150" font-size="120" fill="${col}" text-anchor="middle" font-weight="800" class="spin" style="animation-duration:6s">${sym}</text>`+T(300,250,txt,'#e8ecf5',18,'popin',.5))}
function assignScene(){return svg(guy(110,110,'#ef4444','Seller','sad')+guy(490,110,'#3b82f6','Buyer','happy',.3)+`<text x="300" y="80" font-size="50" text-anchor="middle" class="pulse">🔔</text>`+T(300,130,'"I exercise!"','#facc15',20)+doc(440,160,160,'📦')+T(300,280,'Seller MUST deliver (call) or buy (put) at the strike','#e8ecf5',16,'popin',1))}
function futScene(){return svg(`<text x="130" y="150" font-size="70" text-anchor="middle" class="bob">📜</text><path d="M200 120 L380 120" stroke="#facc15" stroke-width="5" class="draw" marker-end=""/><text x="290" y="105" fill="#facc15" font-size="16" text-anchor="middle">exercise →</text>
<text x="470" y="150" font-size="70" text-anchor="middle" class="bob" style="animation-delay:.5s">📊</text>${T(130,200,'Option on MES','#e8ecf5',16)}${T(470,200,'1 MES futures contract','#e8ecf5',16)}${T(300,270,'Futures options deliver a futures contract, not 100 shares','#facc15',16,'popin',1.5)}`)}
// ---------- lessons ----------
const L=[
{id:'what',e:'📜',t:'What is an option?',s:[
['An option is a <b>contract</b>. It gives the buyer the <b class="g">right, not the obligation</b>, to buy or sell something at a set price before a set date.',()=>big('🤝',[['A contract = a RIGHT, not an obligation','#4ade80'],['Buyer pays for that right','#facc15']])],
['For US stock options, <b>1 contract controls 100 shares</b>. That\'s why a $2.00 price really costs $200.',contractScene],
['There are two sides: the <b class="b">buyer</b> (holder) pays money, the <b class="r">seller</b> (writer) receives it and takes on the obligation.',()=>trade('Buyer','Seller','#3b82f6','#ef4444','Money flows to the seller; the right flows to the buyer')]],
q:[['How many shares does one standard US stock option contract cover?',['10','100','1,000'],1],['Buying an option gives you…',['An obligation to buy','The right, not obligation','Ownership of the company'],1]]},
{id:'call',e:'🚀',t:'Calls',s:[
['A <b class="g">call</b> = the right to <b>BUY</b> at the strike price. Call buyers want the price to go <b>UP</b>.',()=>big('🚀',[['CALL = right to BUY','#4ade80'],['Wins when price rises','#e8ecf5']])],
['Strike $100. The stock climbs to $115. You can buy at $100 something worth $115 — your call is worth at least $15/share.',()=>priceScene([95,97,96,100,103,101,106,110,108,113,115],100,'Price rose above the strike → call gains value')],
['If the stock stays under $100 at expiration, the call expires worthless. You lose only the premium you paid.',()=>priceScene([100,99,97,98,95,96,93,94,92],100,'Below strike at expiration → call expires worthless','#f87171')]],
q:[['A call gives the right to…',['Buy','Sell','Borrow'],0],['Call buyers mostly want the price to…',['Fall','Stay flat','Rise'],2]]},
{id:'put',e:'🪂',t:'Puts',s:[
['A <b class="r">put</b> = the right to <b>SELL</b> at the strike price. Put buyers want the price to go <b>DOWN</b>.',()=>big('🪂',[['PUT = right to SELL','#f87171'],['Wins when price falls','#e8ecf5']])],
['Strike $100. The stock drops to $85. You can sell at $100 something worth $85 — your put is worth at least $15/share.',()=>priceScene([104,102,103,99,96,97,92,90,88,86,85],100,'Price fell below the strike → put gains value','#f87171')],
['Puts can work like insurance: own shares + buy a put = you have a floor price if the market crashes.',()=>big('🛡️',[['Protective put = insurance','#60a5fa'],['You pay premium for protection','#facc15']])]],
q:[['A put gives the right to…',['Buy','Sell','Hold'],1],['Stock at $85, put strike $100. Intrinsic value per share?',['$0','$15','$85'],1]]},
{id:'strike',e:'🎯',t:'Strike & expiration',s:[
['The <b class="y">strike</b> is the locked-in price where you can buy (call) or sell (put).',()=>priceScene([98,101,99,102,100,103,101],100,'The dashed yellow line = the strike')],
['The <b>expiration</b> is the last day the contract exists. After it, the option is exercised or gone.',()=>big('⏳',[['Expiration = the deadline','#facc15'],['Many have weekly & monthly dates','#e8ecf5']])],
['Most US stock options are <b>American style</b> (can be exercised any time before expiration). Index options like SPX are usually <b>European style</b> (only at expiration).',()=>big('🗓️',[['American: any day up to expiration','#4ade80'],['European: only at expiration','#60a5fa']])]],
q:[['The strike price is…',['Today\'s stock price','The locked-in buy/sell price','The premium'],1],['European-style options can be exercised…',['Any day','Only at expiration','Never'],1]]},
{id:'prem',e:'💰',t:'Premium & buy vs sell',s:[
['The <b class="y">premium</b> is the price of the option. Quoted per share: $3.00 × 100 = <b>$300</b> per contract.',()=>trade('Buyer','Seller','#3b82f6','#ef4444','Premium $3.00 × 100 = $300 paid to the seller')],
['<b class="b">Buying</b>: pay premium. Max loss = premium. Profit potential can be large.',()=>payoffSVG(STRATS['Long Call'].legs)],
['<b class="r">Selling</b> (writing): collect premium. Max gain = premium. Risk can be large — even unlimited for a naked call.',()=>payoffSVG([{t:'c',q:-1,K:100,pr:3}])]],
q:[['Premium quoted at $2.50. Cost of 1 contract?',['$2.50','$25','$250'],2],['Max profit for an option SELLER is…',['Unlimited','The premium received','The strike'],1]]},
{id:'money',e:'🎚️',t:'In / at / out of the money',s:[
['Moneyness tells you where the price is versus the strike.',moneyScene],
['<b>Calls</b>: ITM when price > strike. <b>Puts</b>: ITM when price < strike. It flips!',()=>big('🔄',[['Call ITM: price ABOVE strike','#4ade80'],['Put ITM: price BELOW strike','#f87171']])],
['OTM options are cheaper because they need a move to pay off; they also expire worthless more often.',()=>priceScene([100,101,100,102,101,103,102],110,'Strike $110 call is OTM: price must climb first','#60a5fa')]],
q:[['Stock $50, put strike $55. The put is…',['ITM','ATM','OTM'],0],['Stock $50, call strike $55. The call is…',['ITM','ATM','OTM'],2]]},
{id:'value',e:'🧊',t:'Intrinsic vs time value',s:[
['Premium = <b class="g">intrinsic value</b> + <b class="b">time (extrinsic) value</b>.',()=>bars([{h:110,c:'#4ade80',l:'Intrinsic'},{h:70,c:'#60a5fa',l:'Time value'}],'Premium = Intrinsic + Time value')],
['Example: stock $105, call strike $100, premium $7. Intrinsic = $5. Time value = $2.',()=>bars([{h:150,c:'#4ade80',l:'$5 intrinsic'},{h:60,c:'#60a5fa',l:'$2 time'}],'$7 premium = $5 + $2')],
['OTM options have <b>zero</b> intrinsic value — their whole price is time value.',()=>bars([{h:4,c:'#4ade80',l:'$0 intrinsic'},{h:90,c:'#60a5fa',l:'All time value'}],'OTM option = 100% time value')]],
q:[['Stock $105, call strike $100, premium $7. Time value?',['$2','$5','$7'],0],['An OTM option\'s intrinsic value is…',['Positive','Zero','Negative'],1]]},
{id:'decay',e:'🫠',t:'Time decay',s:[
['Time value <b>melts</b> every day. This is called <b>theta decay</b>. It hurts buyers and helps sellers.',meltScene],
['Watch the premium of an ATM option melt as expiration approaches — it speeds up in the final weeks.',decayAnim],
['Decay is fastest for at-the-money options near expiration.',()=>big('⏱️',[['Last 30 days: decay accelerates','#f87171'],['Sellers like this, buyers fight it','#facc15']])]],
q:[['Time decay generally helps…',['Option buyers','Option sellers','Neither'],1],['Decay usually speeds up…',['Far from expiration','Near expiration','Never changes'],1]]},
{id:'iv',e:'🌊',t:'Implied volatility',s:[
['<b>Implied volatility (IV)</b> is the market\'s guess of how much price will swing. It comes from option prices.',ivScene],
['Higher IV = pricier options. Before earnings, IV often rises; after, it often drops fast (<b>"IV crush"</b>).',ivAnim],
['IV doesn\'t predict direction — only the size of expected moves.',()=>big('↕️',[['IV = size of move, not direction','#60a5fa']])]],
q:[['Higher IV makes options…',['Cheaper','More expensive','No change'],1],['IV crush often happens…',['After earnings','Before earnings','On weekends only'],0]]},
{id:'greeks',e:'🧮',t:'The Greeks',s:[
['<b>Delta (Δ)</b>: how much the option moves per $1 stock move. Call 0 to 1, put 0 to −1. ATM ≈ 0.50.',()=>greekScene('Δ','Delta = speed vs. the stock','#4ade80')],
['<b>Gamma (Γ)</b>: how fast delta changes. Highest ATM near expiration.',()=>greekScene('Γ','Gamma = acceleration of delta','#60a5fa')],
['<b>Theta (Θ)</b>: dollars lost per day from time decay. <b>Vega (ν)</b>: change per 1-point IV move.',()=>greekScene('Θ ν','Theta = daily melt · Vega = IV sensitivity','#facc15')],
['Play with the sliders — the Greeks update live (Black-Scholes model, strike $100).',greekLab]],
q:[['A call with delta 0.50 — stock up $1, option up about…',['$0.05','$0.50','$5'],1],['Which Greek measures time decay?',['Vega','Gamma','Theta'],2],['Which Greek measures IV sensitivity?',['Vega','Delta','Theta'],0]]},
{id:'payoff',e:'📉',t:'Payoff diagrams',s:[
['A payoff diagram shows profit/loss <b>at expiration</b> for every stock price. Green = profit, red = loss.',()=>payoffSVG(STRATS['Long Call'].legs)],
['Long call, strike $100, premium $3. Breakeven = $103. Max loss = $300.',()=>payoffSVG(STRATS['Long Call'].legs)],
['Long put, strike $100, premium $3. Breakeven = $97. Max loss = $300.',()=>payoffSVG(STRATS['Long Put'].legs)],
['Watch the price slide and P/L follow it:',payAnim]],
q:[['Long call strike $100, premium $3. Breakeven?',['$97','$100','$103'],2],['Long put max loss is…',['Unlimited','The premium paid','The strike'],1]]},
{id:'strat',e:'🧩',t:'Basic strategies',s:Object.entries(STRATS).map(([k,v])=>[`<b class="y">${k}</b>: ${v.d}`,()=>payoffSVG(v.legs)]),
q:[['Covered call = own shares and…',['Buy a call','Sell a call','Buy a put'],1],['Iron condor profits most when price…',['Moves a lot','Stays in a range','Gaps up'],1],['Long straddle needs…',['A big move either way','No movement','Only a drop'],0]]},
{id:'risk',e:'⚠️',t:'Risk & assignment',s:[
['<b>Exercise</b>: buyer uses the right. <b>Assignment</b>: seller is told to fulfill it. Can happen any time with American options.',assignScene],
['ITM options are typically auto-exercised at expiration (in the US, generally if $0.01+ ITM) unless instructed otherwise.',()=>big('🤖',[['ITM at expiration → usually auto-exercised','#facc15'],['Check your broker\'s rules','#e8ecf5']])],
['Selling naked calls has <b class="r">unlimited risk</b>. Most beginners stick to defined-risk trades (long options, spreads).',()=>payoffSVG([{t:'c',q:-1,K:100,pr:3}])],
['Leverage cuts both ways. Many options expire worthless. Only risk money you can afford to lose.',()=>big('🎢',[['Leverage = bigger wins AND losses','#f87171']])]],
q:[['Assignment happens to the…',['Buyer','Seller','Exchange'],1],['A naked short call has…',['Limited risk','Unlimited risk','No risk'],1]]},
{id:'fut',e:'📊',t:'Options on futures',s:[
['Options on futures (like MES, MNQ, MGC) give the right to a <b>futures contract</b>, not shares.',futScene],
['Value per point follows the futures: Micro E-mini S&P (MES) = <b>$5/point</b>, Micro Nasdaq (MNQ) = <b>$2/point</b>, Micro Gold (MGC) = <b>$10 per $1</b>.',()=>big('📏',[['MES $5/pt · MNQ $2/pt','#4ade80'],['MGC $10 per $1 move','#facc15']])],
['CME offers weekly and monthly expirations on many futures options. Same ideas apply: calls, puts, strikes, decay, Greeks.',()=>big('🧠',[['Same concepts, different underlying','#60a5fa']])]],
q:[['Exercising an MES call gives you…',['100 shares of SPY','A long MES futures contract','Cash only, always'],1],['MES value per index point?',['$2','$5','$50'],1]]}];
// ---------- interactive animated steps ----------
function decayAnim(el){el.innerHTML=`<div style="width:100%;padding:10px"><div id="dv"></div><div class="row"><span>Days left: <b id="dd">60</b></span><span>Premium: <b id="dp" class="y"></b></span></div></div>`;let d=60;
const draw=()=>{const xs=[];for(let i=60;i>=0;i--)xs.push(bs(100,100,i/365,.3).price);const c=chartPath(xs,50,560,30,220,0,xs[0]);const i=60-d;
$('#dv').innerHTML=svg(`<path d="${c.d}" stroke="#60a5fa" stroke-width="3" fill="none" opacity=".35"/><path d="${xs.slice(0,i+1).map((v,k)=>(k?'L':'M')+c.X(k)+' '+c.Y(v)).join('')}" stroke="#facc15" stroke-width="4" fill="none"/>
<rect x="${c.X(i)-20}" y="${c.Y(xs[i])-10}" width="40" height="${230-c.Y(xs[i])}" fill="#93c5fd" rx="6"/><text x="300" y="260" fill="#94a3b8" font-size="13" text-anchor="middle">60 days → expiration (ATM, IV 30%)</text>`,270);
$('#dd').textContent=d;$('#dp').textContent='$'+(xs[i]*100).toFixed(0)};const t=setInterval(()=>{if(!document.body.contains(el)){clearInterval(t);return}d=d<=0?60:d-1;draw()},150);draw()}
function ivAnim(el){el.innerHTML=`<div style="width:100%;padding:10px"><div id="iv"></div><div class="row"><span>IV: <b id="ivv" class="b"></b></span><span>ATM call premium: <b id="ivp" class="y"></b></span></div></div>`;let t0=0;
const tm=setInterval(()=>{if(!document.body.contains(el)){clearInterval(tm);return}t0=(t0+1)%80;const iv=t0<50?.2+t0*.012:.8-(t0-50)*.02;const p=bs(100,100,30/365,iv).price;
$('#iv').innerHTML=svg(`<rect x="100" y="${230-p*20}" width="400" height="${p*20}" rx="12" fill="#facc15"/><text x="300" y="${220-p*20}" fill="#fff" font-size="20" text-anchor="middle">${t0<50?'IV rising into earnings 📈':'IV CRUSH after earnings 💥'}</text>`,250);
$('#ivv').textContent=(iv*100).toFixed(0)+'%';$('#ivp').textContent='$'+(p*100).toFixed(0)},120)}
function greekLab(el){el.innerHTML=`<div style="width:100%;padding:8px"><label>Stock price: <b id="gs"></b><input type=range id="gS" min=80 max=120 value=100></label><label>Days to expiration: <b id="gd"></b><input type=range id="gD" min=1 max=90 value=30></label>
<label>Implied volatility: <b id="gi"></b><input type=range id="gI" min=10 max=100 value=30></label><select id="gT"><option value=1>Call</option><option value=0>Put</option></select><div class="stats" id="gOut"></div><div id="gBar"></div></div>`;
const up=()=>{const S=+$('#gS').value,D=+$('#gD').value,I=$('#gI').value/100,c=$('#gT').value=='1',g=bs(S,100,D/365,I,c);$('#gs').textContent='$'+S;$('#gd').textContent=D;$('#gi').textContent=(I*100)+'%';
$('#gOut').innerHTML=[['Price','$'+(g.price*100).toFixed(0),'y'],['Δ Delta',g.delta.toFixed(2),'g'],['Γ Gamma',g.gamma.toFixed(3),'b'],['Θ Theta/day','-$'+Math.abs(g.theta*100).toFixed(2),'r'],['ν Vega','$'+(g.vega*100).toFixed(2),'b']].map(a=>`<div class="pop"><small>${a[0]}</small><div class="big ${a[2]}" style="font-size:20px">${a[1]}</div></div>`).join('');
$('#gBar').innerHTML=svg(`<rect x="50" y="20" width="${Math.abs(g.delta)*500}" height="30" rx="8" fill="#4ade80" style="transition:width .4s"/><text x="55" y="42" fill="#06210f" font-weight="800">Delta meter</text>`,70)};
el.querySelectorAll('input,select').forEach(i=>i.oninput=up);up()}
function payAnim(el){el.innerHTML='<div id="pa" style="width:100%"></div>';let s=70,dir=1;const tm=setInterval(()=>{if(!document.body.contains(el)){clearInterval(tm);return}s+=dir;if(s>=130||s<=70)dir*=-1;$('#pa').innerHTML=payoffSVG(STRATS['Long Call'].legs,s,false)},80)}
// ---------- views ----------
function hdr(){const d=L.filter(l=>P[l.id]).length;$('#prog').textContent=`✅ ${d}/${L.length} lessons`}
function tickerHTML(){let p=100,s='';for(let i=0;i<14;i++){const c=(Math.random()-.5)*3;p+=c;s+=`<span class="${c>=0?'g':'r'}">${['CALL','PUT','Δ','Θ','IV','MES','MNQ','MGC'][i%8]} ${c>=0?'▲':'▼'}${Math.abs(c).toFixed(2)}</span>`}return `<div class="ticker"><div>${s}${s}</div></div>`}
function homeView(){V.innerHTML=tickerHTML()+`<div class="stage" style="min-height:200px">${svg(guy(110,90,'#3b82f6','Bea the Buyer')+guy(490,90,'#ef4444','Sam the Seller','happy',.6)+coins(160,440,95,5)+doc(440,160,125)+T(300,240,'Learn options the animated way!','#4ade80',24)+T(300,275,'Tap a lesson • Watch • Quiz • Earn ✅','#cbd5ee',15,'popin',.6),290)}</div>
<h2>Lessons</h2><div class="grid">${L.map((l,i)=>`<div class="card" style="animation-delay:${i*.06}s" onclick="lesson(${i})"><div style="font-size:34px" class="bob">${l.e}</div><h3>${i+1}. ${l.t}</h3><p>${l.s.length} animated steps · ${l.q.length} quiz Qs</p>${P[l.id]?`<div class="done">✅ Done — score ${P[l.id]}</div>`:''}</div>`).join('')}</div>
<p class="note">Educational only. Not financial advice. This app never places trades. <a href="#" style="color:#8090b0" onclick="if(confirm('Reset progress?')){localStorage.oaProg='{}';location.reload()}">Reset progress</a></p>`}
let cur=0,st=0;
window.lesson=(i,s=0)=>{cur=i;st=s;const l=L[i],step=l.s[st];V.innerHTML=`<div class="slide"><div class="row"><button class="btn alt" onclick="home()">← Lessons</button><b>${l.e} ${l.t}</b></div>
<div class="dots">${l.s.map((_,k)=>`<i class="${k<=st?'on':''}"></i>`).join('')}</div><div class="stage" id="stg"></div><p class="txt fade">${step[0]}</p>
<div class="row"><button class="btn alt" ${st?'':'disabled'} onclick="lesson(${i},${st-1})">◀ Back</button><button class="btn alt" onclick="lesson(${i},${st})">↻ Replay</button>
<button class="btn" onclick="${st<l.s.length-1?`lesson(${i},${st+1})`:`quiz(${i})`}">${st<l.s.length-1?'Next ▶':'Take quiz 🎯'}</button></div></div>`;
const stg=$('#stg'),r=step[1].length?null:step[1]();if(r)stg.innerHTML=r;else step[1](stg);scrollTo(0,0)};
function confetti(){for(let i=0;i<40;i++){const c=document.createElement('div');c.className='conf';c.style.left=Math.random()*100+'vw';c.style.background=['#4ade80','#facc15','#60a5fa','#f87171'][i%4];c.style.animationDelay=Math.random()*.5+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),2500)}}
window.quiz=(i,k=0,sc=0)=>{const l=L[i];if(k>=l.q.length){const pct=Math.round(sc/l.q.length*100);P[l.id]=pct+'%';save();if(pct>=50)confetti();
V.innerHTML=`<div class="stage slide">${svg(`<text x="300" y="130" font-size="100" text-anchor="middle" class="bob">${pct==100?'🏆':pct>=50?'🎉':'💪'}</text>`+T(300,200,`You scored ${sc}/${l.q.length}`,'#4ade80',30)+T(300,240,pct==100?'Perfect!':pct>=50?'Nice work!':'Replay the lesson and try again','#e8ecf5',18,'popin',.4))}</div>
<div class="row" style="justify-content:center"><button class="btn alt" onclick="lesson(${i})">↻ Replay lesson</button>${i<L.length-1?`<button class="btn" onclick="lesson(${i+1})">Next lesson ▶</button>`:''}<button class="btn alt" onclick="home()">🏠 Home</button></div>`;return}
const [q,o,a]=l.q[k];V.innerHTML=`<div class="slide"><div class="row"><b>🎯 Quiz: ${l.t}</b><span>${k+1}/${l.q.length}</span></div><div class="stage" style="min-height:140px">${svg(guy(300,60,'#8b5cf6','Quiz Bot','neutral'),190)}</div><h3>${q}</h3><div id="ops">${o.map((t,j)=>`<button class="opt" data-j="${j}">${t}</button>`).join('')}</div><div id="fb"></div></div>`;
V.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const j=+b.dataset.j,ok=j==a;V.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(+x.dataset.j==a)x.classList.add('ok')});if(!ok)b.classList.add('bad','shake');else{b.classList.add('pop');confetti()}
$('#fb').innerHTML=`<p class="big ${ok?'g':'r'} pop">${ok?'✅ Correct!':'❌ Not quite'}</p><button class="btn" onclick="quiz(${i},${k+1},${sc+(ok?1:0)})">Continue ▶</button>`})};
function play(){V.innerHTML=`<div class="slide"><h2>🎮 Payoff Playground</h2><select id="ps">${Object.keys(STRATS).map(k=>`<option>${k}</option>`).join('')}</select><p id="pd" class="txt"></p>
<div class="stage" id="pg"></div><label>Stock price at expiration: <b id="pv"></b><input type=range id="pS" min=70 max=130 value=100 step=.5></label>
<div class="row"><button class="btn" id="pAuto">▶ Animate price</button><span id="pl" class="big"></span></div><div class="stats" id="pst"></div><p class="note">Example numbers, stock starts at $100. Educational only.</p></div>`;
let auto=null;const up=()=>{const k=$('#ps').value,S=+$('#pS').value,lg=STRATS[k].legs,v=pay(lg,S);$('#pd').innerHTML=STRATS[k].d+'<br><small>'+lg.map(l=>`${l.q>0?'Buy':'Sell'} ${l.t=='s'?'100 shares @ $'+l.K:(l.t=='c'?'call':'put')+' $'+l.K+' for $'+l.pr}`).join(' · ')+'</small>';
$('#pg').innerHTML=payoffSVG(lg,S,false);$('#pv').textContent='$'+S;$('#pl').innerHTML=`<span class="${v>=0?'g':'r'}">${v>=0?'+$':'-$'}${Math.abs(v).toFixed(0)}</span>`;
const ys=[];for(let s=0;s<=300;s+=.5)ys.push(pay(lg,s));const mx=Math.max(...ys),mn=Math.min(...ys),unl=pay(lg,1000)>mx||pay(lg,1000)<mn-1;
$('#pst').innerHTML=`<div><small>Max profit*</small><div class="g">${pay(lg,1000)>pay(lg,300)+1?'Unlimited':'$'+mx.toFixed(0)}</div></div><div><small>Max loss*</small><div class="r">${pay(lg,1000)<pay(lg,300)-1?'Unlimited':'-$'+Math.abs(mn).toFixed(0)}</div></div>`};
$('#ps').onchange=()=>{$('#pg').innerHTML=payoffSVG(STRATS[$('#ps').value].legs);setTimeout(up,1500)};$('#pS').oninput=up;
$('#pAuto').onclick=()=>{if(auto){clearInterval(auto);auto=null;$('#pAuto').textContent='▶ Animate price';return}let d=1;$('#pAuto').textContent='⏸ Pause';auto=setInterval(()=>{if(!document.body.contains($('#pS')||document.body)){clearInterval(auto);return}let s=+$('#pS').value+d*.5;if(s>=130||s<=70)d*=-1;$('#pS').value=s;up()},50)};up()}
const G=[['Option','Contract giving the right, not obligation, to buy (call) or sell (put) at a set price by a set date.'],['Call','Right to buy at the strike.'],['Put','Right to sell at the strike.'],['Strike','The locked-in price of the option.'],['Expiration','Last day the option exists.'],['Premium','Price of the option, per share (×100 per contract for stocks).'],['Contract multiplier','Shares per contract; 100 for standard US stock options.'],['ITM / ATM / OTM','In, at, or out of the money: where price sits versus the strike.'],['Intrinsic value','The amount an option is in the money. Never below zero.'],['Time (extrinsic) value','Premium minus intrinsic value.'],['Theta decay','Loss of time value as expiration nears.'],['Implied volatility (IV)','Market-implied expected size of price moves, derived from option prices.'],['IV crush','Sharp drop in IV, often after earnings or big events.'],['Delta','Option price change per $1 move in the underlying.'],['Gamma','Change in delta per $1 move.'],['Theta','Option value lost per day from time.'],['Vega','Option price change per 1 percentage point of IV.'],['Exercise','Buyer using the option\'s right.'],['Assignment','Seller being required to fulfill the contract.'],['American style','Can be exercised any time before expiration.'],['European style','Can be exercised only at expiration.'],['Breakeven','Price where P/L at expiration is zero. Long call: strike + premium. Long put: strike − premium.'],['Covered call','Own 100 shares and sell a call against them.'],['Cash-secured put','Sell a put while holding cash to buy the shares if assigned.'],['Vertical spread','Buy and sell same-type options, same expiration, different strikes.'],['Straddle','Call and put at the same strike and expiration.'],['Iron condor','Short OTM put spread + short OTM call spread; range-bound strategy.'],['Naked option','Sold option without an offsetting position; can carry very large risk.'],['Open interest','Number of contracts currently open.'],['Options on futures','Options whose exercise delivers a futures contract (e.g., MES, MNQ, MGC).']];
function gloss(){V.innerHTML=`<div class="slide"><h2>📖 Glossary</h2><input id="gq" placeholder="Search…" style="width:100%;padding:10px;border-radius:8px;border:1px solid #243056;background:#151f3d;color:#fff;font-size:16px"><dl class="gl" id="gl"></dl></div>`;
const r=()=>{const q=$('#gq').value.toLowerCase();$('#gl').innerHTML=G.filter(g=>(g[0]+g[1]).toLowerCase().includes(q)).map((g,i)=>`<div class="fade" style="animation-delay:${i*.03}s"><dt>${g[0]}</dt><dd>${g[1]}</dd></div>`).join('')};$('#gq').oninput=r;r()}
const views={home:homeView,play,gloss};document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on'));b.classList.add('on');views[b.dataset.v]()});
window.home=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x.dataset.v=="home"));homeView()};
hdr();{const h=location.hash;if(h.startsWith("#lesson")){const [a,b]=h.slice(8).split(",");lesson(+a,+b||0)}else if(h=="#play")play();else if(h=="#gloss")gloss();else window.home()}if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
