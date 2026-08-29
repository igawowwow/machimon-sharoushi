"use strict";
/* ============================================================
   machimon/ui/gacha.js — ガチャ画面(1回/10連・演出・結果)
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var RN=["N","R","SR","SSR","UR"], RC=["#8A8494","#5B8DFF","#8A6FD1","#FFC53C","#FF5A5A"];

  UI.screens.gacha=function(p){
    var c=UI.ctx(), esc=UI.esc, g=c.mm.res.g;
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-gacha-hero"><div class="mm-gacha-ball">🔮</div><div class="mm-intro-logo" style="font-size:22px">マチモンガチャ</div>'
      +'<div class="mm-sub">全30種・ダブりは 🧩才能結晶 になる(引き損なし)</div>'
      +((c.mm.tix||0)>0?'<div class="mm-tix">🎫 ガチャチケット <b>'+c.mm.tix+'</b>枚(図鑑の達成報酬・コイン不要)</div>':'')+'</div>'
      +'<div class="mm-q" style="padding:8px;font-size:12px;background:#FFF9E0">📣 街を進化させるのは <b>問題を解くこと</b>だけ。ガチャはマチモンを増やすおまけ。コインも解いた分しか増えない。</div>';
    var rate=MM.gacha.RATE;
    h+='<div class="mm-q" style="padding:10px;font-size:12px"><div class="mm-goal-row"><span>排出率</span><span>'
      +rate.map(function(r,i){ return '<b style="color:'+RC[i]+'">'+RN[i]+'</b> '+Math.round(r*100)+'%'; }).join(' / ')+'</span></div>'
      +'<div class="mm-goal-row" style="margin-top:4px"><span>天井</span><span>あと <b>'+Math.max(0,MM.gacha.PITY-(c.mm.pity||0))+'</b> 回でSR以上確定</span></div></div>';
    h+='<div style="display:grid;gap:10px;margin-top:8px">'
      +'<button class="mm-cta" '+(MM.gacha.canPull(c,1)?'':'disabled style="opacity:.5;animation:none"')+' onclick="MM.ui.pull(1)">1回引く '+((c.mm.tix||0)>=1?'🎫1':'🪙'+MM.gacha.COST1)+'</button>'
      +'<button class="mm-cta" style="background:linear-gradient(135deg,#FFE1EB,#FFF3C4)" '+(MM.gacha.canPull(c,10)?'':'disabled style="opacity:.5;animation:none"')+' onclick="MM.ui.pull(10)">10連 '+((c.mm.tix||0)>=10?'🎫10':'🪙'+MM.gacha.COST10)+' <span class="mm-sub">SR以上1体確定</span></button>'
      +(g<MM.gacha.COST1&&!(c.mm.tix||0)?'<div class="mm-sub" style="text-align:center">🪙 あと '+(MM.gacha.COST1-g)+' — 事件を解決するとコインが入る</div>':'')
      +'</div>';
    return h+'</div>'+UI.tabs("gacha");
  };

  UI.pull=function(n){
    var c=UI.ctx();
    var res=MM.gacha.pull(c,n);
    if(!res)return UI.go("gacha");
    var got=MM.zukan?MM.zukan.claim(c):[];
    MM.game.save();
    var box=G.document.getElementById("app"); if(!box)return;
    UI.pendingCele=got;
    var top=Math.max.apply(null,res.map(function(r){ return r.rar; }));
    /* ドラムロール → 開封 */
    if(MM.sfx)MM.sfx.roll(8);
    box.innerHTML='<div class="mm-wrap mm-gacha-stage"><div class="mm-gacha-ball mm-gacha-shake" style="font-size:96px">🔮</div><div class="mm-sub" style="text-align:center">…</div></div>';
    setTimeout(function(){
      if(MM.sfx)MM.sfx.reveal(top);
      UI.play({haptic:top>=3?"heavy":"medium"});
      var h='<div class="mm-wrap '+(top>=3?"mm-fx3":"mm-fx2")+'"><div class="mm-h" style="justify-content:center">'+(n>=10?'10連の結果':'ガチャの結果')+'</div>'
        +'<div class="mm-gacha-grid'+(n===1?' mm-one':'')+'">';
      res.forEach(function(r,i){
        h+='<div class="mm-card mm-r'+r.rar+'" style="animation-delay:'+(i*.12)+'s">'
          +'<div class="mm-card-rar" style="background:'+RC[r.rar]+'">'+RN[r.rar]+'</div>'
          +MM.px(r.sp,n===1?120:64,(r.rar>=3?"mm-hop":""))+'<b>'+UI.esc(r.name)+'</b>'
          +(r.dupe?'<span class="mm-sub">ダブり → 🧩+'+r.mat+'</span>':'<span class="mm-new">NEW!</span>')+'</div>';
      });
      h+='</div><div style="display:grid;gap:8px;margin-top:12px">'
        +'<button class="mm-cta" onclick="MM.ui.go(\'gacha\')">もう一度 ▶</button>'
        +'<button class="small-btn" style="min-height:44px" onclick="MM.ui.go(\'town\')">街へもどる</button></div></div>';
      box.innerHTML=h;
      var pc=UI.pendingCele; UI.pendingCele=null;
      if(pc&&pc.length&&UI.celebrate)setTimeout(function(){ UI.celebrate({icon:"📖",title:pc[0].title,sub:"🎫 ガチャチケット +"+pc.reduce(function(a,x){return a+x.tix;},0)+"枚",sfx:"big"}); },600);
    },900);
  };
})();
