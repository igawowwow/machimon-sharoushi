"use strict";
/* ============================================================
   machimon/ui/story.js — 物語「消えた看板」を読む画面
   ★1話は4〜6行。画面のどこをタップしても 1行ずつ進む(前の行は うすく残る=読み返せる)。
   ★ひらくのは core/banzuke.js(はじめて勝った日・段を上がった日)。ここは読むだけ。
   ★読んだ話は「きろく」から いつでも読み返せる。まだ ひらいていない話は題も見せない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var M=function(){ return MM.mon; }, D=function(){ return MM.DATA; };
  var esc=function(s){ return UI.esc(s); };
  function save(){ MM.game.save(); }
  UI.v2ok.st=1;
  UI.stS={ep:1,line:0};

  function opened(c){ return MM.banzuke.Z(c).story; }
  /* 話す人の 名前と絵 */
  function who(ep,w){
    if(w==="m")return {name:"マチノコ",pic:MM.px("m01",44)};
    if(w==="y")return {name:D().YOKOZUNA.boss,pic:'<span class="mm-bz-flip">'+MM.px(D().bzAt(1).kind,44)+'</span>'};
    if(w==="b"){ var rv=D().bzRival(ep.rival), gate=null; D().banzuke.forEach(function(b){ if(b.gate&&b.rival===ep.rival)gate=b; });
      return {name:rv.boss,pic:gate?'<span class="mm-bz-flip">'+MM.px(gate.kind,44)+'</span>':''}; }
    return null;
  }
  function lineHtml(ep,ln,cls){
    var p=who(ep,ln.w);
    if(!p)return '<div class="mm-st-n '+cls+'">'+esc(ln.t)+'</div>';
    return '<div class="mm-st-l mm-st-w'+ln.w+' '+cls+'"><span class="mm-st-pic">'+p.pic+'</span><span class="mm-st-b"><b>'+esc(p.name)+'</b><span>'+esc(ln.t)+'</span></span></div>';
  }
  UI.storyRead=function(no,back){ UI.stS={ep:no,line:0,back:back||"r2"}; UI.go("st"); };
  UI.screens.st=function(){
    var c=UI.ctx(), S=UI.stS, ep=D().storyEp(S.ep);
    if(!ep||S.ep>opened(c))return UI.screens.r2();
    var n=ep.lines.length, i=Math.min(S.line,n-1), last=i>=n-1, h='';
    h+='<div class="mm-wrap mm-st" onclick="MM.ui.storyTap()">'
      +'<div class="mm-st-head"><span class="mm-st-ser">'+esc(D().STORY.title)+'</span><b>第'+ep.no+'話 '+esc(ep.title)+'</b><span class="mm-sub">'+esc(ep.when)+'</span></div>'
      +'<div class="mm-st-body">';
    for(var k=0;k<=i;k++)h+=lineHtml(ep,ep.lines[k],k===i?'mm-st-now bin':'mm-st-old');
    h+='</div><div class="mm-st-dots">'+ep.lines.map(function(x,k){ return '<i class="'+(k<=i?'mm-on':'')+'"></i>'; }).join('')+'</div>';
    if(last){
      var more=ep.no<D().STORY.eps.length;
      h+='<div class="mm-st-end">'+(more?'つづきは、つぎの段に上がった日に。':'おしまい。番付は つづく。横綱を守ろう。')+'</div>'
        +'<button class="mm-cta" onclick="event.stopPropagation();MM.ui.storyClose()">とじる</button>';
    }else h+='<div class="mm-st-tap">▼ タップで つぎへ</div>';
    return h+'</div>';
  };
  UI.storyTap=function(){
    var S=UI.stS, ep=D().storyEp(S.ep); if(!ep)return;
    if(S.line<ep.lines.length-1){ S.line++; try{ if(MM.sfx)MM.sfx.tap(); }catch(e){} UI.render(); try{ G.scrollTo(0,G.document.body.scrollHeight); }catch(e2){} }
  };
  UI.storyClose=function(){
    var c=UI.ctx(), g=M().W(c), S=UI.stS;
    if(S.ep>g.sread){ g.sread=S.ep; save(); }
    UI.go(S.back||"r2");
  };
  /* 取組の結果に出す「読む」ボタン */
  UI.storyOpenBtn=function(no){
    var ep=D().storyEp(no); if(!ep)return '';
    return '<button class="mm-cta mm-st-open" onclick="MM.ui.storyRead('+no+',\'bz\')">📖 物語が ひらいた<span class="mm-sub">第'+no+'話「'+esc(ep.title)+'」を読む ▶</span></button>';
  };
  /* ホーム: まだ読んでいない話があるときだけ出す1行 */
  UI.storyHome=function(c){
    var g=M().W(c), op=opened(c); if(op<=g.sread)return '';
    var ep=D().storyEp(g.sread+1); if(!ep)return '';
    return '<button class="mm-st-new" onclick="MM.ui.storyRead('+ep.no+',\'h2\')">📖 あたらしい話 <b>第'+ep.no+'話「'+esc(ep.title)+'」</b> ▶</button>';
  };
  /* きろく: 物語の一覧(ひらいた話は読み返せる。まだの話は「？」) */
  UI.storyList=function(c){
    var g=M().W(c), op=opened(c), E=D().STORY.eps, DAN=D().DAN;
    var h='<div class="mm-h" style="font-size:14px">📖 物語「'+esc(D().STORY.title)+'」 <span class="mm-sub">'+op+'/'+E.length+'話</span></div><div class="mm-q mm-st-list">';
    E.forEach(function(ep){
      if(ep.no<=op)h+='<button class="mm-st-row" onclick="MM.ui.storyRead('+ep.no+',\'r2\')"><b>第'+ep.no+'話</b><span>'+esc(ep.title)+(ep.no>g.sread?' <i class="mm-gdot mm-st-dot">まだ</i>':'')+'</span><i>読む ▶</i></button>';
      else h+='<div class="mm-st-row mm-st-lock"><b>第'+ep.no+'話</b><span>？？？</span><i>'+(ep.no===1?'はじめて勝つと ひらく':DAN[ep.no-1].name+'に上がると ひらく')+'</i></div>';
    });
    return h+'</div>';
  };
})();
