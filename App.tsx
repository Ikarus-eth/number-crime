import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ==========================================================================
   DISPATCH v3 — number sense through detective work.

   Rebuilt after review. What changed and why (short version):
   - Everything a pre-reader must understand is SPOKEN. No silent clues.
   - Eliminations now run on NUMBERS: every suspect wears a booking placard,
     dispatch calls out which number is cleared, and the player finds that
     numeral and stamps him out. The crime layer IS numeral practice now.
   - The old feature-logic elimination (with negative clues) is gone. One
     positive witness clue remains as the finale: two suspects left, the
     witness remembers one thing, tap the right one.
   - The player DRIVES the police car along the 1-10 route himself, one
     square at a time, each number spoken (Siegler & Ramani mechanism).
   - Difficulty is gated per numeral, not per mode roulette: a numeral that
     is not yet secure only appears in the three teaching modes (radio,
     count, frame). Radar / neighbour / trace / compare unlock per numeral
     once it is secure. Brand-new numerals get a spoken teach beat first.
   - Speed tiers are gone. Radar flash is fixed and structured (tray/dice).
   - Mastery stats are honest: only the FIRST attempt of a task records.
   - First miss = "have another go" (no answer reveal). Second miss = show
     and say the answer. Third miss = glow the answer and move on. A case
     always ends in an arrest; the stats stay truthful either way.
   - Progress is visible: rank promotions with a badge ceremony (Rookie ->
     Officer -> Detective -> Sergeant -> Chief), gold numeral badges on the
     station wall, a trophy board of caught robbers, Rex every 5th case
     with a WANTED poster teasing him one case ahead.
   - Cases survive interruption: quit / reload resumes mid-case.
   - Parent panel: erase needs a confirm, two-player toggle lives here now,
     and progress can be exported/imported as a backup code (travel-proof).

   RECORDED CLIPS — mirror these ids into audio/<id>.mp3. Browser speech
   covers anything missing. Full list:
     place_bank place_museum place_jeweller place_harbour place_toys
     place_station brief again scaffold help_trace help_show not_that
     drive_go witness badge rex arrest turn_hero turn_other
     frame_ask trace_ask count_ask radar_ask next_ask prev_ask split_ask
     compare_ask rank_2 rank_3 rank_4 rank_5
     clue_hat_1 clue_glasses_1 clue_stache_1 clue_stripes_1
     radio_1..10  vault_1..10  wrong_1..10  num_1..10  count_1..10
     clear_1..10
   ========================================================================== */

export const HERO = "Nalu";
const W = 1000, H = 660;

const C = {
  night:"#0B1F2A", panel:"#12303F", panelHi:"#1B4256", board:"#25404E",
  bone:"#F2EDE4", amber:"#FFB100", blue:"#2E9BFF", violet:"#9B7BD4",
  red:"#FF4A3D", green:"#3FD68C", dim:"#5A7C8C", edge:"#08151C",
};
const DIGIT_FONT = 'Verdana, Tahoma, "DejaVu Sans", sans-serif';
const UI_FONT = '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif';
const WORDS = {1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten"};

/* ---------------- case world ---------------- */

const PLACES = [
  {id:"bank",    name:"City Bank",        loot:"gold bars"},
  {id:"museum",  name:"Old Museum",       loot:"jewels"},
  {id:"jeweller",name:"Corner Jewellers", loot:"rings"},
  {id:"harbour", name:"Harbour Depot",    loot:"crates"},
  {id:"toys",    name:"Toy Factory",      loot:"robots"},
  {id:"station", name:"Train Station",    loot:"mail bags"},
];

const FEATURES = ["hat","glasses","stache","stripes"];
const SUSPECT_POOL = [
  {id:"rex",  name:"Rex",  skin:"#C98B5E", shirt:"#3C6E8F"},
  {id:"bo",   name:"Bo",   skin:"#8C5A3A", shirt:"#7A5AA8"},
  {id:"cliff",name:"Cliff",skin:"#E0AE84", shirt:"#B5623F"},
  {id:"duke", name:"Duke", skin:"#9C6742", shirt:"#4F8F6B"},
  {id:"vic",  name:"Vic",  skin:"#D89C72", shirt:"#8F8A45"},
  {id:"moe",  name:"Moe",  skin:"#B07A50", shirt:"#5C6B8A"},
  {id:"gus",  name:"Gus",  skin:"#7E5233", shirt:"#3F7F86"},
  {id:"hank", name:"Hank", skin:"#EBBE96", shirt:"#A34F70"},
];

/* ---------------- spoken lines ---------------- */

export const LINE = {
  brief:      "One of them did it. Solve the numbers to catch him.",
  arrest:     "Case closed, Detective " + HERO + ". Take him away.",
  rex:        "You got Rex! That is the one we have been chasing for months.",
  witness:    "Two suspects left. The witness remembers one thing.",
  not_that:   "Not that one. Look again.",
  drive_go:   "Drive! Tap the road.",
  trace_ask:  "Write the number with your finger.",
  frame_ask:  "Fill in that many.",
  count_ask:  "Count the evidence. How many?",
  split_ask:  "Some loot is hiding in the closed box. Fill in the hidden loot.",
  radar_ask:  "Quick! How many did you see?",
  compare_ask:"Two house numbers. Tap the bigger one.",
  next_ask:   "Which house comes right after?",
  prev_ask:   "Which house comes right before?",
  again:      "Have another go.",
  help_trace: "Watch how it goes, then try again.",
  help_show:  "Here it is. Have a go now.",
  scaffold:   "Here is what that many looks like.",
  badge:      "New badge!",
  rank_2:     "Well done, " + HERO + ". You are now an Officer.",
  rank_3:     "Well done, " + HERO + ". You are now a Detective.",
  rank_4:     "Well done, " + HERO + ". You are now a Sergeant.",
  rank_5:     "Amazing, " + HERO + ". You are now the Chief of Police.",
  turn_hero:  HERO + ", your turn.",
  turn_other: "Grown-up, your turn.",
};
PLACES.forEach(p=>{ LINE["place_"+p.id] = "Somebody robbed the " + p.name + " last night."; });
for(const n of Object.keys(WORDS)){
  LINE["radio_"+n] = "Dispatch to " + HERO + ". The number is " + WORDS[n] + ".";
  LINE["vault_"+n] = "The vault code is " + WORDS[n] + ".";
  LINE["wrong_"+n] = "It was " + WORDS[n] + ". " + WORDS[n] + ".";
  LINE["num_"+n]   = "Number " + WORDS[n] + ".";
  LINE["count_"+n] = WORDS[n] + ".";
  LINE["clear_"+n] = "Number " + WORDS[n] + " is cleared. Cross him out.";
}
export const CLUE_LINE = {
  hat_1:"The robber wore a hat.",
  glasses_1:"The robber wore glasses.",
  stache_1:"The robber had a moustache.",
  stripes_1:"The robber wore a striped shirt.",
};
Object.entries(CLUE_LINE).forEach(([k,v])=>{ LINE["clue_"+k]=v; });

/* ---------------- storage (window.storage in chat, localStorage on Pages) */

const KEY = "dispatch:v3";
const OLD_KEY = "dispatch:v2";
async function loadRaw(k){
  try{ if(window.storage){ const r=await window.storage.get(k); return r?r.value:null; } }catch(e){}
  try{ return window.localStorage.getItem(k); }catch(e){ return null; }
}
async function saveRaw(v){
  try{ if(window.storage){ await window.storage.set(KEY,v); return; } }catch(e){}
  try{ window.localStorage.setItem(KEY,v); }catch(e){}
}
const blankStats=()=>{const s={};for(let n=1;n<=10;n++)s[n]={c:0,w:0,streak:0,days:[]};return s;};
const blankSplits=()=>{const s={};for(let t=2;t<=10;t++)for(let a=1;a<t;a++)s[t+"_"+a]=0;return s;};
export const freshProfile=()=>({
  v:3, level:1, stats:blankStats(), splits:blankSplits(),
  cases:0, solved:[], rexCaught:0, voiceURI:null, twoPlayer:false, muted:false,
  activeCase:null,
});
/* Pure so it can be unit-tested. Accepts a parsed object of v2 or v3 shape. */
export function migrateProfile(p){
  const base=freshProfile();
  if(!p||typeof p!=="object"||!p.stats) return base;
  const out={...base,
    level:Math.min(Math.max(+p.level||1,1),5),
    cases:+p.cases||0,
    rexCaught:+p.rexCaught||0,
    voiceURI:p.voiceURI||null,
    twoPlayer:!!p.twoPlayer,
    muted:!!p.muted,
  };
  for(let n=1;n<=10;n++){
    const s=p.stats[n];
    if(s) out.stats[n]={c:+s.c||0,w:+s.w||0,streak:+s.streak||0,days:Array.isArray(s.days)?s.days.slice(-30):[]};
  }
  if(p.splits) for(const k of Object.keys(base.splits)) out.splits[k]=+((p.splits||{})[k])||0;
  if(Array.isArray(p.solved)) out.solved=p.solved.slice(-40);
  if(p.v===3 && p.activeCase && p.activeCase.kase) out.activeCase=p.activeCase;
  return out;
}
async function loadProfile(){
  try{
    let raw=await loadRaw(KEY);
    if(!raw){ raw=await loadRaw(OLD_KEY); }
    return migrateProfile(raw?JSON.parse(raw):null);
  }catch(e){ return freshProfile(); }
}
const saveProfile=p=>saveRaw(JSON.stringify(p));

/* ---------------- sound ---------------- */

export let MUTED=false;
export const setMuted=v=>{ MUTED=!!v; if(MUTED){ try{ window.speechSynthesis.cancel(); }catch(e){} } };

let actx=null;
function ac(){ try{ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==="suspended") actx.resume(); return actx; }catch(e){ return null; } }
function tone(f,dur,type="sine",delay=0,gain=.18){
  if(MUTED) return;
  const a=ac(); if(!a) return;
  const t=a.currentTime+delay, o=a.createOscillator(), g=a.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.015);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+.05);
}
function noise(dur,gain=.06,freq=1700){
  if(MUTED) return;
  const a=ac(); if(!a) return;
  const n=Math.max(1,Math.floor(a.sampleRate*dur)), b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5);
  const src=a.createBufferSource(); src.buffer=b;
  const f=a.createBiquadFilter(); f.type="bandpass"; f.frequency.value=freq; f.Q.value=1.1;
  const g=a.createGain(); g.gain.value=gain;
  src.connect(f); f.connect(g); g.connect(a.destination); src.start();
}
export const sfx = {
  tap:()=>tone(640,.05,"square",0,.07),
  right:()=>{tone(659,.12);tone(880,.17,"sine",.1);},
  wrong:()=>{tone(190,.2,"triangle",0,.13);tone(150,.24,"triangle",.06,.11);},
  squelch:()=>{noise(.13,.05);tone(1250,.04,"square",.02,.04);},
  stamp:()=>{tone(120,.15,"square",0,.16);noise(.08,.05);},
  bust:()=>{tone(300,.1,"square",0,.13);tone(220,.13,"square",.08,.13);noise(.18,.05);},
  shutter:()=>{noise(.05,.09,3200);tone(2000,.03,"square",.05,.05);},
  drive:()=>{tone(420,.09,"triangle",0,.07);tone(520,.09,"triangle",.07,.06);},
  coin:()=>{tone(1050,.07,"square",0,.08);tone(1400,.1,"square",.07,.07);},
  siren:()=>{for(let i=0;i<5;i++){tone(740,.19,"sawtooth",i*.33,.09);tone(980,.19,"sawtooth",i*.33+.16,.09);}},
  fanfare:()=>{tone(523,.16,"square",0,.1);tone(659,.16,"square",.15,.1);tone(784,.2,"square",.3,.1);tone(1047,.34,"square",.45,.12);},
};

/* ---------------- voice: recorded clips first, browser speech as fallback */

const AUDIO_BASE="audio/";
let player=null, playerReady=false;
const missingClips=new Set();
export function primeAudio(){
  if(player) return;
  try{ player=new Audio(); player.preload="auto"; playerReady=true; }catch(e){ playerReady=false; }
}

const GOOD=[/premium/i,/enhanced/i,/\bava\b/i,/\ballison\b/i,/\bsamantha\b/i,/\bnicky\b/i,
  /\baaron\b/i,/\bserena\b/i,/\bzoe\b/i,/\bkaren\b/i,/\bdaniel\b/i,/\bmoira\b/i,/google.*(us|uk)/i];
const JUNK=/compact|eloquence|novelty|whisper|bells|bad news|good news|organ|cellos|zarvox|trinoids|bahh|jester|superstar|wobble|boing|albert|ralph|fred|kathy|junior|princess|deranged|hysterical|bubbles/i;
export let VOICES=[]; let chosen=null;
function scoreVoice(v){
  let s=0;
  if(v.localService===false) s+=45;
  GOOD.forEach((rx,i)=>{ if(rx.test(v.name)) s+=60-i*3; });
  if(/en[-_]US/i.test(v.lang)) s+=6;
  if(/en[-_]GB/i.test(v.lang)) s+=4;
  if(JUNK.test(v.name)) s-=120;
  return s;
}
export function voiceTag(v){
  if(/premium/i.test(v.name)) return "Premium";
  if(/enhanced/i.test(v.name)) return "Enhanced";
  if(v.localService===false) return "Network";
  return "Basic";
}
export function refreshVoices(preferURI){
  try{
    const all=window.speechSynthesis.getVoices()||[];
    VOICES=all.filter(v=>(v.lang||"").toLowerCase().startsWith("en")).sort((a,b)=>scoreVoice(b)-scoreVoice(a));
    const m=preferURI?VOICES.find(v=>v.voiceURI===preferURI):null;
    chosen=m||VOICES[0]||null;
  }catch(e){ VOICES=[]; chosen=null; }
}
export function setVoiceDirect(v){ chosen=v; }

let Q=[], busy=false, gen=0, alive=[], hb=null, guard=null;
const synth=()=>{ try{ return window.speechSynthesis; }catch(e){ return null; } };
function chunks(text){
  const parts=text.match(/[^.!?]+[.!?]*/g)||[text];
  const out=[]; let buf="";
  for(const p of parts){ if(buf&&(buf+p).length>80){ out.push(buf.trim()); buf=p; } else buf+=p; }
  if(buf.trim()) out.push(buf.trim());
  return out.filter(t=>/[a-z0-9]/i.test(t));
}
const startHB=()=>{ if(hb) return; hb=setInterval(()=>{ const s=synth();
  if(s&&s.speaking&&!s.paused){ try{ s.pause(); s.resume(); }catch(e){} } },8000); };
const stopHB=()=>{ if(hb){ clearInterval(hb); hb=null; } };

