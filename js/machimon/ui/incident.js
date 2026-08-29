"use strict";
/* ============================================================
   machimon/ui/incident.js — 事件(問題を解く画面)
   ★導入は1行だけ。問題文・解説は既存の教材をそのまま使い、改変しない。
   ★正解したら「次へ」を押させず、自動で街へ戻る(1タップでも減らす)。
     誤答時だけ解説を自動展開する(理解の機会を逃さない)。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  var t0=0;

  UI.screens.incident=function(p){
    var c=UI.ctx(), esc=UI.esc;
    var inc=MM.incident.find(c,p.id);
    if(!inc)return UI.screens.town();
    var qid=inc.qids[0];
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q)return UI.screens.town();
    var k=MM.DATA.incKindById[inc.kind]||{badge:"",color:"#8A8494"};
    var a=MM.DATA.areaById[inc.area]||{name:""};
    t0=Date.now();
    var h='<div class="mm-wrap">'+UI.resBar(c)
      +'<div class="mm-h">'+esc(a.name)
      +' <span class="mm-badge" style="background:'+k.color+';color:#fff;font-size:10px;border-radius:8px;padding:1px 6px">'+esc(k.badge)+'</span></div>'
      +'<div class="mm-say">'+speaker(c,inc)+'「'+esc(inc.line)+'」</div>'
      +'<div class="mm-q">'+esc(q.q||q.question||"")+'</div>';
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      h+='<div style="display:grid;gap:8px">';
      for(var i=0;i<q.choices.length;i++){
        h+='<button class="mm-slot" style="min-height:52px" onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+','+i+')">'
          +(i+1)+'. '+esc(typeof q.choices[i]==="string"?q.choices[i]:(q.choices[i].text||""))+'</button>';
      }
      h+='</div>';
    }else{
      h+='<div class="mm-ans">'
        +'<button onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+',true)" aria-label="まる">◯</button>'
        +'<button onclick="MM.ui.answer(\''+esc(inc.id)+'\','+JSON.stringify(qid)+',false)" aria-label="ばつ">✕</button>'
        +'</div>';
    }
    h+='<div class="mm-combo">'+(c.mm.combo?'🔥 '+c.mm.combo+'れんぞく':'')+'</div>';
    h+='</div>';
    return h;
  };

  /* 解答 → 学習の確定・報酬・演出。正解なら1.1秒で自動的に街へ戻る */
  UI.answer=function(incId,qid,v){
    var c=UI.ctx();
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    if(!q)return UI.go("town");
    var ok=judge(q,v);
    var ms=t0?(Date.now()-t0):0;
    var r=MM.game.answer({ST:c.ST},incId,qid,ok,ms);
    UI.play(r.audio);
    UI.result(r,q,ok,incId);
  };
  function judge(q,v){
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      var ci=(typeof q.answerIndex==="number")?q.answerIndex:(typeof q.correctIndex==="number"?q.correctIndex:-1);
      if(ci<0&&q.choices[0]&&typeof q.choices[0]==="object"){
        for(var i=0;i<q.choices.length;i++)if(q.choices[i].correct)ci=i;
      }
      return v===ci;
    }
    var ans=(typeof q.a==="boolean")?q.a:!!q.answer;
    return v===ans;
  }

  /* 相談に来た住民: そのエリアのマチモン(いなければ持っている子)が話者になる */
  function speaker(c,inc){
    var pick=null;
    for(var uid in c.mm.mons){
      var sp=MM.DATA.speciesById[c.mm.mons[uid].sp];
      if(!sp)continue;
      if(sp.sub===inc.sub){ pick=c.mm.mons[uid].sp; break; }
      if(!pick)pick=c.mm.mons[uid].sp;
    }
    return pick?(MM.px(pick,26)+' '):'';
  }

  /* 結果表示。正解=小さく短く / 誤答=解説を自動展開(責めずに、理解へ渡す) */
  UI.result=function(r,q,ok,incId){
    var box=G.document&&G.document.getElementById?G.document.getElementById("app"):null;
    if(!box)return;
    var esc=UI.esc, g=r.gain;
    var fx=UI.fxClass(r.audio);
    var h='<div class="mm-wrap '+fx+'">'+UI.resBar(r.c)
      +'<div class="mm-h">'+(ok?"✅ 事件を解決しました":"🤔 もういちど確かめよう")+'</div>';
    if(ok){
      h+='<div class="mm-q" style="padding:10px"><span class="mm-gain">🪙'+g.g+' 📘'+g.xp
        +(g.ke?' <b style="color:#B58900">✨'+g.ke+'</b>':'')+(g.mat?' 🧩'+g.mat:'')+(g.tama?' 🥚'+g.tama:'')+'</span>'
        +'<div class="mm-sub" style="margin-top:4px">'+cheer(r.c)+esc(r.flavor)+'</div>';
      if(r.reward.novelty<1)h+='<div class="mm-sub">今日すでに解いた問題です(報酬は控えめ)</div>';
      if(r.reward.timing>=1.6)h+='<div class="mm-sub">忘れかけていた問題を思い出せました</div>';
      if(r.reward.fluke)h+='<div class="mm-sub">早すぎる解答でした。読んでから答えると身につきます</div>';
      h+='</div>';
    }else{
      h+='<div class="mm-q">'+explain(q,false)+'</div>';
    }
    /* マイルストーン(Day1)は演出の中の1行だけで教える */
    for(var i=0;i<r.milestones.length;i++){
      h+='<div class="mm-q" style="padding:10px;background:linear-gradient(135deg,#FFF9E0,#FFF)">✨ '
        +esc(r.milestones[i].say)+'</div>';
      var ex=r.milestones[i].extra;
      if(ex&&ex.uid){ UI.pendingHatch=ex; }
    }
    if(r.lvUp&&r.lvUp.length)h+='<div class="mm-sub">👾 マチモンがレベルアップしました</div>';
    h+='<div style="display:flex;gap:8px;margin-top:12px">'
      +'<button class="small-btn" style="flex:1;min-height:48px" onclick="MM.ui.after()">街へもどる</button>'
      +(ok?'<button class="small-btn" style="flex:1;min-height:48px" onclick="MM.ui.detail('+JSON.stringify(q.id)+')">くわしく</button>':'')
      +'</div></div>';
    box.innerHTML=h;
    if(ok){ clearTimeout(UI._t); UI._t=setTimeout(function(){ UI.after(); },1100); }
  };
  /* 解決を喜ぶ住民(所持マチモンから1体) */
  function cheer(c){
    var uids=Object.keys(c.mm.mons);
    if(!uids.length)return "";
    var m=c.mm.mons[uids[Math.floor(Math.random()*uids.length)]];
    return '<span class="mm-hop" style="display:inline-block;margin-right:4px">'+MM.px(m.sp,24)+'</span>';
  }

  UI.after=function(){
    clearTimeout(UI._t);
    if(UI.pendingHatch){ var p=UI.pendingHatch; UI.pendingHatch=null; return UI.go("hatch",{uid:p.uid,rare:p.rare}); }
    UI.go("town");
  };
  /* 解説は既存の3層解説(ui-explain.js)を使う。無ければ問題データの解説文へ落とす。
     理解チェック・自己評価・用語ポップアップが参照する共有状態(expQ/fbQid/fbGood)も
     ここで渡す=解説の対話部品がMACHIMON内で完全に動く(画面遷移は起きない) */
  function explain(q,ok){
    try{ expQ=q; fbQid=q.id; fbGood=!!ok; }catch(e){}
    try{ if(typeof G.explainHtml==="function")return G.explainHtml(q,!!ok); }catch(e){}
    return UI.esc(q.e||q.explanation||"");
  }
  UI.detail=function(qid){
    clearTimeout(UI._t);
    var q=(typeof G.qById==="function")?G.qById(qid):null;
    var box=G.document.getElementById("app");
    if(!box||!q)return;
    box.innerHTML='<div class="mm-wrap">'+UI.resBar(UI.ctx())+'<div class="mm-q">'+explain(q,true)+'</div>'
      +'<button class="small-btn" style="width:100%;min-height:48px;margin-top:12px" onclick="MM.ui.go(\'town\')">街へもどる</button></div>';
  };
})();
