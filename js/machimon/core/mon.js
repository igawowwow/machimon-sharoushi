"use strict";
/* ============================================================
   machimon/core/mon.js — 個体(種類×才能×性格×特性)と「つよさ」。新しい遊び(GD.V2)の土台。
   ★つよさの式(運なし・1つの数字):
       能力k = 種類の基礎値k × (1+0.04×(Lv−1)) × (0.60+0.08×才能k) × 性格の補正k ＋ けいこ値k   (×特性の補正)
       つよさ = 5つの能力の合計
     才能の幅は 0.60〜1.40 倍。設計書の 0.70〜1.30 では「才能のいいNがふつうのSRを超える」が
     成り立たない(満点のNでも195 < SRの真ん中200)ので広げた。満点のN=210 > SRの真ん中200。
   ★セーブは c.mm.g2 の1キー(旧版の c.mm.gd とは別。GD.V2 が偽のあいだは作られない)。
   ★旧セーブからの引っ越しは最初の1回だけ。学習の記録(ST.q / ST.rq)には一切さわらない。
     失敗したら旧セーブ(c.mm.gd)をそのまま残し、新しい遊びは最初の1体から始める(mf=1 を立てる)。
   ★MM.power は旧版(GD.V2 が偽)の画面用の「つよさ」。旧版を消すとき(スライス8)に一緒に消す。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{};
  function D(){ return MM.DATA; }
  function GD(){ return MM.DATA.garden; }
  var KEYS=["h","m","o","j","s"];                 /* 才能 tl / けいこ値 ef の並び(保存の並び。変えない) */
  var BACKUP_KEY="machimon-v1-backup", SAVE_KEY="machimon-v1";
  function obj(v){ return (v&&typeof v==="object"&&!Array.isArray(v))?v:null; }
  function num(v,d,lo,hi){ v=Number(v); if(!isFinite(v))v=d; return Math.max(lo,Math.min(hi,v)); }
  function int(v,d,lo,hi){ return Math.round(num(v,d,lo,hi)); }
  function r2(v){ return Math.round(v*100)/100; }

  /* ================= 旧版(V1)の画面に出す つよさ ================= */
  function v1TraitMul(p,k){ var m=1; if(p.tr==="star")m*=1.06; if(p.tr==="cosmos")m*=1.10; if(k==="o"&&p.tr==="giant")m*=1.15; return m; }
  function v1Of(g,p){
    if(!p||p.dead)return 0;
    var s=0, adult=(p.bw!=null);
    for(var i=0;i<KEYS.length;i++){ var k=KEYS[i]; s+=adult?MM.garden.cur(g,p,k):Math.round((p[k]||0)*v1TraitMul(p,k)); }
    return Math.round(s);
  }
  function v1Best(g){ var b=null,bv=-1; for(var i=0;i<g.plots.length;i++){ var p=g.plots[i]; if(!p||p.dead)continue; var v=v1Of(g,p); if(v>bv){ bv=v; b=p; } } return b?{p:b,v:bv}:null; }
  function v1Diff(g,p){ var b=v1Best(g), v=v1Of(g,p); if(!b)return {v:v,d:0,top:false,none:true}; return {v:v,d:v-b.v,top:b.p===p,none:false}; }
  function v1Sum(p){ var s=0; for(var i=0;i<KEYS.length;i++)s+=p[KEYS[i]]||0; return s; }
  function v1Rar(p){ var R=GD().RARITY, s=v1Sum(p), out=0; for(var i=0;i<R.length;i++)if(s>=R[i].min)out=i; return out; }
  function v1Pct(p){ var R=GD().RARITY, s=v1Sum(p), r=v1Rar(p), lo=r===0?150:R[r].min, hi=R[r+1]?R[r+1].min:500; return Math.max(0,Math.min(1,(s-lo)/Math.max(1,hi-lo))); }
  MM.power={ of:v1Of, best:v1Best, diff:v1Diff, pct:v1Pct };

  /* ================= セーブ ================= */
  function defaults(){
    return { v:2, on:0, nid:1, mons:[], kan:"", sub:[], shard:0, pity:0, pulls:0, free:"", dex:{}, hall:[],
             bt:0, items:{}, hn:[], hnf:{}, bz:null, mig:0, mf:0, shiny:0, rel:0 };
  }
  function normMon(p){
    p=obj(p); if(!p||!D().kindById[p.k])return null;
    var o={ i:String(p.i||"").slice(0,12), k:p.k, n:String(p.n||D().kindById[p.k].name).replace(/[<>"]/g,"").slice(0,20),
            lv:int(p.lv,1,1,D().LV_MAX), xp:int(p.xp,0,0,1e7), tl:[], na:D().natureById[p.na]?p.na:"n0", tr:[], ef:[], a:[], w:int(p.w,0,0,1e7) };
    var tl=Array.isArray(p.tl)?p.tl:[], ef=Array.isArray(p.ef)?p.ef:[];
    for(var i=0;i<5;i++){ o.tl.push(int(tl[i],0,0,D().TALENT_MAX)); o.ef.push(r2(num(ef[i],0,0,D().EF_MAX))); }
    (Array.isArray(p.tr)?p.tr:[]).slice(0,2).forEach(function(t){ if(GD().traitById[t]&&o.tr.indexOf(t)<0)o.tr.push(t); });
    if(Array.isArray(p.a))o.a=p.a.slice(0,2).map(function(x){ return String(x||"").slice(0,12); });
    if(p.sh)o.sh=1; if(p.first)o.first=1;
    return o.i?o:null;
  }
  function normalize(raw){
    var s=obj(raw)||{}, o=defaults();
    o.on=s.on?1:0; o.nid=int(s.nid,1,1,1e9);
    var ids={};
    (Array.isArray(s.mons)?s.mons:[]).slice(0,400).forEach(function(p){ var m=normMon(p); if(m&&!ids[m.i]){ ids[m.i]=1; o.mons.push(m); } });
    o.kan=(typeof s.kan==="string"&&ids[s.kan])?s.kan:"";
    o.sub=(Array.isArray(s.sub)?s.sub:[]).filter(function(x){ return typeof x==="string"&&ids[x]&&x!==o.kan; }).slice(0,2);
    o.shard=int(s.shard,0,0,1e9); o.pity=int(s.pity,0,0,9999); o.pulls=int(s.pulls,0,0,1e9);
    o.free=typeof s.free==="string"?s.free.slice(0,12):"";
    var dx=obj(s.dex)||{}; for(var k in dx){ if(D().kindById[k])o.dex[k]=int(dx[k],0,0,7); }
    o.hall=(Array.isArray(s.hall)?s.hall:[]).slice(0,20).map(function(x){ return String(x||"").replace(/[<>"]/g,"").slice(0,20); });
    o.bt=int(s.bt,0,0,9999); o.items=obj(s.items)||{};
    o.hn=(Array.isArray(s.hn)?s.hn:[]).map(String).slice(0,60); o.hnf=obj(s.hnf)||{};
    o.bz=(MM.banzuke&&MM.banzuke.norm)?MM.banzuke.norm(s.bz):(obj(s.bz)||null);
    o.mig=s.mig?1:0; o.mf=s.mf?1:0; o.shiny=int(s.shiny,0,0,1e9); o.rel=int(s.rel,0,0,1e9);
    return o;
  }
  var seen=(typeof WeakSet==="function")?new WeakSet():null;
  function W(c){
    var mm=c.mm;
    if(!mm.g2||!(seen&&seen.has(mm.g2))){
      mm.g2=(obj(mm.g2)&&mm.g2.on)?normalize(mm.g2):boot(c);
      if(!mm.g2.mons.length)mm.g2.mons.push(roll(c,mm.g2,{rar:0}));        /* だれも居ない状態を作らない */
      if(seen)seen.add(mm.g2);
    }
    kanban(mm.g2);
    return mm.g2;
  }
  /* 最初の起動: 旧セーブがあれば引っ越し、無ければ最初の1体から */
  function boot(c){
    var mm=c.mm, old=obj(mm.gd);
    if(old&&old.on){
      try{
        var r=migrateV1toV2(old,mm);
        var backed=backupOnce();
        mm.res.g=r.coins; mm.tix=0;
        if(backed)mm.gd=null;                 /* 写しが取れたときだけ旧データを手放す(取れなければセーブに残す) */
        return r.g2;
      }catch(e){ try{ if(G.console)console.warn("migrate failed",e); }catch(e2){} var f=fresh(c); f.mf=1; return f; }
    }
    return fresh(c);
  }
  function fresh(c){ var g=defaults(); g.on=1; var p=roll(c,g,{rar:0}); g.mons.push(p); g.kan=p.i; mark(g,p); return g; }
  /* 旧セーブ全体を別のキーへ1回だけ写す(戻せるように)。写しがある状態なら true */
  function backupOnce(){
    try{ var ls=G.localStorage; if(!ls)return false;
      if(ls.getItem(BACKUP_KEY))return true;
      var raw=ls.getItem(SAVE_KEY); if(!raw)return false;
      ls.setItem(BACKUP_KEY,raw); return ls.getItem(BACKUP_KEY)===raw;
    }catch(e){ return false; }
  }

  /* ---------- 引っ越し(純関数: 引数を書きかえない。同じ入力なら必ず同じ結果) ---------- */
  function idNum(id){ var n=parseInt(String(id).replace(/\D/g,""),10); return isFinite(n)?n:0; }
  function migrateV1toV2(old,mm){
    var gd=MM.garden.normalize(old), g=defaults(); g.on=1; g.mig=1;
    var list=[]; gd.plots.forEach(function(p){ if(p&&!p.dead)list.push(p); }); gd.seeds.forEach(function(p){ list.push(p); });
    list.forEach(function(p){
      var r5=v1Rar(p), rar=Math.min(4,r5), n=idNum(p.i);
      var pool=D().kindsByRar[rar].filter(function(k){ return k.f===p.f; }); if(!pool.length)pool=D().kindsByRar[rar];
      var kd=pool[n%pool.length];
      var m={ i:"a"+(g.nid++), k:kd.id, n:p.n||kd.name, lv:(p.bw!=null)?D().LV_ADULT:1, xp:0,
              tl:KEYS.map(function(k){ return Math.max(0,Math.min(10,Math.round((p[k]||0)/10))); }),
              na:D().natures[n%D().natures.length].id, tr:p.tr?[p.tr]:[], ef:[0,0,0,0,0], a:[], w:(p.r&&p.r.w)||0 };
      if(p.sh)m.sh=1; if(r5>=5)m.first=1;
      m=normMon(m); if(m){ g.mons.push(m); mark(g,m); }
    });
    gd.mb.forEach(function(m){ if(m.own&&g.hall.length<10)g.hall.push(m.n); });
    var coin=int(mm.res&&mm.res.g,0,0,1e12), over=Math.max(0,coin-5000);
    g.shard=Math.min(300,Math.floor(over/1000))+3*(int(mm.tix,0,0,9999)+int(gd.medal,0,0,1e6));
    g.pulls=gd.pulls; g.shiny=gd.shiny; g.hn=gd.hn.slice(); g.hnf=JSON.parse(JSON.stringify(gd.hnf||{}));
    if(!g.mons.length){ var kd0=D().kindsByRar[0][0]; var st=normMon({i:"a"+(g.nid++),k:kd0.id,lv:1,tl:[5,5,5,5,5],na:"n0"}); g.mons.push(st); mark(g,st); }
    var s=sorted(g); g.kan=s[0].i; g.sub=s.slice(1,3).map(function(x){ return x.i; });
    return { g2:g, coins:Math.min(coin,5000), shards:g.shard };
  }

  /* ================= 個体 ================= */
  function kindOf(p){ return D().kindById[p.k]||D().kinds[0]; }
  function rarOf(p){ return kindOf(p).rar; }
  function rarInfo(p){ return GD().RARITY[rarOf(p)]; }
  function natOf(p){ return D().natureById[p.na]||D().natures[0]; }
  function natMul(p,k){ var n=natOf(p); return n.up===k?1.1:(n.dn===k?0.9:1); }
  /* 特性の補正(つよさに効くもの)。スライス7で36種に広げるときはここに足す */
  var TL_A=0.60, TL_B=0.08;
  var TRAIT_FX={ star:{all:1.06}, cosmos:{all:1.10}, giant:{o:1.15} };
  function trMul(p,k){ var m=1; for(var i=0;i<p.tr.length;i++){ var fx=TRAIT_FX[p.tr[i]]; if(!fx)continue; if(fx.all)m*=fx.all; if(fx[k])m*=fx[k]; } return m; }
  function stat(p,k){
    var kd=kindOf(p), i=KEYS.indexOf(k);
    return Math.round((kd.base[k]*(1+0.04*(p.lv-1))*(TL_A+TL_B*p.tl[i])*natMul(p,k)+(p.ef[i]||0))*trMul(p,k));
  }
  function stats(p){ var o={}; KEYS.forEach(function(k){ o[k]=stat(p,k); }); return o; }
  function power(p){ var s=0; for(var i=0;i<KEYS.length;i++)s+=stat(p,KEYS[i]); return s; }
  function talent(p){ var s=0; for(var i=0;i<5;i++)s+=p.tl[i]; return s; }
  /* 才能の合計が「その種類のなかで上位何%か」。0〜10の5つの和の分布から正確に出す */
  var CDF=null;
  function cdf(){
    if(CDF)return CDF; var d=[1], i, j, k;
    for(i=0;i<5;i++){ var n=[]; for(j=0;j<d.length;j++)for(k=0;k<=10;k++)n[j+k]=(n[j+k]||0)+d[j]; d=n; }
    var tot=Math.pow(11,5), acc=0; CDF=[];
    for(i=d.length-1;i>=0;i--){ acc+=d[i]; CDF[i]=acc/tot; }   /* CDF[s] = 合計が s 以上になる確率 */
    return CDF;
  }
  function rank(p){ var s=talent(p), t=cdf()[s]; return { sum:s, max:50, top:Math.max(1,Math.round(t*100)) }; }
  /* 「看板と同じLv・同じけいこ値まで育てたら」のつよさ。Lv1の新入りとLv30の看板を、同じ土俵で比べるため */
  function atLv(p,lv,ef){ var q={k:p.k,lv:lv,tl:p.tl,na:p.na,tr:p.tr,ef:ef||p.ef}; return power(q); }
  function pot(g,p){ var k=kanban(g); if(!k)return {v:power(p),d:0,top:false,none:true}; if(k===p)return {v:power(p),d:0,top:true,none:false};
    var v=atLv(p,Math.max(p.lv,k.lv),p.lv>=k.lv?p.ef:k.ef), kv=p.lv>k.lv?atLv(k,p.lv,k.ef):power(k); return {v:v,d:v-kv,top:false,none:false}; }
  function need(lv){ return 40+64*lv; }                         /* 次のLvまでの経験 */
  function adult(p){ return p.lv>=D().LV_ADULT; }
  function spId(p){ return adult(p)?p.k:p.k+"c"; }              /* 絵のid(こども=小物なし) */

  /* 1体を作る。o: {rar|kind, fam, parents:[A,B]} */
  function roll(c,g,o){
    o=o||{}; var r=c.rand, kd;
    if(o.kind&&D().kindById[o.kind])kd=D().kindById[o.kind];
    else { var pool=D().kindsByRar[Math.max(0,Math.min(4,o.rar||0))]; if(o.fam!=null){ var pf=pool.filter(function(k){ return k.f===o.fam; }); if(pf.length)pool=pf; } kd=pool[Math.floor(r()*pool.length)]; }
    var p={ i:"a"+(g.nid++), k:kd.id, n:kd.name, lv:1, xp:0, tl:[], na:D().natures[Math.floor(r()*D().natures.length)].id, tr:[], ef:[0,0,0,0,0], a:[], w:0 };
    for(var i=0;i<5;i++)p.tl.push(Math.floor(r()*(D().TALENT_MAX+1)));
    if(r()<GD().TRAIT_RATE[Math.min(4,kd.rar)])p.tr.push(MM.garden.rollTrait(r,kd.rar));
    if(r()<(o.parents?D().RATE2.shinyBred:D().RATE2.shiny))p.sh=1;
    if(o.parents)p.a=[o.parents[0].i,o.parents[1].i];
    return p;
  }
  function byId(g,id){ for(var i=0;i<g.mons.length;i++)if(g.mons[i].i===id)return g.mons[i]; return null; }
  function sorted(g){ return g.mons.slice().sort(function(a,b){ return power(b)-power(a)||(a.i<b.i?-1:1); }); }
  /* 看板(いちばん前に立つ1体)。決まっていなければ最強を立てる */
  function kanban(g){ var p=byId(g,g.kan); if(!p&&g.mons.length){ p=sorted(g)[0]; g.kan=p.i; } return p; }
  function diff(g,p){ var k=kanban(g), v=power(p); if(!k)return {v:v,d:0,top:false,none:true}; return {v:v,d:v-power(k),top:k===p,none:false}; }
  function setKan(c,id){ var g=W(c), p=byId(g,id); if(!p)return false; g.kan=id; g.sub=g.sub.filter(function(x){ return x!==id; }); return true; }
  function toggleSub(c,id){ var g=W(c), p=byId(g,id); if(!p||g.kan===id)return {err:"看板はひかえにできない"};
    var i=g.sub.indexOf(id); if(i>=0){ g.sub.splice(i,1); return {on:0}; }
    if(g.sub.length>=2)return {err:"ひかえは2体まで"}; g.sub.push(id); return {on:1}; }
  /* 図鑑のはんこ: 1=見つけた 2=おとなにした 4=才能40以上 */
  function mark(g,p){ var b=g.dex[p.k]||0; b|=1; if(adult(p))b|=2; if(talent(p)>=40)b|=4; g.dex[p.k]=b; }

  /* ---------- タマゴ ---------- */
  function rollRar(c){ var R=D().RATE2.rate, x=c.rand(), acc=0; for(var i=0;i<R.length;i++){ acc+=R[i]; if(x<acc)return i; } return 0; }
  function freeReady(c){ return W(c).free!==c.dstr; }
  function pityLeft(g){ return Math.max(1,D().RATE2.pity-g.pity); }
  function canPull(c){ var g=W(c); return g.mons.length<D().RATE2.cap&&(freeReady(c)||(c.mm.res.g||0)>=D().RATE2.cost); }
  function pull(c,free){
    var g=W(c), R=D().RATE2;
    if(g.mons.length>=R.cap)return {err:"なかまがいっぱい("+R.cap+"体)。だれかを手放してね"};
    if(free){ if(!freeReady(c))return {err:"無料のタマゴは1日1回"}; g.free=c.dstr; }
    else if(!MM.economy.spend(c,"g",R.cost))return {err:"コインが足りない(🪙"+R.cost+")。けいこで集めよう"};
    g.pity++;
    var rar=rollRar(c), pity=false;
    if(g.pity>=R.pity&&rar<R.pityRar){ rar=R.pityRar; pity=true; }
    if(rar>=R.pityRar)g.pity=0;
    var isNew=false, p=roll(c,g,{rar:rar});
    isNew=!g.dex[p.k]; g.mons.push(p); g.pulls++; if(p.sh)g.shiny++; mark(g,p);
    return { mon:p, isNew:isNew, pity:pity };
  }
  /* 手放す → かけら(看板は手放せない) */
  function release(c,id){
    var g=W(c), p=byId(g,id); if(!p)return {err:"いない"};
    if(g.kan===id)return {err:"看板は手放せない(先にほかの子を看板にしてね)"};
    if(g.mons.length<=1)return {err:"最後の1体は手放せない"};
    var n=D().SHARD[rarOf(p)]||1; g.shard+=n; g.rel++;
    g.mons=g.mons.filter(function(x){ return x.i!==id; }); g.sub=g.sub.filter(function(x){ return x!==id; });
    return {shard:n};
  }

  /* ---------- 育つ(1回答ごと。core/economy.js の grant から呼ばれる) ----------
     ★コインも経験も「正解」からしか出ない。2秒未満のまぐれ当たりは何も出さない。
     ★けいこ値の入り方はスライス5(けいこ3択)で作り直す前提の仮の形。 */
  function lvCap(c,p,mast){
    var m=(mast||MM.learn.masteryBySub(c))[GD().families[kindOf(p).f].sub]||0;
    return m>=0.7?50:(m>=0.4?40:30);
  }
  function addXp(p,xp,cap){
    var ups=0; if(p.lv>=cap){ p.xp=Math.min(p.xp+xp,need(p.lv)-1); return 0; }
    p.xp+=xp;
    while(p.lv<cap&&p.xp>=need(p.lv)){ p.xp-=need(p.lv); p.lv++; ups++; }
    if(p.lv>=cap)p.xp=Math.min(p.xp,need(p.lv)-1);
    return ups;
  }
  function addEf(p,k,v){
    var i=KEYS.indexOf(k), tot=0; for(var j=0;j<5;j++)tot+=p.ef[j];
    var add=Math.max(0,Math.min(v,D().EF_MAX-p.ef[i],D().EF_TOTAL-tot)); if(add<=0)return 0;
    p.ef[i]=r2(p.ef[i]+add); return add;
  }
  function onAnswer(rw,gain,c){
    var g=W(c), out={coin:0,xp:0,ups:[],ef:{},kan:null};
    gain.g=0; gain.xp=0; gain.ke=0; gain.mat=0; gain.tama=0; gain.mon=out;
    if(!rw.ok||rw.fluke)return out;
    var hard=(rw.timing>=2||rw.ng), due=(rw.timing>=1.6);
    var base=hard?30:(due?20:10);
    var f=(rw.novelty==null?1:rw.novelty)*(rw.timing<=0.3?0.3:1);     /* 同じ日のくり返し・覚えた問題の連打はほぼ無価値 */
    out.coin=Math.round(base*f); out.xp=out.coin; gain.g=out.coin;
    var k=kanban(g), mast=MM.learn.masteryBySub(c); out.kan=k;
    if(k&&out.xp>0){
      var was=adult(k), u=addXp(k,out.xp,lvCap(c,k,mast)); if(u){ out.ups.push({p:k,n:u,grown:!was&&adult(k)}); mark(g,k); }
      g.sub.forEach(function(id){ var s=byId(g,id); if(!s)return; var w2=adult(s), u2=addXp(s,Math.round(out.xp/2),lvCap(c,s,mast)); if(u2){ out.ups.push({p:s,n:u2,grown:!w2&&adult(s)}); mark(g,s); } });
      if(f>=1){
        var e=function(key,v){ var a=addEf(k,key,v); if(a)out.ef[key]=r2((out.ef[key]||0)+a); };
        if(hard)e("s",0.1); else if(due)e("j",0.1); else if(rw.seen===false)e("o",0.1);
        if((c.mm.combo||0)>0&&c.mm.combo%5===0)e("h",0.2);
        try{ var q=(typeof G.qById==="function"&&c.lastQid!=null)?G.qById(c.lastQid):null; if(q&&MM.garden.isExam(q))e("m",0.15); }catch(e2){}
      }
    }
    return out;
  }

  MM.mon={ KEYS:KEYS, BACKUP_KEY:BACKUP_KEY, defaults:defaults, normalize:normalize, normMon:normMon, W:W, fresh:fresh, migrateV1toV2:migrateV1toV2, backupOnce:backupOnce,
    kindOf:kindOf, rarOf:rarOf, rarInfo:rarInfo, natOf:natOf, stat:stat, stats:stats, power:power, talent:talent, rank:rank, need:need, adult:adult, spId:spId,
    atLv:atLv, pot:pot, roll:roll, byId:byId, sorted:sorted, kanban:kanban, diff:diff, setKan:setKan, toggleSub:toggleSub, mark:mark,
    rollRar:rollRar, freeReady:freeReady, pityLeft:pityLeft, canPull:canPull, pull:pull, release:release,
    lvCap:lvCap, addXp:addXp, addEf:addEf, onAnswer:onAnswer, TRAIT_FX:TRAIT_FX };
})();
