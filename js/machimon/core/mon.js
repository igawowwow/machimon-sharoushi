"use strict";
/* ============================================================
   machimon/core/mon.js — 個体(種類×才能×性格×特性)と「つよさ」。遊びの土台。
   ★つよさの式(運なし・1つの数字):
       能力k = (種類の基礎値k × (1+0.04×(Lv−1)) × (0.60+0.08×才能k) × 性格の補正k ＋ けいこ値k) × 特性の補正
       つよさ = 5つの能力の合計
     才能の幅は 0.60〜1.40 倍。設計書の 0.70〜1.30 では「才能のいいNがふつうのSRを超える」が
     成り立たない(満点のNでも195 < SRの真ん中200)ので広げた。満点のN=210 > SRの真ん中200。
   ★セーブは c.mm.g2 の1キー(1.x の c.mm.gd とは別)。
   ★1.x のセーブからの引っ越しは最初の1回だけ。学習の記録(ST.q / ST.rq)には一切さわらない。
     失敗したら 1.x のセーブ(c.mm.gd)をそのまま残し、最初の1体から始める(mf=1 を立てる)。
     1.x のセーブ全体は、起動のときに boot.js が別のキー(machimon-v1-backup)へ写してある。
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

  /* ================= セーブ ================= */
  function defaults(){
    return { v:2, on:0, nid:1, mons:[], kan:"", sub:[], shard:0, pity:0, pulls:0, free:"", dex:{}, hall:[],
             bt:0, btd:"", items:{}, hn:[], hnf:{}, bz:null, mig:0, mf:0, shiny:0, rel:0,
             st:0, brd:0, gn:[0,0], rv:null, cd:null, ms:null, boost:{xp:0,ef:0}, sdex:{}, sread:0, buy:0, mn:0 };
  }
  function normMon(p){
    p=obj(p); if(!p||!D().kindById[p.k])return null;
    var o={ i:String(p.i||"").slice(0,12), k:p.k, n:String(p.n||D().kindById[p.k].name).replace(/[<>"]/g,"").slice(0,20),
            lv:int(p.lv,1,1,D().LV_MAX), xp:int(p.xp,0,0,1e7), tl:[], na:D().natureById[p.na]?p.na:"n0", tr:[], ef:[], a:[], w:int(p.w,0,0,1e7), kc:int(p.kc,0,0,D().ADULT_NEED) };
    var tl=Array.isArray(p.tl)?p.tl:[], ef=Array.isArray(p.ef)?p.ef:[];
    for(var i=0;i<5;i++){ o.tl.push(int(tl[i],0,0,D().TALENT_MAX)); o.ef.push(r2(num(ef[i],0,0,D().EF_MAX))); }
    (Array.isArray(p.tr)?p.tr:[]).slice(0,2).forEach(function(t){ if(D().traitById[t]&&o.tr.indexOf(t)<0)o.tr.push(t); });
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
    o.bt=int(s.bt,0,0,9999); o.btd=typeof s.btd==="string"?s.btd.slice(0,12):"";
    var it=obj(s.items)||{}; for(var ik in it){ if(D().itemById[ik]){ var iv=int(it[ik],0,0,D().ITEM_CAP); if(iv>0)o.items[ik]=iv; } }
    /* かくれ相性は「族|族」の組。旧版の形(子系統の組)は捨てて作り直す */
    o.hn=(Array.isArray(s.hn)?s.hn:[]).map(String).filter(function(x){ return /^[0-8]\|[0-8]$/.test(x); }).slice(0,20);
    var hf=obj(s.hnf)||{}; o.hn.forEach(function(x){ if(hf[x])o.hnf[x]=1; });
    o.st=s.st?1:0; o.brd=int(s.brd,0,0,1e9);
    var gn=Array.isArray(s.gn)?s.gn:[]; o.gn=[int(gn[0],0,0,1e9),int(gn[1],0,0,1e9)];
    var rv=obj(s.rv); o.rv=rv?{d:String(rv.d||"").slice(0,12),need:int(rv.need,0,0,999),done:int(rv.done,0,0,9999)}:null;
    var cd=obj(s.cd); o.cd=cd?{d:String(cd.d||"").slice(0,12),n:int(cd.n,0,0,9999)}:null;
    var ms=obj(s.ms); if(ms){ o.ms={}; for(var mk in ms){ if(/^m[0-8]_[1-3]$/.test(mk)&&ms[mk])o.ms[mk]=1; } }
    var bs=obj(s.boost)||{}; o.boost={xp:int(bs.xp,0,0,999),ef:int(bs.ef,0,0,999)};
    o.bz=(MM.banzuke&&MM.banzuke.norm)?MM.banzuke.norm(s.bz):(obj(s.bz)||null);
    o.mig=s.mig?1:0; o.mf=s.mf?1:0; o.shiny=int(s.shiny,0,0,1e9); o.rel=int(s.rel,0,0,1e9);
    var sd=obj(s.sdex)||{}; for(var sk in sd){ if(D().kindById[sk]&&sd[sk])o.sdex[sk]=1; }
    o.sread=int(s.sread,0,0,8); o.buy=int(s.buy,0,0,1e9); o.mn=s.mn?1:0;
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
    if(mm.g2.hn.length<D().BREED.hidden)rollHidden(c,mm.g2);
    if(!mm.g2.ms)initMs(c,mm.g2);
    kanban(mm.g2);
    return mm.g2;
  }
  /* かくれ相性: 表の相性(GD.NICKS)に無い族の組から、セーブごとに決める。配合してはじめて分かる */
  function rollHidden(c,g){
    var pool=[], a, b, N=GD().NICKS, pub={};
    N.forEach(function(x){ pub[Math.min(x[0],x[1])+"|"+Math.max(x[0],x[1])]=1; });
    for(a=0;a<9;a++)for(b=a+1;b<9;b++){ var k=a+"|"+b; if(!pub[k]&&g.hn.indexOf(k)<0)pool.push(k); }
    while(g.hn.length<D().BREED.hidden&&pool.length)g.hn.push(pool.splice(Math.floor(c.rand()*pool.length),1)[0]);
  }
  /* 習熟の節目のごほうびは「これから こえた段」だけ。はじめて開いた時点でこえている段は、もらった扱いにする */
  function initMs(c,g){
    g.ms={}; try{ var st=MM.keiko.stepsOf(MM.learn.masteryBySub(c)); for(var s=0;s<9;s++)for(var t=1;t<=st[s];t++)g.ms["m"+s+"_"+t]=1; }catch(e){}
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
  /* 最初の1体をえらぶ(オープニング)。3つのタマゴのどれか。まだ選んでいない まっさらなセーブでだけ効く */
  function starter(c,idx){
    var g=W(c); if(g.st||g.mig)return kanban(g);
    var kid=D().STARTERS[Math.max(0,Math.min(D().STARTERS.length-1,idx|0))], p=roll(c,g,{kind:kid});
    for(var i=0;i<5;i++)p.tl[i]=3+Math.floor(c.rand()*4);      /* 才能 3〜6(合計15〜30=ふつう) */
    p.tr=[]; delete p.sh;
    g.mons=[p]; g.kan=p.i; g.sub=[]; g.dex={}; g.st=1; mark(g,p);
    return p;
  }
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
    var gd=MM.legacy.read(old), g=defaults(); g.on=1; g.mig=1;
    gd.mons.slice(0,D().RATE2.cap).forEach(function(p){
      var r5=MM.legacy.rar(p), rar=Math.min(4,r5), n=idNum(p.i);
      var pool=D().kindsByRar[rar].filter(function(k){ return k.f===p.f; }); if(!pool.length)pool=D().kindsByRar[rar];
      var kd=pool[n%pool.length];
      var m={ i:"a"+(g.nid++), k:kd.id, n:p.n||kd.name, lv:p.adult?D().LV_ADULT:1, xp:0,
              tl:KEYS.map(function(k){ return Math.max(0,Math.min(10,Math.round((p[k]||0)/10))); }),
              na:D().natures[n%D().natures.length].id, tr:p.tr?[p.tr]:[], ef:[0,0,0,0,0], a:[], w:p.w||0 };
      if(p.sh)m.sh=1; if(r5>=5)m.first=1;
      m=normMon(m); if(m){ g.mons.push(m); mark(g,m); if(adult(m))markAdult(g,m); }   /* 旧版で おとな まで育てた子は「おとなにした」のはんこ つき */
    });
    gd.hall.forEach(function(n){ if(g.hall.length<10)g.hall.push(n); });
    var coin=int(mm.res&&mm.res.g,0,0,1e12), over=Math.max(0,coin-5000);
    g.shard=Math.min(300,Math.floor(over/1000))+3*(int(mm.tix,0,0,9999)+int(gd.medal,0,0,1e6));
    g.pulls=gd.pulls; g.shiny=gd.shiny; g.st=1;
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
  /* ---------- 特性の効果 ----------
     特性(と、2つそろった組み合わせ)の fx を1つにまとめる。まとめ方は効果ごとに決まっている:
       かけ算=倍率 / max=「◯%になる」 / min=「◯問ごと」 / 足し算=確率の上のせ / 旗=あるか無いか */
  var TL_A=0.60, TL_B=0.08;
  var FX_MAX={miss:1,fast:1,bNat:1,bTr:1}, FX_MIN={combo:1}, FX_ADD={bHi:1,bUp:1}, FX_FLAG={slow:1,bRe:1};
  function fxAdd(o,fx){ for(var k in fx){ var v=fx[k];
    if(FX_FLAG[k])o[k]=1; else if(FX_MAX[k])o[k]=Math.max(o[k]||0,v); else if(FX_MIN[k])o[k]=o[k]?Math.min(o[k],v):v;
    else if(FX_ADD[k])o[k]=(o[k]||0)+v; else o[k]=(o[k]||1)*v; } }
  /* そろっている組み合わせ(特性idの配列から) */
  function combosOf(tr){ var out=[], C=D().COMBOS; for(var i=0;i<C.length;i++)if(tr.indexOf(C[i].a)>=0&&tr.indexOf(C[i].b)>=0)out.push(C[i]); return out; }
  var FXC=Object.create(null);
  function fxOf(tr){
    tr=tr||[]; if(!tr.length)return FX0; var key=tr.join("+"), o=FXC[key]; if(o)return o;
    o={}; for(var i=0;i<tr.length;i++){ var t=D().traitById[tr[i]]; if(t)fxAdd(o,t.fx); }
    combosOf(tr).forEach(function(cb){ fxAdd(o,cb.fx); });
    return (FXC[key]=o);
  }
  var FX0={};
  /* 効いている特性・組み合わせの名前(fx のどれかのキーを持つもの)。画面で「なぜ この数字か」を見せる */
  function fxNames(tr,keys){
    var out=[]; function hit(fx){ for(var i=0;i<keys.length;i++)if(fx[keys[i]]!=null)return true; return false; }
    (tr||[]).forEach(function(id){ var t=D().traitById[id]; if(t&&hit(t.fx))out.push(t.icon+t.name); });
    combosOf(tr||[]).forEach(function(cb){ if(hit(cb.fx))out.push("✨"+cb.name); });
    return out;
  }
  function stats(p){
    var kd=kindOf(p), fx=fxOf(p.tr), o={}, lo=null, i, k, lvm=1+0.04*(p.lv-1);
    for(i=0;i<KEYS.length;i++){ k=KEYS[i];
      o[k]=(kd.base[k]*lvm*(TL_A+TL_B*p.tl[i])*natMul(p,k)+(p.ef[i]||0))*(fx.all||1)*(fx[k]||1);
      if(lo===null||o[k]<o[lo])lo=k; }
    if(fx.low)o[lo]*=fx.low;                       /* 底上げ: いちばん低い能力だけ */
    for(i=0;i<KEYS.length;i++)o[KEYS[i]]=Math.round(o[KEYS[i]]);
    return o;
  }
  function stat(p,k){ return stats(p)[k]; }
  function power(p){ var st=stats(p), s=0; for(var i=0;i<KEYS.length;i++)s+=st[KEYS[i]]; return s; }
  /* 特性の抽選: めずらしい特性ほど出にくい。高レアの種類ほど めずらしい特性が出やすい */
  function rollTrait(r,ri,not){
    var T=D().TRAITS.filter(function(t){ return !not||not.indexOf(t.id)<0; }), tot=0;
    var w=T.map(function(t){ var x=Math.pow(0.45,t.rar)*(1+0.5*(ri||0)*(t.rar>=2?1:0)); tot+=x; return x; });
    var x=r()*tot; for(var i=0;i<T.length;i++){ x-=w[i]; if(x<=0)return T[i].id; } return T[0].id;
  }
  function talent(p){ var s=0; for(var i=0;i<5;i++)s+=p.tl[i]; return s; }
  /* 才能の合計が「その種類のなかで上位何%か」。0〜10の5つの和の分布から正確に出す */
  var CDF=null;
  function cdf(){
    if(CDF)return CDF; var d=[1], i, j, k;
    var W=D().TALENT_W, w1=0; for(k=0;k<W.length;k++)w1+=W[k];
    for(i=0;i<5;i++){ var n=[]; for(j=0;j<d.length;j++)for(k=0;k<=10;k++)n[j+k]=(n[j+k]||0)+d[j]*W[k]; d=n; }
    var tot=Math.pow(w1,5), acc=0; CDF=[];
    for(i=d.length-1;i>=0;i--){ acc+=d[i]; CDF[i]=acc/tot; }   /* CDF[s] = 合計が s 以上になる確率 */
    return CDF;
  }
  function rank(p){ var s=talent(p), t=cdf()[s]; return { sum:s, max:50, top:Math.max(1,Math.round(t*100)) }; }
  /* 「看板と同じLv・同じけいこ値まで育てたら」のつよさ。Lv1の新入りとLv30の看板を、同じ土俵で比べるため */
  function atLv(p,lv,ef){ var q={k:p.k,lv:lv,tl:p.tl,na:p.na,tr:p.tr,ef:ef||p.ef}; return power(q); }
  /* 看板をゆずり受けたときの Lv と けいこ値: Lvはそのまま、けいこ値は9割を引きつぐ(自分のほうが多い能力は自分のまま) */
  function handover(p,k){
    var keep=D().KEIKO.keep, ef=[], inc=[], own=0, add=0, i;
    for(i=0;i<5;i++){ var o=p.ef[i]||0; inc.push(Math.max(0,Math.floor((k.ef[i]||0)*keep*100)/100-o)); own+=o; add+=inc[i]; }
    var f=add>0?Math.min(1,Math.max(0,D().EF_TOTAL-own)/add):0;          /* 合計の上限をこえるぶんは、引きつぐ側を減らす(自分のけいこ値は減らない) */
    for(i=0;i<5;i++)ef.push(Math.floor(((p.ef[i]||0)+inc[i]*f)*100)/100);
    return { lv:Math.max(p.lv,k.lv), xp:p.lv>=k.lv?p.xp:k.xp, ef:ef };
  }
  /* ▲▼ = 「いま この子を看板にしたら、つよさ が いくつ変わるか」(Lv1の新入りでも、そのまま比べられる) */
  function pot(g,p){ var k=kanban(g); if(!k)return {v:power(p),d:0,top:false,none:true}; if(k===p)return {v:power(p),d:0,top:true,none:false};
    var h=handover(p,k), v=atLv(p,h.lv,h.ef); return {v:v,d:v-power(k),top:false,none:false}; }
  function need(lv){ return D().XP_NEED[0]+D().XP_NEED[1]*lv; }   /* 次のLvまでの経験 */
  /* 才能1つを ふる(出やすさは D.TALENT_W) */
  function rollTalent(r){ var W=D().TALENT_W, tot=0, i; for(i=0;i<W.length;i++)tot+=W[i]; var x=r()*tot; for(i=0;i<W.length;i++){ x-=W[i]; if(x<0)return i; } return W.length-1; }
  function adult(p){ return p.lv>=D().LV_ADULT; }
  function spId(p){ return adult(p)?p.k:p.k+"c"; }              /* 絵のid(こども=小物なし) */

  /* 1体を作る。o: {rar|kind, fam, parents:[A,B]} */
  function roll(c,g,o){
    o=o||{}; var r=c.rand, kd;
    if(o.kind&&D().kindById[o.kind])kd=D().kindById[o.kind];
    else { var pool=D().kindsByRar[Math.max(0,Math.min(4,o.rar||0))]; if(o.fam!=null){ var pf=pool.filter(function(k){ return k.f===o.fam; }); if(pf.length)pool=pf; } kd=pool[Math.floor(r()*pool.length)]; }
    var p={ i:"a"+(g.nid++), k:kd.id, n:kd.name, lv:1, xp:0, tl:[], na:D().natures[Math.floor(r()*D().natures.length)].id, tr:[], ef:[0,0,0,0,0], a:[], w:0 };
    for(var i=0;i<5;i++)p.tl.push(rollTalent(r));
    if(r()<D().TRAIT_RATE[Math.min(4,kd.rar)])p.tr.push(rollTrait(r,Math.min(4,kd.rar)));
    if(r()<(o.parents?D().RATE2.shinyBred:D().RATE2.shiny))p.sh=1;
    if(o.parents)p.a=[o.parents[0].i,o.parents[1].i];
    return p;
  }
  function byId(g,id){ for(var i=0;i<g.mons.length;i++)if(g.mons[i].i===id)return g.mons[i]; return null; }
  function sorted(g){ return g.mons.slice().sort(function(a,b){ return power(b)-power(a)||(a.i<b.i?-1:1); }); }
  /* 看板(いちばん前に立つ1体)。決まっていなければ最強を立てる */
  function kanban(g){ var p=byId(g,g.kan); if(!p&&g.mons.length){ p=sorted(g)[0]; g.kan=p.i; } return p; }
  function diff(g,p){ var k=kanban(g), v=power(p); if(!k)return {v:v,d:0,top:false,none:true}; return {v:v,d:v-power(k),top:k===p,none:false}; }
  /* 看板をかえる。新しい看板は、前の看板の Lv と けいこ値の9割を引きつぐ(乗りかえで何十日ぶんも失わないように) */
  function setKan(c,id){
    var g=W(c), p=byId(g,id), k=kanban(g); if(!p)return false; if(k===p)return {from:power(p),to:power(p),same:true};
    var from=k?power(k):0;
    if(k){ var h=handover(p,k); p.lv=h.lv; p.xp=Math.min(h.xp,need(p.lv)-1); p.ef=h.ef; }
    g.kan=id; g.sub=[]; mark(g,p);
    return {from:from,to:power(p),lv:p.lv};
  }
  function toggleSub(c,id){ var g=W(c), p=byId(g,id); if(!p||g.kan===id)return {err:"看板はひかえにできない"};
    var i=g.sub.indexOf(id); if(i>=0){ g.sub.splice(i,1); return {on:0}; }
    if(g.sub.length>=2)return {err:"ひかえは2体まで"}; g.sub.push(id); return {on:1}; }
  /* 図鑑のはんこ: 1=見つけた 2=おとなにした 4=才能40以上。
     「おとなにした」は markAdult だけが押す(看板として D.ADULT_NEED 問 正解・Lv10以上)。
     看板をゆずり受けると Lv を引きつぐので、Lv だけで押すと「看板にした瞬間」に付いてしまうため。 */
  function mark(g,p){ var b=g.dex[p.k]||0; b|=1; if(talent(p)>=40)b|=4; g.dex[p.k]=b; if(p.sh)g.sdex[p.k]=1; }
  function markAdult(g,p){ g.dex[p.k]=(g.dex[p.k]||0)|3; }
  /* 看板として正解した数を数え、条件がそろったら「おとなにした」。押した瞬間だけ true */
  function kanCorrect(g,p){
    var N=D().ADULT_NEED; if((p.kc||0)<N)p.kc=(p.kc||0)+1;
    if(p.kc>=N&&adult(p)&&!((g.dex[p.k]||0)&2)){ markAdult(g,p); return true; }
    return false;
  }

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
    var n=shardOf(p); g.shard+=n; g.rel++;
    g.mons=g.mons.filter(function(x){ return x.i!==id; }); g.sub=g.sub.filter(function(x){ return x!==id; });
    return {shard:n};
  }

  /* ---------- 育つ ----------
     けいこの中身(3択・けいこ値・Lvの上限・配合券)は core/keiko.js。ここは Lv と けいこ値 を足す道具だけ持つ。 */
  function lvCap(c,p,mast){ return MM.keiko.lvCap(c,mast).cap; }       /* 全科目の習熟で決まる(どの個体も同じ) */
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
  function onAnswer(rw,gain,c){ return MM.keiko.onAnswer(rw,gain,c); }
  function shardOf(p){ return D().SHARD[rarOf(p)]||1; }

  MM.mon={ KEYS:KEYS, BACKUP_KEY:BACKUP_KEY, defaults:defaults, normalize:normalize, normMon:normMon, W:W, fresh:fresh, migrateV1toV2:migrateV1toV2, backupOnce:backupOnce,
    kindOf:kindOf, rarOf:rarOf, rarInfo:rarInfo, natOf:natOf, stat:stat, stats:stats, power:power, talent:talent, rank:rank, need:need, adult:adult, spId:spId,
    atLv:atLv, pot:pot, roll:roll, byId:byId, sorted:sorted, kanban:kanban, diff:diff, setKan:setKan, toggleSub:toggleSub, mark:mark,
    rollRar:rollRar, freeReady:freeReady, pityLeft:pityLeft, canPull:canPull, pull:pull, release:release,
    lvCap:lvCap, addXp:addXp, addEf:addEf, onAnswer:onAnswer, fxOf:fxOf, fxNames:fxNames, combosOf:combosOf, rollTrait:rollTrait, markAdult:markAdult, kanCorrect:kanCorrect,
    handover:handover, starter:starter, rollTalent:rollTalent, shardOf:shardOf, natMul:natMul, cdf:cdf };
})();
