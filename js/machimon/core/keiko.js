"use strict";
/* ============================================================
   machimon/core/keiko.js — けいこ(3つから選ぶ)・けいこ値・Lvの上限・配合券
   ★けいこは3つ。どれを選ぶかで、出る問題と 伸びる能力(けいこ値)が変わる。1回10問。
       あたらしい問題 = まだ解いていない問題      → ちから
       復習           = 期限の来た問題            → ねばり(7日以上ためた復習は2倍)
       苦手つぶし     = 前にまちがえた問題        → ひらめき
     どの問題も、連続正解5問ごとに いきおい、本試験形式の正解で かしこさ。
   ★何が伸びるかは「その問題が、答える前にどういう状態だったか」で決まる(取組で解いた問題も同じ決まり)。
   ★勉強が1科目にかたよらない作り:
       ・あたらしい問題は、いちばん進んでいない科目から出す(1回=1科目。回ごとに科目がかわる)。
       ・Lvの上限は 9科目すべての習熟で決まる(1科目だけ仕上げても +3 どまり)。看板の族の科目は関係ない。
   ★配合券は「きょうの復習をやりきる」と1日1枚。コインでは買えない。
   ★コインも経験も「正解」からしか出ない。2秒未満のまぐれ当たりは何も出さない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function D(){ return MM.DATA; }
  function K(){ return MM.DATA.KEIKO; }
  function M(){ return MM.mon; }
  function L(){ return MM.learn; }
  function bank(){ return G.Q||[]; }
  function r2(v){ return Math.round(v*100)/100; }
  function isExam(q){ return MM.garden.isExam(q); }
  function doneToday(c,id){ var x=c.mm.qx[id]; return !!(x&&x.d===c.dstr&&x.n>0); }

  /* 問題の状態(答える前)。new=まだ / nig=前にまちがえた / rev=期限の来た復習 / other=期限前 */
  function classOf(st,today){
    if(!st||!L().seen(st))return "new";
    if(st.ng)return "nig";
    return (st.due||0)<=today?"rev":"other";
  }
  /* 答えたあとの rw(MM.learn.reward の戻り値=答える前の状態を持つ)から同じ分類を出す */
  function classOfRw(rw){ if(rw.seen===false)return "new"; if(rw.ng)return "nig"; return rw.timing>=1.6?"rev":"other"; }

  /* 科目ごとの数(全体・解いたことがある・のこりの復習・のこりの苦手) */
  function census(c){
    var Q=bank(), st=c.ST.q||{}, per=[], i, tot={n:0,seen:0,neu:0,rev:0,nig:0};
    for(i=0;i<9;i++)per.push({sub:i,n:0,seen:0,neu:0,rev:0,nig:0});
    for(i=0;i<Q.length;i++){
      var q=Q[i], p=per[q.s]; if(!p)continue; var s=st[q.id], cl=classOf(s,c.today);
      p.n++; tot.n++;
      if(cl==="new"){ p.neu++; tot.neu++; } else { p.seen++; tot.seen++; }
      if(doneToday(c,q.id))continue;
      if(cl==="rev"){ p.rev++; tot.rev++; } else if(cl==="nig"){ p.nig++; tot.nig++; }
    }
    return { per:per, tot:tot };
  }
  /* あたらしい問題を出す科目 = いちばん進んでいない科目(解いた割合が低い順。同じなら科目の並び順) */
  function nextSub(cs){
    var best=-1, bv=2;
    for(var i=0;i<cs.per.length;i++){ var p=cs.per[i]; if(!p.neu)continue; var v=p.n?p.seen/p.n:1; if(v<bv-1e-9){ bv=v; best=i; } }
    return best;
  }

  /* ---------- きょうの復習 と 配合券 ---------- */
  function rv(c,cs){
    var g=M().W(c);
    if(!g.rv||g.rv.d!==c.dstr){ cs=cs||census(c); g.rv={d:c.dstr,need:Math.min(K().revQuota,cs.tot.rev),done:0}; }
    return g.rv;
  }
  function ticketState(c,cs){
    var g=M().W(c), r=rv(c,cs), got=(g.btd===c.dstr);
    return { need:r.need, done:Math.min(r.need,r.done), got:got, ans:c.mm.day.ans||0, min:K().ticketMin,
             ready:!got&&r.done>=r.need&&(c.mm.day.ans||0)>=K().ticketMin };
  }
  function tryTicket(c){
    var g=M().W(c), t=ticketState(c); if(!t.ready)return 0;
    g.btd=c.dstr; g.bt=Math.min(9999,(g.bt||0)+1); return 1;
  }

  /* ---------- けいこの献立 ---------- */
  function menu(c){
    var cs=census(c), sub=nextSub(cs), names=G.SUBJECTS||[], t=ticketState(c,cs);
    return { cs:cs, ticket:t, list:D().KEIKO.kinds.map(function(k){
      var left=k.id==="new"?cs.tot.neu:(k.id==="rev"?cs.tot.rev:cs.tot.nig);
      return { id:k.id, name:k.name, icon:k.icon, stat:k.stat, coin:k.coin, left:left, none:k.none,
               sub:k.id==="new"?sub:-1, subName:k.id==="new"&&sub>=0?(names[sub]||""):"" };
    }) };
  }
  /* 1回ぶんをはじめる。出せる問題が無ければ err */
  function start(c,kind){
    var k=D().keikoById[kind]; if(!k)return {err:"そのけいこは無い"};
    var cs=census(c), s={ kind:kind, size:K().size, n:0, hits:0, sub:-1, qid:null, coin:0, xp:0, ef:{}, lv0:0, pw0:0, gifts:[], ticket:0 };
    if(kind==="new"){ s.sub=nextSub(cs); if(s.sub<0)return {err:k.none}; }
    else if((kind==="rev"?cs.tot.rev:cs.tot.nig)<=0)return {err:k.none};
    var kan=M().kanban(M().W(c)); s.lv0=kan.lv; s.pw0=M().power(kan); s.pid=kan.i;
    s.qid=pick(c,s); if(s.qid==null)return {err:k.none};
    return s;
  }
  /* つぎの1問。4問に1問は本試験形式(その けいこ の条件に合うものがあれば) */
  function pick(c,s){
    var all=[0,1,2,3,4,5,6,7,8], wantEx=(s.n%K().examEvery===K().examEvery-1);
    function f(ex){ return function(q,st){ if(classOf(st,c.today)!==s.kind)return false; if(doneToday(c,q.id))return false; return ex==null||isExam(q)===ex; }; }
    var o=(s.kind==="new")?{sub:s.sub}:{subs:all}, ids;
    if(wantEx){ var ex=pickEx(c,s); if(ex!=null)return ex; }
    o.filter=f(null); ids=L().pick(1,c,o);
    return ids.length?ids[0]:null;
  }
  /* 本試験形式(択一・個数・選択式)は ふだんの問題の表(Q)とは別にある。その けいこ の条件に合うものを1問 */
  function pickEx(c,s){
    var ids=MM.garden.examIds(), m=L().masteryBySub(c), cand=[];
    for(var i=0;i<ids.length;i++){ var q=G.qById(ids[i]); if(!q)continue; if(s.kind==="new"&&q.s!==s.sub)continue;
      if(classOf(c.ST.q&&c.ST.q[q.id],c.today)!==s.kind||doneToday(c,q.id))continue; cand.push({id:q.id,p:L().priority(q,c,{mastery:m})}); }
    if(!cand.length)return null;
    cand.sort(function(a,b){ return b.p-a.p; });
    return cand[Math.floor(c.rand()*Math.min(cand.length,8))].id;
  }
  /* 答えたあとに呼ぶ(記録は MM.learn.commit / MM.economy.grant が済ませている)。次の問題を用意する */
  function advance(c,s,ok,gain){
    s.n++; if(ok)s.hits++;
    var mo=(gain&&gain.mon)||{};
    s.coin+=mo.coin||0; s.xp+=mo.xp||0;
    for(var k in (mo.ef||{}))s.ef[k]=r2((s.ef[k]||0)+mo.ef[k]);
    (mo.gifts||[]).forEach(function(x){ s.gifts.push(x); });
    if(mo.ticket)s.ticket=1;
    s.qid=(s.n>=s.size)?null:pick(c,s);
    s.over=(s.qid==null);
    return s;
  }

  /* ---------- Lvの上限(全科目の習熟で決まる。どの個体も同じ) ---------- */
  function lvCap(c,mast){
    mast=mast||L().masteryBySub(c); var T=D().LVCAP.steps, cap=D().LVCAP.base, per=[], next=null, names=G.SUBJECTS||[];
    for(var s=0;s<9;s++){
      var m=mast[s]||0, st=0; while(st<T.length&&m>=T[st])st++;
      cap+=st; per.push({sub:s,m:m,step:st});
      if(st<T.length){ var gap=T[st]-m; if(!next||gap<next.gap)next={sub:s,name:names[s]||"",gap:gap,to:T[st],m:m}; }
    }
    return { cap:Math.min(D().LV_MAX,cap), per:per, next:next };
  }
  function stepsOf(mast){ var T=D().LVCAP.steps, o=[]; for(var s=0;s<9;s++){ var m=mast[s]||0, st=0; while(st<T.length&&m>=T[st])st++; o.push(st); } return o; }

  /* ---------- 1回答ごと(core/economy.js の grant → MM.mon.onAnswer から呼ばれる) ---------- */
  function onAnswer(rw,gain,c){
    var g=M().W(c), out={coin:0,xp:0,ups:[],ef:{},kan:null,cls:classOfRw(rw),gifts:[],ticket:0,late:false,rvNeed:0};
    gain.g=0; gain.xp=0; gain.ke=0; gain.mat=0; gain.tama=0; gain.mon=out;
    /* きょうの復習の数え上げ(正解でも まちがいでも「やった」に入る) */
    var r=rv(c); if(out.cls==="rev"&&(rw.novelty==null||rw.novelty>=1))r.done++;
    if(rw.ok&&!rw.fluke){
      var kd=D().keikoById[out.cls];
      var f=(rw.novelty==null?1:rw.novelty)*(rw.timing<=0.3?0.3:1);     /* 同じ日のくり返し・覚えた問題の連打はほぼ無価値 */
      var bst=g.boost||(g.boost={xp:0,ef:0});
      out.coin=Math.round((kd?kd.coin:K().other)*f); out.xp=out.coin; gain.g=out.coin;
      if(bst.xp>0&&out.xp>0){ out.xp*=2; bst.xp--; out.boostXp=1; }
      var k=M().kanban(g); out.kan=k;
      if(k&&out.xp>0){
        var mast=L().masteryBySub(c), was=M().adult(k), u=M().addXp(k,out.xp,lvCap(c,mast).cap);
        if(u){ out.ups.push({p:k,n:u,grown:!was&&M().adult(k)}); M().mark(g,k); }
        if(f>=1){
          var mul=1; if(bst.ef>0){ mul=2; bst.ef--; out.boostEf=1; }
          var e=function(key,v){ var a=M().addEf(k,key,v*mul); if(a)out.ef[key]=r2((out.ef[key]||0)+a); };
          if(kd){ out.late=(out.cls==="rev"&&rw.timing>=2); e(kd.stat,kd.ef*(out.late?K().lateMul:1)); }
          if((c.mm.combo||0)>0&&c.mm.combo%K().comboEvery===0)e("h",K().comboEf);
          try{ var q=(typeof G.qById==="function"&&c.lastQid!=null)?G.qById(c.lastQid):null; if(q&&isExam(q))e("m",K().examEf); }catch(e2){}
        }
        /* 科目の習熟が Lv上限の段をこえたら、とっておきのどうぐ(科目×段ごとに1回きり) */
        if(MM.breed){ var st=stepsOf(mast), ms=g.ms||(g.ms={});
          for(var s=0;s<9;s++){ for(var t=1;t<=st[s];t++){ var key="m"+s+"_"+t; if(!ms[key]){ ms[key]=1; MM.breed.give(c,D().GIFT.mastery,out.gifts,(G.SUBJECTS||[])[s]+" の習熟"); } } } }
      }
      /* 連続正解の節目(その日はじめての 10連続・20連続) */
      if(MM.breed){ var cd=g.cd&&g.cd.d===c.dstr?g.cd:(g.cd={d:c.dstr,n:0});
        D().GIFT.combo.forEach(function(x){ if((c.mm.combo||0)>=x.n&&cd.n<x.n){ cd.n=x.n; MM.breed.give(c,x,out.gifts,x.n+"問 連続正解"); } }); }
    }
    if(tryTicket(c)){ out.ticket=1; out.rvNeed=r.need; }
    return out;
  }

  MM.keiko={ classOf:classOf, classOfRw:classOfRw, census:census, nextSub:nextSub, rv:rv, ticketState:ticketState, tryTicket:tryTicket,
    menu:menu, start:start, pick:pick, advance:advance, lvCap:lvCap, stepsOf:stepsOf, onAnswer:onAnswer };
})();