function pump(g){
  if(g!==gen) return;
  if(!Q.length){ busy=false; stopHB(); return; }
  busy=true;
  const job=Q.shift();
  if(job.clip && playerReady && !missingClips.has(job.clip)){
    let done=false;
    const settle=ok=>{
      if(done||g!==gen) return; done=true; clearTimeout(guard);
      player.onended=null; player.onerror=null;
      if(ok) setTimeout(()=>pump(g), job.gap);
      else { missingClips.add(job.clip); utter(job,g); }
    };
    player.onended=()=>settle(true);
    player.onerror=()=>settle(false);
    guard=setTimeout(()=>settle(false),14000);
    try{ player.src=AUDIO_BASE+job.clip+".mp3"; player.currentTime=0;
         const p=player.play(); if(p&&p.catch) p.catch(()=>settle(false)); }
    catch(e){ settle(false); }
    return;
  }
  utter(job,g);
}
function utter(job,g){
  const s=synth(); if(!s){ busy=false; return; }
  startHB();
  const u=new SpeechSynthesisUtterance(job.text);
  u.lang=(chosen&&chosen.lang)||"en-US"; u.rate=job.rate; u.pitch=job.pitch; u.volume=1;
  if(chosen) u.voice=chosen;
  alive.push(u); if(alive.length>14) alive.shift();
  let done=false;
  const finish=()=>{ if(done||g!==gen) return; done=true; clearTimeout(guard); setTimeout(()=>pump(g),job.gap); };
  u.onend=finish; u.onerror=finish;
  const est=700+(job.text.length*72)/Math.max(job.rate,.5);
  guard=setTimeout(()=>{ if(!done&&g===gen){ try{ s.cancel(); }catch(e){} finish(); } }, est+2600);
  try{ s.speak(u); }catch(e){ finish(); }
}
export function say(text,{rate=.94,pitch=1,radio=false,interrupt=false,gap=140,clip=null}={}){
  if(MUTED) return;
  const s=synth(); if(!text) return;
  if(!chosen) refreshVoices();
  if(interrupt){ gen++; Q=[]; busy=false; clearTimeout(guard); try{ if(s) s.cancel(); }catch(e){}
    try{ if(player){ player.pause(); } }catch(e){} }
  if(radio) sfx.squelch();
  if(clip) Q.push({text,clip,rate,pitch,gap});
  else { const list=chunks(text); list.forEach((t,i)=>Q.push({text:t,rate,pitch,gap:i===list.length-1?gap:100})); }
  if(!busy){ const g=gen; setTimeout(()=>pump(g), interrupt?200:(radio?180:10)); }
}
export const sayLine=(id,opts={})=>say(LINE[id]||id,{clip:id,...opts});
export function primeSpeech(){
  const s=synth(); if(!s) return;
  refreshVoices();
  try{ const u=new SpeechSynthesisUtterance("."); u.volume=0; s.speak(u); }catch(e){}
}

/* ==========================================================================
   ENGINE
   ========================================================================== */

const today=()=>new Date().toISOString().slice(0,10);
export const isSecure=s=>s.streak>=3&&s.days.length>=2;
export const rangeFor=l=>Array.from({length:l===1?5:(l===2?8:10)},(_,i)=>i+1);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function wchoice(pairs){
  let sum=0; for(const p of pairs) sum+=p[1];
  let r=Math.random()*sum;
  for(const p of pairs){ r-=p[1]; if(r<=0) return p[0]; }
  return pairs[pairs.length-1][0];
}

export const RANKS={1:"Rookie",2:"Officer",3:"Detective",4:"Sergeant",5:"Chief"};

const splitsDone=(p,t)=>Object.keys(p.splits).filter(k=>+k.split("_")[0]<=t&&p.splits[k]>=2).length;
export function nextLevel(p){
  const sec=n=>isSecure(p.stats[n]);
  const nsec=arr=>arr.filter(sec).length;
  if(p.level===1 && [1,2,3,4,5].every(sec)) return 2;
  if(p.level===2 && nsec(rangeFor(2))>=7) return 3;
  if(p.level===3 && nsec(rangeFor(3))>=9) return 4;
  if(p.level===4 && splitsDone(p,5)>=8) return 5;
  return p.level;
}

/* Secure numerals must still come back or they quietly decay. Review is due
   at 3, then 7, then 14 days, and an overdue numeral outranks a fresh one. */
const DUE_DAYS=[3,7,14];
const daysBetween=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/86400000);
export function reviewWeight(s){
  if(!isSecure(s)) return 4+Math.min(s.w,4)*2;
  const last=s.days[s.days.length-1];
  if(!last) return 1;
  const gap=daysBetween(last,today());
  const due=DUE_DAYS[Math.min(s.days.length-2,DUE_DAYS.length-1)]||3;
  return gap>=due ? 7 : 1;
}
function weightedPick(range,stats,retry){
  if(retry && retry.length && Math.random()<.55){
    const n=retry[0];
    if(range.includes(n)) return n;
  }
  const w=range.map(n=>reviewWeight(stats[n]));
  let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<range.length;i++){ r-=w[i]; if(r<=0) return range[i]; }
  return range[range.length-1];
}
/* k distinct numbers, weak ones favoured — the booking placards. */
function weightedSample(range,stats,k){
  const left=[...range], out=[];
  while(out.length<k&&left.length){
    const w=left.map(n=>reviewWeight(stats[n]));
    let r=Math.random()*w.reduce((a,b)=>a+b,0), idx=left.length-1;
    for(let i=0;i<left.length;i++){ r-=w[i]; if(r<=0){ idx=i; break; } }
    out.push(left[idx]); left.splice(idx,1);
  }
  return out;
}
function weakSplit(splits,max){
  const keys=Object.keys(splits).filter(k=>{const t=+k.split("_")[0];return t<=max&&t>=2;});
  const w=keys.map(k=>Math.max(1,5-Math.min(splits[k],4)));
  let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<keys.length;i++){ r-=w[i]; if(r<=0) return keys[i]; }
  return keys[keys.length-1];
}

/* -------- case generation --------
   Every suspect wears a numbered booking placard. Each round, dispatch calls
   one number "cleared" and the player finds and stamps that suspect. The last
   two are separated by ONE positive witness clue. The culprit always has the
   witness feature; the runner-up never does. No negation anywhere. */

export function makeCase(profile){
  const place=pick(PLACES);
  const level=profile.level;
  const castSize=level===1?5:6;
  const range=rangeFor(level);
  const pool=shuffle(SUSPECT_POOL).slice(0,castSize);
  if(!pool.find(s=>s.id==="rex")) pool[castSize-1]=SUSPECT_POOL[0];
  const nums=weightedSample(range,profile.stats,castSize);
  const rexCase=(profile.cases+1)%5===0;
  const culpritBase = rexCase ? pool.find(s=>s.id==="rex") : pick(pool.filter(s=>s.id!=="rex"));
  const wf=pick(FEATURES);
  const runnerBase=pick(pool.filter(s=>s!==culpritBase));
  let cast=null;
  for(let attempt=0;attempt<60&&!cast;attempt++){
    const seen=new Set(); const c=[]; let okAll=true;
    for(const s of pool){
      let f={},key,g=0;
      do{
        f={}; FEATURES.forEach(k=>f[k]=Math.random()<.5?1:0);
        if(s===culpritBase) f[wf]=1;
        if(s===runnerBase) f[wf]=0;
        key=FEATURES.map(k=>f[k]).join("");
      }while(seen.has(key)&&++g<30);
      if(seen.has(key)){ okAll=false; break; }
      seen.add(key); c.push({...s,f});
    }
    if(okAll) cast=c;
  }
  if(!cast){
    cast=pool.map(s=>{ const f={}; FEATURES.forEach(k=>f[k]=Math.random()<.5?1:0);
      if(s===culpritBase) f[wf]=1; if(s===runnerBase) f[wf]=0; return {...s,f}; });
  }
  cast.forEach((s,i)=>{ s.num=nums[i]; });
  const culprit=cast.find(s=>s.id===culpritBase.id);
  const runner=cast.find(s=>s.id===runnerBase.id);
  const clearOrder=shuffle(cast.filter(s=>s.id!==culprit.id&&s.id!==runner.id).map(s=>s.id));
  return {place,cast,culprit:culprit.id,runner:runner.id,wf,clearOrder,
    rounds:clearOrder.length+1,rex:culprit.id==="rex"};
}

/* How many squares the car earns per solved round (10 across the case). */
export function movesFor(r,rounds){
  const cum=i=>Math.round(10*(i+1)/rounds);
  return cum(r)-(r>0?cum(r-1):0);
}

/* -------- task generation --------
   The gate is per NUMERAL, not per level: a numeral that is not yet secure
   only appears in the three teaching modes (hear it, count it, build it).
   Radar, neighbour, trace and compare are review formats for secure numerals.
   Brand-new numerals announce themselves with a teach beat first. */

const radarArrange=n=>(n<=6&&Math.random()<.5)?"dice":"tray";

export function makeTask(p,{vault=false,retry=[]}={}){
  const range=rangeFor(p.level);
  const stats=p.stats;
  if(vault){
    const target=weightedPick(range,stats,retry);
    const sec=isSecure(stats[target]);
    const opts=["pad"];
    if(sec) opts.push("trace","radar");
    if(p.level>=4) opts.push("split");
    const fin=pick(opts);
    if(fin==="split"){
      const key=weakSplit(p.splits,p.level>=5?10:5);
      const [t,a]=key.split("_").map(Number);
      return {mode:"split",total:t,a,target:t-a,key,vault:true,promptId:"split_ask"};
    }
    if(fin==="trace") return {mode:"trace",target,vault:true,promptId:"vault_"+target};
    if(fin==="radar") return {mode:"radar",target,vault:true,promptId:"radar_ask",flash:1600,arrange:radarArrange(target)};
    return {mode:"radio",target,vault:true,promptId:"vault_"+target,radio:true};
  }
  if(p.level>=4 && Math.random()<.3){
    const key=weakSplit(p.splits,p.level>=5?10:5);
    const [t,a]=key.split("_").map(Number);
    return {mode:"split",total:t,a,target:t-a,key,promptId:"split_ask"};
  }
  const target=weightedPick(range,stats,retry);
  const s=stats[target];
  const intro=s.c+s.w===0;
  const sec=isSecure(s);
  let mode;
  if(!sec) mode=wchoice([["radio",.40],["count",.35],["frame",.25]]);
  else{
    const modes=[["radio",.14],["count",.14],["frame",.14],["trace",.12]];
    if(p.level>=2) modes.push(["neighbour",.2],["radar",.16]);
    if(p.level>=3) modes.push(["compare",.1]);
    mode=wchoice(modes);
  }
  if(mode==="neighbour"){
    const max=range[range.length-1];
    let dir=(p.level>=4&&Math.random()<.3)?-1:1;
    if(dir===1&&target===1) dir=(p.level>=4)?-1:0;
    if(dir===-1&&target===max) dir=1;
    const from=target-dir;
    if(dir===0||from<1||from>max) mode="count";
    else return {mode:"neighbour",from,dir,target,promptId:dir>0?"next_ask":"prev_ask"};
  }
  if(mode==="compare"){
    const cands=range.filter(n=>n!==target&&Math.abs(n-target)<=3&&isSecure(stats[n]));
    if(!cands.length) mode="radio";
    else{ const b=pick(cands); return {mode:"compare",a:target,b,target:Math.max(target,b),promptId:"compare_ask"}; }
  }
  if(mode==="radar")  return {mode,target,promptId:"radar_ask",flash:1600,arrange:radarArrange(target)};
  if(mode==="trace")  return {mode,target,promptId:"trace_ask"};
  if(mode==="frame")  return {mode,target,promptId:"frame_ask",intro};
  if(mode==="count")  return {mode,target,promptId:"count_ask",intro,arrange:Math.random()<.4?"scatter":"tray"};
  return {mode:"radio",target,promptId:"radio_"+target,radio:true,intro};
}

/* Only the FIRST attempt of a task is recorded — retries teach, stats judge. */
function bumpStat(p,n,good){
  const st=p.stats[n]; if(!st) return;
  if(good){ st.c++; st.streak++; const d=today();
    if(!st.days.includes(d)) st.days.push(d);
    if(st.days.length>30) st.days=st.days.slice(-30); }
  else{ st.w++; st.streak=0; }
}
export function recordTask(p,task,ok){
  if(task.mode==="split"){
    if(ok) p.splits[task.key]=Math.min((p.splits[task.key]||0)+1,5);
    bumpStat(p,task.total,ok);
  } else if(task.mode==="compare"){
    bumpStat(p,task.a,ok); bumpStat(p,task.b,ok);
  } else bumpStat(p,task.target,ok);
  return p;
}
export function recordClear(p,n,ok){ bumpStat(p,n,ok); return p; }
export const secureList=p=>Array.from({length:10},(_,i)=>i+1).filter(n=>isSecure(p.stats[n]));

/* ==========================================================================
   ART
   ========================================================================== */

const KIND_LABEL={bag:"money bags",mask:"masks",boot:"footprints",print:"fingerprints",torch:"flashlights",lens:"magnifying glasses"};
const KINDS=Object.keys(KIND_LABEL);

export function Glyph({kind,size=60,color=C.amber}){
  const s={width:size,height:size,display:"block"}, p={fill:color}, cut=C.night;
  switch(kind){
    case "bag": return (
      <svg viewBox="0 0 100 100" style={s}>
        <path d="M38 20 q12 -8 24 0 l-6 10 h-12 Z" {...p}/>
        <path d="M32 32 h36 c14 12 18 30 14 42 -4 12-18 16-32 16 -14 0-28-4-32-16 -4-12 0-30 14-42 Z" {...p}/>
        <circle cx="50" cy="62" r="13" fill={cut}/><rect x="47" y="52" width="6" height="20" rx="3" {...p}/>
      </svg>);
    case "mask": return (
      <svg viewBox="0 0 100 100" style={s}>
        <path d="M8 40 q42 -14 84 0 q4 22 -8 26 -12 4 -22 -6 -6 -5 -12 -5 -6 0-12 5 -10 10-22 6 -12 -4 -8 -26 Z" {...p}/>
        <circle cx="31" cy="49" r="7" fill={cut}/><circle cx="69" cy="49" r="7" fill={cut}/>
      </svg>);
    case "boot": return (
      <svg viewBox="0 0 100 100" style={s}>
        <path d="M32 12 q22 -4 32 8 6 20 2 40 -4 16-18 16 -14 0-18-16 -4-22 2-48 Z" {...p}/>
        <path d="M34 82 q16 -6 30 0 4 10-2 14 -13 5-26 0 -6-4 -2-14 Z" {...p}/>
        <g fill={cut}><circle cx="42" cy="34" r="4"/><circle cx="56" cy="34" r="4"/><circle cx="42" cy="52" r="4"/><circle cx="56" cy="52" r="4"/></g>
      </svg>);
    case "print": return (
      <svg viewBox="0 0 100 100" style={s}>
        <g fill="none" stroke={color} strokeWidth="7" strokeLinecap="round">
          <path d="M22 62 q0 -40 28 -40 q28 0 28 40"/><path d="M34 66 q0 -28 16 -28 q16 0 16 28"/>
          <path d="M46 70 q0 -18 4 -18 q4 0 4 18"/><path d="M26 78 q4 8 12 10"/><path d="M74 78 q-4 8 -12 10"/>
        </g>
      </svg>);
    case "torch": return (
      <svg viewBox="0 0 100 100" style={s}>
        <path d="M22 34 h20 v32 h-20 q-6 -16 0 -32 Z" {...p}/>
        <rect x="42" y="40" width="34" height="20" rx="6" {...p}/><rect x="52" y="42" width="5" height="16" fill={cut}/>
        <g stroke={color} strokeWidth="6" strokeLinecap="round">
          <line x1="84" y1="50" x2="94" y2="50"/><line x1="80" y1="34" x2="90" y2="27"/><line x1="80" y1="66" x2="90" y2="73"/>
        </g>
      </svg>);
    default: return (
      <svg viewBox="0 0 100 100" style={s}>
        <circle cx="44" cy="42" r="26" fill="none" stroke={color} strokeWidth="9"/>
        <circle cx="44" cy="42" r="17" fill={color} opacity="0.22"/>
        <line x1="63" y1="61" x2="86" y2="84" stroke={color} strokeWidth="12" strokeLinecap="round"/>
      </svg>);
  }
}

