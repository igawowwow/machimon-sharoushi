"use strict";
/* ============================================================
   machimon/core/breed.js — 配合・育成どうぐ・ごほうび
   ★配合: なかま2体(おや1・おや2)から子を1体つくる。配合券を1枚使う。
     おや1は残る。おや2は子に生まれかわる(いなくなる)。= 配合で なかま の数もレアの数も増えない。
       子の種類  おや1の種類70% / おや2の種類25% / 同じ族の別の種類5%
                 ただし子のレア度は おや2 より上がらない(おや1のほうがレアなら、子は おや2の種類になる)。
                 = レアな種類を「ふやす」ことはできない。レアな子が欲しければ、レアな おや2 が要る。
                 (族とレア度の条件がそろうと、配合限定の種類が先に判定される。これだけがレア度の上がる道)
       子の才能  能力ごとに 高いほう50% / 低いほう25% / ふり直し25%。
                 族の相性がある組は「ふり直し」が「高いほう」に置きかわる(=75%で高いほう)。
                 両親が同じ値のときだけ 5%(かくれ相性は10%)で +1。
       性格      親のどちらか60% / ふり直し40%
       特性      親の特性を1つずつ35%で判定(生まれつきは1つまで)
   ★予想は2行だけ: 「子の才能の見込み 32〜41／50」「いまの看板を超える確率 28%」。
     予想は決まった種の乱数で600回ためした結果(同じ組なら いつ見ても同じ数字)。
   ★育成どうぐ12種とごほうび。何が出るかは順番で決まる(乱数を使わない=品評会に運を持ちこまない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function D(){ return MM.DATA; }
  function GD(){ return MM.DATA.garden; }
  function M(){ return MM.mon; }
  function B(){ return MM.DATA.BREED; }

  /* ---------- 族の相性 ---------- */
  function pairKey(a,b){ return Math.min(a,b)+"|"+Math.max(a,b); }
  function compat(g,A,B2){
    var fa=M().kindOf(A).f, fb=M().kindOf(B2).f, key=pairKey(fa,fb), pub=false, N=GD().NICKS;
    if(fa!==fb)for(var i=0;i<N.length;i++)if(pairKey(N[i][0],N[i][1])===key)pub=true;
    var hid=fa!==fb&&g.hn.indexOf(key)>=0;
    return { key:key, pub:pub, hid:hid, known:!!(hid&&g.hnf[key]), any:pub||hid };
  }
  /* ---------- 子の種類の確率 ---------- */
  function kindDist(A,B2,item){
    var ka=M().kindOf(A), kb=M().kindOf(B2), out=[], rem=1, map={};
    function add(k,p,only){ if(p<=0)return; if(map[k.id]){ map[k.id].p+=p; return; } map[k.id]={k:k,p:p,only:!!only}; out.push(map[k.id]); }
    if(item==="utsushi"){ add(kb,1); return { list:out, other:0, pool:[], only:[], capped:false }; }
    /* 配合限定: 2つの族がそろい、両親のレア度が条件以上。レア度の高いものから判定 */
    var on=D().kinds.filter(function(k){ return k.only&&pairKey(k.only.fams[0],k.only.fams[1])===pairKey(ka.f,kb.f)&&ka.f!==kb.f&&ka.rar>=k.only.need&&kb.rar>=k.only.need; })
      .sort(function(x,y){ return y.rar-x.rar; });
    on.forEach(function(k){ var p=rem*B().only[k.rar]; add(k,p,true); rem-=p; });
    var okA=ka.rar<=kb.rar;                       /* 子のレア度は おや2 より上がらない */
    var other=(item==="kawari")?0.30:B().kindOther, fam=okA?ka.f:kb.f;
    var pool=D().kinds.filter(function(k){ return !k.only&&k.f===fam&&k.rar<=Math.min(4,kb.rar)&&k.id!==ka.id&&k.id!==kb.id; });
    if(!pool.length)other=0;
    var pa=okA?(1-other)*B().kindA/(B().kindA+B().kindB):0, pb=(1-other)-pa;
    add(ka,rem*pa); add(kb,rem*pb);
    return { list:out, other:rem*other, pool:pool, only:on, capped:!okA };
  }
  function pickKind(r,dist){
    var x=r(), acc=0;
    for(var i=0;i<dist.list.length;i++){ acc+=dist.list[i].p; if(x<acc)return dist.list[i].k; }
    return dist.pool.length?dist.pool[Math.floor(r()*dist.pool.length)]:dist.list[0].k;
  }
  /* ひきつぎの糸がかかる能力 = 両親の差がいちばん大きい能力 */
  function itoIndex(A,B2){ var bi=0, bd=-1; for(var i=0;i<5;i++){ var d=Math.abs(A.tl[i]-B2.tl[i]); if(d>bd){ bd=d; bi=i; } } return bi; }
  /* 子を1体ぶん決める(idは付けない。乱数 r だけで決まる) */
  function make(r,g,A,B2,item,dist,cp){
    var kd=pickKind(r,dist), T=D().TALENT_MAX, tl=[], ito=(item==="ito")?itoIndex(A,B2):-1, i;
    for(i=0;i<5;i++){
      var a=A.tl[i], b=B2.tl[i], hi=Math.max(a,b), lo=Math.min(a,b), v;
      if(i===ito)v=hi;
      else if(a===b&&r()<(cp.hid?B().upHidden:B().up))v=Math.min(T,a+1);
      else { var x=r(); v=x<B().hi?hi:(x<B().hi+B().lo?lo:(cp.any?hi:M().rollTalent(r))); }
      tl.push(v);
    }
    var na=(item==="omamori")?A.na:(r()<B().nature?(r()<0.5?A.na:B2.na):D().natures[Math.floor(r()*D().natures.length)].id);
    var tr=[], cand=A.tr.concat(B2.tr).filter(function(t,ix,arr){ return arr.indexOf(t)===ix; });
    cand.forEach(function(t){ if(!tr.length&&r()<B().trait)tr.push(t); });
    if(!tr.length&&item==="suzu"&&cand.length)tr.push(cand[Math.floor(r()*cand.length)]);
    if(!tr.length&&r()<B().traitNew)tr.push(MM.garden.rollTrait(r,Math.min(4,kd.rar)));
    var ps=(A.sh||B2.sh)?D().RATE2.shinyBred:D().RATE2.shiny;
    var p={ k:kd.id, n:kd.name, lv:1, xp:0, tl:tl, na:na, tr:tr, ef:[0,0,0,0,0], a:[A.i,B2.i], w:0 };
    if(r()<ps)p.sh=1;
    return p;
  }
  function check(c,idA,idB,item){
    var g=M().W(c), A=M().byId(g,idA), B2=M().byId(g,idB);
    if(!A||!B2||A===B2)return {err:"親を2体えらんでね"};
    if(g.kan===B2.i)return {err:"看板は おや2 にできない(おや2は子に生まれかわるので)"};
    if(item){ var it=D().itemById[item]; if(!it||it.use!=="b")return {err:"そのどうぐは配合では使えない"}; if(!(g.items[item]>0))return {err:it.name+" を持っていない"}; }
    return { g:g, A:A, B:B2 };
  }
  /* ---------- 予想(2行) ---------- */
  function seedOf(s){ var h=7; for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%2147483646; return h+1; }
  function lcg(seed){ return function(){ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }; }
  function preview(c,idA,idB,item,n){
    var ck=check(c,idA,idB,item); if(ck.err)return ck;
    var g=ck.g, A=ck.A, B2=ck.B, cp=compat(g,A,B2), dist=kindDist(A,B2,item), r=lcg(seedOf(A.i+"/"+B2.i+"/"+(item||"")+"/"+A.tl.join("")+B2.tl.join(""))), N=n||600;
    var k=M().kanban(g), kv=M().power(k), sums=[], beat=0, t40=0;
    for(var i=0;i<N;i++){ var p=make(r,g,A,B2,item,dist,cp), s=0; for(var j=0;j<5;j++)s+=p.tl[j]; sums.push(s);
      var h=M().handover(p,k); if(M().atLv(p,h.lv,h.ef)>kv)beat++; if(s>=40)t40++; }
    sums.sort(function(a,b){ return a-b; });
    var kinds=dist.list.map(function(x){ return {k:x.k,p:x.p,only:x.only}; });
    return { A:A, B:B2, lo:sums[Math.floor(N*0.1)], hi:sums[Math.floor(N*0.9)], mean:sums.reduce(function(a,b){ return a+b; },0)/N,
             pBeat:beat/N, p40:t40/N, kinds:kinds, other:dist.other, compat:cp, ticket:g.bt, capped:dist.capped,
             ito:item==="ito"?itoIndex(A,B2):-1 };
  }
  /* ---------- 配合する ---------- */
  function breed(c,idA,idB,o){
    o=o||{}; var item=o.item||"", ck=check(c,idA,idB,item); if(ck.err)return ck;
    var g=ck.g, A=ck.A, B2=ck.B, n=(item==="futago")?2:1;
    if(g.bt<1)return {err:"配合券が無い(きょうの復習をやりきると 1枚もらえる)"};
    g.bt--; if(item){ g.items[item]--; if(g.items[item]<=0)delete g.items[item]; }
    var cp=compat(g,A,B2), dist=kindDist(A,B2,item), best=null, found=false, was=M().pot(g,B2).v;
    if(cp.hid&&!g.hnf[cp.key]){ g.hnf[cp.key]=1; found=true; }
    /* ふたごの実: 2体ためして、才能の合計が高いほうが生まれる */
    for(var i=0;i<n;i++){ var q=make(c.rand,g,A,B2,item,dist,cp); if(!best||M().talent(q)>M().talent(best))best=q; }
    var p=best; p.i="a"+(g.nid++); p=M().normMon(p);
    /* おや2は子に生まれかわる(いなくなる) */
    g.mons=g.mons.filter(function(x){ return x.i!==B2.i; }); g.sub=g.sub.filter(function(x){ return x!==B2.i; });
    var isNew=!g.dex[p.k]; g.mons.push(p); M().mark(g,p); if(p.sh)g.shiny++;
    g.brd++;
    return { kids:[{mon:p,isNew:isNew,only:!!M().kindOf(p).only}], found:found, compat:cp, A:A, B:B2, wasB:was, item:item };
  }

  /* ---------- ごほうび(順番で決まる。乱数なし) ---------- */
  function tierList(t){ return D().ITEMS.filter(function(x){ return x.tier===t; }); }
  function addItem(g,id,n){ g.items[id]=Math.min(D().ITEM_CAP,(g.items[id]||0)+(n||1)); }
  /* spec: {t0:n, t1:n, bt:n}。out(配列)へ {item|bt, n, why} を足す */
  function give(c,spec,out,why){
    var g=M().W(c); out=out||[]; if(!spec)return out;
    [0,1].forEach(function(t){ var L=tierList(t); for(var i=0;i<(spec["t"+t]||0);i++){ var it=L[g.gn[t]%L.length]; g.gn[t]++; addItem(g,it.id,1); out.push({item:it.id,n:1,why:why||""}); } });
    if(spec.bt){ g.bt=Math.min(9999,g.bt+spec.bt); out.push({bt:1,n:spec.bt,why:why||""}); }
    return out;
  }
  /* つぎにもらえる どうぐ(画面で先に見せる) */
  function nextGift(c,t){ var g=M().W(c), L=tierList(t); return L[g.gn[t]%L.length]; }

  /* ---------- なかまに使う どうぐ ---------- */
  function useItem(c,item,monId){
    var g=M().W(c), it=D().itemById[item]; if(!it)return {err:"そのどうぐは無い"};
    if(!(g.items[item]>0))return {err:it.name+" を持っていない"};
    var p=M().byId(g,monId), r=c.rand, res={item:item}, i;
    if(it.use==="b")return {err:"配合のときに使う どうぐ"};
    if(it.use==="m"&&!p)return {err:"だれに使うか えらんでね"};
    if(item==="mi"){ var lo=0; for(i=1;i<5;i++)if(p.tl[i]<p.tl[lo])lo=i; res.k=M().KEYS[lo]; res.from=p.tl[lo]; p.tl[lo]=M().rollTalent(r); res.to=p.tl[lo]; M().mark(g,p); }
    else if(item==="ishi"){ if(p.tr.length>=2)return {err:"特性は2つまで"}; var t, guard=0; do{ t=MM.garden.rollTrait(r,Math.min(4,M().rarOf(p))); }while(p.tr.indexOf(t)>=0&&guard++<50); if(p.tr.indexOf(t)>=0)return {err:"うまくいかなかった"}; p.tr.push(t); res.trait=t; }
    else if(item==="happa"){ var N=D().natures.filter(function(n){ return n.id!==p.na; }); res.from=p.na; p.na=N[Math.floor(r()*N.length)].id; res.to=p.na; }
    else if(item==="wasure"){ var hi=0; for(i=1;i<5;i++)if(p.ef[i]>p.ef[hi])hi=i; if(!(p.ef[hi]>0))return {err:"けいこ値が まだ無い"}; res.k=M().KEYS[hi]; res.from=p.ef[hi]; p.ef[hi]=0; }
    else if(item==="cho"){ g.boost.ef=Math.min(999,g.boost.ef+D().KEIKO.size); res.boost=g.boost.ef; }
    else if(item==="mochi"){ g.boost.xp=Math.min(999,g.boost.xp+D().KEIKO.size); res.boost=g.boost.xp; }
    else return {err:"使えない"};
    g.items[item]--; if(g.items[item]<=0)delete g.items[item];
    return res;
  }
  function itemCount(g){ var n=0; for(var k in g.items)n+=g.items[k]; return n; }

  MM.breed={ pairKey:pairKey, compat:compat, kindDist:kindDist, itoIndex:itoIndex, make:make, preview:preview, breed:breed,
    give:give, nextGift:nextGift, addItem:addItem, useItem:useItem, itemCount:itemCount, tierList:tierList, lcg:lcg };
})();
