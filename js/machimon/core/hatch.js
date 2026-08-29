"use strict";
/* ============================================================
   machimon/core/hatch.js — 孵化(マチタマ → マチモン)
   ★Pay to Win にしない: レアリティが上げるのは 街の生産力・見た目・演出だけ。
     学習効率(出題・報酬倍率・知識エネルギー)には一切影響しない。
   ★主要な入手経路は課金ではなく「問題を解くとゲージが貯まって卵が割れる」。
     報酬感の源泉は解答そのものであり、賭けではない。
   ★孵化から知識エネルギーは1も出ない(economy.keFor を通さない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  /* レアリティ排出率(N/R/SR/SSR/UR)。天井=30回引いてSR以上が出なければSR確定 */
  var RATE=[0.45,0.30,0.18,0.06,0.01];
  var PITY=30;

  function rollRar(c){
    var pity=c.mm.pity||0;
    if(pity>=PITY)return 2;
    var r=c.rand(),acc=0;
    for(var i=0;i<RATE.length;i++){ acc+=RATE[i]; if(r<acc)return i; }
    return 0;
  }

  /* 出現候補: 解放済みエリアの科目 + 街ライン。第1段階のみ(進化は学習でしか進まない) */
  function pool(c){
    var D=MM.DATA,subs={},out=[];
    for(var id in c.mm.areas){ var a=D.areaById[id]; if(a)subs[a.sub]=1; }
    for(var i=0;i<D.species.length;i++){
      var s=D.species[i];
      if(s.stage!==1)continue;
      if(s.sub>=0&&!subs[s.sub])continue;
      out.push(s);
    }
    return out;
  }

  /* 1回ぶんの抽選結果。状態は変えない */
  function roll(c){
    var cand=pool(c);
    if(!cand.length)return null;
    var rar=rollRar(c);
    /* そのレアリティに合う種族が無ければ、いちばん近いレアリティへ寄せる
       (=第1段階は N 中心なので、高レアは「同じ種族の色違い扱い」で表現する) */
    var same=cand.filter(function(s){ return s.rar===rar; });
    var sp=(same.length?same:cand)[Math.floor(c.rand()*(same.length?same.length:cand.length))];
    return { sp:sp.id, rar:rar, rare:rar>=3, name:sp.name };
  }

  /* 実際に孵す。マチタマを1つ消費し、個体を追加して uid を返す */
  function hatch(c){
    if((c.mm.res.tama||0)<1)return null;
    if(Object.keys(c.mm.mons).length>=MM.state.MON_CAP)return null;
    var r=roll(c);
    if(!r)return null;
    c.mm.res.tama--;
    c.mm.pity=(r.rar>=2)?0:((c.mm.pity||0)+1);
    var uid="u"+(c.mm.uid++);
    c.mm.mons[uid]={ sp:r.sp, lv:1, xp:0, born:c.today, place:"" };
    return { uid:uid, sp:r.sp, rar:r.rar, rare:r.rare, name:r.name };
  }

  /* 演出の段取り(UIはこの配列を順に再生するだけ。ロジックと演出の分離) */
  function sequence(rare){
    if(!rare)return [
      {t:"egg",  ms:300},{t:"crack",ms:400},{t:"glow", ms:300},{t:"born", ms:600}];
    /* 高レア: 一度ふつうの光に見せてから、短い静寂を挟む(音を足すのではなく消して期待を作る) */
    return [
      {t:"egg",  ms:300},{t:"crack",ms:400},{t:"glow", ms:300},
      {t:"hush", ms:500,silent:true},
      {t:"shift",ms:400},{t:"burst",ms:600},{t:"born", ms:700}];
  }

  MM.hatch={ RATE:RATE, PITY:PITY, rollRar:rollRar, pool:pool, roll:roll, hatch:hatch, sequence:sequence };
})();
