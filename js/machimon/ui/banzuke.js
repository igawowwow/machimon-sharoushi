"use strict";
/* ============================================================
   machimon/ui/banzuke.js — 番付表・取組の前(見込み)・五番勝負・結果
   ★始める前に「勝てるかどうか」が分かる: 能力ごとに ◎▲△▼ と、5本中何本とれる見込みか。
   ★1本ごとに、2つの数字を並べて勝ち負けを見せる(体力・けずり合いは無い)。
   ★UIは判断を持たない。すべて core/banzuke.js に委譲する。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, BZ=function(){ return MM.banzuke; }, D=function(){ return MM.DATA; };
  var esc=function(s){ return UI.esc(s); };
  function fmt(n){ return UI.v2p.fmt(n); }
  function sfx(n,a){ try{ if(MM.sfx&&MM.sfx[n])MM.sfx[n](a); }catch(e){} }
  function save(){ MM.game.save(); }
  UI.v2ok.bz=1; UI.v2ok.bzPre=1; UI.v2ok.bzBout=1; UI.v2ok.bzRes=1;
  UI.bzS={bout:null,res:null};

  var MARK={ "◎":["mm-bz-m3","まちがえても とれる"], "▲":["mm-bz-m2","正解で とれる"], "△":["mm-bz-m1","はやく正解で とれる"], "▼":["mm-bz-m0","正解しても とれない"] };
  function mark(m){ return '<i class="mm-bz-mark '+MARK[m][0]+'">'+m+'</i>'; }
  function rankText(st){ return st.ranked?(st.dan.icon+' '+st.dan.name+' <span class="mm-sub">60枚中</span> <b>'+st.pos+'</b>枚目'):'🌱 番付の外 <span class="mm-sub">(まず1場所とろう)</span>'; }
  /* 星取り: ○=勝ち ●=負け ・=これから */
  function stars(st){ var h=''; for(var i=0;i<D().BASHO.bouts;i++)h+=i<st.w?'<i class="mm-bz-w">○</i>':(i<st.w+st.l?'<i class="mm-bz-l">●</i>':'<i class="mm-bz-n">・</i>'); return '<span class="mm-bz-stars">'+h+'</span>'; }
  function verdict(fc){
    if(fc.verdict==="sure")return ['mm-v2-up','◎ まちがえても勝てる見込み(5本中 '+fc.sure+'本は かたい)'];
    if(fc.verdict==="can")return ['mm-v2-up','▲ 正解すれば勝てる(5本中 '+fc.can+'本とれる見込み)'];
    if(fc.verdict==="fast")return ['mm-bz-warn','△ はやく正解すれば とどく(あと つよさ +'+fmt(fc.gap)+' で楽になる)'];
    return ['mm-v2-dn','▼ いまは全問正解でも勝てない(あと つよさ +'+fmt(fc.gap)+')'];
  }
  function foeSprite(foe,size){ return '<span class="mm-gi mm-bz-flip">'+MM.px(foe.kind,size)+'</span>'; }
  function foeName(foe){ var rv=D().bzRival(foe.rival); return esc(rv.name)+' '+foe.role; }

  /* ホームに出す1枚: いまの番付・星取り・次の相手と見込み */
  UI.bzHome=function(c){
    BZ().settleAbandoned(c);
    var st=BZ().state(c), fc=BZ().forecast(c,st.foe), v=verdict(fc);
    return '<button class="mm-bz-home" onclick="MM.ui.go(\'bz\')"><span class="mm-bz-home-r">'+rankText(st)+'</span>'
      +'<span class="mm-bz-home-s">'+(st.promo?'<b class="mm-bz-promo">昇進の一番</b>':'第'+st.basho+'場所 '+stars(st))+'</span>'
      +'<span class="mm-bz-home-f">つぎの相手 <b>'+esc(st.foe.name)+'</b> <span class="mm-sub">'+foeName(st.foe)+'</span> つよさ <b>'+fmt(BZ().foePower(st.foe))+'</b></span>'
      +'<span class="mm-bz-home-v '+v[0]+'">'+v[1]+'</span></button>';
  };

  /* ---------- 番付表 ---------- */
  UI.screens.bz=function(){
    var c=UI.ctx(); BZ().settleAbandoned(c); save();
    var g=M().W(c), st=BZ().state(c), k=M().kanban(g), fc=BZ().forecast(c,st.foe), v=verdict(fc);
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h">🏆 番付</div>';
    h+='<div class="mm-q mm-bz-top"><div class="mm-bz-home-r">'+rankText(st)+'</div>'
      +'<div class="mm-bz-home-s">'+(st.promo?'<b class="mm-bz-promo">昇進の一番</b> 勝てば '+D().danOf(st.pos-1).name+' へ':'第'+st.basho+'場所 '+stars(st)+' <span class="mm-sub">'+st.w+'勝'+st.l+'敗・あと'+st.bashoLeft+'番</span>')+'</div>'
      +'<div class="mm-sub mm-bz-rule">7番で1場所。4勝で1枚、5勝で2枚、6勝で3枚、全勝で5枚あがる。3勝以下は1枚さがる。</div></div>';
    h+='<button class="mm-cta" '+(st.left>0?'':'disabled')+' onclick="MM.ui.go(\'bzPre\')">'+(st.left>0?(st.promo?'🚪 昇進の一番へ ▶':'つぎの取組へ ▶')+'<span class="mm-sub">きょうは あと'+st.left+'番 ・ 相手 '+esc(st.foe.name)+'(つよさ '+fmt(BZ().foePower(st.foe))+')</span>':'きょうの取組は おわり<span class="mm-sub">1日'+D().BASHO.perDay+'番まで。あした また来てね</span>')+'</button>';
    h+='<div class="mm-v2-verdict '+v[0]+'" style="text-align:center">'+v[1]+'</div>';
    /* 60枚を上から。自分の位置に色。今場所の相手に印 */
    var meRow='<div class="mm-bz-row mm-bz-me" id="mmBzMe"><b class="mm-bz-pos">'+(st.ranked?st.pos:'—')+'</b>'+UI.v2p.sprite(k,30)+'<span class="mm-bz-nm"><b>'+esc(k.n)+'</b><span class="mm-sub">'+esc(c.mm.name||"わたしの街")+'</span></span><span class="mm-bz-pw">'+fmt(M().power(k))+'</span></div>';
    var marks={}; st.foes.forEach(function(p){ marks[p]=1; });
    h+='<div class="mm-bz-list">'; var lastDan=-1;
    D().banzuke.forEach(function(b){
      if(b.dan!==lastDan){ lastDan=b.dan; var dn=D().DAN[b.dan]; h+='<div class="mm-bz-dan">'+dn.icon+' '+dn.name+'</div>'; }
      if(st.ranked&&b.pos===st.pos)h+=meRow;
      var beaten=b.pos>=st.pos, isNext=b.pos===st.foe.pos, rv=D().bzRival(b.rival);
      h+='<div class="mm-bz-row'+(beaten?' mm-bz-done':'')+(isNext?' mm-bz-next':'')+'"><b class="mm-bz-pos">'+(beaten?'✔':b.pos)+'</b>'+foeSprite(b,30)
        +'<span class="mm-bz-nm"><b>'+esc(b.name)+'</b><span class="mm-sub">'+esc(rv.name)+' '+b.role+(b.gate?' 🚪関門':'')+'</span></span>'
        +(isNext?'<i class="mm-bz-tag">つぎ</i>':((!st.promo&&marks[b.pos])?'<i class="mm-bz-tag mm-bz-tag2">今場所</i>':''))+'<span class="mm-bz-pw">'+fmt(BZ().foePower(b))+'</span></div>';
    });
    if(!st.ranked)h+=meRow;
    h+='</div></div>'+UI.tabs2("bz");
    try{ setTimeout(function(){ try{ var e=G.document.getElementById("mmBzMe"); if(e&&e.scrollIntoView&&UI.route.screen==="bz"&&!UI.bzS.noScroll)e.scrollIntoView({block:"center"}); }catch(e2){} },60); }catch(e){}
    return h;
  };

  /* ---------- 取組の前: 自分と相手の能力5本を並べ、見込みの印 ---------- */
  UI.screens.bzPre=function(){
    var c=UI.ctx(), g=M().W(c), st=BZ().state(c), k=M().kanban(g), foe=st.foe, rv=D().bzRival(foe.rival), fc=BZ().forecast(c,foe), v=verdict(fc);
    var mx=1; fc.rows.forEach(function(r){ mx=Math.max(mx,r.me,r.foe); });
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-h" style="justify-content:center">'+(st.promo?'🚪 昇進の一番':'第'+st.basho+'場所 '+(st.n+1)+'番目')+'</div>';
    h+='<div class="mm-bz-vs"><div class="mm-bz-side">'+UI.v2p.sprite(k,72)+'<b>'+esc(k.n)+'</b><span class="mm-pw">つよさ <b>'+fmt(fc.mine)+'</b></span></div>'
      +'<div class="mm-bz-x">対</div>'
      +'<div class="mm-bz-side">'+foeSprite(foe,72)+'<b>'+esc(foe.name)+'</b><span class="mm-pw">つよさ <b>'+fmt(BZ().foePower(foe))+'</b></span></div></div>';
    h+='<div class="mm-live mm-live-taunt">🗣 '+esc(rv.boss)+'<span class="mm-sub">('+esc(rv.name)+')</span>「'+esc(rv.taunt)+'」</div>';
    h+='<div class="mm-v2-verdict '+v[0]+'" style="text-align:center">'+v[1]+'</div>';
    h+='<div class="mm-q mm-bz-table"><div class="mm-bz-th"><span><i class="mm-bz-dot mm-bz-dot-me"></i>じぶん</span><span><i class="mm-bz-dot mm-bz-dot-foe"></i>相手(出してくる数字)</span></div>';
    fc.rows.forEach(function(r){ var s=D().kstat[r.k];
      h+='<div class="mm-bz-tr"><span class="mm-bz-sn">'+s.icon+' '+s.name+'</span>'
        +'<span class="mm-bz-bars"><span class="mm-bz-bar mm-bz-bar-me"><i style="width:'+Math.max(4,Math.round(r.me/mx*100))+'%"></i><b>'+r.me+'</b></span><span class="mm-bz-bar mm-bz-bar-foe"><i style="width:'+Math.max(4,Math.round(r.foe/mx*100))+'%"></i><b>'+r.foe+'</b></span></span>'
        +mark(r.mark)+'</div>'; });
    h+='<div class="mm-bz-legend">'+["◎","▲","△","▼"].map(function(m){ return '<span>'+mark(m)+MARK[m][1]+'</span>'; }).join('')+'</div>';
    h+='<div class="mm-sub mm-bz-rule">能力1つにつき問題を1問。正解なら じぶんの数字をそのまま出せる(8秒以内なら1.1倍)。まちがえると半分。<b>3本とれば勝ち</b>。運は無い。</div></div>';
    h+='<button class="mm-cta" '+(st.left>0?'':'disabled')+' onclick="MM.ui.bzGo()">'+(st.left>0?'はっけよい！ ▶':'きょうの取組は おわり')+'</button>';
    return h+'<button class="small-btn mm-gback" onclick="MM.ui.go(\'bz\')">番付へ もどる</button></div>';
  };
  UI.bzGo=function(){
    var c=UI.ctx(), s=BZ().start(c); save();
    if(s.err){ UI.toast(s.err); UI.go("bz"); return; }
    s.t0=Date.now(); s.sen={picks:[]}; s.fb=null; UI.bzS.bout=s; sfx("roll",4); UI.go("bzBout");
  };

  /* ---------- 五番勝負(1本ずつ) ---------- */
  function score(s){ var h=''; for(var i=0;i<s.n;i++){ var r=s.rounds[i]; h+=r?(r.win?'<i class="mm-bz-w">○</i>':'<i class="mm-bz-l">●</i>'):'<i class="mm-bz-n">・</i>'; } return '<span class="mm-bz-stars">'+h+'</span>'; }
  UI.screens.bzBout=function(){
    var c=UI.ctx(), s=UI.bzS.bout; if(!s)return UI.screens.bz();
    var foe=D().bzAt(s.foe), q=G.qById(s.qids[Math.min(s.i,s.n-1)]);
    var h='<div class="mm-wrap">'+UI.resBar2(c)+'<div class="mm-bz-head"><span>'+(s.promo?'🚪 昇進の一番':'五番勝負')+' <b>'+Math.min(s.i+(s.fb?0:1),s.n)+'</b>/'+s.n+'本目</span>'+score(s)+'<span>'+s.w+' - '+s.l+'</span></div>';
    if(s.fb)return h+s.fb+'</div>';
    var k=D().BASHO.order[s.i], ks=D().kstat[k], row=s.fc.rows[s.i];
    h+='<div class="mm-bz-duel"><div class="mm-bz-duel-k">'+ks.icon+' '+ks.name+' くらべ '+mark(row.mark)+'<span class="mm-sub">'+MARK[row.mark][1]+'</span></div>'
      +'<div class="mm-bz-duel-n"><span><small>じぶん</small><b>'+row.me+'</b></span><i>対</i><span><small>'+esc(foe.name)+'</small><b>'+row.foe+'</b></span></div></div>';
    h+=UI.qz.qHtml(q,"MM.ui.bzAns",s.sen);
    return h+'</div>';
  };
  UI.bzAns=function(v){
    var c=UI.ctx(), s=UI.bzS.bout; if(!s||s.fb)return;
    var q=G.qById(s.qids[s.i]), ms=Date.now()-(s.t0||Date.now()), ok;
    if(q.sentaku){ var sp=UI.qz.senPick(q,s.sen,v); if(!sp.done){ UI.render(); return; } ok=sp.ok; } else ok=UI.qz.judgeQ(q,v);
    var r=BZ().round(c,s,ok,ms), foe=D().bzAt(s.foe), ks=D().kstat[r.k]; save();
    sfx(r.win?"correct":"wrong",c.mm.combo); UI.play({haptic:r.win?"light":"medium"});
    var how=r.ok?(r.quick?'はやい正解 ×1.1':'正解 そのまま'):'まちがい ×0.5';
    s.fb='<div class="mm-stamp '+(r.ok?'mm-stamp-ok':'')+'">'+(r.ok?'⭕ 正解！':'❌ ざんねん')+'</div>'
      +'<div class="mm-bz-duel mm-bz-duel-'+(r.win?'win':'lose')+'"><div class="mm-bz-duel-k">'+ks.icon+' '+ks.name+' <span class="mm-sub">'+r.base+' → '+how+'</span></div>'
      +'<div class="mm-bz-duel-n"><span><small>じぶん</small><b>'+r.me+'</b></span><i>'+(r.win?'＞':'＜')+'</i><span><small>'+esc(foe.name)+'</small><b>'+r.foe+'</b></span></div>'
      +'<div class="mm-bz-duel-r">'+(r.win?'この1本 とった！':'この1本 とられた…')+'</div></div>'
      +UI.qz.explainHtml(q,v,s.sen)
      +'<button class="mm-cta" onclick="MM.ui.bzNext()">'+(r.over?'結果へ ▶':'つぎの一本 ▶')+'</button>';
    s.over=r.over; UI.render();
  };
  UI.bzNext=function(){
    var s=UI.bzS.bout; if(!s)return UI.go("bz");
    if(s.over){ var c=UI.ctx(); UI.bzS.res=BZ().finish(c,s); UI.bzS.bout=null; save(); UI.go("bzRes"); return; }
    s.fb=null; s.sen={picks:[]}; s.t0=Date.now(); UI.render(); try{ G.scrollTo(0,0); }catch(e){}
  };

  /* ---------- 結果: 勝ち負け・星取り・番付の上がり下がり ---------- */
  UI.screens.bzRes=function(){
    var c=UI.ctx(), r=UI.bzS.res; if(!r)return UI.screens.bz();
    var st=BZ().state(c), K=D().kstat;
    var h='<div class="mm-wrap '+(r.won?'mm-fx3':'')+'">'+UI.resBar2(c)
      +'<div class="mm-stamp '+(r.won?'mm-stamp-ok':'')+'" style="font-size:24px">'+(r.won?'🏆 勝ち！':'負け…')+' <span style="font-size:18px">'+r.w+' - '+r.l+'</span></div>';
    h+='<div class="mm-q mm-bz-table">';
    r.rounds.forEach(function(x){ h+='<div class="mm-bz-rr"><span class="mm-bz-sn">'+K[x.k].icon+' '+K[x.k].name+'</span><span>'+(x.ok?'⭕':'❌')+'</span><span class="mm-bz-rn"><b>'+x.me+'</b> '+(x.win?'＞':'＜')+' '+x.foe+'</span>'+(x.win?'<i class="mm-bz-w">○</i>':'<i class="mm-bz-l">●</i>')+'</div>'; });
    h+='</div><div class="mm-live mm-live-taunt">🗣 '+esc(r.rival.boss)+'「'+esc(r.say)+'」</div>';
    if(r.promo)h+='<div class="mm-gbloom mm-bz-move">'+(r.promo.won?'🎉 昇進！ <b>'+D().danOf(r.to).name+'</b> に上がった(60枚中 '+r.to+'枚目)':'昇進ならず。つよくなって、もう一度いどもう')+'</div>';
    if(r.basho){ var b=r.basho; h+='<div class="mm-gbloom mm-bz-move'+(b.delta<0?' mm-bz-down':'')+'">第'+b.no+'場所 <b>'+b.w+'勝'+b.l+'敗</b> → '
      +(b.delta>0?'⬆ '+b.delta+'枚あがった！('+(b.from>60?'番付の外':b.from+'枚目')+' → <b>'+b.to+'枚目</b>)':(b.delta<0?'⬇ 1枚さがった('+b.from+'枚目 → '+b.to+'枚目)':'そのまま('+(b.to>60?'番付の外':b.to+'枚目')+')'))+'</div>'; }
    else if(!r.promo)h+='<div class="mm-q mm-bz-top"><div class="mm-bz-home-s">第'+st.basho+'場所 '+stars(st)+' <span class="mm-sub">'+st.w+'勝'+st.l+'敗・あと'+st.bashoLeft+'番</span></div></div>';
    if(r.story)h+='<div class="mm-gbloom">📖 物語が1話 ひらいた(第'+r.story+'話)</div>';
    if(!r.won)h+='<div class="mm-say-card">'+MM.px("m01",24)+'<span>'+(r.rounds.some(function(x){ return !x.ok; })?'正解がふえれば とれる本数がふえるモン。':'つよさで負けたモン。けいこで育てて出直そう！')+'</span></div>';
    h+='<button class="mm-cta" onclick="MM.ui.go(\'bz\')">番付へ ▶</button><button class="small-btn mm-gback" onclick="MM.ui.go(\'h2\')">ホームへ</button></div>';
    if(r.won)setTimeout(function(){ sfx("fanfare"); },300);
    return h;
  };
})();
