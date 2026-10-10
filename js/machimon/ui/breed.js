"use strict";
/* ============================================================
   machimon/ui/breed.js — 配合: 親2体を選ぶ → 見込み2行 → 決定 → 生まれた子
   ★見込みは2行だけ: 「子の才能の見込み 32〜41／50」「いまの看板を超える確率 28%」。
   ★おや2 を選ぶ一覧は「看板を超える確率」の高い順に並べる = どれと組めばいいかが一目で分かる。
   ★おや1は残る。おや2は子に生まれかわる(いなくなる)。決める前にかならず確かめる。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, GD=function(){ return MM.DATA.garden; }, BR=function(){ return MM.breed; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return UI.v2p.fmt(n); }
  function pct(v){ var p=Math.round(v*100); return (v>0&&p<1)?"1%未満":p+"%"; }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }
  UI.v2ok.b2=1; UI.v2ok.b2p=1; UI.v2ok.b2r=1;
  UI.b2S={a:"",b:"",item:"",res:null};

  function sel(c){ var g=M().W(c), S=UI.b2S; if(!M().byId(g,S.a))S.a=g.kan; if(!M().byId(g,S.b)||S.b===S.a||S.b===g.kan)S.b="";
    if(S.item&&!(g.items[S.item]>0))S.item=""; return S; }
  function slot(c,g,which,p){
    var lab=which==="a"?'おや1 <i>のこる</i>':'おや2 <i>子に生まれかわる</i>';
    if(!p)return '<button class="mm-v2-slot mm-v2-slot-empty" onclick="MM.ui.go(\'b2p\',{w:\''+which+'\'})"><span class="mm-v2-slot-l">'+lab+'</span><span class="mm-v2-slot-plus">＋</span><b>えらぶ</b></button>';
    return '<button class="mm-v2-slot" style="border-color:'+M().rarInfo(p).color+'" onclick="MM.ui.go(\'b2p\',{w:\''+which+'\'})"><span class="mm-v2-slot-l">'+lab+'</span>'+UI.v2p.sprite(p,56)
      +'<b>'+esc(p.n)+'</b><span>'+UI.v2p.rarB(p)+' 才能 <b>'+M().talent(p)+'</b></span>'+UI.v2p.talentRow(p)+'</button>';
  }

  /* ホームから開く: おや1は いまの看板、おや2は これから選ぶ */
  UI.b2Open=function(){ var c=UI.ctx(), g=M().W(c); UI.b2S.a=g.kan; UI.b2S.b=""; UI.b2S.item=""; UI.go("b2"); };
  /* ---------- 配合(親を選ぶ・見込み) ---------- */
  UI.screens.b2=function(){
    var c=UI.ctx(), g=M().W(c), S=sel(c), A=M().byId(g,S.a), B2=M().byId(g,S.b), K=D().kstat;
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">💞 配合 <span class="mm-sub">配合券 '+g.bt+'枚</span></div>';
    if(g.mons.length<2)h+='<div class="mm-q mm-v2-note">配合には なかまが2体いる。まず 🥚タマゴ をもらおう。</div>';
    h+='<div class="mm-v2-slots">'+slot(c,g,"a",A)+'<span class="mm-v2-x">×</span>'+slot(c,g,"b",B2)+'</div>';
    if(A&&B2){
      var pv=BR().preview(c,A.i,B2.i,S.item);
      if(pv.err)h+='<div class="mm-q mm-v2-note">'+esc(pv.err)+'</div>';
      else{
        h+='<div class="mm-q mm-v2-pv">'
          +'<div class="mm-v2-pv1">子の才能の見込み <b>'+pv.lo+'〜'+pv.hi+'</b>／50</div>'
          +'<div class="mm-v2-pv2 '+(pv.pBeat>=0.2?'mm-v2-up':'mm-v2-dn')+'">いまの看板を超える確率 <b>'+pct(pv.pBeat)+'</b></div>'
          +'<div class="mm-v2-pvk">子の種類 '+pv.kinds.map(function(x){ return '<span class="mm-v2-pvkind">'+MM.px(x.k.id,26)+' '+esc(x.k.name)+' '+UI.v2p.rarB({k:x.k.id})+' <b>'+pct(x.p)+'</b>'+(x.only?' <i>配合限定</i>':'')+'</span>'; }).join('')
          +(pv.other>0.001?'<span class="mm-v2-pvkind">べつの種類 <b>'+pct(pv.other)+'</b></span>':'')+'</div>'
          +(pv.capped?'<div class="mm-v2-hint">子のレア度は おや2 より上がらない(おや1のほうがレアなので、子は おや2の種類になる)</div>':'')
          +(pv.compat.pub||pv.compat.known?'<div class="mm-v2-compat">'+(pv.compat.known?'✨ かくれ相性':'◎ 族の相性')+'：高いほうの才能を 継ぎやすい'+(pv.compat.known?'・同じ値なら +1 しやすい':'')+'</div>':'')
          +(pv.ito>=0?'<div class="mm-v2-compat">🧵 '+K[M().KEYS[pv.ito]].name+' は かならず高いほう(★'+Math.max(A.tl[pv.ito],B2.tl[pv.ito])+')</div>':'')
          +'</div>';
      }
      /* 配合で使う どうぐ(1つまで) */
      var its=D().ITEMS.filter(function(t){ return t.use==="b"&&g.items[t.id]>0; });
      if(its.length){ h+='<div class="mm-v2-usebox"><div class="mm-sub">🎒 どうぐを使う(1つまで)</div><div class="mm-v2-chips">';
        its.forEach(function(t){ var on=S.item===t.id; h+='<button class="mm-v2-chipbtn'+(on?' mm-v2-use-on':'')+'" onclick="MM.ui.b2Item(\''+t.id+'\')">'+(on?'✔ ':'')+t.icon+' '+esc(t.name)+' ×'+g.items[t.id]+'</button>'; });
        h+='</div>'+(S.item?'<div class="mm-v2-hint">'+D().itemById[S.item].icon+' '+esc(D().itemById[S.item].desc)+'</div>':'')+'</div>'; }
      h+='<button class="mm-cta mm-gfree" '+(g.bt>0&&!(pv&&pv.err)?'':'disabled')+' onclick="MM.ui.b2Do()">'+(g.bt>0?'配合する 🎟1枚 ▶':'配合券が無い')+'<span class="mm-sub">'+(g.bt>0?'おや2の '+esc(B2.n)+' は 子に生まれかわる':'きょうの復習をやりきると 1枚もらえる')+'</span></button>';
    }else{
      h+='<div class="mm-q mm-v2-note">おや2 を えらぶと、<b>子の才能の見込み</b> と <b>看板を超える確率</b> が出る。<br>'+(g.bt>0?'':'🎟 配合券は「きょうの復習をやりきる」と 1日1枚もらえる。')+'</div>';
    }
    return h+UI.back2("h2","ホームへ")+'</div>'+UI.tabs2("");
  };
  UI.b2Item=function(id){ var S=UI.b2S; S.item=(S.item===id)?"":id; UI.render(); };

  /* ---------- 親を選ぶ一覧 ---------- */
  UI.screens.b2p=function(pr){
    var c=UI.ctx(), g=M().W(c), S=sel(c), w=(pr&&pr.w)==="b"?"b":"a", A=M().byId(g,S.a);
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">'+(w==="a"?'おや1 を えらぶ <span class="mm-sub">のこる ・ 子の種類は おや1 が70%</span>':'おや2 を えらぶ <span class="mm-sub">子に生まれかわる</span>')+'</div>';
    var list=g.mons.filter(function(p){ return w==="a"?true:(p.i!==S.a&&p.i!==g.kan); }).map(function(p){
      var pv=(w==="b"&&A)?BR().preview(c,A.i,p.i,S.item,120):null;
      return {p:p,pv:(pv&&!pv.err)?pv:null,v:M().pot(g,p).v};
    });
    if(w==="b")list.sort(function(x,y){ return (y.pv?y.pv.pBeat:0)-(x.pv?x.pv.pBeat:0)||(y.pv?y.pv.mean:0)-(x.pv?x.pv.mean:0)||y.v-x.v; });
    else list.sort(function(x,y){ return y.v-x.v; });
    if(w==="b")h+='<div class="mm-v2-hint">「看板を超える確率」の高い順。看板は おや2 にできない。</div>';
    if(!list.length)h+='<div class="mm-q mm-v2-note">えらべる なかまが いない。🥚タマゴ をもらおう。</div>';
    list.forEach(function(x){ var p=x.p;
      h+='<button class="mm-v2-row" style="border-left-color:'+M().rarInfo(p).color+'" onclick="MM.ui.b2Pick(\''+w+'\',\''+p.i+'\')">'+UI.v2p.sprite(p,44)
        +'<span class="mm-v2-row-b"><span class="mm-v2-row-n"><b>'+esc(p.n)+'</b> '+UI.v2p.rarB(p)+(g.kan===p.i?'<i class="mm-v2-tag mm-v2-tag-k">看板</i>':'')+'</span><span class="mm-v2-row-s">才能 <b>'+M().talent(p)+'</b>/50 '+UI.v2p.talentRow(p)+'</span></span>'
        +(x.pv?'<span class="mm-v2-row-p"><i class="mm-sub">超える確率</i><b class="'+(x.pv.pBeat>=0.2?'mm-pw-up':'')+'">'+pct(x.pv.pBeat)+'</b><i class="mm-sub">才能 '+x.pv.lo+'〜'+x.pv.hi+'</i></span>':'<span class="mm-v2-row-p"><b>'+fmt(x.v)+'</b>'+UI.v2p.arrow(g,p)+'</span>')+'</button>'; });
    return h+UI.back2("b2","配合へ もどる")+'</div>';
  };
  UI.b2Pick=function(w,id){ var S=UI.b2S; if(w==="a"){ S.a=id; if(S.b===id)S.b=""; } else S.b=id; UI.go("b2"); };
  UI.b2Do=function(){
    var c=UI.ctx(), g=M().W(c), S=sel(c), B2=M().byId(g,S.b); if(!B2)return;
    try{ if(G.confirm&&!G.confirm("おや2の "+B2.n+" は 子に生まれかわります(いなくなる)。配合しますか？"))return; }catch(e){}
    var r=BR().breed(c,S.a,S.b,{item:S.item}); save();
    if(r.err){ UI.toast(r.err); UI.render(); return; }
    S.res=r; S.b=""; S.item=""; sfx("roll",6); UI.go("b2r");
  };
  /* ---------- 生まれた子 ---------- */
  UI.screens.b2r=function(){
    var c=UI.ctx(), g=M().W(c), r=UI.b2S.res, kid=r&&r.kids[0], p=kid&&M().byId(g,kid.mon.i); if(!p)return UI.screens.b2();
    var rk=M().kindOf(p).rar;
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h" style="justify-content:center">💞 子が 生まれた！</div>';
    if(r.found)h+='<div class="mm-gbloom mm-v2-gift">✨ <b>かくれ相性</b>を見つけた！ '+esc(GD().families[+r.compat.key.split("|")[0]].name)+' × '+esc(GD().families[+r.compat.key.split("|")[1]].name)+'</div>';
    h+=UI.bornCard(c,g,p,kid);
    h+='<div class="mm-gbtns mm-gbtns-col"><button class="mm-cta-s" '+(g.bt>0?'':'disabled')+' onclick="MM.ui.b2Open()">💞 もう1回 配合(配合券 '+g.bt+'枚)</button>'
      +'<button class="small-btn" onclick="MM.ui.go(\'n2d\',{id:\''+p.i+'\'})">くわしく見る</button></div>'+UI.back2("h2","ホームへ")+'</div>';
    if(rk>=3||kid.only)setTimeout(function(){ sfx("fanfare"); },400); else setTimeout(function(){ sfx("levelup"); },400);
    return h;
  };
})();