const FINGERS=[{x:66,w:24,up:42,down:96},{x:100,w:25,up:28,down:91},{x:134,w:24,up:44,down:96},{x:164,w:20,up:68,down:104}];
export function Hand({up,size=110,color=C.bone,mirror=false}){
  const crease="rgba(11,31,42,0.22)";
  return (
    <svg viewBox="0 0 210 250" style={{width:size,height:size*250/210,display:"block",transform:mirror?"scaleX(-1)":"none"}}>
      <g fill="none" stroke={color} strokeLinecap="round">
        {FINGERS.map((f,i)=><line key={i} x1={f.x} y1="170" x2={f.x} y2={up>=i+2?f.up:f.down} strokeWidth={f.w}/>)}
        {up>=1 ? <path d="M68 192 C 45 180 26 151 22 117" strokeWidth="31"/>
               : <path d="M66 196 C 51 190 43 178 43 164" strokeWidth="29"/>}
      </g>
      <path d="M48 129 Q48 110 69 110 L150 110 Q170 110 170 133 L170 187 Q170 225 109 225 Q48 225 48 187 Z" fill={color}/>
      <g stroke={crease} strokeWidth="5" strokeLinecap="round" fill="none">
        {FINGERS.map((f,i)=>up>=i+2?<line key={i} x1={f.x-f.w/2+5} y1="125" x2={f.x+f.w/2-5} y2="125"/>:null)}
        {up>=1 ? <path d="M52 158 C 49 176 55 190 66 197"/> : <path d="M56 152 C 50 166 52 182 62 194"/>}
      </g>
    </svg>
  );
}

export const Numeral=({n,size=96,color=C.bone})=>(
  <span style={{fontFamily:DIGIT_FONT,fontWeight:700,fontSize:size,color,lineHeight:1,padding:"0 3px",display:"inline-block"}}>{n}</span>
);

/* Five-structure: evidence trays hold exactly five, so 7 is always seen as a
   full tray plus two, never as an unstructured heap. */
export function Trays({n,kind="bag",cell=54,color=C.amber,dim=C.panelHi}){
  const rows=[[0,1,2,3,4],[5,6,7,8,9]].filter((r,i)=>i===0||n>5);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:cell*.16}}>
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:cell*.12,background:C.panel,padding:cell*.14,
          borderRadius:cell*.24,border:`2px solid ${C.edge}`}}>
          {row.map(i=>(
            <div key={i} style={{width:cell,height:cell,borderRadius:cell*.2,background:dim,
              border:`2px solid ${C.edge}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {i<n && <Glyph kind={kind} size={cell*.72} color={color}/>}
            </div>))}
        </div>))}
    </div>
  );
}

const DICE={1:[[50,50]],2:[[28,28],[72,72]],3:[[26,26],[50,50],[74,74]],
  4:[[30,30],[70,30],[30,70],[70,70]],5:[[30,30],[70,30],[50,50],[30,70],[70,70]],
  6:[[30,24],[70,24],[30,50],[70,50],[30,76],[70,76]]};

const scatterPos=(n,cell,seedExtra)=>{
  const seed=n*37+seedExtra;
  const cols=Math.min(n,4), rows=Math.ceil(n/4);
  const colW=cell*1.34, rowH=cell*1.38;
  return {w:cols*colW,h:rows*rowH,
    items:Array.from({length:n},(_,i)=>{
      const col=i%4,row=Math.floor(i/4);
      const jx=(((seed+i*53)%22)-11)*(cell/54), jy=(((seed+i*97)%20)-10)*(cell/54);
      const rot=((seed+i*29)%34)-17;
      return {x:col*colW+(colW-cell)/2+jx,y:row*rowH+(rowH-cell)/2+jy,rot};
    })};
};

export function Scatter({n,kind="bag",cell=54}){
  const lay=scatterPos(n,cell,kind.length*11);
  return (
    <div style={{position:"relative",width:lay.w,height:lay.h}}>
      {lay.items.map((it,i)=>(
        <div key={i} style={{position:"absolute",left:it.x,top:it.y,transform:`rotate(${it.rot}deg)`}}>
          <Glyph kind={kind} size={cell}/></div>))}
    </div>);
}

export function QuantitySet({n,kind="bag",mode="tray",cell=54}){
  if(mode==="scatter") return <Scatter n={n} kind={kind} cell={cell}/>;
  if(mode==="fingers"){
    if(n<=5) return <Hand up={n} size={cell*2.1}/>;
    return <div style={{display:"flex",gap:cell*.16,alignItems:"flex-end"}}>
      <Hand up={5} size={cell*1.85} mirror/><Hand up={n-5} size={cell*1.85}/></div>;
  }
  if(mode==="dice"&&n<=6) return (
    <div style={{width:cell*3.6,height:cell*3.6,background:C.bone,borderRadius:cell*.44,
      display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 ${cell*.11}px 0 rgba(0,0,0,.35)`}}>
      <svg viewBox="0 0 100 100" style={{width:"76%",height:"76%"}}>
        {DICE[n].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="10" fill={C.night}/>)}
      </svg></div>);
  return <Trays n={n} kind={kind} cell={cell}/>;
}

/* Icons carry the meaning; the word next to them is only for the adult. */
export function Ico({name,size=30,color=C.bone}){
  const s={width:size,height:size,display:"block",flexShrink:0};
  const st={stroke:color,strokeWidth:9,fill:"none",strokeLinecap:"round",strokeLinejoin:"round"};
  switch(name){
    case "play":   return <svg viewBox="0 0 100 100" style={s}><path d="M26 18 L84 50 L26 82 Z" fill={color}/></svg>;
    case "back":   return <svg viewBox="0 0 100 100" style={s}><path d="M60 22 L30 50 L60 78" {...st}/></svg>;
    case "check":  return <svg viewBox="0 0 100 100" style={s}><path d="M20 52 L42 74 L82 28" {...st} strokeWidth="13"/></svg>;
    case "close":  return <svg viewBox="0 0 100 100" style={s}><path d="M26 26 L74 74 M74 26 L26 74" {...st} strokeWidth="12"/></svg>;
    case "redo":   return <svg viewBox="0 0 100 100" style={s}><path d="M78 40a30 30 0 1 0 4 22" {...st}/><path d="M78 18v24H54" {...st}/></svg>;
    case "eye":    return <svg viewBox="0 0 100 100" style={s}><path d="M8 50q42-30 84 0-42 30-84 0Z" {...st}/><circle cx="50" cy="50" r="12" fill={color}/></svg>;
    case "skip":   return <svg viewBox="0 0 100 100" style={s}><path d="M24 24 L56 50 L24 76 Z" fill={color}/><path d="M64 22v56" {...st} strokeWidth="12"/></svg>;
    case "folder": return <svg viewBox="0 0 100 100" style={s}><path d="M10 26h28l8 10h44v46H10Z" {...st}/></svg>;
    case "hash":   return <svg viewBox="0 0 100 100" style={s}><path d="M32 16 24 84 M68 16 60 84 M16 36h68 M14 64h68" {...st} strokeWidth="10"/></svg>;
    case "gear":   return <svg viewBox="0 0 100 100" style={s}><circle cx="50" cy="50" r="17" {...st}/><path d="M50 12v12 M50 76v12 M12 50h12 M76 50h12 M23 23l9 9 M68 68l9 9 M77 23l-9 9 M32 68l-9 9" {...st}/></svg>;
    case "two":    return <svg viewBox="0 0 100 100" style={s}><circle cx="33" cy="34" r="14" {...st}/><circle cx="70" cy="38" r="11" {...st}/><path d="M10 84c0-15 10-24 23-24s23 9 23 24 M58 84c0-12 7-19 16-19s16 7 16 19" {...st}/></svg>;
    case "star":   return <svg viewBox="0 0 100 100" style={s}><path d="M50 8 L62 38 L94 40 L69 60 L77 92 L50 74 L23 92 L31 60 L6 40 L38 38 Z" fill={color}/></svg>;
    case "hat":    return <svg viewBox="0 0 100 100" style={s}><path d="M22 52q28-30 56 0Z" fill={color}/><rect x="10" y="50" width="80" height="13" rx="6" fill={color}/></svg>;
    case "glasses":return <svg viewBox="0 0 100 100" style={s}><circle cx="30" cy="52" r="18" {...st}/><circle cx="70" cy="52" r="18" {...st}/><path d="M48 52h4" {...st}/></svg>;
    case "stache": return <svg viewBox="0 0 100 100" style={s}><path d="M14 42q22-14 36 4 14-18 36-4 2 26-20 26-12 0-16-12-4 12-16 12-22 0-20-26Z" fill={color}/></svg>;
    case "stripes":return <svg viewBox="0 0 100 100" style={s}><path d="M12 30h76 M12 50h76 M12 70h76" {...st} strokeWidth="12"/></svg>;
    default:       return <svg viewBox="0 0 100 100" style={s}><circle cx="50" cy="50" r="30" {...st}/></svg>;
  }
}
export const FEATURE_ICON={hat:"hat",glasses:"glasses",stache:"stache",stripes:"stripes"};

/* The rank badge: a shield with as many stars as the current level. He cannot
   read "Sergeant", but he can count four stars. */
export function Badge({level=1,size=120}){
  const stars=Math.max(1,Math.min(level,5));
  const pos={1:[[50,52]],2:[[38,52],[62,52]],3:[[50,38],[36,60],[64,60]],
    4:[[38,40],[62,40],[38,64],[62,64]],5:[[50,32],[32,50],[68,50],[38,70],[62,70]]}[stars];
  return (
    <svg viewBox="0 0 100 100" style={{width:size,height:size,display:"block"}}>
      <path d="M50 4 L90 18 v32 c0 27-19 41-40 50 -21-9-40-23-40-50 V18 Z" fill={C.amber} stroke={C.edge} strokeWidth="3"/>
      <path d="M50 12 L83 23 v26 c0 22-16 34-33 42 -17-8-33-20-33-42 V23 Z" fill="none" stroke={C.night} strokeWidth="2.5" opacity=".5"/>
      {pos.map(([x,y],i)=>(
        <path key={i} transform={`translate(${x},${y}) scale(0.13)`} fill={C.night}
          d="M0 -50 L14 -15 L52 -12 L22 12 L31 48 L0 27 L-31 48 L-22 12 L-52 -12 L-14 -15 Z"/>))}
    </svg>
  );
}

/* Bruno rides along. A face that reacts is worth more to a five-year-old than
   any number of points. */
export function Bruno({mood="idle",size=96}){
  const eye = mood==="happy" ? 4.5 : 6.5;
  const brow = mood==="sad" ? "M28 32 q10 6 20 2" : mood==="think" ? "M28 30 q10 -6 20 -1" : "M28 30 q10 -3 20 0";
  const mouth = mood==="happy" ? "M36 66 q14 16 28 0" : mood==="sad" ? "M38 74 q12 -12 24 0" : "M40 70 q10 6 20 0";
  return (
    <svg viewBox="0 0 100 110" style={{width:size,height:size*1.1,display:"block"}}>
      <path d="M12 30 q-4 -22 12 -20 l10 12Z" fill="#6E4A2E"/>
      <path d="M88 30 q4 -22 -12 -20 l-10 12Z" fill="#6E4A2E"/>
      <ellipse cx="50" cy="56" rx="34" ry="33" fill="#8A5E3B"/>
      <ellipse cx="50" cy="74" rx="19" ry="15" fill="#C69A6D"/>
      <ellipse cx="50" cy="66" rx="8" ry="6" fill="#2A1D14"/>
      <circle cx="36" cy="48" r={eye} fill="#1B1108"/><circle cx="64" cy="48" r={eye} fill="#1B1108"/>
      <path d={brow} stroke="#5A3A21" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={brow} stroke="#5A3A21" strokeWidth="4" fill="none" strokeLinecap="round" transform="translate(44,0) scale(-1,1) translate(-56,0)"/>
      <path d={mouth} stroke="#2A1D14" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <rect x="16" y="90" width="68" height="16" rx="8" fill={C.blue}/>
      <circle cx="50" cy="98" r="7" fill={C.amber}/>
      {mood==="happy" && <g><circle cx="14" cy="24" r="4" fill={C.amber} className="nf-pop"/><circle cx="86" cy="20" r="5" fill={C.amber} className="nf-pop"/></g>}
    </svg>
  );
}

export function Burst({show}){
  if(!show) return null;
  return (
    <div className="nf-burst" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
      justifyContent:"center",pointerEvents:"none",zIndex:5}}>
      <svg viewBox="0 0 200 200" style={{width:270,height:270}}>
        {Array.from({length:9},(_,i)=>{
          const a=i/9*Math.PI*2, r=74;
          return <g key={i} transform={`translate(${100+r*Math.cos(a)},${100+r*Math.sin(a)})`}>
            <path d="M0 -13 L4 -4 L13 -3 L6 3 L8 12 L0 7 L-8 12 L-6 3 L-13 -3 L-4 -4 Z" fill={C.amber}/></g>;
        })}
        <circle cx="100" cy="100" r="44" fill={C.green}/>
        <path d="M76 100 L94 118 L126 82" stroke={C.night} strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

const CarSvg=({w=44})=>(
  <svg viewBox="0 0 120 70" style={{width:w,height:w*26/44,display:"block"}}>
    <rect x="6" y="30" width="108" height="26" rx="9" fill={C.blue}/>
    <path d="M26 30 L38 12 h44 l12 18Z" fill={C.bone}/>
    <rect x="48" y="4" width="24" height="10" rx="5" fill={C.amber}/>
    <circle cx="34" cy="58" r="10" fill="#0A0A0A"/><circle cx="88" cy="58" r="10" fill="#0A0A0A"/>
  </svg>
);

/* The 1-10 route. Passive strip in the top bar; in drive mode the squares
   are tappable and the car advances one square per tap, each number spoken. */
