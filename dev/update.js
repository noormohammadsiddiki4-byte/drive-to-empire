/* Drive to Empire - update.js
   Adds: rain, headlights, lit windows at night, nitro (ACT while moving), daily missions, achievements.
   Driving controls are unchanged. Load AFTER the main script. */
(()=>{
const T=THREE,BASE=CARS.map(c=>c.v),KEY='dte_x',nit={v:100,on:false};
const day=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
let X={day:'',m:[],a:{},st:{},b:0};
try{Object.assign(X,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
X.st=X.st||{};X.a=X.a||{};
let dirty=0,pe=S.earn;
const save2=()=>{if(!dirty)return;dirty=0;try{localStorage.setItem(KEY,JSON.stringify(X))}catch(e){}};

/* ---------- toast ---------- */
const tt=document.createElement('div');
tt.style.cssText='position:absolute;top:16%;width:100%;text-align:center;font:700 17px system-ui;color:#f3d27a;text-shadow:0 2px 6px #000;pointer-events:none;z-index:8';
document.body.appendChild(tt);
const q=[];let busy=0;
function toast(t){q.push(t);if(!busy)nx()}
function nx(){const t=q.shift();if(!t){busy=0;tt.textContent='';return}busy=1;tt.textContent=t;setTimeout(nx,2600)}

/* ---------- missions & achievements ---------- */
const POOL=[
{k:'pax',f:n=>`Deliver ${n} passengers`,t:[3,5,8],r:600},
{k:'coin',f:n=>`Collect ${n} coins`,t:[30,60,100],r:500},
{k:'km',f:n=>`Drive ${n} km`,t:[3,5,8],r:500},
{k:'nitro',f:n=>`Use nitro ${n} times`,t:[3,5,8],r:400},
{k:'clean',f:n=>`Drive ${n} km without a crash`,t:[1,2,3],r:700,max:1},
{k:'speed',f:n=>`Reach ${n} km/h`,t:[90,100,110],r:500,max:1},
{k:'earn',f:n=>`Earn $${n}`,t:[1500,2500,4000],r:600},
{k:'fuel',f:n=>`Refuel ${n} times`,t:[1,2,3],r:450},
{k:'cp',f:n=>`Pass ${n} checkpoints`,t:[3,6,10],r:550},
{k:'overtake',f:n=>`Overtake ${n} cars`,t:[5,10,18],r:650},
{k:'drift',f:n=>`Drift for ${n} seconds`,t:[5,10,20],r:700},
{k:'nocrash',f:n=>`Drive ${n} km with zero crashes`,t:[2,4,6],r:800,max:1},
{k:'police',f:n=>`Escape the police ${n} times`,t:[1,2,3],r:900},
{k:'longtrip',f:n=>`Complete ${n} long trips (5km+)`,t:[1,2,3],r:750},
{k:'topspd',f:n=>`Hold ${n} km/h for 5 seconds`,t:[80,100,120],r:600,max:1}];
const ACH=[
['first','First Fare',s=>s.pax>=1,200],
['taxi','Taxi Pro: deliver 25 passengers',s=>s.pax>=25,1500],
['coin','Coin Collector: 200 coins',s=>s.coins>=200,1000],
['km','Road Warrior: drive 50 km',s=>s.km>=50,2000],
['fast','Speed Demon: reach 150 km/h',s=>s.best>=150,1000],
['nit','Nitro Master: use nitro 20 times',s=>s.nitro>=20,800],
['rain','Rainy Day: drive 1 km in the rain',s=>s.rain>=1,600],
['night','Night Rider: drive 2 km at night',s=>s.night>=2,600],
['clean','Clean Driver: 3 km without a crash',s=>s.cl>=3,800],
['car','Collector: own 3 cars',()=>S.own.length>=3,1500],
['esc','Escape Artist: outrun the police',s=>s.esc>=1,1000],
['car5','Garage King: own 5 cars',()=>S.own.length>=5,2500],
['car8','Fleet Owner: own 8 cars',()=>S.own.length>=8,5000],
['carall','Perfectionist: own every car',()=>S.own.length>=CARS.length,15000],
['km100','Long Hauler: drive 100 km',s=>s.km>=100,3000],
['km250','Road Legend: drive 250 km',s=>s.km>=250,6000],
['fast200','Hyper Speed: reach 200 km/h',s=>s.best>=200,2500],
['nit50','Nitro Addict: use nitro 50 times',s=>s.nitro>=50,2000],
['pax100','People Mover: deliver 100 passengers',s=>s.pax>=100,4000],
['coin500','Coin Tycoon: 500 coins',s=>s.coins>=500,3000],
['clean10','Flawless: 10 km without a crash',s=>s.cl>=10,4000],
['night10','Night Owl: drive 10 km at night',s=>s.night>=10,2500],
['rain10','Storm Chaser: drive 10 km in the rain',s=>s.rain>=10,2500],
['cp50','Checkpoint Ace: pass 50 checkpoints',s=>s.cp>=50,3000],
['esc10','Untouchable: escape the police 10 times',s=>s.esc>=10,5000],
['lvl5','Empire Builder: reach Level 5',()=>lvl()>=5,5000],
['lvl8','Tycoon: reach Level 8',()=>lvl()>=8,12000],
['lvl10','Dynasty: reach Level 10',()=>lvl()>=10,25000]];

function gen(){
 X.day=day();X.b=0;let h=0;for(const c of X.day)h=(h*31+c.charCodeAt(0))>>>0;
 const r=()=>(h=(h*1664525+1013904223)>>>0)/4294967296,ix=POOL.map((_,i)=>i);
 for(let i=ix.length-1;i>0;i--){const j=r()*(i+1)|0;[ix[i],ix[j]]=[ix[j],ix[i]]}
 const tr=lvl()>=4?2:lvl()>=2?1:0;
 X.m=ix.slice(0,3).map(i=>({i,t:POOL[i].t[tr],p:0,d:0}));dirty=1}
if(X.day!==day()||!X.m.length)gen();

function rew(r,t){pay(r);pe=S.earn;toast(t+' +$'+r)}
function ev(k,n){
 const sk={coin:'coins',clean:'cl',speed:'best'}[k]||k;
 if(k=='clean'||k=='speed')X.st[sk]=Math.max(X.st[sk]||0,n);else if(k!='earn')X.st[sk]=(X.st[sk]||0)+n;
 X.m.forEach(m=>{const p=POOL[m.i];if(p.k!=k||m.d)return;m.p=p.max?Math.max(m.p,n):m.p+n;
  if(m.p>=m.t){m.d=1;m.p=m.t;rew(p.r,'Mission complete!')}});
 if(!X.b&&X.m.length&&X.m.every(m=>m.d)){X.b=1;rew(1000,'All daily missions done!')}
 ACH.forEach(a=>{if(!X.a[a[0]]&&a[2](X.st)){X.a[a[0]]=1;rew(a[3],'Achievement: '+a[1])}});
 dirty=1}

/* ---------- missions screen ---------- */
const mb=document.createElement('button');mb.className='b';mb.textContent='MISSIONS';
const hm=$('home');hm.insertBefore(mb,hm.lastElementChild);
const pn=document.createElement('div');
pn.style.cssText='position:absolute;inset:0;z-index:9;background:#000e;display:none;overflow:auto;padding:14px;box-sizing:border-box;font-size:14px;touch-action:pan-y';
document.body.appendChild(pn);
mb.onclick=()=>{if(X.day!==day())gen();
 const bar=(v,m)=>`<div style="height:8px;background:#2a2108;border-radius:5px"><div style="height:8px;width:${Math.min(100,v/m*100)}%;background:#d9a520;border-radius:5px"></div></div>`;
 pn.innerHTML='<h2 style="color:#f3d27a;margin:4px 0">DAILY MISSIONS</h2>'+
 X.m.map(m=>{const p=POOL[m.i];return `<div style="margin:10px 0"><div>${m.d?'✅ ':''}${p.f(m.t)} <b style="color:#f3d27a">+$${p.r}</b></div>${bar(m.p,m.t)}</div>`}).join('')+
 `<div style="color:#b8860b">All 3 done: +$1000 bonus${X.b?' ✅':''}</div>
 <h2 style="color:#f3d27a;margin:18px 0 4px">ACHIEVEMENTS</h2>`+
 ACH.map(a=>`<div style="margin:6px 0;opacity:${X.a[a[0]]?1:.6}">${X.a[a[0]]?'🏆':'🔒'} ${a[1]} <b style="color:#f3d27a">+$${a[3]}</b></div>`).join('')+
 '<div style="margin:18px 0;color:#b8860b">Nitro: press ACT while the car is moving.</div><div style="text-align:center"><button class="b" id="mcl">CLOSE</button></div>';
 pn.style.display='block';$('mcl').onclick=()=>pn.style.display='none'};

/* ---------- nitro bar ---------- */
const nb=document.createElement('div');
nb.style.cssText='position:absolute;top:190px;left:8px;width:90px;height:14px;border:1px solid #b8860b;border-radius:8px;background:#000a;overflow:hidden;display:none;pointer-events:none;z-index:3';
const nf=document.createElement('div');nf.style.cssText='height:100%;width:100%;background:#f3d27a';
const nl=document.createElement('div');nl.textContent='NITRO';nl.style.cssText='position:absolute;inset:0;font:700 9px/14px system-ui;text-align:center;color:#fff;text-shadow:0 0 3px #000';
nb.append(nf,nl);document.body.appendChild(nb);

/* ---------- rain ---------- */
const RN=1400,rp=new Float32Array(RN*6),rg2=new T.BufferGeometry(),D=[];
rg2.setAttribute('position',new T.BufferAttribute(rp,3));
const rm=new T.LineSegments(rg2,new T.LineBasicMaterial({color:0xaec6e0,transparent:true,opacity:0}));
rm.frustumCulled=false;rm.visible=false;sc.add(rm);
for(let i=0;i<RN;i++)D.push({x:(Math.random()-.5)*60,y:Math.random()*30,z:8-Math.random()*68});

/* ---------- headlights & nitro flames ---------- */
const hg=new T.Group();sc.add(hg);
const pt2=tex(64,128,g=>{const r=g.createRadialGradient(32,64,2,32,64,60);r.addColorStop(0,'rgba(255,240,190,1)');r.addColorStop(1,'rgba(255,240,190,0)');g.fillStyle=r;g.fillRect(0,0,64,128)});
const pool=new T.Mesh(new T.PlaneGeometry(8,26),new T.MeshBasicMaterial({map:pt2,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));
pool.rotation.x=-Math.PI/2;pool.position.set(0,.07,-15);hg.add(pool);
const bgeo=new T.ConeGeometry(2.4,20,16,1,true);bgeo.rotateX(Math.PI/2);bgeo.translate(0,0,-10);
const bmat=new T.MeshBasicMaterial({color:0xfff3c8,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),BM=[];
for(const s of[-1,1]){const m=new T.Mesh(bgeo,bmat);m.position.set(s*.62,.7,-2.2);m.visible=false;hg.add(m);BM.push(m)}
const fgeo=new T.ConeGeometry(.28,1.8,10);fgeo.rotateX(Math.PI/2);fgeo.translate(0,0,.9);
const fmat=new T.MeshBasicMaterial({color:0xff8a2a,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}),FL=[];
for(const s of[-1,1]){const m=new T.Mesh(fgeo,fmat);m.position.set(s*.55,.5,2.4);m.visible=false;hg.add(m);FL.push(m)}

/* ---------- lit windows on city buildings ---------- */
const win=(lit)=>tex(128,256,g=>{g.fillStyle=lit?'#000':'#7d8892';g.fillRect(0,0,128,256);
 for(let r=0;r<8;r++)for(let c=0;c<4;c++){if(lit){if(Math.random()<.45){g.fillStyle='#ffd37a';g.fillRect(c*32+6,r*32+7,20,18)}}else{g.fillStyle='#26323d';g.fillRect(c*32+6,r*32+7,20,18)}}});
const bw=new T.MeshStandardMaterial({map:win(0),emissiveMap:win(1),emissive:0xffffff,emissiveIntensity:0,roughness:.7});
TR.forEach(o=>{o.b.material=bw;o.u0=o.b.geometry.attributes.uv.array.slice();o.sy=0});

/* ---------- hooks into the game ---------- */
let lt=0,ps=null,cl=0,rn=0,sa=0,tip=0,spdHold=0,driftAcc=0,lastFuel=100,lastCp=0;const vv=new T.Vector3();

const _m=msg;msg=function(t){_m(t);t=String(t);
 if(t.startsWith('Fare'))ev('pax',car.pax);
 else if(t=='Crash!'){cl=0;nit.on=false}
 else if(t.startsWith('Escaped'))ev('esc',1)
 else if(t.startsWith('Refueled'))ev('fuel',1)};

const _a=act;act=function(){
 if(run&&Math.abs(car.v)>2.5){
  if(!nit.on&&nit.v>=30){nit.on=true;ev('nitro',1);tone(260,.6,'sawtooth',.05)}
  else if(!nit.on)msg('Nitro charging...');
  return}
 _a()};

const _p=play;play=function(){_p();if(!run)return;
 nit.v=100;nit.on=false;lt=0;ps=null;cl=0;pe=S.earn;
 if(!tip){tip=1;toast('Tip: press ACT while moving for NITRO')}};

const _q=quit;quit=function(){nit.on=false;CARS.forEach((c,i)=>c.v=BASE[i]);nb.style.display='none';save2();_q()};

const _f=frame;frame=function(t){
 if(!run)return;
 const dt=Math.min(.05,(t-(lt||t))/1e3);lt=t;
 if(nit.on){nit.v-=26*dt;car.v+=20*dt;if(nit.v<=0){nit.v=0;nit.on=false}}else nit.v=Math.min(100,nit.v+5*dt);
 CARS[S.cur].v=BASE[S.cur]*(nit.on?1.35:1);
 _f(t);

 const ph=(clk/45)%4,i=ph|0,l=LL[i]+(LL[(i+1)%4]-LL[i])*(ph-i),nt=1-l,se=lvl()>=3?(clk/90|0)%6:0;

 /* rain (Monsoon season, Lv3+) */
 rn+=((se==2?1:0)-rn)*Math.min(1,dt*.8);
 rm.visible=rn>.02;
 if(rm.visible){
  rm.material.opacity=.5*rn;cam.getWorldDirection(vv);rm.rotation.y=Math.atan2(-vv.x,-vv.z);rm.position.set(cam.position.x,0,cam.position.z);
  const sk=Math.abs(car.v)*.03+.3;
  for(let k=0;k<RN;k++){const d=D[k];d.y-=32*dt;d.z+=car.v*dt;if(d.y<0)d.y+=30;if(d.z>8)d.z-=68;
   const o=k*6;rp[o]=d.x;rp[o+1]=d.y;rp[o+2]=d.z;rp[o+3]=d.x;rp[o+4]=d.y+.8;rp[o+5]=d.z-sk}
  rg2.attributes.position.needsUpdate=true}
 road.material.roughness=.85-.5*rn;

 /* headlights + flames (AUTO: on at night/dusk, off in day) */
 const nightness=nt;                 // 1 = full night, 0 = full day
 const autoOn=nightness>.45;        // auto headlights: dusk/night only
 const on=Math.max(autoOn?nightness:0,rn*.4),lit=on>.03;
 hg.visible=lit||nit.on;
 if(hg.visible){hg.position.copy(car.m.position);hg.rotation.y=car.m.rotation.y;
  pool.visible=lit;BM.forEach(m=>m.visible=false);pool.material.opacity=.55*on;bmat.opacity=0;
  FL.forEach(m=>{m.visible=nit.on;m.scale.set(1,1,.7+Math.random()*.7)})}
 /* tail lights glow at night */
 if(car.m&&car.m.userData.tl)car.m.userData.tl.emissiveIntensity=autoOn?2.2:1.2;

 /* windows */
 bw.emissiveIntensity=nt*1.6;
 TR.forEach((o,k)=>{if(o.sy!==o.b.scale.y){o.sy=o.b.scale.y;const a=o.b.geometry.attributes.uv,s=o.sy/10,off=(k*.37)%1;
  for(let n=0;n<a.count;n++){a.array[2*n]=o.u0[2*n];a.array[2*n+1]=o.u0[2*n+1]*s+off}a.needsUpdate=true}});

 /* nitro HUD + camera */
 nb.style.display='block';nf.style.width=nit.v+'%';nf.style.background=nit.on?'#ff7a1a':'#f3d27a';
 if(nit.on){cam.fov+=8;cam.updateProjectionMatrix()}

 /* mission / achievement tracking */
 const d=S.earn-pe;pe=S.earn;if(d>0){ev('earn',d);if(d>=25&&d<100)ev('coin',1)}
 const spd=Math.abs(car.v)*3.6;ev('speed',spd);
 if(spd>=80){spdHold+=dt;if(spdHold>=5){spdHold=-1e9;ev('topspd',spd)}}else if(spdHold>=0)spdHold=0;
 if(ps!=null){const ds=car.s-ps;if(ds>0&&ds<100){const km=ds/1e3;cl+=km;ev('km',km);ev('clean',cl);if(rn>.5)ev('rain',km);if(nt>.7)ev('night',km)}
  else if(ds<0)cl=0}
 if(car.fuel>lastFuel+20)ev('fuel',1);lastFuel=car.fuel;
 if(typeof CPS!=='undefined'&&CPS){const done=CPS.filter(c=>c.passed).length;if(done>lastCp){ev('cp',done-lastCp);lastCp=done}}
 if(typeof TRF!=='undefined'&&TRF)TRF.forEach(t=>{if(t.s>0&&Math.abs(t.s-car.s)<3&&!t._ot){t._ot=1;ev('overtake',1)}else if(Math.abs(t.s-car.s)>8)t._ot=0});
 ps=car.s;
 if((sa+=dt)>3){sa=0;save2()}
};
})();
