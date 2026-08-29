"use strict";
/* ============================================================
   machimon/ui/boss.js — ボス(単元テスト・過去問・模試)
   ★ダメージ=正解。難問と期限到来の復習はCritical。コンボで最大+50%。
   ★敗北にペナルティを置かない。失うものは無く、弱点だけが街の掲示板に残る。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var g=null,t0=0;

  UI.screens.boss=function(){
    var c=UI.ctx(), esc=UI.esc;
    if(g)return fight(c);
    var list=MM.boss.list(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">⚔️ ボス</div>'
      +'<div class="mm-q" style="font-size:12px">ボス戦は単元テストです。正解がそのままダメージになります。'
      +'<div class="mm-sub">負けても失うものはありません(弱点が分かるだけです)</div></div>';
    if(!list.length)h+='<div class="mm-q">まだ挑めるボスがいません。</div>';
    for(var i=0;i<list.length;i++){
      var b=list[i].def, ck=list[i].can, rec=list[i].rec;
      h+='<button class="mm-inc" style="animation:none" onclick="MM.ui.bossStart(\''+b.id+'\')">'
        +'<span class="mm-line">'+esc(b.name)+'</span>'
        +'<span class="mm-sub"> '+esc(kindName(b.kind))+' / '+b.q+'問 / 挑戦に ✨'+b.ke+'</span><br>'
        +'<span class="mm-sub">'+(ck.ok?'挑戦できます':reason(ck))+(rec.clears?' ・撃破'+rec.clears+'回':'')+'</span>'
        +'</button>';
    }
    return h+'</div>'+UI.tabs("boss");
  };
  function kindName(k){ return k==="raid"?"模試(9科目)":(k==="mid"?"過去問":"単元テスト"); }
  function reason(ck){
    if(ck.why==="mastery")return "習熟度 "+ck.now+"% / "+ck.need+"% 必要です";
    if(ck.why==="ke")return "知識エネルギー "+ck.now+" / "+ck.need+" 必要です";
    if(ck.why==="area")return "エリアが未解放です";
    return "まだ挑めません";
  }

  UI.bossStart=function(id){
    var c=UI.ctx();
    g=MM.boss.start(c,id);
    if(!g)return UI.go("boss");
    MM.game.save();
    UI.go("boss");
  };

  function fight(c){
    var esc=UI.esc;
    var b=MM.boss.def(g.boss);
    var qid=g.qids[g.i];
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q||g.i>=g.qids.length||g.hp<=0)return finish(c);
    t0=Date.now();
    var pct=Math.round(g.hp/g.max*100);
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">⚔️ '+esc(b.name)+' <span class="mm-sub">'+(g.i+1)+' / '+g.qids.length+'問</span></div>'
      +'<div class="mm-hp"><i style="width:'+pct+'%"></i></div>'
      +'<div class="mm-say">「'+esc(b.line)+'」</div>'
      +'<div class="mm-q">'+esc(q.q||q.question||"")+'</div>'
      +'<div class="mm-ans">'
      +'<button onclick="MM.ui.bossAnswer(true)" aria-label="まる">◯</button>'
      +'<button onclick="MM.ui.bossAnswer(false)" aria-label="ばつ">✕</button>'
      +'</div>'
      +'<div class="mm-combo">'+(g.combo?'🔥 '+g.combo+'れんぞく':'')+'</div>'
      +'</div>';
    return h;
  }

  UI.bossAnswer=function(v){
    if(!g)return UI.go("boss");
    var c=UI.ctx();
    var qid=g.qids[g.i];
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    var ans=q&&(typeof q.a==="boolean")?q.a:!!(q&&q.answer);
    var ok=(v===ans);
    var r=MM.game.bossStep({ST:c.ST},g,ok,t0?Date.now()-t0:0);
    UI.play(r.audio);
    var box=G.document.getElementById("app");
    if(!box)return;
    var esc=UI.esc;
    box.innerHTML='<div class="mm-wrap '+UI.fxClass(r.audio)+'">'+UI.resBar(c)
      +'<div class="mm-h">'+(ok?(r.res.crit?'💥 クリティカル！ '+r.res.dmg:'⚔️ '+r.res.dmg+' ダメージ'):'🛡 ダメージを与えられなかった')+'</div>'
      +(ok?'':'<div class="mm-q">'+esc(q&&(q.e||q.explanation)||"")+'</div>')
      +'<button class="small-btn" style="width:100%;min-height:52px" onclick="MM.ui.bossNext()">つづける</button></div>';
    if(ok)setTimeout(function(){ UI.bossNext(); },700);
  };
  UI.bossNext=function(){
    if(!g)return UI.go("boss");
    if(g.hp<=0||g.i>=g.qids.length){ UI.render(); return; }
    UI.render();
  };

  function finish(c){
    var esc=UI.esc;
    var r=MM.boss.finish(c,g);
    var b=MM.boss.def(g.boss);
    g=null;
    MM.game.save();
    var h='<div class="mm-wrap '+(r.win?"mm-fx3":"")+'">'+UI.resBar(c)
      +'<div class="mm-h">'+(r.win?'🏆 '+esc(b.name)+' を撃破！':'💤 今回は届きませんでした')+'</div>';
    if(r.win){
      h+='<div class="mm-q"><span class="mm-gain">🪙'+r.gain.g+' ✨'+r.gain.ke+' 🧩'+r.gain.mat+' 🥚'+r.gain.tama+'</span>'
        +'<div class="mm-sub">正解 '+r.hits+' 問</div></div>';
    }else{
      h+='<div class="mm-q">正解 '+r.hits+' 問。<div class="mm-sub">間違えた問題は、街の事件としてまた現れます。'
        +'失ったものは何もありません。</div></div>';
    }
    h+='<button class="small-btn" style="width:100%;min-height:52px" onclick="MM.ui.go(\'boss\')">もどる</button></div>';
    return h;
  }
})();