export function NumberRoute({pos,height=52,drive=false,onDrive}){
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:height*.1}}>
      {Array.from({length:10},(_,i)=>i+1).map(n=>{
        const done=pos>=n, next=drive&&n===pos+1;
        return (
          <div key={n} style={{position:"relative"}}>
            <button data-t={"route-"+n} disabled={!drive}
              onClick={drive?()=>onDrive&&onDrive(n):undefined}
              className={next?"nf-glow":undefined}
              style={{width:height*.86,height,borderRadius:9,display:"flex",alignItems:"center",padding:0,
                justifyContent:"center",background:done?C.amber:(next?C.panelHi:C.panel),cursor:drive?"pointer":"default",
                border:`3px solid ${done?C.amber:(next?C.amber:C.edge)}`,transition:"background .3s"}}>
              <Numeral n={n} size={height*.44} color={done?C.night:(next?C.bone:C.dim)}/>
            </button>
            {pos===n && <div style={{position:"absolute",left:"50%",top:-height*.52,transform:"translateX(-50%)",pointerEvents:"none"}}>
              <CarSvg w={height*.9}/></div>}
          </div>);
      })}
    </div>
  );
}

/* ---------- mugshots with booking placards ---------- */

export function Mugshot({s,out,w=94,dimmed,tick}){
  const f=s.f||{};
  return (
    <div style={{position:"relative",width:w,height:w*1.16,borderRadius:10,overflow:"hidden",
      background:C.board,border:`3px solid ${out?C.red:C.edge}`,flexShrink:0,
      filter:out?"grayscale(1)":"none",opacity:out?.45:(dimmed?.6:1),transition:"opacity .35s, filter .35s"}}>
      <svg viewBox="0 0 100 116" style={{width:"100%",height:"100%",display:"block"}}>
        <g stroke="#33586A" strokeWidth="3"><line x1="0" y1="24" x2="100" y2="24"/><line x1="0" y1="52" x2="100" y2="52"/><line x1="0" y1="80" x2="100" y2="80"/></g>
        <path d="M12 116 c0-21 17-30 38-30 s38 9 38 30 Z" fill={s.shirt}/>
        {f.stripes===1 && <g stroke={C.bone} strokeWidth="5" opacity=".92">
          <line x1="14" y1="92" x2="86" y2="92"/><line x1="16" y1="103" x2="84" y2="103"/></g>}
        <ellipse cx="50" cy="50" rx="26" ry="30" fill={s.skin}/>
        <rect x="22" y="41" width="56" height="14" rx="6" fill="#17222A"/>
        <circle cx="39" cy="48" r="4" fill={C.bone}/><circle cx="61" cy="48" r="4" fill={C.bone}/>
        {f.glasses===1 && <g stroke={C.bone} strokeWidth="3" fill="none">
          <circle cx="39" cy="48" r="9.5"/><circle cx="61" cy="48" r="9.5"/><line x1="48.5" y1="48" x2="51.5" y2="48"/></g>}
        {f.stache===1 && <path d="M35 66 q15 -7 30 0 q-15 10 -30 0 Z" fill="#2A1D14"/>}
        <path d="M42 76 q8 5 16 0" stroke="#2A1D14" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {f.hat===1 && <g><path d="M21 31 q29 -21 58 0 Z" fill="#2C3A44"/><rect x="13" y="28" width="74" height="9" rx="4" fill="#1B262E"/></g>}
      </svg>
      {s.num!=null && (
        <div style={{position:"absolute",left:"50%",bottom:w*.045,transform:"translateX(-50%)",
          width:w*.56,height:w*.36,background:C.bone,borderRadius:w*.06,border:`2px solid ${C.edge}`,
          display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 0 rgba(0,0,0,.4)"}}>
          <div style={{position:"absolute",top:w*.03,left:w*.05,width:w*.05,height:w*.05,borderRadius:"50%",background:C.dim}}/>
          <div style={{position:"absolute",top:w*.03,right:w*.05,width:w*.05,height:w*.05,borderRadius:"50%",background:C.dim}}/>
          <Numeral n={s.num} size={w*.26} color={C.night}/>
        </div>)}
      {out && (
        <svg className="nf-x" viewBox="0 0 100 116" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          <g stroke={C.red} strokeWidth="11" strokeLinecap="round">
            <line x1="14" y1="16" x2="86" y2="100"/><line x1="86" y1="16" x2="14" y2="100"/></g>
        </svg>)}
      {tick && <div className="nf-pop" style={{position:"absolute",top:4,right:4,width:w*.3,height:w*.3,
        borderRadius:"50%",background:C.green,border:`2px solid ${C.edge}`,display:"flex",
        alignItems:"center",justifyContent:"center"}}><Ico name="check" size={w*.17} color={C.night}/></div>}
    </div>
  );
}

/* ---------- digit stroke paths for the trace pad ---------- */

const arcPts=(cx,cy,rx,ry,a0,a1,n=16)=>Array.from({length:n+1},(_,i)=>{
  const t=a0+(a1-a0)*i/n; return [cx+rx*Math.cos(t), cy+ry*Math.sin(t)];
});
const line=(x0,y0,x1,y1,n=6)=>Array.from({length:n+1},(_,i)=>[x0+(x1-x0)*i/n, y0+(y1-y0)*i/n]);
const P=Math.PI;

export const DIGIT_STROKES={
  0:[arcPts(50,70,28,46,-P/2,-P/2-2*P,22)],
  1:[[...line(28,40,50,22,4),...line(50,22,50,118,10)]],
  2:[[...arcPts(50,46,26,24,P,-P*0.15,12),...line(72,58,26,116,8),...line(26,116,78,116,5)]],
  3:[[...arcPts(48,44,24,22,P,P*0.35,10),...line(58,62,44,68,2)],
     [...arcPts(46,94,28,26,-P*0.75,P*0.75,12)]],
  4:[[...line(64,22,20,88,8),...line(20,88,82,88,6)],[...line(64,22,64,120,8)]],
  5:[[...line(74,24,32,24,5),...line(32,24,28,62,4)],
     [...arcPts(48,90,26,28,-P*0.85,P*0.7,12)]],
  6:[[...arcPts(52,72,26,46,-P*0.55,-P*1.5,12),...arcPts(50,94,26,24,P*1.5,P*3.5,14)]],
  7:[[...line(22,26,78,26,5),...line(78,26,40,118,9)]],
  8:[[...arcPts(50,44,22,22,-P/2,-P/2-2*P,16)],[...arcPts(50,94,26,26,-P/2,-P/2+2*P,16)]],
  9:[[...arcPts(50,46,24,24,P*0.35,P*2.35,14),...line(72,54,62,118,7)]],
};
export const digitOf=n=>String(n).split("").map(Number);
try{ window.__STROKES=DIGIT_STROKES; }catch(e){}

/* ==========================================================================
   CONTROLS + TASK SURFACES
   ========================================================================== */

export function Btn({children,onClick,w=190,h=68,bg=C.panelHi,fg=C.bone,fs=18,disabled,icon,iconSize,dataT}){
  const col=disabled?C.dim:fg;
  return (
    <button data-t={dataT} onClick={disabled?undefined:onClick} disabled={disabled} style={{width:w,height:h,padding:"0 10px",borderRadius:18,
      background:disabled?C.panel:bg,border:`3px solid ${C.edge}`,cursor:disabled?"default":"pointer",
      fontFamily:UI_FONT,fontWeight:700,fontSize:fs,color:col,display:"flex",alignItems:"center",
      justifyContent:"center",gap:10,boxShadow:`0 6px 0 ${C.edge}`,flexShrink:0,opacity:disabled?.55:1}}>
      {icon && <Ico name={icon} size={iconSize||Math.min(h*.5,34)} color={col}/>}
      {children && <span>{children}</span>}
    </button>
  );
}
export function CheckBtn({onClick,disabled,label="Lock it in"}){
  return (
    <button data-t="check" onClick={disabled?undefined:onClick} disabled={disabled}
      className={disabled?undefined:"nf-breathe"}
      style={{height:70,padding:"0 30px",borderRadius:18,
      background:disabled?C.panel:C.green,border:`3px solid ${C.edge}`,cursor:disabled?"default":"pointer",
      display:"flex",alignItems:"center",gap:12,boxShadow:`0 6px 0 ${C.edge}`,opacity:disabled?.5:1}}>
      <svg viewBox="0 0 100 100" style={{width:34,height:34}}>
        <path d="M20 52 L42 74 L82 28" stroke={disabled?C.dim:C.night} strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{fontFamily:UI_FONT,fontWeight:800,fontSize:21,color:disabled?C.dim:C.night}}>{label}</span>
    </button>
  );
}
export function SpeakerButton({onClick,size=68}){
  return (
    <button data-t="speak" onClick={onClick} aria-label="Say it again" style={{width:size,height:size,padding:0,borderRadius:size/2,
      background:C.panelHi,border:`3px solid ${C.edge}`,display:"flex",alignItems:"center",justifyContent:"center",
      cursor:"pointer",boxShadow:`0 5px 0 ${C.edge}`,flexShrink:0}}>
      <svg viewBox="0 0 100 100" style={{width:size*.5,height:size*.5}}>
        <path d="M20 38h16l20-18v60L36 62H20Z" fill={C.amber}/>
        <path d="M66 34a24 24 0 0 1 0 32" stroke={C.amber} strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

/* Two rows of five, so the keypad layout itself keeps teaching the five
   structure. mark: {value: "right"|"wrong"|"glow"} */
export function Keypad({onPick,mark,max=10,cw=104,ch=76}){
  const rows=[[1,2,3,4,5],[6,7,8,9,10]].map(r=>r.filter(n=>n<=max)).filter(r=>r.length);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:9}}>
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:9,justifyContent:"center"}}>
          {row.map(n=>{
            const st=mark&&mark[n];
            const bg=st==="right"?C.green:st==="wrong"?C.red:C.panelHi;
            return (
              <button key={n} data-t={"key-"+n} onClick={()=>onPick(n)}
                className={st==="glow"?"nf-glow":undefined}
                style={{width:cw,height:ch,padding:0,borderRadius:15,
                background:bg,border:`3px solid ${st==="glow"?C.amber:C.edge}`,cursor:"pointer",boxShadow:`0 5px 0 ${C.edge}`,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Numeral n={n} size={ch*.62} color={st==="right"||st==="wrong"?C.night:C.bone}/>
              </button>);
          })}
        </div>))}
    </div>
  );
}

/* Tap a cell to fill up to it. Every change is counted ALOUD — the app counts
   with him, it never just clicks. */
export function FillTray({value,max=10,kind="bag",cell=62,onChange,locked,color=C.amber}){
  const rows=[[0,1,2,3,4],[5,6,7,8,9]].filter((r,i)=>i===0||max>5);
  const change=v=>{
    if(locked) return;
    sfx.tap();
    if(v>0) sayLine("count_"+v,{interrupt:true,rate:1});
    onChange(v);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:7,background:C.panel,padding:8,borderRadius:14,border:`2px solid ${C.edge}`}}>
          {row.map(i=>{
            const on=i<value;
            return (
              <button key={i} data-t={"cell-"+(i+1)} disabled={locked}
                onClick={()=>change(i+1===value?i:i+1)}
                style={{width:cell,height:cell,padding:0,borderRadius:11,cursor:locked?"default":"pointer",
                  background:on?C.panelHi:C.night,border:`2px solid ${on?color:C.edge}`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                {on && <Glyph kind={kind} size={cell*.72} color={color}/>}
              </button>);
          })}
        </div>))}
    </div>
  );
}

/* Untimed counting surface: he taps each piece of evidence, it gets a number
   tag and the number is SPOKEN — one-to-one counting enacted, and the last
   tag he hears is the cardinal answer. Keypad answers below. */
export function CountField({n,kind,arrange="tray",cell=52}){
  const [tags,setTags]=useState([]);
  useEffect(()=>{ setTags([]); },[n,kind,arrange]);
  let lay;
  if(arrange==="scatter") lay=scatterPos(n,cell,kind.length*11);
  else{
    const cols=Math.min(n,5), rows=Math.ceil(n/5), colW=cell*1.24, rowH=cell*1.3;
    lay={w:cols*colW,h:rows*rowH,items:Array.from({length:n},(_,i)=>({
      x:(i%5)*colW+(colW-cell)/2, y:Math.floor(i/5)*rowH+(rowH-cell)/2, rot:0}))};
  }
  const tag=i=>{
    if(tags.includes(i)) return;
    const next=[...tags,i];
    setTags(next);
    sfx.tap();
    sayLine("count_"+next.length,{interrupt:true,rate:1});
  };
  return (
    <div style={{position:"relative",width:lay.w,height:lay.h,background:C.panel,
      borderRadius:16,border:`3px solid ${C.edge}`,padding:0,boxSizing:"content-box"}}>
      {lay.items.map((it,i)=>{
        const order=tags.indexOf(i);
        return (
          <button key={i} data-t={"ev-"+i} onClick={()=>tag(i)}
            style={{position:"absolute",left:it.x,top:it.y,width:cell,height:cell,padding:0,
              background:"transparent",border:"none",cursor:"pointer",transform:`rotate(${it.rot}deg)`}}>
            <Glyph kind={kind} size={cell} color={order>=0?C.dim:C.amber}/>
            {order>=0 && (
              <div className="nf-pop" style={{position:"absolute",top:-6,right:-6,width:cell*.5,height:cell*.5,
                borderRadius:"50%",background:C.amber,border:`2px solid ${C.edge}`,display:"flex",
                alignItems:"center",justifyContent:"center"}}>
                <Numeral n={order+1} size={cell*.28} color={C.night}/>
              </div>)}
          </button>);
      })}
    </div>
  );
}

/* Trace the numeral. Checkpoints must be crossed in order, the finger may
   lift. Idle: ghost demo at 7s, a skip door at 16s — he can never get stuck. */
