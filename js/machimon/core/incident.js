"use strict";
/* ============================================================
   machimon/core/incident.js — 事件(クイズのゲームイベント化)
   ★問題一覧画面に依存しない。街で「事件」が発生し、タップすると問題が出る。
   ★1日の事件の半分は復習(SRSの期限到来)である = ゲームを普通に遊ぶと復習が終わる。
     これが本作の学習効果の中心。
   ★事件は科目エリアに紐づく。建物が増えるほど事件枠が増える(街の発展=演習機会の増加)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};

  function D(){ return MM.DATA; }

  /* 1日の事件枠 */
  function slots(c){
    var n=D().INC_BASE+MM.town.bldCount(c)*D().INC_PER_BLD;
    return Math.min(D().INC_CAP,Math.round(n));
  }

  /* 種類別の目標件数(復習50% / 沼15% / 新問25% / 残りは弱点補強) */
  function quota(n){
    var rv=Math.round(n*0.5), lc=Math.round(n*0.15), nw=Math.round(n*0.25);
    var wk=Math.max(0,n-rv-lc-nw);
    return {review:rv,leech:lc,"new":nw,weak:wk};
  }

  /* 解放済みエリアの科目 */
  function openSubs(c){
    var out=[];
    for(var id in c.mm.areas){ var a=D().areaById[id]; if(a)out.push(a.sub); }
    return out;
  }

  /* 当日の事件を生成する(1日1回・その日の最初の街訪問時) */
  function generate(c){
    if(c.mm.inc.d===c.dstr&&c.mm.inc.list.length)return c.mm.inc.list;
    var subs=openSubs(c), n=slots(c), q=quota(n);
    var mast=MM.learn.masteryBySub(c);
    var list=[],used={};
    c.mm.inc={ d:c.dstr, list:list, done:0 };   /* 生成中の重複判定に使う(下で確定する) */
    var kinds=["review","leech","new","weak"];
    for(var ki=0;ki<kinds.length;ki++){
      var kind=kinds[ki], want=q[kind];
      var ids=MM.learn.pick(want*2,c,{ subs:subs, mastery:mast, filter:filterFor(kind,c) });
      for(var i=0;i<ids.length&&want>0;i++){
        if(used[ids[i]])continue;
        used[ids[i]]=1;
        var qq=(typeof G.qById==="function")?G.qById(ids[i]):null;
        var sub=qq?qq.s:0;
        var a=D().areaBySub[sub];
        if(!a||!c.mm.areas[a.id])continue;
        list.push(make(c,kind,a,[ids[i]]));
        want--;
      }
    }
    /* 枠が埋まらなかったぶんを補充する(初日は復習・沼問題が存在しないため必ず起きる)。
       種類は問題の状態から決める=バッジの意味と中身が食い違わない。 */
    if(list.length<n){
      var fill=MM.learn.pick((n-list.length)*2,c,{ subs:subs, mastery:mast });
      for(var fi=0;fi<fill.length&&list.length<n;fi++){
        if(used[fill[fi]])continue;
        var fq=(typeof G.qById==="function")?G.qById(fill[fi]):null;
        var fa=fq?D().areaBySub[fq.s]:null;
        if(!fa||!c.mm.areas[fa.id])continue;
        used[fill[fi]]=1;
        list.push(make(c,kindOf(c,fill[fi]),fa,[fill[fi]]));
      }
    }
    /* 事件の並びは科目がばらけるようにシャッフル(同じ科目が続くと世界が単調になる) */
    shuffle(list,c.rand);
    /* 1日1つの大事件(解放済みエリアからランダム)。先頭には置かない(初日の1問目は普通の事件) */
    var oa=[]; for(var aid in c.mm.areas){ if(D().areaById[aid])oa.push(D().areaById[aid]); }
    if(oa.length){ var big=makeBig(c,oa[Math.floor(c.rand()*oa.length)]); if(big)list.splice(Math.min(2,list.length),0,big); }
    c.mm.inc.d=c.dstr; c.mm.inc.list=list; c.mm.inc.done=0;
    return list;
  }

  function filterFor(kind,c){
    return function(q,st){
      var seen=MM.learn.seen(st);
      if(kind==="review")return seen&&(st.due||0)<=c.today;
      if(kind==="leech") return MM.learn.isLeech(st);
      if(kind==="new")   return !seen;
      return true;                                   /* weak: 何でも(優先度が弱点科目を拾う) */
    };
  }

  var seq=0;
  /* 相談内容は問題文から決める(問題と相談が食い違わない)。当たらなければ科目の声へ */
  function pickLine(c,sub,qid){
    var q=(typeof G.qById==="function"&&qid!=null)?G.qById(qid):null;
    var text=q?String(q.q||q.question||""):"";
    var T=D().incTopics||[];
    for(var t=0;t<T.length;t++){ if(T[t][0].test(text))return T[t][1]; }
    /* 対応表に無い問題: 問題文の先頭の語(助詞の手前)を使って「〇〇のことで相談」にする=絶対に食い違わない */
    if(text){
      text=text.replace(/^(使用者|労働者|事業主|事業者|会社|被保険者|受給資格者|国|政府|都道府県労働局長|厚生労働大臣)(は|が|の|に|を)/,"");
      var m=text.match(/^[「『]?([^、。,\s]{2,14}?)(について|に関して|の場合|とは|には|は|が|を|に|で|の)/);
      var key=m?m[1]:text.slice(0,10);
      if(key)return key+"のことで相談があるモン！";
    }
    var lines=D().incLines[sub]||["助けてほしいモン！"];
    var used=(c.mm.inc&&c.mm.inc.d===c.dstr)?usedLines(c):{};
    var free=lines.filter(function(l){ return !used[l]; });
    var pool=free.length?free:lines;
    return pool[Math.floor(c.rand()*pool.length)];
  }
  function usedLines(c){
    var out={},l=(c.mm.inc&&c.mm.inc.list)||[];
    for(var i=0;i<l.length;i++)out[l[i].line]=1;
    return out;
  }
  /* 相談に来る住民の顔: 全種族からランダム(同じ顔が並ばないよう直前と変える) */
  var lastFace="";
  function pickFace(c){
    var sp=D().species||[], id="m01";
    for(var g=0;g<4;g++){ id=sp[Math.floor(c.rand()*sp.length)].id; if(id!==lastFace)break; }
    lastFace=id; return id;
  }
  function make(c,kind,area,qids){
    return { id:"i"+(++seq)+"-"+area.id, area:area.id, sub:area.sub, kind:kind,
             line:pickLine(c,area.sub,qids[0]), face:pickFace(c), qids:qids, done:0 };
  }
  /* 大事件: 同じ科目の問題を5問。連続正解でのみ解決、1問でも外すと最初から */
  function makeBig(c,area){
    var ids=MM.learn.pick(D().BIG_NEED*2,c,{ sub:area.sub });
    if(ids.length<D().BIG_NEED)return null;
    var inc=make(c,"big",area,ids.slice(0,D().BIG_NEED));
    inc.line="大事件モン！ "+inc.line.replace(/モン[！…？]?$/,"")+"…みんな困ってるモン！";
    inc.need=D().BIG_NEED; inc.prog=0; inc.fail=0;
    return inc;
  }

  /* 問題の学習状態から事件の種類(理由バッジ)を決める */
  function kindOf(c,qid){
    var st=MM.learn.stat(c,qid);
    if(MM.learn.isLeech(st))return "leech";
    if(!MM.learn.seen(st))return "new";
    if((st.due||0)<=c.today)return "review";
    return "weak";
  }

  function shuffle(a,rand){
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(rand()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; }
    return a;
  }

  /* 未解決の事件 */
  function pending(c){
    return (c.mm.inc.list||[]).filter(function(x){ return !x.done; });
  }
  function byArea(c,areaId){
    return pending(c).filter(function(x){ return x.area===areaId; });
  }
  function find(c,id){
    var l=c.mm.inc.list||[];
    for(var i=0;i<l.length;i++){ if(l[i].id===id)return l[i]; }
    return null;
  }

  /* 事件の1問に回答する。学習の確定・報酬付与・マチモンの経験値まで面倒を見る */
  function answer(c,incId,qid,ok,ms){
    var inc=find(c,incId);
    var rw=MM.learn.commit(qid,ok,ms,c);
    var gain=MM.economy.grant(rw,c);
    var lvUp=MM.evolve.gainXp(c,(inc?inc.sub:subOf(qid)),ok);
    var big=null;
    if(inc&&inc.kind==="big"){
      if(ok){ inc.prog=(inc.prog||0)+1; if(inc.prog>=inc.need){ inc.done=1; var B=D().BIG_BONUS; MM.economy.apply({g:B.g,xp:0,ke:B.ke,mat:B.mat,tama:B.tama},c); gain.g+=B.g; gain.ke+=B.ke; gain.mat+=B.mat; gain.tama+=B.tama; } }
      else { inc.prog=0; inc.fail=(inc.fail||0)+1; }
      big={ prog:inc.prog, need:inc.need, cleared:!!inc.done, failed:!ok };
    }else if(inc&&ok)inc.done=1;
    if(inc&&inc.done)c.mm.inc.done=(c.mm.inc.done||0)+1;
    var res=D().incResolve[Math.floor(c.rand()*D().incResolve.length)];
    return { reward:rw, gain:gain, lvUp:lvUp, resolved:!!(inc&&inc.done), flavor:res, big:big };
  }
  /* 事件のいま出すべき問題(大事件は進行中の番号) */
  function currentQid(inc){ return inc.qids[inc.kind==="big"?(inc.prog||0):0]; }
  function subOf(qid){
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    return q?q.s:0;
  }

  /* エリアに入って解く(街の場所と出題科目を一致させる)。事件が尽きたら追加生成 */
  function more(c,areaId,n){
    var a=D().areaById[areaId]; if(!a)return [];
    var ids=MM.learn.pick(n||3,c,{ sub:a.sub });
    var out=[];
    for(var i=0;i<ids.length;i++){
      var inc=make(c,kindOf(c,ids[i]),a,[ids[i]]);
      c.mm.inc.list.push(inc);
      out.push(inc);
    }
    return out;
  }

  MM.incident={ slots:slots, quota:quota, generate:generate, pending:pending, byArea:byArea,
                find:find, answer:answer, more:more, make:make, makeBig:makeBig, currentQid:currentQid };
})();
