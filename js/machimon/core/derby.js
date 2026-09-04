"use strict";
/* ============================================================
   machimon/core/derby.js — 社労士ダービー(ウイニングポスト風の週送り・厩舎・レース・世代交代)
   ★マチモンを「競走馬」として育て、週ごとのレース(=問題を解く)に出走させる。
     馬の強さ(スピード)= 進化段階とLv / 知識 = その科目の習熟度 / 調子 = 出走間隔。
     騎手はあなた自身。レースの勝敗は「正解」でしか決まらない。
   ★時間は週送り(ターン制)。レースに出る/休養する でしか週は進まない。
   ★引退→殿堂入り→血統ボーナス(次の世代へ受け継ぐ)= 世代交代の楽しさ。
   ★知識エネルギー(KE)はここから1も出ない(各解答は learn.commit → economy.grant を通るので
     学習の分だけは通常どおり付く)。賞金はマチGだけ。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function D(){ return MM.DATA; }
  function int(v,d,lo,hi){ return MM.state.int(v,d,lo,hi); }
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }

  /* ---------- セーブ(mm.wp) ---------- */
  function defaults(){
    return { y:1, w:1, rec:{}, hist:[], hall:[], awards:[], done:0, entry:"",
             total:{run:0,win:0,g1:0,prize:0}, last:null };
  }
  function normRec(r){
    r=obj(r)||{};
    var cur=obj(r.cur)||{};
    var crown=obj(r.crown)||{};
    var out={ born:int(r.born,1,1,9999), run:int(r.run,0,0,99999), win:int(r.win,0,0,99999), g1:int(r.g1,0,0,9999),
              prize:int(r.prize,0,0,1e12), fat:int(r.fat,0,0,20), ret:r.ret?1:0,
              cur:{ y:int(cur.y,1,1,9999), run:int(cur.run,0,0,999), win:int(cur.win,0,0,999), g1:int(cur.g1,0,0,99), prize:int(cur.prize,0,0,1e12) },
              crown:{} };
    for(var k in crown){ if(crown[k])out.crown[String(k).slice(0,6)]=1; }
    return out;
  }
  function normalize(raw){
    var s=obj(raw)||{}, out=defaults();
    out.y=int(s.y,1,1,9999);
    out.w=int(s.w,1,1,D().YEAR_WEEKS||48);
    out.done=s.done?1:0;
    out.entry=(typeof s.entry==="string")?s.entry.slice(0,24):"";
    var rec=obj(s.rec)||{};
    for(var u in rec){ out.rec[String(u).slice(0,12)]=normRec(rec[u]); }
    out.hist=Array.isArray(s.hist)?s.hist.slice(-40):[];
    out.hall=Array.isArray(s.hall)?s.hall.slice(-60):[];
    out.awards=Array.isArray(s.awards)?s.awards.slice(-60):[];
    var t=obj(s.total)||{};
    out.total={ run:int(t.run,0,0,1e7), win:int(t.win,0,0,1e7), g1:int(t.g1,0,0,1e6), prize:int(t.prize,0,0,1e12) };
    out.last=obj(s.last)||null;
    return out;
  }
  /* 未正規化の mm(旧セーブ)に出会ったらその場で補完する */
  var seen=(typeof WeakSet==="function")?new WeakSet():null;
  function W(c){
    var mm=c.mm;
    if(!mm.wp||!(seen&&seen.has(mm.wp))){ mm.wp=normalize(mm.wp); if(seen)seen.add(mm.wp); }
    return mm.wp;
  }

  /* ---------- 暦 ---------- */
  function cal(c){
    var wp=W(c), w=wp.w, mi=Math.ceil(w/4);           /* 1..12 (4月始まり) */
    var month=((mi+2)%12)+1, wk=((w-1)%4)+1;
    return { y:wp.y, w:w, month:month, wk:wk, label:"第"+wp.y+"年 "+month+"月"+wk+"週" };
  }
  function weekOf(m,w){ var mi=((m+8)%12)+1; return (mi-1)*4+w; }   /* 月・週 → 通し週 */

  /* ---------- 今週のレース ---------- */
  function openSubs(c){
    var out=[]; for(var id in c.mm.areas){ var a=D().areaById[id]; if(a)out.push(a.sub); }
    out.sort(function(a,b){ return a-b; }); return out;
  }
  function g3Def(c){
    var wp=W(c), sub=(wp.w-1)%9, a=D().areaBySub[sub];
    var open=openSubs(c);
    if(open.indexOf(sub)<0){ return { id:"g3_open", name:"オープン特別", grade:3, subs:open, n:6, weekly:true, sub:-1 }; }
    return { id:"g3_"+sub, name:(a?a.name:"")+"ステークス", grade:3, subs:[sub], n:6, weekly:true, sub:sub };
  }
  function weekRaces(c){
    var wp=W(c), out=[], R=D().races;
    for(var i=0;i<R.length;i++){ if(weekOf(R[i].m,R[i].w)===wp.w)out.push(R[i]); }
    out.push(g3Def(c));
    return out.map(function(r){ return { def:r, lock:lockOf(c,r) }; });
  }
  /* 出走に必要なエリアが未解放なら、そのエリア名を返す */
  function lockOf(c,def){
    var open=openSubs(c);
    var ok=def.subs.filter(function(s){ return open.indexOf(s)>=0; });
    if(ok.length)return "";
    var a=D().areaBySub[def.subs[0]]; return a?a.name:"";
  }
  function raceDef(c,id){
    if(D().raceById[id])return D().raceById[id];
    var g3=g3Def(c); return (g3.id===id)?g3:null;
  }
  function raceSubs(c,def){
    var open=openSubs(c);
    var ok=def.subs.filter(function(s){ return open.indexOf(s)>=0; });
    return ok.length?ok:open;
  }

  /* ---------- 厩舎(マチモン=競走馬) ---------- */
  function rec(c,uid){
    var wp=W(c), r=wp.rec[uid];
    if(!r){ r=wp.rec[uid]=normRec({born:wp.y,cur:{y:wp.y}}); }
    if(r.cur.y!==wp.y){ r.cur={y:wp.y,run:0,win:0,g1:0,prize:0}; }
    return r;
  }
  function age(c,uid){ var r=rec(c,uid); return W(c).y-r.born+2; }   /* 2歳デビュー */
  function condOf(fat){ return fat<=0?0:(fat<=2?1:(fat<=4?2:3)); }
  function cond(c,uid){ var r=rec(c,uid); return D().cond[condOf(r.fat)]; }
  var AGE_RETIRE=3, AGE_MAX=9;
  function canRun(c,uid){ var r=rec(c,uid); return !r.ret&&age(c,uid)<AGE_MAX; }

  /* 血統ボーナス: 殿堂入りした同じ科目(または街ライン)の先輩から受け継ぐ */
  function legacy(c,sub){
    var hall=W(c).hall, best=0;
    for(var i=0;i<hall.length;i++){
      var h=hall[i]; if(h.sub!==sub&&h.sub!==-1)continue;
      var v=Math.min(15,(h.g1||0)*3+(h.win||0));
      if(v>best)best=v;
    }
    return best;
  }
  /* 系統確立: その科目の殿堂G1が3勝以上 */
  function lineage(c){
    var hall=W(c).hall, g1={}, out={};
    for(var i=0;i<hall.length;i++){ var h=hall[i]; g1[h.sub]=(g1[h.sub]||0)+(h.g1||0); }
    for(var s in g1){ if(g1[s]>=3)out[s]=1; }
    return out;
  }

  /* 馬の力: スピード(段階+Lv) + 知識(科目習熟) + 調子 + 血統 (+系統確立) */
  function power(c,uid,def){
    var m=c.mm.mons[uid]; if(!m)return null;
    var sp=D().speciesById[m.sp]||{stage:1,sub:-1};
    var spd=Math.min(60,8+(sp.stage||1)*10+Math.round(m.lv*0.6));
    var mast=MM.learn.masteryBySub(c);
    var subs=def?raceSubs(c,def):(sp.sub>=0?[sp.sub]:openSubs(c));
    var k=0; for(var i=0;i<subs.length;i++)k+=(mast[subs[i]]||0);
    var know=Math.round((subs.length?k/subs.length:0)*20);
    var cd=cond(c,uid);
    var lg=legacy(c,sp.sub);
    var lin=lineage(c)[sp.sub]?5:0;
    /* 適性: 自分の科目のレースなら +6、街ライン(全科目)は常に+3 */
    var fit=(sp.sub===-1)?3:(def&&def.subs.indexOf(sp.sub)>=0?6:0);
    var total=Math.max(0,spd+know+cd.mod+lg+lin+fit);
    return { spd:spd, know:know, cond:cd, legacy:lg+lin, fit:fit, total:total, subs:subs };
  }
  function stable(c){
    var out=[];
    for(var uid in c.mm.mons){
      var m=c.mm.mons[uid], sp=D().speciesById[m.sp]; if(!sp)continue;
      var r=rec(c,uid);
      out.push({ uid:uid, m:m, sp:sp, rec:r, age:age(c,uid), cond:cond(c,uid), pw:power(c,uid,null), can:canRun(c,uid) });
    }
    out.sort(function(a,b){ return (b.can-a.can)||(b.pw.total-a.pw.total); });
    return out;
  }

  /* ---------- ライバル ---------- */
  function seeded(seed){ var x=seed%2147483647; if(x<=0)x+=2147483646; return function(){ x=x*16807%2147483647; return (x-1)/2147483646; }; }
  function rivalPower(c,def){
    var gr=D().raceGrade[def.grade];
    return gr.power+Math.min(30,(W(c).y-1)*(D().RIVAL_YEAR_GROWTH||3));
  }
  function rivals(c,def){
    var wp=W(c), rnd=seeded(wp.y*1000+wp.w*7+(def.grade*31)+String(def.id).length);
    var names=D().rivalNames.slice(), out=[], base=rivalPower(c,def), n=(D().RUNNERS||8)-1;
    for(var i=0;i<n;i++){
      var idx=Math.floor(rnd()*names.length); var nm=names.splice(idx,1)[0]||("ライバル"+(i+1));
      out.push({ name:nm, pw:Math.round(base*(0.72+0.28*(i/(n-1)))), pos:0 });
    }
    out.sort(function(){ return rnd()-0.5; });
    return out;
  }
  /* 1着圏の目安: 正解が何問あればトップのライバルに届くか */
  function needCorrect(c,uid,def){
    var p=power(c,uid,def); if(!p)return def.n;
    var top=rivalPower(c,def), mine=100+p.total+10, miss=15;
    var r=(top-miss)/Math.max(1,(mine-miss));
    var need=Math.ceil(r*def.n);
    if(r>1)return def.n+1;                       /* 全問正解でもトップに届かない=格上 */
    return Math.max(1,Math.min(def.n,need));
  }

  /* ---------- レース ---------- */
  function timeBonus(ms){
    if(typeof ms!=="number"||ms<=0)return 10;
    if(ms<MM.learn.FLUKE_MS)return 0;
    return Math.round(Math.max(0,Math.min(20,20*(1-(ms-2000)/10000))));
  }
  function enter(c,raceId,uid){
    var wp=W(c), def=raceDef(c,raceId);
    if(!def||wp.done||!c.mm.mons[uid]||!canRun(c,uid))return null;
    if(lockOf(c,def))return null;
    var subs=raceSubs(c,def);
    var qids=MM.learn.pick(def.n,c,subs.length===1?{sub:subs[0]}:{subs:subs});
    if(qids.length<Math.min(3,def.n))return null;
    var p=power(c,uid,def);
    var g={ race:def.id, name:def.name, grade:def.grade, uid:uid, qids:qids, n:qids.length, i:0,
            me:0, hits:0, pw:p, rivals:rivals(c,def), scale:qids.length*(100+rivalPower(c,def)), log:[] };
    wp.entry=def.id;
    return g;
  }
  function rank(g){
    var ahead=0;
    for(var i=0;i<g.rivals.length;i++){ if(g.rivals[i].pos>g.me)ahead++; }
    return ahead+1;
  }
  function step(c,g,ok,ms){
    var qid=g.qids[g.i];
    var rw=MM.learn.commit(qid,ok,ms,c);
    var gain=MM.economy.grant(rw,c);
    var last=(g.i===g.n-1), mult=last?1.5:1;
    var tb=ok?timeBonus(ms):0;
    var adv=Math.round((ok?(100+g.pw.total+tb):15)*mult);
    g.me+=adv; if(ok)g.hits++;
    for(var i=0;i<g.rivals.length;i++){ var r=g.rivals[i]; r.pos+=Math.round(r.pw*(0.88+0.24*c.rand())*mult); }
    g.i++;
    var rk=rank(g);
    g.log.push({ok:ok,adv:adv,rank:rk});
    return { qid:qid, reward:rw, gain:gain, ok:ok, adv:adv, tb:tb, last:last, rank:rk, over:g.i>=g.n };
  }
  function finish(c,g){
    var wp=W(c), def=raceDef(c,g.race)||{grade:g.grade,name:g.name,n:g.n}, gr=D().raceGrade[g.grade];
    var pos=rank(g), r=rec(c,g.uid);
    var prize=(pos<=gr.prize.length)?gr.prize[pos-1]:0;
    var gain={g:prize,xp:0,ke:0,mat:0,tama:0};
    var tix=0;
    if(pos===1){ gain.mat=gr.bonus.mat||0; gain.tama=gr.bonus.tama||0; tix=gr.bonus.tix||0; }
    MM.economy.apply(gain,c);
    if(tix)c.mm.tix=(c.mm.tix||0)+tix;
    /* 成績 */
    r.run++; r.cur.run++; r.prize+=prize; r.cur.prize+=prize; r.fat+=gr.fat;
    wp.total.run++; wp.total.prize+=prize;
    if(pos===1){ r.win++; r.cur.win++; wp.total.win++; if(g.grade===1){ r.g1++; r.cur.g1++; wp.total.g1++; } }
    /* 三冠 */
    var crown=null;
    if(pos===1&&def.crown){ r.crown[wp.y+":"+def.crown]=1;
      if(r.crown[wp.y+":1"]&&r.crown[wp.y+":2"]&&r.crown[wp.y+":3"]){ crown={tix:D().CROWN_TIX||10}; c.mm.tix=(c.mm.tix||0)+crown.tix;
        wp.awards.push({y:wp.y,id:"crown",name:"三冠達成",uid:g.uid,sp:c.mm.mons[g.uid].sp}); } }
    /* 着順表 */
    var board=[{name:spName(c,g.uid),pos:g.me,me:true,uid:g.uid}];
    for(var i=0;i<g.rivals.length;i++)board.push({name:g.rivals[i].name,pos:g.rivals[i].pos,me:false});
    board.sort(function(a,b){ return b.pos-a.pos; });
    var entry={ y:wp.y, w:wp.w, race:def.name, grade:g.grade, uid:g.uid, sp:c.mm.mons[g.uid].sp, pos:pos, prize:prize, hits:g.hits, n:g.n };
    wp.hist.push(entry); while(wp.hist.length>40)wp.hist.shift();
    wp.last=entry; wp.done=1; wp.entry="";
    return { pos:pos, prize:prize, gain:gain, tix:tix, crown:crown, board:board, hits:g.hits, n:g.n, first:(pos===1&&r.win===1), grade:g.grade, name:def.name };
  }
  function spName(c,uid){ var m=c.mm.mons[uid]; return m?((D().speciesById[m.sp]||{}).name||"?"):"?"; }

  /* ---------- 週送り・年度末 ---------- */
  function advance(c){
    var wp=W(c);
    for(var u in wp.rec){ if(wp.rec[u].fat>0)wp.rec[u].fat--; }
    wp.done=0; wp.entry="";
    wp.w++;
    if(wp.w>(D().YEAR_WEEKS||48)){ var aw=yearEnd(c); wp.w=1; wp.y++; return { newYear:true, awards:aw, y:wp.y }; }
    return { newYear:false };
  }
  function rest(c){ return advance(c); }
  /* 年度表彰: 年度代表(G1×5+勝×2+出走)・最多勝・賞金王 */
  function yearEnd(c){
    var wp=W(c), best=null,wins=null,prize=null;
    for(var u in wp.rec){
      var r=wp.rec[u]; if(r.cur.y!==wp.y||!c.mm.mons[u])continue;
      var pt=r.cur.g1*5+r.cur.win*2+r.cur.run;
      if(r.cur.run>0&&(!best||pt>best.pt))best={uid:u,pt:pt};
      if(r.cur.win>0&&(!wins||r.cur.win>wins.v))wins={uid:u,v:r.cur.win};
      if(r.cur.prize>0&&(!prize||r.cur.prize>prize.v))prize={uid:u,v:r.cur.prize};
    }
    var out=[], A=D().awards;
    function give(a,x,text){ if(!x)return; c.mm.tix=(c.mm.tix||0)+(a.tix||0); if(a.tama)c.mm.res.tama+=a.tama;
      var e={y:wp.y,id:a.id,name:a.name,uid:x.uid,sp:c.mm.mons[x.uid].sp,text:text,tix:a.tix||0,tama:a.tama||0}; wp.awards.push(e); out.push(e); }
    give(A[0],best,best?("ポイント "+best.pt):"");
    give(A[1],wins,wins?(wins.v+"勝"):"");
    give(A[2],prize,prize?("🪙"+prize.v):"");
    while(wp.awards.length>60)wp.awards.shift();
    return out;
  }

  /* ---------- 引退(殿堂入り) ---------- */
  function canRetire(c,uid){ var r=rec(c,uid); return !r.ret&&age(c,uid)>=AGE_RETIRE; }
  function retire(c,uid){
    if(!canRetire(c,uid))return null;
    var wp=W(c), r=rec(c,uid), m=c.mm.mons[uid], sp=D().speciesById[m.sp]||{};
    r.ret=1;
    var h={ uid:uid, sp:m.sp, name:sp.name||"", sub:(typeof sp.sub==="number")?sp.sub:-1, run:r.run, win:r.win, g1:r.g1, prize:r.prize, y:wp.y, age:age(c,uid) };
    wp.hall.push(h); while(wp.hall.length>60)wp.hall.shift();
    return h;
  }

  /* ---------- 秘書(マチノコ)のひとこと ---------- */
  function secretary(c){
    var wp=W(c), rs=weekRaces(c), g1=null,g2=null;
    for(var i=0;i<rs.length;i++){ if(rs[i].def.grade===1&&!rs[i].lock)g1=rs[i].def; if(rs[i].def.grade===2&&!rs[i].lock)g2=rs[i].def; }
    var st=stable(c).filter(function(x){ return x.can; });
    if(!st.length)return "まだ出走できるマチモンがいないモン。街で事件を解いてタマゴを割ろう！";
    var top=st[0];
    if(wp.done){ var l=wp.last; return l?(l.race+"は "+l.pos+"着だったモン。"+(l.pos===1?"おめでとうモン！":"つぎは勝つモン！")+" 休養して次の週へ進もう"):"今週は出走済みモン。次の週へ進もう！"; }
    if(g1)return "今週は "+g1.name+"(G1)モン！ "+top.sp.name+" の調子は "+top.cond.mark+" だモン";
    if(g2)return "今週は "+g2.name+"(G2)があるモン。"+(top.cond.mod<0?"調子が落ちてるから休養もありモン":"いい調子モン！");
    if(top.cond.mod<0)return top.sp.name+" は少し疲れてるモン。休養すると調子が戻るモン";
    return "今週はG3モン。勝って賞金を貯めよう！ "+top.sp.name+" の調子は "+top.cond.mark;
  }

  MM.derby={ defaults:defaults, normalize:normalize, W:W, cal:cal, weekOf:weekOf, weekRaces:weekRaces, raceDef:raceDef, raceSubs:raceSubs, lockOf:lockOf,
             rec:rec, age:age, cond:cond, canRun:canRun, legacy:legacy, lineage:lineage, power:power, stable:stable,
             rivals:rivals, rivalPower:rivalPower, needCorrect:needCorrect, timeBonus:timeBonus,
             enter:enter, step:step, rank:rank, finish:finish, advance:advance, rest:rest, yearEnd:yearEnd,
             canRetire:canRetire, retire:retire, secretary:secretary, AGE_RETIRE:AGE_RETIRE, AGE_MAX:AGE_MAX };
})();