export function TracePad({target,onDone,width=470}){
  const digits=digitOf(target);
  const vw=digits.length*110, vh=140;
  const scale=width/vw, height=vh*scale;
  const cps=useMemo(()=>{
    const pts=[];
    digits.forEach((d,di)=>{
      (DIGIT_STROKES[d]||[]).forEach(stroke=>{
        stroke.forEach((p,i)=>{ if(i%2===0) pts.push([p[0]+di*110,p[1]]); });
      });
    });
    return pts;
  },[target]);
  const [idx,setIdx]=useState(0);
  const [ink,setInk]=useState([]);
  const [ghost,setGhost]=useState(0);
  const [help,setHelp]=useState(0);
  const svgRef=useRef(null), drawing=useRef(false), doneRef=useRef(false);
  const lastMove=useRef(Date.now()), tries=useRef(0);
  const tol = help>=2 ? 30 : help>=1 ? 25 : 20;

  useEffect(()=>{ setIdx(0); setInk([]); setHelp(0); setGhost(0); doneRef.current=false;
    lastMove.current=Date.now(); tries.current=0; },[target]);

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(doneRef.current) return;
      const idle=Date.now()-lastMove.current;
      setHelp(h=>{
        if(h===0 && idle>7000){ setGhost(g=>g+1); sayLine("help_trace"); return 1; }
        if(h===1 && idle>16000) return 2;
        return h;
      });
    },1200);
    return ()=>clearInterval(iv);
  },[target]);

  const toLocal=e=>{
    const r=svgRef.current.getBoundingClientRect();
    return [(e.clientX-r.left)/r.width*vw, (e.clientY-r.top)/r.height*vh];
  };
  const feed=pt=>{
    lastMove.current=Date.now();
    setInk(k=>[...k.slice(-600),pt]);
    let i=idx;
    while(i<cps.length){
      const [cx,cy]=cps[i];
      if(Math.hypot(pt[0]-cx,pt[1]-cy)<tol) i++; else break;
    }
    if(i!==idx){ setIdx(i); if(i%4===0) sfx.tap(); }
    if(i>=cps.length && !doneRef.current){ doneRef.current=true; setTimeout(()=>onDone(true),260); }
  };
  const down=e=>{ if(doneRef.current) return; drawing.current=true;
    try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(err){} feed(toLocal(e)); };
  const move=e=>{ if(!drawing.current||doneRef.current) return; feed(toLocal(e)); };
  const up=()=>{ drawing.current=false; setInk(k=>[...k,null]); };

  const segs=[]; let cur=[];
  ink.forEach(p=>{ if(p===null){ if(cur.length>1) segs.push(cur); cur=[]; } else cur.push(p); });
  if(cur.length>1) segs.push(cur);

  return (
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <svg ref={svgRef} data-t="tracepad" viewBox={`0 0 ${vw} ${vh}`} width={width} height={height}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{background:C.bone,borderRadius:18,border:`4px solid ${help>=2?C.violet:C.edge}`,
          touchAction:"none",display:"block",boxShadow:`0 7px 0 ${C.edge}`}}>
        {digits.map((d,di)=>(
          <g key={di} transform={`translate(${di*110},0)`}>
            {(DIGIT_STROKES[d]||[]).map((st,si)=>(
              <polyline key={si} points={st.map(p=>p.join(",")).join(" ")}
                fill="none" stroke="#D8CFC0" strokeWidth={help>=1?30:26} strokeLinecap="round" strokeLinejoin="round"/>
            ))}
          </g>))}
        {cps.map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r={i===idx?7:4.5}
            fill={i<idx?C.green:(i===idx?C.amber:"#B9AE9C")}
            className={i===idx?"nf-pulse":undefined}/>
        ))}
        {segs.map((s,i)=>(
          <polyline key={i} points={s.map(p=>p.join(",")).join(" ")}
            fill="none" stroke={C.blue} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity=".85"/>
        ))}
        {ghost>0 && digits.map((d,di)=>(
          <g key={"g"+ghost+"-"+di} transform={`translate(${di*110},0)`}>
            {(DIGIT_STROKES[d]||[]).map((st,si)=>{
              const len=st.length*14;
              return <polyline key={si} points={st.map(p=>p.join(",")).join(" ")} fill="none" stroke={C.violet}
                strokeWidth="11" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len}>
                <animate attributeName="stroke-dashoffset" from={len} to="0" dur="1.1s" begin={si*1.2+"s"} fill="freeze"/>
                <animate attributeName="opacity" from="1" to="0" begin={(si*1.2+2.2)+"s"} dur="0.6s" fill="freeze"/>
              </polyline>;
            })}
          </g>))}
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Btn w={116} h={58} fs={13} icon="eye" dataT="trace-show"
          onClick={()=>{ setGhost(g=>g+1); sayLine("help_show"); lastMove.current=Date.now(); }}>Show me</Btn>
        <Btn w={116} h={58} fs={13} icon="redo" dataT="trace-clear" onClick={()=>{ setInk([]); setIdx(0); tries.current++;
          lastMove.current=Date.now(); if(tries.current>=2) setHelp(h=>Math.max(h,1)); }}>Rub out</Btn>
        {help>=2 && (
          <Btn w={116} h={58} fs={13} icon="skip" bg={C.violet} fg={C.night} dataT="trace-skip"
            onClick={()=>{ if(doneRef.current) return; doneRef.current=true; onDone(false,true); }}>Skip it</Btn>)}
      </div>
    </div>
  );
}

/* The radar gun. Fixed window (no speed tiers), structured arrangements only,
   free replays — recognition practice for numerals he already owns. */
export function Radar({n,ms,onReplay,children}){
  const [open,setOpen]=useState(true);
  const [run,setRun]=useState(0);
  useEffect(()=>{ setOpen(true);
    const t=setTimeout(()=>{ setOpen(false); sfx.shutter(); },ms);
    return ()=>clearTimeout(t); },[n,ms,run]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div style={{position:"relative",minWidth:380,minHeight:190,display:"flex",alignItems:"center",
        justifyContent:"center",background:C.night,borderRadius:16,border:`4px solid ${open?C.green:C.dim}`,padding:14}}>
        {open ? children : (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,color:C.dim,fontFamily:UI_FONT}}>
            <svg viewBox="0 0 100 100" style={{width:60,height:60}}>
              <rect x="12" y="26" width="76" height="52" rx="8" fill="none" stroke={C.dim} strokeWidth="6"/>
              <line x1="20" y1="34" x2="80" y2="70" stroke={C.dim} strokeWidth="6" strokeLinecap="round"/>
            </svg>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:2}}>FEED LOST</div>
          </div>)}
        <div style={{position:"absolute",top:8,right:12,fontFamily:UI_FONT,fontWeight:800,fontSize:12,
          letterSpacing:2,color:open?C.green:C.dim}}>{open?"● REC":"○ OFF"}</div>
      </div>
      <Btn w={110} h={64} fs={12} icon="redo" disabled={open} dataT="replay"
        onClick={()=>{ setRun(r=>r+1); onReplay&&onReplay(); }}>Play it again</Btn>
    </div>
  );
}

/* The street: every house shows its number except the one he must name.
   Reading the line IS the support — no hidden sequence to recall. */
export function HouseRow({from,dir,cell=92}){
  const ans=from+dir;
  const near=[from-2,from-1,from,from+1,from+2].filter(n=>n>=1&&n<=10);
  return (
    <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
      {near.map(n=>{
        const me=n===from, q=n===ans;
        return (
          <div key={n} style={{width:cell,opacity:me||q?1:.75}} className={q?"nf-glow":undefined}>
            <svg viewBox="0 0 100 60" style={{width:cell,height:cell*.6,display:"block"}}>
              <path d="M6 56 L50 16 L94 56 Z" fill={me?C.amber:(q?C.violet:C.panelHi)}/>
            </svg>
            <div style={{height:cell*.62,borderRadius:12,background:me?C.amber:(q?C.panelHi:C.panelHi),
              border:`3px solid ${q?C.violet:C.edge}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Numeral n={q?"?":n} size={cell*.4} color={me?C.night:(q?C.violet:C.bone)}/>
            </div>
          </div>);
      })}
      <div style={{alignSelf:"center",marginLeft:4}}>
        <svg viewBox="0 0 60 60" style={{width:52,height:52,transform:dir<0?"scaleX(-1)":"none"}}>
          <path d="M8 30 h34 M30 16 l16 14 -16 14" stroke={C.green} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

const ClosedBox=({cell=110})=>(
  <svg viewBox="0 0 100 90" style={{width:cell,height:cell*.9,display:"block"}}>
    <rect x="10" y="30" width="80" height="52" rx="7" fill="#8A5E3B" stroke={C.edge} strokeWidth="4"/>
    <rect x="4" y="18" width="92" height="18" rx="6" fill="#6E4A2E" stroke={C.edge} strokeWidth="4"/>
    <text x="50" y="68" textAnchor="middle" fontFamily={DIGIT_FONT} fontWeight="700" fontSize="30" fill={C.bone}>?</text>
  </svg>
);

/* ==========================================================================
   TASK VIEW
   ========================================================================== */

const VaultBanner=()=>(
  <div style={{display:"flex",alignItems:"center",gap:10,background:C.panelHi,
    padding:"6px 18px",borderRadius:12,border:`3px solid ${C.red}`}}>
    <svg viewBox="0 0 100 100" style={{width:30,height:30}}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={C.red} strokeWidth="8"/>
      <circle cx="50" cy="50" r="14" fill={C.red}/>
      <g stroke={C.red} strokeWidth="7" strokeLinecap="round">
        <line x1="50" y1="6" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="94"/>
        <line x1="6" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="94" y2="50"/></g>
    </svg>
    <span style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,letterSpacing:3,color:C.red}}>VAULT CODE</span>
  </div>
);

export function TaskView({task,onAnswer,locked,mark,attempts,maxN=10}){
  const [fill,setFill]=useState(0);
  const kind=useMemo(()=>KINDS[Math.floor(Math.random()*KINDS.length)],[task]);
  useEffect(()=>{ setFill(0); },[task]);
  useEffect(()=>{ if(!locked) setFill(f=>f); },[locked]);

  /* Second miss on the same question: stop repeating the word and SHOW what
     that many looks like — in every mode, not just some. */
  const scafN = task.mode==="split" ? task.target : task.target;
  const Scaffold=()=>attempts<2||task.mode==="trace"?null:(
    <div className="nf-pop" style={{display:"flex",alignItems:"center",gap:14,background:C.panelHi,
      padding:"8px 16px",borderRadius:14,border:`3px solid ${C.violet}`}}>
      <Numeral n={scafN} size={44} color={C.violet}/>
      <Trays n={scafN} kind={kind} cell={30} color={C.violet}/>
    </div>);

  if(task.mode==="trace"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {task.vault ? <VaultBanner/> :
            <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:16,letterSpacing:3,color:C.amber}}>
              SIGN THE EVIDENCE TAG</div>}
          <div style={{width:74,height:74,borderRadius:14,background:C.panelHi,border:`3px solid ${C.edge}`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Numeral n={task.target} size={46}/>
          </div>
        </div>
        <TracePad target={task.target} width={task.target===10?470:236}
          onDone={(ok,skipped)=>onAnswer(ok,null,{skipped})}/>
      </div>);
  }

  if(task.mode==="frame"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        {task.vault && <VaultBanner/>}
        <div style={{display:"flex",alignItems:"center",gap:26}}>
          <div style={{width:130,height:130,borderRadius:20,background:C.bone,border:`3px solid ${C.edge}`,
            display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 0 ${C.edge}`}}>
            <Numeral n={task.target} size={86} color={C.night}/>
          </div>
          <FillTray value={fill} max={maxN} kind={kind} onChange={setFill} locked={locked}/>
          <CheckBtn onClick={()=>onAnswer(fill===task.target,null,{fill})} disabled={locked||fill===0}/>
        </div>
        <Scaffold/>
      </div>);
  }

  if(task.mode==="split"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        {task.vault && <VaultBanner/>}
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:96,height:96,borderRadius:18,border:`3px solid ${C.edge}`,
              background:C.bone,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Numeral n={task.total} size={62} color={C.night}/>
            </div>
            <div style={{fontFamily:UI_FONT,fontSize:12,fontWeight:700,color:C.dim}}>ALL THE LOOT</div>
          </div>
          <div style={{padding:10,borderRadius:14,background:C.panel,border:`3px solid ${C.green}`}}>
            <Trays n={task.a} kind={kind} cell={40} color={C.green}/>
          </div>
          <ClosedBox cell={104}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:18}}>
          <FillTray value={fill} max={task.total>5?10:5} kind={kind} cell={46} onChange={setFill} locked={locked} color={C.blue}/>
          <CheckBtn onClick={()=>onAnswer(fill===task.target,null,{fill})} disabled={locked||fill===0}/>
        </div>
        <Scaffold/>
      </div>);
  }

  if(task.mode==="radar"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        {task.vault && <VaultBanner/>}
        <Radar n={task.target} ms={task.flash} onReplay={()=>{}}>
          <QuantitySet n={task.target} kind={kind} mode={task.arrange||"tray"} cell={46}/>
        </Radar>
        <Scaffold/>
        <Keypad onPick={n=>!locked&&onAnswer(n===task.target,n)} mark={mark} max={maxN} ch={68} cw={94}/>
      </div>);
  }

  if(task.mode==="count"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <CountField n={task.target} kind={kind} arrange={task.arrange||"tray"} cell={50}/>
        <Scaffold/>
        <Keypad onPick={n=>!locked&&onAnswer(n===task.target,n)} mark={mark} max={maxN} ch={64} cw={90}/>
      </div>);
  }

  if(task.mode==="neighbour"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <HouseRow from={task.from} dir={task.dir} cell={80}/>
        <Scaffold/>
        <Keypad onPick={n=>!locked&&onAnswer(n===task.target,n)} mark={mark} max={maxN} ch={64} cw={90}/>
      </div>);
  }

  if(task.mode==="compare"){
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{display:"flex",gap:44}}>
          {[task.a,task.b].map((v,i)=>{
            const st=mark&&mark[v];
            return (
              <button key={i} data-t={"cmp-"+v} disabled={locked} onClick={()=>onAnswer(v===task.target,v)}
                className={st==="glow"?"nf-glow":undefined}
                style={{width:170,padding:0,background:"transparent",border:"none",cursor:"pointer"}}>
                <svg viewBox="0 0 100 46" style={{width:170,height:78,display:"block"}}>
                  <path d="M4 44 L50 8 L96 44 Z" fill={st==="right"?C.green:C.panelHi}/>
                </svg>
                <div style={{height:120,borderRadius:16,background:st==="right"?C.green:(st==="wrong"?C.red:C.bone),
                  border:`3px solid ${C.edge}`,display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:`0 6px 0 ${C.edge}`}}>
                  <Numeral n={v} size={72} color={C.night}/>
                </div>
              </button>);
          })}
        </div>
        <Scaffold/>
      </div>);
  }

  /* radio (also the plain vault pad) */
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
      {task.vault ? <VaultBanner/> : (
        <div style={{display:"flex",alignItems:"center",gap:12,background:C.panelHi,
          padding:"8px 20px",borderRadius:14,border:`3px solid ${C.edge}`}}>
          <svg viewBox="0 0 100 100" style={{width:34,height:34}}>
            <rect x="20" y="34" width="60" height="44" rx="9" fill={C.panel} stroke={C.amber} strokeWidth="5"/>
            <circle cx="38" cy="56" r="9" fill={C.amber}/>
            <g stroke={C.amber} strokeWidth="5" strokeLinecap="round">
              <line x1="56" y1="48" x2="72" y2="48"/><line x1="56" y1="60" x2="72" y2="60"/>
              <line x1="30" y1="34" x2="30" y2="16"/></g>
          </svg>
          <span style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,letterSpacing:3,color:C.amber}}>DISPATCH RADIO</span>
        </div>)}
      <Scaffold/>
      <Keypad onPick={n=>!locked&&onAnswer(n===task.target,n)} mark={mark} max={maxN}/>
    </div>
  );
}

/* ==========================================================================
   SCREENS
   ========================================================================== */

