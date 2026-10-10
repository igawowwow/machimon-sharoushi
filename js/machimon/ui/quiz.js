"use strict";
/* ============================================================
   machimon/ui/quiz.js — 問題の出し方・判定・解説(けいこ と 取組で共通)と、実力メーター
   ★○×／五肢択一／個数／選択式 を1つの部品で扱う。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;
  var esc=function(s){ return UI.esc(s); };
  function qText(q){ return q.q||q.question||""; }
  var KANA=["ア","イ","ウ","エ","オ"];
  /* 問題の表示。st=選択式の途中状態 */
  function qHtml(q,fn,st){
    var h="", tag=q.sentaku?"選択式":(q.kosuu?"個数問題":(q.nendo?"年度別過去問形式":(q.examFmt?"五肢択一":"")));
    if(tag)h+='<div class="mm-gexam">📝 本試験形式: '+tag+'</div>';
    if(q.sentaku){
      var picks=(st&&st.picks)||[], k=picks.length, keys=q.blanks.map(function(b){ return b.key; });
      var body=esc(q.passage).replace(/\[\[([A-E])\]\]/g,function(m0,key){ var i=keys.indexOf(key); return i<k?'<b class="mm-gblank mm-gblank-on">'+key+':'+esc(q.options[picks[i]])+'</b>':'<b class="mm-gblank'+(i===k?' mm-gblank-now':'')+'">'+key+'</b>'; });
      h+='<div class="mm-q" style="font-size:14px">'+esc(qText(q))+'<div class="mm-gpass">'+body+'</div></div>';
      h+='<div class="mm-sub" style="text-align:center">空欄 <b>'+keys[k]+'</b> に入る語句を選ぶ('+(k+1)+'/'+keys.length+')</div><div class="mm-gopts">';
      q.options.forEach(function(o,i){ h+='<button onclick="'+fn+'('+i+')">'+esc(o)+'</button>'; });
      return h+'</div>';
    }
    h+='<div class="mm-q">'+esc(qText(q))+'</div>';
    if(q.statements){ h+='<div class="mm-q mm-gstmts">'; q.statements.forEach(function(x,i){ h+='<div><b>'+KANA[i]+'</b> '+esc(x.t)+'</div>'; }); h+='</div>'; }
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      h+='<div style="display:grid;gap:8px">';
      for(var i=0;i<q.choices.length;i++){ var ch=q.choices[i]; h+='<button class="mm-slot" style="min-height:52px;text-align:left" onclick="'+fn+'('+i+')">'+(i+1)+'. '+esc(typeof ch==="string"?ch:(ch.t||ch.text||""))+'</button>'; }
      return h+'</div>';
    }
    return h+'<div class="mm-ans"><button onclick="'+fn+'(true)" aria-label="まる">◯</button><button onclick="'+fn+'(false)" aria-label="ばつ">✕</button></div>';
  }
  function judgeQ(q,v){
    if(q.choices&&q.choices.length&&q.format!=="true_false"){
      var ch=q.choices[v]; if(ch&&typeof ch==="object"&&"ok" in ch)return !!ch.ok;
      var ci=(typeof q.answerIndex==="number")?q.answerIndex:(typeof q.correctIndex==="number"?q.correctIndex:-1);
      if(ci<0&&q.choices[0]&&typeof q.choices[0]==="object"){ for(var i=0;i<q.choices.length;i++)if(q.choices[i].correct)ci=i; }
      return v===ci;
    }
    var ans=(typeof q.a==="boolean")?q.a:!!q.answer; return v===ans;
  }
  /* 選択式: 1つ選ぶたびに呼ぶ。5つ埋まったら {done,ok,hits} */
  function senPick(q,st,i){ st.picks=st.picks||[]; st.picks.push(i); if(st.picks.length<q.blanks.length)return {done:false};
    var hits=0; q.blanks.forEach(function(b,k){ if(st.picks[k]===b.ok)hits++; }); return {done:true,hits:hits,ok:hits>=3}; }
  /* 解説(形式ごと) */
  function explainHtml(q,v,st){
    var h='<div class="mm-q" style="font-size:13px;padding:10px">';
    if(q.sentaku){ q.blanks.forEach(function(b,k){ var ok=st&&st.picks&&st.picks[k]===b.ok; h+='<div>'+(ok?'⭕':'❌')+' <b>'+b.key+'：'+esc(q.options[b.ok])+'</b> <span class="mm-sub">'+esc(b.law||"")+'</span><br><span class="mm-sub">'+esc(b.why||"")+'</span></div>'; }); }
    else if(q.choices&&q.choices.length&&q.format!=="true_false"){
      if(q.statements)q.statements.forEach(function(x,i){ h+='<div>'+(x.ok?'⭕':'❌')+' <b>'+KANA[i]+'</b> <span class="mm-sub">'+esc(x.why||"")+'</span></div>'; });
      q.choices.forEach(function(ch,i){ if(typeof ch!=="object"||!ch.why)return; h+='<div>'+(ch.ok?'⭕ 正解 ':'')+(i===v?'👉 ':'')+'<b>'+(i+1)+'.</b> <span class="mm-sub">'+esc(ch.why)+'</span></div>'; });
      if(!q.statements&&!q.choices.some(function(ch){ return ch&&ch.why; })){ var ci=-1; q.choices.forEach(function(ch,i){ if(ch&&ch.ok)ci=i; }); if(ci>=0)h+='<div>⭕ 正解は '+(ci+1)+'</div>'; }
    } else {
      var ez=String(q.easyExplanation||""), rl=String(q.e||q.explanation||"");
      h+=ez?('<div style="font-size:14px;line-height:1.75">💡 '+esc(ez)+'</div>'+(rl?'<div class="mm-sub" style="margin-top:8px">📐 ルール: '+esc(rl)+'</div>':'')):('💡 '+esc(rl));
    }
    if(q.memoryPoint)h+='<div class="mm-gmemo">🧠 覚えどころ: '+esc(q.memoryPoint)+'</div>';
    if(q.trap)h+='<div class="mm-sub">⚠ ひっかけ: '+esc(q.trap)+'</div>';
    return h+'</div>';
  }
  UI.qz={ qHtml:qHtml, judgeQ:judgeQ, senPick:senPick, explainHtml:explainHtml };

  /* 実力メーター(きろく)。タップで科目ごとの内わけを開く */
  UI.pmOpen=false;
  UI.passCard=function(c){
    var pm=MM.exam.meter(c), n=G.SUBJECTS||[];
    var h='<button class="mm-gpassm" onclick="MM.ui.pmOpen=!MM.ui.pmOpen;MM.ui.render()"><span>📈 実力メーター <b>'+pm.avg+'%</b> <span class="mm-sub">目標 '+pm.line+'% ・ いちばん弱い: '+esc(n[pm.low.sub]||"")+' '+pm.low.v+'%</span></span>'
      +'<span class="mm-gpbar"><i style="width:'+pm.avg+'%"></i><b style="left:'+pm.line+'%"></b></span>';
    if(UI.pmOpen){ pm.subs.forEach(function(x){ h+='<span class="mm-gpsub"><span>'+esc(n[x.sub]||"")+'</span><span class="mm-gpbar"><i style="width:'+x.v+'%;background:'+(x.v>=pm.line?'#3E9B4F':(x.v>=40?'#F2B31B':'#D8534F'))+'"></i><b style="left:'+pm.line+'%"></b></span><i>'+x.v+'%</i></span>'; });
      h+='<span class="mm-sub">○×の習熟と、本試験形式(択一・個数・選択式)の正答から出した目安。どの科目も 目標の線へ。</span>'; }
    return h+'</button>';
  };
})();
