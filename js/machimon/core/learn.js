"use strict";
/* ============================================================
   machimon/core/learn.js — 学習エンジン(出題優先度 / 報酬倍率 / 有効回答)
   ★新しいSRSを発明しない。忘却推定・復習間隔は既存 window.SRLearning.scheduler
     (SM-2ライト)をそのまま使う。ここが足すのは「どの問題をどのゲーム体験で出すか」だけ。
   ★このファイルが MACHIMON の心臓。ゲーム攻略 = 学習の最適行動 を成立させる3つの倍率
     (novelty / timing / combo)を定義する。DOM非依存=node でそのままテストできる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  var FLUKE_MS=2000;      /* これ未満の正解は「まぐれ」= 内容を読んでいない疑い */
  var NOVELTY=[1.00,0.35,0.15,0.05,0.02];   /* 当日の同一問題 n回目の減衰 */
  var RECENT_MAX=30;      /* 直近出題リング(既存 ST.rq と同じ長さ) */
  var POOL=30;            /* 上位何件から重み抽選するか */

  function sched(){ return (G.SRLearning&&G.SRLearning.scheduler)||null; }
  function bank(){ return G.Q||[]; }
  function qOf(id){ return (typeof G.qById==="function")?G.qById(id):null; }

  /* 問題別の学習履歴(既存 ST.q と共有 = どちらのモードで解いても同じ記憶が育つ) */
  function stat(c,id){
    var q=c.ST.q||(c.ST.q={});
    return q[id]||(q[id]={c:0,w:0,ng:false,s:0,bm:false,box:0,due:0,la:-1,ease:2.3});
  }
  function seen(st){ return ((st.c||0)+(st.w||0))>0; }
  function mastered(st){ return !!st&&(st.box||0)>=3&&!st.ng&&(st.c||0)>0; }
  function isLeech(st){ return !!st&&(st.w||0)>=5&&!mastered(st); }
  function overdue(st,today){ return seen(st)?Math.max(0,today-(st.due||0)):0; }

  /* 難易度推定(全ユーザー統計を持たないMVPでは box と自分の誤答率から推定) */
  function difficulty(st){
    var box=(st&&st.box)||0;
    var d=box>=3?0.85:(box>=1?1.0:1.3);
    var tot=((st&&st.c)||0)+((st&&st.w)||0);
    if(tot>=3){ var wr=(st.w||0)/tot; d=d*(0.85+0.5*wr); }
    return Math.max(0.7,Math.min(1.6,d));
  }

  /* ---------- 出題優先度(docs/machimon/07-learning-algorithm.md と同じ式) ---------- */
  function priority(q,c,opt){
    opt=opt||{};
    var st=stat(c,q.id), today=c.today, sc=0;
    var od=overdue(st,today);
    if(od>0) sc+=60*Math.min(1,od/7);
    if(isLeech(st)) sc+=45;
    if(st.ng) sc+=30;
    if(!seen(st)) sc+=25;
    /* 忘却リスク: 期限が今日〜3日以内 */
    if(seen(st)){ var left=(st.due||0)-today; if(left>=0&&left<=3) sc+=20*(1-left/4); }
    sc+=15*(1-(opt.mastery&&typeof opt.mastery[q.s]==="number"?opt.mastery[q.s]:0));
    if(q.e&&String(q.e).indexOf("本試験")>=0) sc+=10;
    var r=recentRank(c,q.id);
    if(r>=0) sc-=40*(1-r/RECENT_MAX);
    if(mastered(st)&&od<=0) sc-=25;
    return sc;
  }
  function recentRank(c,id){
    var ring=c.ST.rq;
    if(!Array.isArray(ring))return -1;
    var i=ring.lastIndexOf(id);
    if(i<0)i=ring.lastIndexOf(String(id));
    return i<0?-1:(ring.length-1-i);
  }
  function pushRecent(c,ids){
    if(!Array.isArray(c.ST.rq))c.ST.rq=[];
    for(var i=0;i<ids.length;i++)c.ST.rq.push(ids[i]);
    while(c.ST.rq.length>RECENT_MAX)c.ST.rq.shift();
  }

  /* 科目ごとの習熟度(既存の単一定義 box>=3 && !ng && c>0 を使う) */
  function masteryBySub(c){
    var out={},cnt={},pool=bank();
    for(var i=0;i<pool.length;i++){
      var q=pool[i]; cnt[q.s]=(cnt[q.s]||0)+1;
      if(mastered(c.ST.q&&c.ST.q[q.id]))out[q.s]=(out[q.s]||0)+1;
    }
    var r={};
    for(var s in cnt)r[s]=cnt[s]?(out[s]||0)/cnt[s]:0;
    return r;
  }
  /* 科目の正解数(進化条件で使う) */
  function correctBySub(c,sub){
    var pool=bank(),n=0;
    for(var i=0;i<pool.length;i++){
      if(pool[i].s!==sub)continue;
      var st=c.ST.q&&c.ST.q[pool[i].id];
      if(st)n+=(st.c||0);
    }
    return n;
  }

  /* ---------- 出題選定: 上位POOL件から重み付き抽選(毎回同じ順にしない) ---------- */
  function pick(n,c,opt){
    opt=opt||{};
    var m=opt.mastery||masteryBySub(c);
    var pool=bank(),cand=[];
    for(var i=0;i<pool.length;i++){
      var q=pool[i];
      if(typeof opt.sub==="number"&&q.s!==opt.sub)continue;
      if(opt.subs&&opt.subs.indexOf(q.s)<0)continue;
      if(opt.filter&&!opt.filter(q,stat(c,q.id)))continue;
      cand.push({id:q.id,s:q.s,p:priority(q,c,{mastery:m})});
    }
    cand.sort(function(a,b){ return b.p-a.p; });
    var out=[],used={};
    /* 科目の偏り防止は「複数科目から選べるとき」だけ効かせる。
       解放エリアが1つしかない序盤に効かせると、枠が埋まらず事件が足りなくなる。 */
    var nSub=(opt.subs&&opt.subs.length)?opt.subs.length:9;
    var wide=(typeof opt.sub!=="number")&&nSub>1;
    var perSub={},cap=Math.max(2,Math.ceil(n/Math.min(3,nSub)));
    while(out.length<n){
      var top=cand.slice(0,POOL).filter(function(x){ return !used[x.id]; });
      if(!top.length)break;
      /* 重み = 優先度を正に寄せた値。上位ほど出やすいが決定的ではない */
      var min=top[top.length-1].p, sum=0,i2;
      for(i2=0;i2<top.length;i2++)sum+=(top[i2].p-min+1);
      var r=c.rand()*sum,acc=0,chosen=top[0];
      for(i2=0;i2<top.length;i2++){ acc+=(top[i2].p-min+1); if(r<=acc){ chosen=top[i2]; break; } }
      used[chosen.id]=1;
      /* 科目の偏り防止(エリア内出題=sub指定時は適用しない: 世界観との整合を優先) */
      if(wide&&(perSub[chosen.s]||0)>=cap){
        cand=cand.filter(function(x){ return x.id!==chosen.id; });
        continue;
      }
      perSub[chosen.s]=(perSub[chosen.s]||0)+1;
      out.push(chosen.id);
      cand=cand.filter(function(x){ return x.id!==chosen.id; });
    }
    return out;
  }

  /* ---------- 報酬倍率: 3因子(それぞれ別の抜け道を塞ぐ) ---------- */
  function noveltyOf(c,id){
    var x=c.mm.qx[id];
    var n=(x&&x.d===c.dstr)?(x.n||0):0;
    return NOVELTY[Math.min(n,NOVELTY.length-1)];
  }
  function timingOf(st,today,ok){
    if(!ok)return 0.30;
    if(isLeech(st))return 2.00;                       /* 沼問題の克服=最大報酬 */
    var od=overdue(st,today);
    if(seen(st)&&od>=7)return 2.00;                   /* 放置した復習の救済 */
    if(seen(st)&&(st.due||0)<=today)return 1.60;      /* 期限到来の復習 */
    if(!seen(st))return 1.30;                         /* 未学習の初挑戦 */
    if(mastered(st))return 0.30;                      /* 既習得の期限前連打を無価値化 */
    return 1.00;
  }
  function comboOf(combo){ return 1+Math.min(0.50,(combo||0)*0.05); }

  /* 1回答の報酬倍率を求める(状態は変えない=純関数的に検査できる) */
  function reward(id,ok,ms,c){
    var st=stat(c,id);
    var nov=noveltyOf(c,id);
    var tim=timingOf(st,c.today,ok);
    var cmb=comboOf(ok?(c.mm.combo+1):0);
    var fluke=!!(ok&&typeof ms==="number"&&ms>0&&ms<FLUKE_MS);
    var mult=nov*tim*cmb*(fluke?0.4:1);
    return { mult:Math.round(mult*1000)/1000, novelty:nov, timing:tim, combo:cmb,
             fluke:fluke, difficulty:difficulty(st), ok:!!ok,
             /* 有効回答: まぐれ(2秒未満)は数に入れない=North Star の定義(Phase12)と一致 */
             effective:!!(ok&&!fluke&&mult>=0.5) };
  }

  /* 回答の確定: SRS前進 + 当日カウンタ + コンボ。報酬内訳を返す(付与は economy が行う) */
  function commit(id,ok,ms,c){
    var st=stat(c,id);
    var rw=reward(id,ok,ms,c);
    var S=sched();
    /* まぐれ(2秒未満の正解)はSRSを前進させない = 記憶の質を守る */
    if(ok&&!rw.fluke){
      if(S)S.srsOnCorrect(st,seen(st),c.today);
      st.c=(st.c||0)+1; st.ng=false;
    }else if(ok){
      st.c=(st.c||0)+1;         /* 正解記録は残すが SRS は進めない */
    }else{
      if(S)S.srsOnWrong(st,c.today);
      st.w=(st.w||0)+1; st.ng=true;
    }
    /* 当日の同一問題カウント */
    var x=c.mm.qx[id];
    if(!x||x.d!==c.dstr)x=c.mm.qx[id]={d:c.dstr,n:0,ms:0};
    x.n++; x.ms=(typeof ms==="number"&&ms>0)?Math.min(600000,ms):0;
    /* コンボ */
    c.mm.combo=ok?(c.mm.combo+1):0;
    if(c.mm.combo>c.mm.best)c.mm.best=c.mm.combo;
    /* 当日集計 */
    c.mm.day.ans++; if(ok)c.mm.day.cor++;
    if(rw.effective)c.mm.day.eff++;
    pushRecent(c,[id]);
    return rw;
  }

  MM.learn={
    FLUKE_MS:FLUKE_MS, NOVELTY:NOVELTY, POOL:POOL, RECENT_MAX:RECENT_MAX,
    stat:stat, seen:seen, mastered:mastered, isLeech:isLeech, overdue:overdue,
    difficulty:difficulty, priority:priority, pick:pick,
    masteryBySub:masteryBySub, correctBySub:correctBySub,
    noveltyOf:noveltyOf, timingOf:timingOf, comboOf:comboOf,
    reward:reward, commit:commit, pushRecent:pushRecent, recentRank:recentRank
  };
})();
