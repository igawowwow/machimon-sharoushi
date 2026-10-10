"use strict";
/* ============================================================
   machimon/ui/more2.js — 新しい遊び(GD.V2)の オープニング・図鑑・きろく
   ★オープニングは1画面: 3行の物語 → タマゴを1つ選ぶ(1タップ) → 生まれた子 →「さっそく けいこ」(2タップ目)で最初の問題。
   ★図鑑: 種類105 × はんこ3つ(見つけた／おとなにした／才能40以上)。物語・かけら交換はスライス7で足す。
   ★きろく: 実力メーター・Lvの上限(9科目の習熟)・番付のあゆみ・もちもの・街の名前。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; }, GD=function(){ return MM.DATA.garden; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return UI.v2p.fmt(n); }
  function save(){ MM.game.save(); }
  UI.v2ok.z2=1; UI.v2ok.r2=1;

  /* ---------- オープニング(最初の1体をもらうまで) ---------- */
  var TYPE={a:"バランス",o:"💪 ちから",j:"🛡 ねばり",h:"🔥 いきおい",s:"💡 ひらめき",m:"📘 かしこさ"};
  UI.screens.op2=function(p){
    var c=UI.ctx();
    if(p&&p.page===2){
      var g=M().W(c), k=M().kanban(g), fam=GD().families[M().kindOf(k).f];
      return '<div class="mm-intro mm-v2-op">'
        +'<div class="mm-v2-op-t">タマゴが われた！</div>'
        +'<div class="mm-intro-stage mm-burst">'+MM.px(k.k+"c",128)+'</div>'
        +'<div class="mm-v2-hero-name">'+esc(k.n)+' '+UI.v2p.rarB(k)+'</div>'
        +'<div class="mm-sub mm-v2-kind">'+fam.icon+esc(fam.name)+'</div>'
        +'<div class="mm-pw mm-pw-big">つよさ <b>'+fmt(M().power(k))+'</b></div>'
        +'<div class="mm-talk"><div class="mm-talk-text">きょうから この子が <b>街の看板</b>。<br>問題に正解すると 育つ。まず1問！</div></div>'
        +'<button class="mm-cta" onclick="MM.ui.opGo()">さっそく けいこ ▶</button></div>';
    }
    var h='<div class="mm-intro mm-v2-op">'
      +'<div class="mm-intro-logo">MACHIMON<span>社労士</span></div>'
      +'<div class="mm-scene mm-v2-scene mm-v2-sky0 mm-v2-op-scene"><span class="mm-bld mm-v2-bld" style="left:8%">⛺</span><span class="mm-v2-noren mm-v2-noren-off">看板なし</span><span class="mm-bld mm-v2-bld" style="left:76%">🍂</span><span class="mm-ground"></span></div>'
      +'<div class="mm-talk"><div class="mm-talk-text">むかし この街には <b>横綱のマチモン</b>がいた。<br>ある夜、街の<b>看板</b>ごと 姿を消した。<br>あたらしい看板を育てて、<b>横綱</b>へ。</div></div>'
      +'<div class="mm-v2-op-t">タマゴを 1つ えらぼう</div><div class="mm-v2-eggs">';
    D().STARTERS.forEach(function(id,i){ var kd=D().kindById[id], fam=GD().families[kd.f];
      h+='<button class="mm-v2-eggbtn" onclick="MM.ui.opPick('+i+')"><span class="mm-v2-eggpic" style="background:'+fam.color+'">🥚</span><b>'+(TYPE[kd.type]||"")+'</b><span class="mm-sub">'+esc(fam.name)+'</span></button>'; });
    return h+'</div></div>';
  };
  UI.opPick=function(i){
    var c=UI.ctx();
    MM.tutorial.finishIntro(c,"マチモンタウン"); M().starter(c,i); save();
    UI.play({step:7,fx:"gold",haptic:"heavy"}); UI.go("intro",{page:2});
  };
  UI.opGo=function(){ UI.k2Go("new"); };

  /* ---------- 図鑑 ---------- */
  function stamps(b){ return '<span class="mm-v2-st">'+[1,2,4].map(function(x){ return '<i class="'+((b&x)?'mm-on':'')+'">●</i>'; }).join('')+'</span>'; }
  UI.screens.z2=function(){
    var c=UI.ctx(), g=M().W(c), K=D().kinds, found=0, st=0;
    K.forEach(function(k){ var b=g.dex[k.id]||0; if(b&1)found++; [1,2,4].forEach(function(x){ if(b&x)st++; }); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">📖 図鑑 <span class="mm-sub">見つけた '+found+'/'+K.length+' ・ はんこ '+st+'/'+(K.length*3)+'</span></div>'+UI.bar(found,K.length)
      +'<div class="mm-v2-hint">はんこ ●●● = 見つけた ／ おとなにした(Lv10) ／ 才能40以上を出した</div>';
    function cell(k){ var b=g.dex[k.id]||0, has=!!(b&1), r=GD().RARITY[k.rar];
      return '<div class="mm-dex mm-v2-dex'+(has?'':' mm-unk')+'">'+MM.px(k.id,40)+'<b>'+(has?esc(k.name):'？？？')+'</b><span class="mm-grar" style="background:'+r.color+'">'+r.name+'</span>'+stamps(b)+'</div>'; }
    GD().families.forEach(function(f){
      var list=K.filter(function(k){ return !k.only&&k.f===f.id; }), n=list.filter(function(k){ return (g.dex[k.id]||0)&1; }).length;
      h+='<div class="mm-dex-line"><div class="mm-goal-row"><b>'+f.icon+' '+esc(f.name)+'</b> <span class="mm-sub">'+esc((G.SUBJECTS||[])[f.sub]||"")+' ・ '+n+'/'+list.length+'</span></div><div class="mm-v2-dexrow">'+list.map(cell).join('')+'</div></div>';
    });
    var on=K.filter(function(k){ return k.only; }), n2=on.filter(function(k){ return (g.dex[k.id]||0)&1; }).length;
    h+='<div class="mm-dex-line"><div class="mm-goal-row"><b>💞 配合でしか生まれない種類</b> <span class="mm-sub">'+n2+'/'+on.length+'</span></div><div class="mm-v2-hint">2つの族を かけ合わせると、まれに生まれる。</div><div class="mm-v2-dexrow">'+on.map(cell).join('')+'</div></div>';
    return h+'</div>'+UI.tabs2("z2");
  };

  /* ---------- きろく ---------- */
  UI.screens.r2=function(){
    var c=UI.ctx(), g=M().W(c), BZ=MM.banzuke, lc=MM.keiko.lvCap(c), names=G.SUBJECTS||[], T=D().LVCAP.steps, top=T[T.length-1];
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">📊 きろく</div>';
    if(UI.passCard)h+=UI.passCard(c);
    /* Lvの上限: 9科目の習熟 */
    h+='<div class="mm-h" style="font-size:14px">📚 科目の習熟 と Lvの上限 <span class="mm-sub">いま <b>Lv'+lc.cap+'</b> まで</span></div><div class="mm-q mm-v2-cap">';
    lc.per.forEach(function(x){
      h+='<div class="mm-v2-caprow"><span>'+esc(names[x.sub]||"")+'</span><span class="mm-v2-capbar"><i style="width:'+Math.min(100,Math.round(x.m/top*100))+'%"></i>'+T.map(function(t){ return '<b style="left:'+Math.round(t/top*100)+'%"></b>'; }).join('')+'</span><span class="mm-v2-capn">'+Math.round(x.m*100)+'%</span>'+'<span class="mm-v2-st">'+T.map(function(t,i){ return '<i class="'+(x.step>i?'mm-on':'')+'">●</i>'; }).join('')+'</span></div>'; });
    h+='<div class="mm-v2-hint">科目ごとに ●が1つ ふえると Lvの上限 +1(9科目 × 3つ で Lv'+D().LV_MAX+')。'+(lc.next?'<br>つぎは「<b>'+esc(lc.next.name)+'</b>」を '+Math.round(lc.next.to*100)+'% に(いま '+Math.round(lc.next.m*100)+'%)。':'')+'</div></div>';
    /* 番付のあゆみ */
    if(BZ){ var st=BZ.state(c);
      h+='<div class="mm-h" style="font-size:14px">🏆 番付のあゆみ</div><div class="mm-q mm-v2-note">'
        +'<div class="mm-row"><span>いま</span><span>'+(st.ranked?st.dan.icon+' '+st.dan.name+' '+st.pos+'枚目':'番付の外')+'</span></div>'
        +'<div class="mm-row"><span>通算</span><span>'+st.tw+'勝 '+st.tl+'敗</span></div>'
        +'<div class="mm-row"><span>配合</span><span>'+g.brd+'回 ・ タマゴ '+g.pulls+'個</span></div>';
      st.hist.slice(-5).reverse().forEach(function(x){ h+='<div class="mm-row"><span>第'+x.b+'場所</span><span>'+x.w+'勝'+x.l+'敗 '+(x.to<x.from?'⬆ '+(x.from>60?'外':x.from)+'→'+x.to+'枚目':(x.to>x.from?'⬇ '+x.to+'枚目':'そのまま'))+'</span></div>'; });
      h+='</div>'; }
    /* もちもの(育成どうぐ12種) */
    h+='<div class="mm-h" style="font-size:14px">🎒 育成どうぐ <span class="mm-sub">'+MM.breed.itemCount(g)+'こ</span></div><div class="mm-q mm-v2-bag">';
    D().ITEMS.forEach(function(t){ var n=g.items[t.id]||0;
      h+='<div class="mm-v2-bagrow'+(n?'':' mm-v2-bag0')+'"><span class="mm-v2-bagi">'+t.icon+'</span><span class="mm-v2-bagb"><b>'+esc(t.name)+'</b><span class="mm-sub">'+esc(t.desc)+'</span><span class="mm-sub">'+(t.use==="b"?'💞 配合のときに使う':(t.use==="m"?'🐣 なかまの画面で使う':'📚 けいこの画面で使う'))+'</span></span><b class="mm-v2-bagn">×'+n+'</b></div>'; });
    h+='<div class="mm-v2-hint">どうぐは、場所の勝ち越し・昇進・連続正解・科目の習熟の ごほうび。お店では買えない。</div></div>';
    /* 街の名前 */
    h+='<div class="mm-h" style="font-size:14px">🏠 街の名前</div><div class="mm-q mm-v2-note"><input id="mmTownName" class="mm-input mm-v2-name" maxlength="12" value="'+esc(c.mm.name||"マチモンタウン")+'"><button class="small-btn" style="min-height:48px;width:100%;margin-top:6px" onclick="MM.ui.r2Name()">この名前にする</button></div>';
    return h+'</div>'+UI.tabs2("r2");
  };
  UI.r2Name=function(){
    var el=G.document&&G.document.getElementById?G.document.getElementById("mmTownName"):null, c=UI.ctx();
    var name=String(el&&el.value||"").replace(/[<>"]/g,"").trim().slice(0,12); if(!name)return;
    c.mm.name=name; save(); UI.toast("🏠 街の名前を かえた"); UI.go("r2");
  };
})();