export function TopBar({kase,pos,turn,onQuit,muted,onMute}){
  return (
    <div style={{height:78,flexShrink:0,background:C.panel,borderBottom:`3px solid ${C.edge}`,
      display:"flex",alignItems:"center",padding:"0 16px",gap:14}}>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:13,letterSpacing:2,color:C.amber,
        width:96,lineHeight:1.15}}>{kase.place.name.toUpperCase()}</div>
      <NumberRoute pos={pos} height={40}/>
      <div style={{flex:1}}/>
      {turn && <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,color:turn==="hero"?C.green:C.violet,
        background:C.panelHi,padding:"7px 16px",borderRadius:12,border:`2px solid ${C.edge}`}}>
        {turn==="hero"?HERO:"Grown-up"}</div>}
      <button onClick={onMute} aria-label="Sound" style={{width:44,height:44,padding:0,borderRadius:11,
        background:C.panelHi,border:`2px solid ${C.edge}`,cursor:"pointer",display:"flex",
        alignItems:"center",justifyContent:"center"}}>
        <svg viewBox="0 0 100 100" style={{width:24,height:24}}>
          <path d="M22 38h14l18-16v56L36 62H22Z" fill={muted?C.dim:C.amber}/>
          {muted
            ? <g stroke={C.red} strokeWidth="8" strokeLinecap="round"><line x1="64" y1="36" x2="88" y2="64"/><line x1="88" y1="36" x2="64" y2="64"/></g>
            : <path d="M66 36a22 22 0 0 1 0 28" stroke={C.amber} strokeWidth="8" fill="none" strokeLinecap="round"/>}
        </svg>
      </button>
      <button data-t="quit" onClick={onQuit} aria-label="Leave case" style={{width:44,height:44,padding:0,borderRadius:11,
        background:C.panelHi,border:`2px solid ${C.edge}`,cursor:"pointer",display:"flex",
        alignItems:"center",justifyContent:"center"}}>
        <svg viewBox="0 0 100 100" style={{width:22,height:22}}>
          <g stroke={C.dim} strokeWidth="12" strokeLinecap="round"><line x1="24" y1="24" x2="76" y2="76"/><line x1="76" y1="24" x2="24" y2="76"/></g>
        </svg>
      </button>
    </div>
  );
}

export function Lineup({cast,out,onTap,w=92,shake,glow,dimNotGlow}){
  return (
    <div style={{display:"flex",gap:11,justifyContent:"center"}}>
      {cast.map(s=>{
        const gone=out.includes(s.id);
        return (
          <div key={s.id} data-t={"sus-"+s.id} data-num={s.num}
            className={shake===s.id?"nf-shake":(glow===s.id?"nf-glow":undefined)}
            onClick={onTap&&!gone?()=>onTap(s):undefined}
            style={{cursor:onTap&&!gone?"pointer":"default",borderRadius:12}}>
            <Mugshot s={s} out={gone} w={w} dimmed={dimNotGlow&&glow&&glow!==s.id&&!gone}/>
          </div>);
      })}
    </div>
  );
}

/* Held, not tapped — he will absolutely press this button otherwise. */
export function HoldBtn({onHold,ms=1200}){
  const [p,setP]=useState(0);
  const timer=useRef(null), start=useRef(0);
  const begin=()=>{ start.current=Date.now();
    timer.current=setInterval(()=>{
      const f=Math.min(1,(Date.now()-start.current)/ms);
      setP(f);
      if(f>=1){ clearInterval(timer.current); timer.current=null; setP(0); onHold(); }
    },40); };
  const end=()=>{ if(timer.current) clearInterval(timer.current); timer.current=null; setP(0); };
  useEffect(()=>()=>{ if(timer.current) clearInterval(timer.current); },[]);
  return (
    <button data-t="parent-hold" onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      style={{width:302,height:52,padding:"0 10px",borderRadius:18,background:C.panel,
        border:`3px solid ${C.edge}`,cursor:"pointer",position:"relative",overflow:"hidden",
        display:"flex",alignItems:"center",justifyContent:"center",gap:9,boxShadow:`0 6px 0 ${C.edge}`}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${p*100}%`,background:C.panelHi}}/>
      <div style={{position:"relative",display:"flex",alignItems:"center",gap:9}}>
        <Ico name="gear" size={22} color={C.dim}/>
        <span style={{fontFamily:UI_FONT,fontWeight:700,fontSize:13,color:C.dim}}>Grown-ups — hold</span>
      </div>
    </button>);
}

export function WantedPoster({size=150}){
  const rex=SUSPECT_POOL[0];
  return (
    <div className="nf-pop" style={{width:size,background:C.bone,borderRadius:10,
      border:`4px solid ${C.red}`,padding:8,transform:"rotate(3deg)",boxShadow:`0 8px 0 ${C.edge}`}}>
      <div style={{textAlign:"center",fontFamily:UI_FONT,fontWeight:800,fontSize:size*.14,
        letterSpacing:3,color:C.red}}>WANTED</div>
      <div style={{display:"flex",justifyContent:"center",margin:"6px 0"}}>
        <Mugshot s={{...rex,f:{stache:1}}} out={false} w={size*.72}/>
      </div>
      <div style={{textAlign:"center",fontFamily:UI_FONT,fontWeight:800,fontSize:size*.12,color:C.night}}>REX</div>
    </div>
  );
}

export function Title({profile,onNew,onBoard,onStation,onParent}){
  const rexNext=(profile.cases+1)%5===0;
  const resume=!!(profile.activeCase&&profile.activeCase.kase);
  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:40,padding:"0 46px"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,flexShrink:0}}>
        <Badge level={profile.level} size={190}/>
        <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:19,color:C.amber,letterSpacing:2}}>
          {RANKS[profile.level].toUpperCase()}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"flex-start"}}>
        <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:54,letterSpacing:8,color:C.amber,lineHeight:1}}>DISPATCH</div>
        <div style={{fontFamily:UI_FONT,fontWeight:600,fontSize:18,color:C.bone}}>
          Detective {HERO} · {profile.solved.length} cases closed
          {profile.rexCaught>0 && <span style={{color:C.amber}}> · Rex caught ×{profile.rexCaught}</span>}
        </div>
        <div style={{display:"flex",gap:12,marginTop:4}}>
          <Btn dataT="new" onClick={onNew} w={252} h={90} bg={C.amber} fg={C.night} fs={24} icon="play" iconSize={40}>
            {resume?"Keep going":"New case"}</Btn>
          <Btn dataT="board" onClick={onBoard} w={150} h={90} fs={15} icon="folder">Case board</Btn>
          <Btn dataT="station" onClick={onStation} w={150} h={90} fs={15} icon="hash">My numbers</Btn>
        </div>
        <div style={{marginTop:2}}><HoldBtn onHold={onParent}/></div>
      </div>
      {rexNext && <WantedPoster size={150}/>}
    </div>
  );
}

export function Briefing({kase,twoPlayer,onGo}){
  useEffect(()=>{
    sfx.siren();
    const t1=setTimeout(()=>{ sayLine("place_"+kase.place.id,{radio:true}); sayLine("brief"); },650);
    return ()=>clearTimeout(t1);
  },[kase]);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:22}}>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,letterSpacing:5,color:C.dim}}>NEW CASE</div>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:40,color:C.amber,lineHeight:1}}>{kase.place.name}</div>
      <Lineup cast={kase.cast} out={[]} w={102}/>
      <div style={{fontFamily:UI_FONT,fontWeight:700,fontSize:22,color:C.bone,textAlign:"center"}}>
        One of them did it. Solve the numbers to catch him.
        {twoPlayer && <span style={{color:C.violet}}><br/>Two players — take turns.</span>}
      </div>
      <Btn dataT="start" onClick={onGo} w={300} h={86} bg={C.amber} fg={C.night} fs={24} icon="play" iconSize={38}>Start the hunt</Btn>
    </div>
  );
}

/* -------- the case itself -------- */

export function Play({profile,kase,initial,onCheckpoint,onFinish,onQuit}){
  const work=useRef(JSON.parse(JSON.stringify(profile)));
  const [round,setRound]=useState(initial.round||0);
  const [out,setOut]=useState(initial.out||[]);
  const [pos,setPos]=useState(initial.pos||0);
  const posRef=useRef(initial.pos||0), movesRef=useRef(0), outRef=useRef(initial.out||[]);
  const isVaultRound=r=>r===kase.rounds-1;
  const [task,setTask]=useState(()=>makeTask(work.current,{vault:isVaultRound(initial.round||0),retry:[]}));
  const [phase,setPhase]=useState(task.intro?"teach":"task");
  const [mark,setMark]=useState({});
  const [locked,setLocked]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const attemptsRef=useRef(0);
  const [mood,setMood]=useState("idle");
  const [burst,setBurst]=useState(false);
  const [moves,setMoves]=useState(0);
  const [shakeSus,setShakeSus]=useState(null);
  const [glowSus,setGlowSus]=useState(null);
  const clearMiss=useRef(0), witMiss=useRef(0);
  const resolvedRef=useRef(false), advRef=useRef(false), spokeDrive=useRef(false);
  const retry=useRef([]);
  const idleAt=useRef(Date.now()), idleHints=useRef(0);
  const timers=useRef([]);
  const after=(ms,fn)=>timers.current.push(setTimeout(fn,ms));
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);

  const isVault=isVaultRound(round);
  const clearTargetId=!isVault?kase.clearOrder[round]:null;
  const clearTarget=clearTargetId?kase.cast.find(s=>s.id===clearTargetId):null;
  const turn=profile.twoPlayer?(round%2===0?"hero":"other"):null;
  const range=rangeFor(work.current.level);
  const maxN=range[range.length-1];
  const remaining=kase.cast.filter(s=>!out.includes(s.id));

  /* debug hook for automated tests — harmless in production */
  useEffect(()=>{ try{ window.__D={phase,round,pos,moves,out,
    task:{mode:task.mode,target:task.target,a:task.a,b:task.b,total:task.total,from:task.from,dir:task.dir,vault:!!task.vault},
    clearTargetNum:clearTarget?clearTarget.num:null,culprit:kase.culprit,rounds:kase.rounds}; }catch(e){} });

  const askPrompt=useCallback((tk,force)=>{
    sayLine(tk.promptId,{radio:!!tk.radio,interrupt:!!force});
  },[]);

  /* teach beat: a brand-new numeral introduces itself before it asks */
  useEffect(()=>{
    if(phase!=="teach") return;
    sayLine("num_"+task.target,{interrupt:true});
    sayLine("scaffold");
    const t=setTimeout(()=>setPhase("task"),3100);
    return ()=>clearTimeout(t);
  },[phase,task]);

  useEffect(()=>{
    if(phase!=="task") return;
    idleAt.current=Date.now(); idleHints.current=0;
    const t=setTimeout(()=>{
      if(profile.twoPlayer) sayLine(turn==="hero"?"turn_hero":"turn_other");
      askPrompt(task);
    },350);
    return ()=>clearTimeout(t);
  },[task,phase]);

  /* one shared idle nurse: re-speaks the prompt, auto-drives the car,
     re-calls the clear number — nobody ever sits in silence */
  useEffect(()=>{
    const iv=setInterval(()=>{
      const idle=Date.now()-idleAt.current;
      if(phase==="task"&&!locked&&idle>9000&&idleHints.current<2){
        idleHints.current++; idleAt.current=Date.now(); askPrompt(task,true);
      }
      if(phase==="drive"&&idle>4500) doDrive();
      if(phase==="clear"&&idle>9000&&idleHints.current<3&&clearTarget){
        idleHints.current++; idleAt.current=Date.now();
        sayLine("clear_"+clearTarget.num,{radio:true,interrupt:true});
      }
      if(phase==="witness"&&idle>10000&&idleHints.current<3){
        idleHints.current++; idleAt.current=Date.now();
        sayLine("clue_"+kase.wf+"_1",{interrupt:true});
      }
    },1300);
    return ()=>clearInterval(iv);
  },[phase,task,locked,clearTarget]);

  function resolveTask(finalOk){
    if(resolvedRef.current) return; resolvedRef.current=true;
    const firstTry=attemptsRef.current===0&&finalOk;
    if(!turn||turn==="hero") recordTask(work.current,task,firstTry);
    if(firstTry) retry.current=retry.current.filter(n=>n!==task.target);
    else if(task.target&&!retry.current.includes(task.target)) retry.current.push(task.target);
    setMark({}); setLocked(false);
    movesRef.current=Math.min(movesFor(round,kase.rounds),10-posRef.current);
    setMoves(movesRef.current);
    idleAt.current=Date.now();
    if(movesRef.current<=0){ after(500,endDrive); setPhase("drive"); return; }
    setPhase("drive");
    if(!spokeDrive.current){ spokeDrive.current=true; after(250,()=>sayLine("drive_go",{interrupt:true})); }
  }

  function onAnswer(ok,picked,opts={}){
    if(locked||resolvedRef.current||phase!=="task") return;
    idleAt.current=Date.now();
    if(ok){
      setLocked(true); sfx.right(); setMood("happy"); setBurst(true);
      if(picked!=null) setMark({[picked]:"right"});
      after(760,()=>setBurst(false));
      after(950,()=>resolveTask(true));
      return;
    }
    if(opts.skipped){
      setLocked(true);
      attemptsRef.current=Math.max(attemptsRef.current,1);
      after(200,()=>sayLine("wrong_"+task.target,{interrupt:true}));
      after(1500,()=>resolveTask(false));
      return;
    }
    const a=attemptsRef.current;
    attemptsRef.current=a+1; setAttempts(a+1);
    setLocked(true); sfx.wrong(); setMood("sad");
    if(picked!=null) setMark({[picked]:"wrong"});
    if(a===0){
      after(300,()=>sayLine("again",{interrupt:true}));
      after(1300,()=>{ setMark({}); setLocked(false); setMood("think"); });
    }else if(a===1){
      after(300,()=>{ sayLine("scaffold",{interrupt:true}); sayLine("wrong_"+task.target); });
      after(2300,()=>{ setMark({}); setLocked(false); setMood("think"); });
    }else{
      after(300,()=>sayLine("wrong_"+task.target,{interrupt:true}));
      if(task.mode==="frame"||task.mode==="split"){
        after(2400,()=>resolveTask(false));
      }else{
        after(1300,()=>{ setMark({[task.target]:"glow"}); setLocked(false); setMood("think"); });
      }
    }
  }

  function doDrive(){
    if(phase!=="drive") return;
    if(movesRef.current<=0) return;
    if(posRef.current>=10){ movesRef.current=0; setMoves(0); after(200,endDrive); return; }
    posRef.current++; movesRef.current--;
    setPos(posRef.current); setMoves(movesRef.current);
    sfx.drive();
    sayLine("count_"+posRef.current,{interrupt:true,rate:1});
    idleAt.current=Date.now();
    if(movesRef.current<=0) after(700,endDrive);
  }
  function endDrive(){
    idleAt.current=Date.now(); idleHints.current=0;
    if(isVault){ setPhase("witness"); witMiss.current=0;
      after(300,()=>{ sayLine("witness",{interrupt:true}); sayLine("clue_"+kase.wf+"_1"); });
    }
    else{ setPhase("clear"); clearMiss.current=0;
      after(350,()=>{ if(clearTarget) sayLine("clear_"+clearTarget.num,{radio:true,interrupt:true}); });
    }
  }

  function stampOut(id,ok){
    if(outRef.current.includes(id)) return;
    sfx.stamp();
    outRef.current=[...outRef.current,id];
    setOut(outRef.current);
    setGlowSus(null);
    if(!turn||turn==="hero"){ const s=kase.cast.find(x=>x.id===id); recordClear(work.current,s.num,ok); }
    after(900,advance);
  }
  function tapClear(s){
    if(phase!=="clear"||outRef.current.includes(s.id)||advRef.current) return;
    idleAt.current=Date.now();
    if(s.id===clearTargetId){ stampOut(s.id,clearMiss.current===0); return; }
    clearMiss.current++;
    sfx.wrong(); setShakeSus(s.id);
    after(600,()=>setShakeSus(null));
    if(clearMiss.current===1) sayLine("not_that",{interrupt:true});
    else{ sayLine("clear_"+(clearTarget?clearTarget.num:""),{interrupt:true}); setGlowSus(clearTargetId); }
    if(clearMiss.current===3) after(1400,()=>{ if(!advRef.current) stampOut(clearTargetId,false); });
  }

  function tapWitness(s){
    if(phase!=="witness"||advRef.current) return;
    idleAt.current=Date.now();
    if(s.id===kase.culprit){
      advRef.current=true;
      sfx.bust(); after(150,()=>sfx.siren());
      after(700,()=>onFinish(work.current));
      return;
    }
    witMiss.current++;
    sfx.wrong(); setShakeSus(s.id);
    after(600,()=>setShakeSus(null));
    if(witMiss.current===1) sayLine("not_that",{interrupt:true});
    else{ sayLine("clue_"+kase.wf+"_1",{interrupt:true}); setGlowSus(kase.culprit); }
  }

  function advance(){
    if(advRef.current) return; advRef.current=true;
    const n=round+1;
    work.current.activeCase={kase,round:n,out:[...outRef.current],pos:posRef.current};
    onCheckpoint(JSON.parse(JSON.stringify(work.current)));
    const t=makeTask(work.current,{vault:isVaultRound(n),retry:retry.current});
    setRound(n);
    setTask(t);
    attemptsRef.current=0; setAttempts(0);
    resolvedRef.current=false; advRef.current=false;
    clearMiss.current=0; witMiss.current=0; idleHints.current=0;
    setMark({}); setLocked(false); setMood("idle"); setBurst(false);
    setShakeSus(null); setGlowSus(null);
    setPhase(t.intro?"teach":"task");
  }

  function quit(){
    work.current.activeCase={kase,round,out:[...outRef.current],pos:posRef.current};
    onQuit(JSON.parse(JSON.stringify(work.current)));
  }
  function toggleMute(){
    const m=!work.current.muted;
    work.current.muted=m; setMuted(m);
    onCheckpoint(JSON.parse(JSON.stringify({...work.current,
      activeCase:{kase,round,out:[...outRef.current],pos:posRef.current}})));
  }

  return (
    <>
      <TopBar kase={kase} pos={pos} turn={turn} muted={profile.muted} onMute={toggleMute} onQuit={quit}/>
      <div onPointerDown={()=>{ idleAt.current=Date.now(); }}
        style={{flex:1,minHeight:0,display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",gap:12,padding:"6px 18px",position:"relative"}}>

        {phase==="teach" && (
          <div className="nf-pop" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
            <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,letterSpacing:4,color:C.violet}}>NEW NUMBER</div>
            <div style={{display:"flex",alignItems:"center",gap:30,background:C.panelHi,padding:"22px 34px",
              borderRadius:22,border:`4px solid ${C.violet}`}}>
              <Numeral n={task.target} size={120} color={C.bone}/>
              <Trays n={task.target} kind="bag" cell={44} color={C.violet}/>
            </div>
          </div>)}

        {phase==="task" && (
          <>
            <TaskView task={task} onAnswer={onAnswer} locked={locked} mark={mark} attempts={attempts} maxN={maxN}/>
            <Burst show={burst}/>
            <div style={{position:"absolute",right:16,top:4,display:"flex",flexDirection:"column",
              alignItems:"center",gap:6}}>
              <SpeakerButton onClick={()=>askPrompt(task,true)} size={58}/>
              <Bruno mood={mood} size={78}/>
            </div>
          </>)}

        {phase==="drive" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:26}}>
            <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:16,letterSpacing:4,color:C.green}}>
              DRIVE {moves>0?"· "+moves:""}</div>
            <NumberRoute pos={pos} height={62} drive onDrive={()=>doDrive()}/>
            <Bruno mood="happy" size={72}/>
          </div>)}

        {phase==="clear" && clearTarget && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14,background:C.panelHi,padding:"10px 22px",
              borderRadius:16,border:`3px solid ${C.amber}`}}>
              <svg viewBox="0 0 100 100" style={{width:34,height:34}}>
                <rect x="20" y="34" width="60" height="44" rx="9" fill={C.panel} stroke={C.amber} strokeWidth="5"/>
                <circle cx="38" cy="56" r="9" fill={C.amber}/>
                <g stroke={C.amber} strokeWidth="5" strokeLinecap="round">
                  <line x1="56" y1="48" x2="72" y2="48"/><line x1="56" y1="60" x2="72" y2="60"/>
                  <line x1="30" y1="34" x2="30" y2="16"/></g>
              </svg>
              <span style={{fontFamily:UI_FONT,fontWeight:800,fontSize:20,color:C.bone}}>Cross out number…</span>
              <SpeakerButton size={46} onClick={()=>sayLine("clear_"+clearTarget.num,{radio:true,interrupt:true})}/>
            </div>
            <Lineup cast={kase.cast} out={out} onTap={tapClear} w={126} shake={shakeSus} glow={glowSus}/>
          </div>)}

        {phase==="witness" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
            <div style={{display:"flex",alignItems:"center",gap:16,background:C.bone,padding:"12px 26px",
              borderRadius:16,border:`4px solid ${C.amber}`,boxShadow:`0 6px 0 ${C.edge}`}}>
              <Glyph kind="lens" size={44} color={C.night}/>
              <Ico name={FEATURE_ICON[kase.wf]} size={54} color={C.green}/>
              <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:24,color:C.night}}>{CLUE_LINE[kase.wf+"_1"]}</div>
              <SpeakerButton size={46} onClick={()=>sayLine("clue_"+kase.wf+"_1",{interrupt:true})}/>
            </div>
            <div style={{display:"flex",gap:30}}>
              {remaining.map(s=>(
                <div key={s.id} data-t={"sus-"+s.id} data-num={s.num}
                  className={shakeSus===s.id?"nf-shake":(glowSus===s.id?"nf-glow":undefined)}
                  onClick={()=>tapWitness(s)} style={{cursor:"pointer",borderRadius:12}}>
                  <Mugshot s={s} out={false} w={170}/>
                </div>))}
            </div>
          </div>)}
      </div>

      {(phase==="task"||phase==="teach"||phase==="drive") && (
        <div style={{height:118,flexShrink:0,background:C.panel,borderTop:`3px solid ${C.edge}`,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Lineup cast={kase.cast} out={out} w={78}/>
        </div>)}
    </>
  );
}

export function Arrest({profile,kase,badges,onNext,onHome}){
  const culprit=kase.cast.find(s=>s.id===kase.culprit);
  const isRex=kase.culprit==="rex";
  useEffect(()=>{
    sfx.siren();
    const t=setTimeout(()=>{
      sayLine(isRex?"rex":"arrest");
      badges.forEach(n=>{ sayLine("badge"); sayLine("num_"+n); });
    },620);
    return ()=>clearTimeout(t);
  },[]);
  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:42,padding:"0 46px"}}>
      <div className="nf-pop" style={{position:"relative"}}>
        <Mugshot s={culprit} out={false} w={196}/>
        <div style={{position:"absolute",top:36,left:-24,transform:"rotate(-13deg)",background:C.red,color:C.bone,
          fontFamily:UI_FONT,fontWeight:800,fontSize:27,letterSpacing:4,padding:"7px 22px",borderRadius:8,
          border:`4px solid ${C.bone}`}}>CAUGHT</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:13,alignItems:"flex-start",maxWidth:560}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Bruno mood="happy" size={72}/>
          <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:42,color:C.green,lineHeight:1}}>CASE CLOSED</div>
        </div>
        <div style={{fontFamily:UI_FONT,fontWeight:700,fontSize:20,color:C.bone,lineHeight:1.35}}>
          {culprit.name} robbed the {kase.place.name}.
          {isRex?" That is the one we have been chasing for months.":" Great work, Detective "+HERO+"."}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:C.panel,padding:"10px 16px",
          borderRadius:14,border:`2px solid ${C.edge}`}}>
          <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:13,letterSpacing:2,color:C.dim}}>RECOVERED</div>
          <Trays n={culprit.num} kind="bag" cell={26}/>
          <Numeral n={culprit.num} size={34} color={C.amber}/>
        </div>
        {badges.length>0 && (
          <div className="nf-pop" style={{display:"flex",alignItems:"center",gap:10,background:C.panelHi,
            padding:"10px 16px",borderRadius:14,border:`3px solid ${C.amber}`}}>
            <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:13,letterSpacing:2,color:C.amber}}>NEW BADGE</div>
            {badges.map(n=>(
              <div key={n} style={{width:54,height:54,borderRadius:12,background:C.amber,
                border:`3px solid ${C.edge}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Numeral n={n} size={30} color={C.night}/>
              </div>))}
          </div>)}
        <div style={{display:"flex",gap:14,marginTop:6}}>
          <Btn dataT="next" onClick={onNext} w={252} h={86} bg={C.amber} fg={C.night} fs={23} icon="play" iconSize={36}>Next case</Btn>
          <Btn dataT="home" onClick={onHome} w={150} h={86} fs={17} icon="back">Station</Btn>
        </div>
      </div>
    </div>
  );
}

