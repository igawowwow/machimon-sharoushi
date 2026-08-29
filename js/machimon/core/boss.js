"use strict";
/* ============================================================
   machimon/core/boss.js — ボス(単元テスト・過去問・模試のゲーム化)
   ★エリアボス=単元テスト / 中ボス=過去問 / レイド=模試。ダメージ=正解。
   ★挑戦には習熟度(need)と知識エネルギー(ke)が要る = 実力に見合わない周回ができない。
   ★敗北にペナルティを置かない。失った物は無く、弱点リストが残るだけ(不安で学習させない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function D(){ return MM.DATA; }
  function def(id){ return D().bossById[id]||null; }

  /* 挑戦可能か。理由も返す(UIは「あと習熟度3%」のように具体的な行動を示せる) */
  function canChallenge(c,id){
    var b=def(id); if(!b)return {ok:false,why:"none"};
    var mast=MM.learn.masteryBySub(c);
    var m=(b.sub>=0)?(mast[b.sub]||0):avg(mast,b.subs||[]);
    if(b.area!=="*"&&!c.mm.areas[b.area])return {ok:false,why:"area",need:b.area};
    if(m<b.need)return {ok:false,why:"mastery",now:Math.round(m*100),need:Math.round(b.need*100)};
    if(c.mm.res.ke<b.ke)return {ok:false,why:"ke",now:c.mm.res.ke,need:b.ke};
    return {ok:true,mastery:Math.round(m*100)};
  }
  function avg(mast,subs){
    if(!subs.length)return 0;
    var s=0;
    for(var i=0;i<subs.length;i++)s+=(mast[subs[i]]||0);
    return s/subs.length;
  }

  /* 戦闘の開始。挑戦権(KE)を消費して出題セットを組む */
  function start(c,id){
    var ck=canChallenge(c,id);
    if(!ck.ok)return null;
    var b=def(id);
    if(!MM.economy.spend(c,"ke",b.ke))return null;
    var opt=(b.sub>=0)?{sub:b.sub}:{subs:b.subs||[]};
    var qids=MM.learn.pick(b.q,c,opt);
    return { boss:id, hp:b.hp, max:b.hp, qids:qids, i:0, hits:0, miss:0, combo:0 };
  }

  /* ダメージ = 正解。高難度・期限到来の復習は Critical。コンボで最大+50% */
  function damage(c,qid,ok,combo){
    if(!ok)return {dmg:0,crit:false};
    var st=MM.learn.stat(c,qid);
    var hard=MM.learn.difficulty(st)>=1.15||MM.learn.isLeech(st)||
             (MM.learn.seen(st)&&(st.due||0)<=c.today);
    var base=hard?D().DMG_CRIT:D().DMG_BASE;
    var mult=1+Math.min(D().DMG_COMBO_CAP,(combo||0)*0.05);
    return { dmg:Math.round(base*mult), crit:hard };
  }

  /* 1問ぶんの進行。戦闘状態 g を破壊的に更新して結果を返す */
  function step(c,g,ok,ms){
    var qid=g.qids[g.i];
    var rw=MM.learn.commit(qid,ok,ms,c);
    var gain=MM.economy.grant(rw,c);
    g.combo=ok?g.combo+1:0;
    var d=damage(c,qid,ok,g.combo);
    g.hp=Math.max(0,g.hp-d.dmg);
    if(ok)g.hits++; else g.miss++;
    g.i++;
    var over=(g.hp<=0)||(g.i>=g.qids.length);
    return { qid:qid, reward:rw, gain:gain, dmg:d.dmg, crit:d.crit, over:over, win:g.hp<=0 };
  }

  /* 決着。勝利時のみ報酬。敗北はペナルティ無し(弱点リストを返すだけ) */
  function finish(c,g){
    var b=def(g.boss);
    var win=g.hp<=0;
    var rec=c.mm.boss[g.boss]||(c.mm.boss[g.boss]={clears:0,best:0});
    if(g.hits>rec.best)rec.best=g.hits;
    if(!win)return { win:false, hits:g.hits, weak:weakList(c,g) };
    rec.clears++;
    var r=b.reward;
    var gain={g:r.g,xp:0,ke:r.ke,mat:r.mat,tama:r.tama};
    MM.economy.apply(gain,c);
    return { win:true, hits:g.hits, gain:gain, first:rec.clears===1 };
  }
  /* 敗北時に街の掲示板へ貼られる弱点(責めない・次の行動だけ示す) */
  function weakList(c,g){
    var out=[];
    for(var i=0;i<g.i;i++){
      var st=c.ST.q&&c.ST.q[g.qids[i]];
      if(st&&st.ng)out.push(g.qids[i]);
    }
    return out.slice(0,5);
  }

  /* 解放済み・挑戦可能なボス一覧(UI用) */
  function list(c){
    var out=[];
    for(var i=0;i<D().bosses.length;i++){
      var b=D().bosses[i];
      if(b.area!=="*"&&!c.mm.areas[b.area])continue;
      var ck=canChallenge(c,b.id);
      var rec=c.mm.boss[b.id]||{clears:0,best:0};
      out.push({ def:b, can:ck, rec:rec });
    }
    return out;
  }

  MM.boss={ def:def, canChallenge:canChallenge, start:start, damage:damage,
            step:step, finish:finish, list:list };
})();