export function Promotion({level,onNext}){
  useEffect(()=>{
    sfx.fanfare();
    const t=setTimeout(()=>sayLine("rank_"+level),700);
    return ()=>clearTimeout(t);
  },[level]);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:17,letterSpacing:6,color:C.dim}}>PROMOTION</div>
      <div className="nf-pop"><Badge level={level} size={250}/></div>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:44,color:C.amber,letterSpacing:3}}>
        {RANKS[level].toUpperCase()}</div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <Bruno mood="happy" size={84}/>
        <Btn dataT="promo-next" onClick={onNext} w={260} h={86} bg={C.amber} fg={C.night} fs={23} icon="play" iconSize={36}>Next case</Btn>
      </div>
    </div>
  );
}

export function CaseBoard({profile,onBack}){
  const files=[...profile.solved].reverse().slice(0,12);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18}}>
      <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:24,letterSpacing:4,color:C.bone}}>CASE BOARD</div>
      {files.length===0
        ? <div style={{fontFamily:UI_FONT,fontSize:19,color:C.dim}}>No closed cases yet. Take one.</div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(6, 108px)",gap:14}}>
            {files.map((f,i)=>(
              <div key={i} style={{position:"relative",padding:5,borderRadius:12,
                background:f.rex?C.amber:C.panel,border:`3px solid ${C.edge}`}}>
                {f.face
                  ? <Mugshot s={f.face} out={false} w={94}/>
                  : <div style={{height:109,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Ico name="star" size={40} color={C.dim}/></div>}
                <div style={{position:"absolute",top:-9,right:-9,width:34,height:34,borderRadius:17,
                  background:C.green,border:`3px solid ${C.edge}`,display:"flex",alignItems:"center",
                  justifyContent:"center"}}><Ico name="check" size={18} color={C.night}/></div>
                <div style={{fontFamily:UI_FONT,fontWeight:700,fontSize:10,textAlign:"center",marginTop:4,
                  color:f.rex?C.night:C.dim}}>{f.place}</div>
              </div>))}
          </div>}
      {profile.solved.length>12 && <div style={{fontFamily:UI_FONT,fontSize:13,color:C.dim}}>
        …and {profile.solved.length-12} more</div>}
      <Btn onClick={onBack} w={186} h={64} fs={17} icon="back">Back</Btn>
    </div>
  );
}

export function SplitGrid({splits,cell=26}){
  const rows=[];
  for(let t=2;t<=10;t++){
    const cells=[];
    for(let a=1;a<t;a++){
      const k=t+"_"+a, on=(splits[k]||0)>=2;
      cells.push(<div key={a} style={{width:cell,height:cell,borderRadius:5,
        background:on?C.green:C.panelHi,border:`1px solid ${C.edge}`}}/>);
    }
    rows.push(<div key={t} style={{display:"flex",gap:3,alignItems:"center"}}>
      <div style={{width:20,fontFamily:DIGIT_FONT,fontWeight:700,fontSize:13,color:C.dim}}>{t}</div>{cells}</div>);
  }
  return <div style={{display:"flex",flexDirection:"column",gap:3}}>{rows}</div>;
}

/* The badge wall: his visible, growing record. Gold = secured numeral. */
export function Station({profile,onBack}){
  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:46}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <Badge level={profile.level} size={110}/>
        <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:15,letterSpacing:2,color:C.amber}}>
          {RANKS[profile.level].toUpperCase()}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:20,letterSpacing:3,color:C.bone}}>MY NUMBER BADGES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5, 92px)",gap:11}}>
          {Array.from({length:10},(_,i)=>i+1).map(n=>{
            const sec=isSecure(profile.stats[n]);
            return (
              <div key={n} onClick={()=>sayLine("num_"+n,{interrupt:true})}
                style={{width:92,height:92,borderRadius:15,cursor:"pointer",position:"relative",
                  background:sec?C.amber:C.panel,border:`3px solid ${sec?C.amber:C.edge}`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Numeral n={n} size={52} color={sec?C.night:C.dim}/>
                {sec && <div style={{position:"absolute",top:4,right:6}}>
                  <Ico name="star" size={17} color={C.night}/></div>}
              </div>);
          })}
        </div>
        <div style={{fontFamily:UI_FONT,fontSize:14,color:C.dim}}>Gold = secured</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        {profile.level>=4 && <>
          <div style={{fontFamily:UI_FONT,fontWeight:800,fontSize:20,letterSpacing:3,color:C.bone}}>SPLITS I KNOW</div>
          <SplitGrid splits={profile.splits}/>
        </>}
        <Btn onClick={onBack} w={186} h={62} fs={17} icon="back">Back</Btn>
      </div>
    </div>
  );
}

export function VoiceRow({v,active,onPick}){
  const tag=voiceTag(v);
  const col = (tag==="Premium"||tag==="Enhanced") ? C.green : tag==="Network" ? C.blue : C.dim;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:9,
      background:active?C.panelHi:"transparent",border:`2px solid ${active?C.amber:"transparent"}`}}>
      <button onClick={onPick} style={{flex:1,textAlign:"left",background:"none",border:"none",cursor:"pointer",
        color:C.bone,fontFamily:UI_FONT,fontSize:14,padding:0}}>
        {v.name}<span style={{marginLeft:8,fontSize:11,fontWeight:700,color:col}}>{tag}</span>
      </button>
      <button onClick={()=>{ setVoiceDirect(v); say(LINE.radio_7,{rate:.94,interrupt:true}); }}
        style={{padding:"5px 12px",borderRadius:7,background:C.panelHi,border:`2px solid ${C.edge}`,
          color:C.amber,cursor:"pointer",fontSize:12,fontFamily:UI_FONT,fontWeight:700}}>Hear</button>
    </div>);
}

export function Parent({profile,onBack,onReset,onVoice,onToggle2P,onImport}){
  const [list,setList]=useState(VOICES);
  const [arm,setArm]=useState(false);
  const [pasted,setPasted]=useState("");
  const [note,setNote]=useState("");
  useEffect(()=>{ let n=0;
    const t=setInterval(()=>{ refreshVoices(profile.voiceURI); setList([...VOICES]); if(++n>8) clearInterval(t); },400);
    return ()=>clearInterval(t); },[profile.voiceURI]);
  useEffect(()=>{ if(!arm) return; const t=setTimeout(()=>setArm(false),4000); return ()=>clearTimeout(t); },[arm]);
  const secured=secureList(profile).length;
  const copy=async()=>{
    const code=JSON.stringify({...profile,activeCase:null});
    try{ await navigator.clipboard.writeText(code); setNote("Copied. Paste it somewhere safe (a note, an email to yourself)."); }
    catch(e){ setNote(code); }
  };
  const load=()=>{
    try{
      const p=migrateProfile(JSON.parse(pasted));
      onImport(p); setNote("Loaded. "+secureList(p).length+" secured numerals restored."); setPasted("");
    }catch(e){ setNote("That code did not read as a backup. Paste the whole thing."); }
  };
  return (
    <div style={{flex:1,overflow:"auto",padding:20,fontFamily:UI_FONT,color:C.bone}}>
      <h2 style={{fontSize:19,margin:"0 0 4px"}}>Progress</h2>
      <p style={{fontSize:12.5,color:C.dim,margin:"0 0 12px",maxWidth:760,lineHeight:1.55}}>
        Rank: {RANKS[profile.level]} · {profile.solved.length} cases · {secured}/10 numerals secured.
        A numeral is <b>secured</b> after 3 first-try correct answers in a row across 2 different days.
        Only the first try of each task counts — retries are for learning, not for the record.
        Weak and overdue numerals are shown far more often; numerals he has never met get a spoken
        introduction before the first question.
      </p>
      <div style={{display:"flex",gap:26,flexWrap:"wrap",alignItems:"flex-start"}}>
        <table style={{borderCollapse:"collapse",fontSize:13.5,minWidth:330}}>
          <thead><tr style={{color:C.dim,textAlign:"left"}}>
            <th style={{padding:5}}>No.</th><th style={{padding:5}}>Right</th><th style={{padding:5}}>Wrong</th>
            <th style={{padding:5}}>Streak</th><th style={{padding:5}}>Status</th></tr></thead>
          <tbody>
            {Array.from({length:10},(_,i)=>i+1).map(n=>{
              const s=profile.stats[n];
              return (<tr key={n} style={{borderTop:`1px solid ${C.panelHi}`}}>
                <td style={{padding:5,fontWeight:700}}>{n}</td>
                <td style={{padding:5}}>{s.c}</td>
                <td style={{padding:5,color:s.w>s.c?C.red:C.bone}}>{s.w}</td>
                <td style={{padding:5}}>{s.streak}</td>
                <td style={{padding:5,color:isSecure(s)?C.green:C.dim}}>{isSecure(s)?"secure":"learning"}</td>
              </tr>);
            })}
          </tbody>
        </table>
        <div>
          <h3 style={{fontSize:15,margin:"0 0 8px"}}>Number splits (from Sergeant rank)</h3>
          <SplitGrid splits={profile.splits} cell={22}/>
          <p style={{fontSize:11.5,color:C.dim,marginTop:8,maxWidth:230,lineHeight:1.5}}>
            Each row is a total; each square is one way to split it. Green means practised.
          </p>
          <h3 style={{fontSize:15,margin:"14px 0 6px"}}>Two players</h3>
          <button data-t="toggle2p" onClick={onToggle2P} style={{padding:"10px 18px",borderRadius:10,
            background:profile.twoPlayer?C.violet:C.panelHi,border:`2px solid ${C.edge}`,
            color:profile.twoPlayer?C.night:C.bone,cursor:"pointer",fontSize:13,fontFamily:UI_FONT,fontWeight:700}}>
            {profile.twoPlayer?"Two players: ON":"Two players: off"}</button>
          <p style={{fontSize:11.5,color:C.dim,marginTop:6,maxWidth:230,lineHeight:1.5}}>
            Turns alternate by round. Only {HERO}'s answers are recorded.
          </p>
        </div>
        <div style={{width:340}}>
          <h3 style={{fontSize:15,margin:"0 0 6px"}}>Voice — tap Hear, then pick</h3>
          <p style={{fontSize:11.5,color:C.dim,margin:"0 0 8px",lineHeight:1.55}}>
            Recorded clips in <code>audio/</code> always win. Without them this falls back to the browser voice.
            For the best browser voice: iPad Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; English,
            download one marked Premium.
          </p>
          <div style={{maxHeight:170,overflow:"auto",background:C.panel,borderRadius:10,border:`2px solid ${C.edge}`,padding:6}}>
            <VoiceRow v={{name:"Automatic (best available)",lang:"en-US",localService:true,voiceURI:""}}
              active={!profile.voiceURI} onPick={()=>onVoice(null)}/>
            {list.map(v=><VoiceRow key={v.voiceURI} v={v} active={profile.voiceURI===v.voiceURI} onPick={()=>onVoice(v.voiceURI)}/>)}
          </div>
          <h3 style={{fontSize:15,margin:"14px 0 6px"}}>Backup (for travel)</h3>
          <div style={{display:"flex",gap:8,marginBottom:6}}>
            <button onClick={copy} style={{padding:"9px 14px",borderRadius:9,background:C.panelHi,
              border:`2px solid ${C.edge}`,color:C.bone,cursor:"pointer",fontSize:12.5,fontFamily:UI_FONT}}>Copy backup code</button>
            <button onClick={load} disabled={!pasted.trim()} style={{padding:"9px 14px",borderRadius:9,
              background:C.panelHi,border:`2px solid ${C.edge}`,color:pasted.trim()?C.bone:C.dim,
              cursor:"pointer",fontSize:12.5,fontFamily:UI_FONT}}>Load backup</button>
          </div>
          <textarea value={pasted} onChange={e=>setPasted(e.target.value)} placeholder="Paste a backup code here to restore"
            style={{width:"100%",height:52,background:C.panel,border:`2px solid ${C.edge}`,borderRadius:9,
              color:C.bone,fontSize:11,padding:6,fontFamily:"monospace",resize:"none"}}/>
          {note && <p style={{fontSize:11.5,color:C.amber,marginTop:6,lineHeight:1.5,wordBreak:"break-all",
            maxHeight:60,overflow:"auto"}}>{note}</p>}
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginTop:18,alignItems:"center"}}>
        <button data-t="parent-back" onClick={onBack} style={{padding:"11px 24px",borderRadius:11,background:C.panelHi,
          border:`2px solid ${C.edge}`,color:C.bone,cursor:"pointer",fontSize:14,fontFamily:UI_FONT}}>Back</button>
        <button data-t="erase" onClick={()=>{ if(arm){ setArm(false); onReset(); } else setArm(true); }}
          style={{padding:"11px 24px",borderRadius:11,background:arm?C.red:"transparent",
          border:`2px solid ${C.red}`,color:arm?C.bone:C.red,cursor:"pointer",fontSize:14,fontFamily:UI_FONT,fontWeight:arm?800:400}}>
          {arm?"Really erase everything?":"Erase progress"}</button>
        {arm && <span style={{fontSize:12,color:C.dim}}>Tap again to erase, or wait.</span>}
      </div>
    </div>);
}

/* ==========================================================================
   SHELL
   ========================================================================== */

export function useStageScale(){
  const [s,setS]=useState(1);
  useEffect(()=>{
    const calc=()=>{
      const vv=window.visualViewport;
      const vw=vv?vv.width:window.innerWidth, vh=vv?vv.height:window.innerHeight;
      setS(Math.min(vw/W,vh/H)*.985);
    };
    calc();
    window.addEventListener("resize",calc); window.addEventListener("orientationchange",calc);
    if(window.visualViewport) window.visualViewport.addEventListener("resize",calc);
    return ()=>{ window.removeEventListener("resize",calc); window.removeEventListener("orientationchange",calc);
      if(window.visualViewport) window.visualViewport.removeEventListener("resize",calc); };
  },[]);
  return s;
}

const CSS = `
  .dsp *, .dsp *::before, .dsp *::after { box-sizing: border-box; }
  .dsp button, .dsp select { font-family: inherit; -webkit-appearance: none; appearance: none; }
  .dsp button:active:not(:disabled) { transform: translateY(3px); }
  .dsp button:focus-visible { outline: 3px solid ${C.amber}; outline-offset: 3px; }
  @keyframes nfpop { 0%{transform:scale(.35);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
  @keyframes nfx { 0%{transform:scale(2.4);opacity:0} 55%{transform:scale(.92);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes nfshake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-9px)} 40%{transform:translateX(9px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
  @keyframes nfpulse { 0%,100%{r:7} 50%{r:10} }
  @keyframes nfburst { 0%{transform:scale(.4);opacity:0} 45%{transform:scale(1.05);opacity:1} 100%{transform:scale(1.3);opacity:0} }
  @keyframes nfglow { 0%,100%{box-shadow:0 0 0 0 rgba(255,177,0,0)} 50%{box-shadow:0 0 0 9px rgba(255,177,0,.55)} }
  @keyframes nfbreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.035)} }
  .nf-pop { animation: nfpop .45s cubic-bezier(.2,.8,.3,1.2) both; }
  .nf-x { animation: nfx .3s cubic-bezier(.2,.9,.3,1.2) both; }
  .nf-shake { animation: nfshake .5s both; }
  .nf-pulse { animation: nfpulse 1s ease-in-out infinite; }
  .nf-glow { animation: nfglow 1.1s ease-in-out infinite; }
  .nf-burst { animation: nfburst .78s ease-out both; }
  .nf-breathe { animation: nfbreathe 1.6s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .nf-pop,.nf-x,.nf-shake,.nf-pulse,.nf-glow,.nf-burst,.nf-breathe { animation: none } }
`;

export default function App(){
  const [profile,setProfile]=useState(null);
  const [screen,setScreen]=useState("title");
  const [game,setGame]=useState(null); // {kase, init}
  const [badges,setBadges]=useState([]);
  const [promo,setPromo]=useState(null);
  const [ready,setReady]=useState(false);
  const startSecure=useRef([]);
  const scale=useStageScale();

  useEffect(()=>{
    loadProfile().then(p=>{ setProfile(p); refreshVoices(p.voiceURI); setMuted(p.muted); setReady(true); });
    try{ window.speechSynthesis.onvoiceschanged=()=>refreshVoices(); }catch(e){}
    const unlock=()=>{ ac(); primeAudio(); primeSpeech(); window.removeEventListener("pointerdown",unlock); };
    window.addEventListener("pointerdown",unlock,{once:true});
    return ()=>window.removeEventListener("pointerdown",unlock);
  },[]);

  const commit=p=>{ setProfile(p); saveProfile(p); };

  function newCase(fromProfile){
    const prof=fromProfile||profile;
    ac(); primeAudio(); primeSpeech();
    startSecure.current=secureList(prof);
    const ac0=prof.activeCase;
    if(ac0&&ac0.kase&&ac0.round<ac0.kase.rounds){
      setGame({kase:ac0.kase,init:{round:ac0.round||0,out:ac0.out||[],pos:ac0.pos||0}});
      setScreen(ac0.round>0?"play":"brief");
      return;
    }
    const kase=makeCase(prof);
    const p={...prof,activeCase:{kase,round:0,out:[],pos:0}};
    commit(p);
    setGame({kase,init:{round:0,out:[],pos:0}});
    setScreen("brief");
  }
  function quitCase(work){
    commit(work); setScreen("title");
  }
  function finishCase(work){
    const kase=game.kase;
    const culprit=kase.cast.find(s=>s.id===kase.culprit);
    const rex=kase.culprit==="rex";
    const p={...work,
      activeCase:null,
      cases:work.cases+1,
      rexCaught:work.rexCaught+(rex?1:0),
      solved:[...work.solved,{place:kase.place.name,culprit:culprit.name,day:new Date().toISOString().slice(0,10),rex,
        face:{name:culprit.name,skin:culprit.skin,shirt:culprit.shirt,f:culprit.f,num:culprit.num}}].slice(-40)};
    const prev=p.level;
    p.level=nextLevel(p);
    setPromo(p.level>prev?p.level:null);
    setBadges(secureList(p).filter(n=>!startSecure.current.includes(n)));
    commit(p); setScreen("arrest");
  }

  if(!ready||!profile) return (
    <div className="dsp" style={{position:"fixed",inset:0,background:C.night,display:"flex",
      alignItems:"center",justifyContent:"center",color:C.dim,fontFamily:UI_FONT}}><style>{CSS}</style>…</div>);

  return (
    <div className="dsp" style={{position:"fixed",inset:0,background:C.night,display:"flex",
      alignItems:"center",justifyContent:"center",overflow:"hidden",userSelect:"none",WebkitUserSelect:"none",
      WebkitTapHighlightColor:"transparent",
      paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)",
      paddingLeft:"env(safe-area-inset-left)",paddingRight:"env(safe-area-inset-right)"}}>
      <style>{CSS}</style>
      <div style={{width:W,height:H,flexShrink:0,transform:`scale(${scale})`,transformOrigin:"center center",
        display:"flex",flexDirection:"column",overflow:"hidden",background:C.night}}>
        {screen==="title" && <Title profile={profile} onNew={()=>newCase()}
          onBoard={()=>setScreen("board")} onStation={()=>setScreen("station")}
          onParent={()=>setScreen("parent")}/>}
        {screen==="brief" && game && <Briefing kase={game.kase} twoPlayer={profile.twoPlayer} onGo={()=>setScreen("play")}/>}
        {screen==="play" && game && (
          <Play key={profile.cases+"-"+game.kase.place.id+"-"+game.init.round}
            profile={profile} kase={game.kase} initial={game.init}
            onCheckpoint={p=>commit(p)}
            onFinish={finishCase} onQuit={quitCase}/>)}
        {screen==="arrest" && game && <Arrest profile={profile} kase={game.kase} badges={badges}
          onNext={()=>{ if(promo){ setScreen("promoted"); } else newCase(); }}
          onHome={()=>setScreen("title")}/>}
        {screen==="promoted" && <Promotion level={promo||profile.level} onNext={()=>{ setPromo(null); newCase(); }}/>}
        {screen==="board" && <CaseBoard profile={profile} onBack={()=>setScreen("title")}/>}
        {screen==="station" && <Station profile={profile} onBack={()=>setScreen("title")}/>}
        {screen==="parent" && <Parent profile={profile} onBack={()=>setScreen("title")}
          onReset={()=>{ const p=freshProfile(); commit(p); setScreen("title"); }}
          onToggle2P={()=>commit({...profile,twoPlayer:!profile.twoPlayer})}
          onImport={p=>commit(p)}
          onVoice={uri=>{ commit({...profile,voiceURI:uri}); refreshVoices(uri); }}/>}
      </div>
    </div>);
}
