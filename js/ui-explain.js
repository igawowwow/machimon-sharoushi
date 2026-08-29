"use strict";
/* ============================================================
   ui-explain.js — 解説表示(v2: 初学者が上から読むだけで分かる構成)
   表示順: 結論 → 誤り箇所 → これは何の話? → 正しいルール
   → なぜ? → 具体例 → 理解チェック → 試験ポイント(既定で開く・根拠条文まで含む)
   → 分かった/なんとなく/まだ分からない(→再説明)
   v2フィールド(topicIntro等)が無い旧問題は従来の3層表示にフォールバック。
   ============================================================ */
let expQ=null; /* 表示中の問題(理解チェック・用語・再説明が参照) */

function expNextDue(qid){
  const st=ST.q[qid];if(!st||!st.due)return "";
  const d=st.due-todayNum();
  const s=d<=0?"今日":d===1?"明日":`${d}日後`;
  return `<span class="exp-due">🔁 次の復習: ${s}</span>`;
}
function expErrorHtml(q){
  if(!q.errorPart||q.a!==false)return "";
  const marked=esc(q.q).replace(esc(q.errorPart),`<mark class="exp-ng">${esc(q.errorPart)}</mark>`);
  return `<div class="exp-fix"><div class="exp-fix-q">${marked}</div>
    <div class="exp-fix-a">正しくは → <b>${esc(q.correction||"")}</b></div></div>`;
}
function expCompareHtml(q){
  if(!q.comparison)return "";
  return `<table class="exp-table">${q.comparison.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
}
/* 用語かんたん解説: タップしないと意味が出ない従来方式をやめ、意味まで常時表示する。
   問題固有の terms が無い問題は、問題文+解説から用語辞書の語を自動抽出して出す。 */
/* 表示上限。5 だと terms が6個ある8問(id=38/40/70/72/83/99/100/111)で6番目が黙って消え、
   そのうち5問は消えた用語を解説本文で使っていた(用語集にも無し)。現在の最大が6なので全部出す。
   増やすときは docs/qa/qa-data-audit.js の「画面に出ない用語」チェックが検知する。 */
const EXP_GLOSS_MAX=6;
function expGlossHtml(q){
  let rows;
  if(q.terms&&q.terms.length){
    rows=q.terms.slice(0,EXP_GLOSS_MAX).map((t,i)=>
      `<div class="exp-gloss-row" onclick="expTerm(${i})"><b>${esc(t.term)}</b>${esc(t.meaning)}${t.confuse||t.example?" <span class='gloss-more'>▶詳しく</span>":""}</div>`);
  }else{
    const src=(q.q||"")+"|"+(q.easyExplanation||q.e||"")+"|"+(q.ruleExplanation||"");
    const found=[...new Set(src.match(TERM_RE)||[])].slice(0,4);
    if(!found.length)return "";
    rows=found.map(t=>
      `<div class="exp-gloss-row" onclick="showTerm('${t}')"><b>${t}</b>${esc(GLOSSARY[t])}</div>`);
  }
  return `<div class="exp-gloss"><div class="exp-row">📖 <b>用語かんたん解説</b></div>${rows.join("")}</div>`;
}
/* 数字の強調: ひっかけの核は数字(50人/3年/25%…)なので自動でマーカーを引く */
function hlNums(s){
  return s.replace(/(\d[\d,.]*)(人|日分|日|年度|年|か月|カ月|%|割増|割|時間|万円|円|週間|週|回|歳|箇所|か所|等級|級|月)/g,
    '<b class="hl-num">$1$2</b>');
}
function expCheckHtml(q){
  if(!q.checkQ)return "";
  return `<div class="exp-check" id="expCheck">
    <div class="exp-row">✍️ <b>理解チェック</b> ${esc(q.checkQ.q)}</div>
    <div class="term-grid">${q.checkQ.choices.map((c,i)=>
      `<button class="btn term-chip" id="ck${i}" onclick="expCheck(${i})">${esc(c.t)}</button>`).join("")}</div>
    <div id="ckResult"></div></div>`;
}
function expRetellHtml(q){
  if(!q.retell)return "";
  /* 沼問題(何度も誤答)は初学者向けのやさしい説明を最初から展開 */
  const open=(typeof beginnerAuto==="function"&&beginnerAuto())||(typeof isLeech==="function"&&isLeech(q.id));
  return `<div class="exp-retell${open?" show":""}" id="expRetell"><b>🫶 もっとやさしく言うと…</b><br>${esc(q.retell)}</div>`;
}
/* 試験ポイント(殿要望2026-08-21)
   ・「🔍さらに詳しく」は使われないので廃止。中身(根拠条文・間違えやすい理由・法改正)は
     捨てずにこの試験ポイントへ合流させる=開く場所を1つに減らしつつ情報量は増やす。
   ・既定で開いた状態にする。畳めるが、畳まないと読めない情報は置かない。
   ・並びは「本番で効く順」: ひっかけ → 覚え方 → 間違えやすい理由 → 具体例 → 根拠条文 → 法改正。 */
function examPointHtml(q){
  const rows=[
    q.trap?`<div class="exp-row">⚠️ <b>試験のひっかけ</b> ${linkTerms(hlNums(esc(q.trap)))}</div>`:"",
    (q.memoryPoint||q.mnemonic)?`<div class="exp-row">🧠 <b>これだけ覚える</b> ${esc(q.memoryPoint||q.mnemonic)}</div>`:"",
    q.whyWrong?`<div class="exp-row">❓ <b>間違えやすい理由</b> ${esc(q.whyWrong)}</div>`:"",
    /* v2 は具体例を本文側で出しているので、旧形式のときだけここで出す(二重掲載を避ける) */
    (!q.topicIntro&&q.example)?`<div class="exp-row">🍞 <b>具体例</b> ${esc(q.example)}</div>`:"",
    q.source?`<div class="exp-row">🧾 <b>根拠</b> ${esc(q.source)}</div>`:"",
    q.lawAsOf?`<div class="exp-row">📅 <b>法令基準日</b> ${esc(q.lawAsOf)}</div>`:"",
    q.lawRevisionNote?`<div class="exp-row">🚨 <b>法改正ウォッチ</b> ${esc(q.lawRevisionNote)}</div>`:""
  ].join("");
  if(!rows)return "";
  return `<button class="exp-tg" onclick="expToggle(this,'expL2')">⚠️ 試験ポイント ▲</button>`+
    `<div class="exp-more open" id="expL2">${rows}</div>`;
}
/* --- 本体 --- */
function explainHtml(q,ok){
  const v2=!!q.topicIntro;
  const l1=q.easyExplanation||q.e||"";
  const parts=[];
  parts.push(`<div class="exp-l1">${linkTerms(hlNums(esc(l1)))}</div>`);
  if(!ok||q.a===false)parts.push(expErrorHtml(q));
  if(q.wrongPoint&&!ok)parts.push(`<div class="exp-row">❌ <b>どこが間違い?</b> ${esc(q.wrongPoint)}</div>`);
  if(q.comparison)parts.push(expCompareHtml(q)); /* 比較表は畳まず最初から見せる */
  if(v2){
    parts.push(`<div class="exp-story">💡 <b>これは何の話?</b> ${esc(q.topicIntro)}${q.situation?`<br>📍 ${esc(q.situation)}`:""}
      ${q.characters&&q.characters.length?`<div class="exp-chars">${q.characters.map(c=>`<span class="exp-char">${esc(c.name)}<small> ${esc(c.role)}</small></span>`).join("")}</div>`:""}</div>`);
    if(q.ruleExplanation)parts.push(`<div class="exp-row">📐 <b>正しいルール</b> ${linkTerms(hlNums(esc(q.ruleExplanation)))}</div>`);
    if(q.reason)parts.push(`<div class="exp-row">🤔 <b>なぜ?</b> ${esc(q.reason)}</div>`);
    if(q.example)parts.push(`<div class="exp-row">🍞 <b>具体例</b> ${esc(q.example)}</div>`);
    parts.push(expGlossHtml(q));
    parts.push(expCheckHtml(q));
    parts.push(examPointHtml(q));
    parts.push(expRetellHtml(q));
  }else{
    /* 旧形式フォールバック。ルール本文は畳まず先に出し、残りは試験ポイントへ集約する */
    if(q.easyExplanation&&q.ruleExplanation)
      parts.push(`<div class="exp-row">📐 <b>正しいルール</b> ${linkTerms(hlNums(esc(q.ruleExplanation)))}</div>`);
    parts.push(expGlossHtml(q));
    parts.push(examPointHtml(q));
  }
  /* 自己評価(理解度): 正解・誤答どちらでも1タップで申告→次回間隔に反映。スキップ可 */
  parts.push(`<div class="exp-foot">${expNextDue(q.id)}
    <div class="exp-self" id="expSelf">
      <div class="exp-self-q">今の理解度は?<small>(タップで次回の出題タイミングに反映・任意)</small></div>
      <div class="exp-self-btns">
        <button class="small-btn sa-ok" onclick="expSelf(2,this)">😎 わかった</button>
        <button class="small-btn sa-mid" onclick="expSelf(1,this)">🙂 なんとなく</button>
        <button class="small-btn sa-ng" onclick="expSelf(0,this)">😕 まだわからない</button></div></div></div>`);
  return parts.join("");
}
window.expToggle=(btn,id)=>{
  const el=document.getElementById(id);if(!el)return;
  const open=el.classList.toggle("open");
  btn.textContent=btn.textContent.replace(open?"▼":"▲",open?"▲":"▼");
};
/* 自己評価(理解度申告)を次回間隔に反映。#42の芯を尊重: box前進(習得)は別日の
   retrieval(srsOnCorrect)でしか起きず、申告はスケジューリング補助に留める。
   わかった=間隔を伸ばす(easeを後押し・正解時は次回を後ろ倒し) /
   なんとなく=通常(SRSが決めた予定のまま) /
   まだわからない=box据え置き〜降格・明日再出題+やさしい再説明。 */
window.expSelf=(lv,btn)=>{
  if(fbQid===null)return;
  const st=qstat(fbQid);
  const tdn=todayNum();
  const wrap=document.getElementById("expSelf");
  /* 申告履歴を軽く記録(分析の土台。旧セーブは穴埋め) */
  st.sa=lv;
  if(!st.sac||typeof st.sac!=="object"||Array.isArray(st.sac))st.sac={};
  st.sac[lv]=(st.sac[lv]||0)+1;
  if(ST.cnt)ST.cnt.sa=(ST.cnt.sa||0)+1;
  let msg;
  if(lv===0){
    /* まだわからない: box降格(要復習)・明日再出題・easeを少し下げる */
    st.box=Math.max(0,(st.box||0)-1);
    st.due=tdn+1;
    st.ease=clampEase((st.ease||EASE_DEF)-0.1);
    const rt=document.getElementById("expRetell");if(rt)rt.classList.add("show");
    msg=(expQ&&expQ.retell?"🫶 上に「もっとやさしい説明」を出した。":"")+"🔁 明日もう一度出題する";
  }else if(lv===1){
    /* なんとなく: 通常。SRSが決めた予定を尊重し、スケジュールは動かさない */
    msg="🔁 予定どおり復習に出す";
  }else{
    /* わかった: easeを後押し。正解できていれば次回を後ろ倒し(box=習得判定は触らない) */
    st.ease=clampEase((st.ease||EASE_DEF)+0.1);
    if(fbGood){
      const cur=Math.max(1,(st.due||tdn+1)-tdn);
      st.due=tdn+Math.min(IV_MAX,Math.max(cur,Math.round(cur*1.3)+1));
      msg="👍 この調子! 次回は少し先に出題する";
    }else{
      /* 誤答直後の「わかった」はretrievalに失敗しているので早め復習は維持 */
      msg="👍 理解OK! 定着確認のため近日また出題する";
    }
  }
  saveST();
  if(wrap)wrap.innerHTML=`<div class="exp-self-done">${msg}</div>`;
  SFX.coin();
};
/* 理解チェック: 間違えたら自動で再説明を開き、明日また出題する */
window.expCheck=(i)=>{
  if(!expQ||!expQ.checkQ)return;
  const ok=!!expQ.checkQ.choices[i].ok;
  expQ.checkQ.choices.forEach((c,j)=>{const b=document.getElementById("ck"+j);if(b){b.disabled=true;if(c.ok)b.classList.add("seg-hit");else if(j===i)b.classList.add("seg-miss");}});
  const r=document.getElementById("ckResult");
  if(r)r.innerHTML=`<div class="exp-row">${ok?"✅ 理解OK!":"😅 もう一歩!"} ${esc(expQ.checkQ.why||"")}</div>`;
  if(!ok){
    const rt=document.getElementById("expRetell");if(rt)rt.classList.add("show");
    const st=qstat(expQ.id);st.due=todayNum()+1;saveST();
  }else if(typeof battleCounter==="function"){
    battleCounter(true); /* 不正解後に理解チェックを突破=奥義級の反撃(小報酬) */
  }
  ok?SFX.ok():SFX.ng();
};
/* 用語ポップアップ(やさしい意味+例+混同注意) */
window.expTerm=(i)=>{
  if(!expQ||!expQ.terms||!expQ.terms[i])return;
  const t=expQ.terms[i];
  showOvl(`<h3>📖 ${esc(t.term)}</h3>
    <div class="sub2" style="text-align:left"><b>一言でいうと:</b> ${esc(t.meaning)}
    ${t.example?`<br><b>例:</b> ${esc(t.example)}`:""}${t.confuse?`<br><b>混同注意:</b> ${esc(t.confuse)}`:""}</div>
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
};

/* ============ バトルからの解説表示+ブクマ ============ */
let fbQid=null;
let fbGood=false; /* 直近の解説対象が正解だったか(自己評価のSRS反映で参照) */
let expFullHtml="";
window.expFull=()=>{const e=document.getElementById("fbe");if(e&&expFullHtml)e.innerHTML=expFullHtml;};
function showFb(good,v,q,qid){
  fbQid=qid;fbGood=!!good;expQ=q;
  const fb=document.getElementById("fb");
  fb.className="fb show "+(good?"good":"bad");
  document.getElementById("fbv").textContent=v;
  expFullHtml=explainHtml(q,good)+choiceReviewHtml(q);
  /* 正解でも誤答でも解説は常にフル表示(折りたたみで飛ばさせない) */
  document.getElementById("fbe").innerHTML=expFullHtml;
  const bm=document.getElementById("bmBtn");
  bm.className="btn bm-btn "+(qstat(qid).bm?"on":"");
  bm.textContent=qstat(qid).bm?"⭐登録済":"☆ブクマ";
  const zk=zkey(qById(qid));
  const zb=document.getElementById("zBtn"),zw=document.getElementById("zwrap");
  /* 図解カードは誤答時のみ最初から開く(殿: 正解時は解説だけ。📊図解ボタンから手動では開ける) */
  if(zk&&ZUKAI[zk]){zb.style.display="";zw.innerHTML=zcardHtml(zk);zw.className="zwrap"+(good?"":" show");}
  else{zb.style.display="none";zw.className="zwrap";zw.innerHTML="";}
}
function bmToggleBattle(){
  if(fbQid===null)return;
  const st=qstat(fbQid);st.bm=!st.bm;saveST();
  const bm=document.getElementById("bmBtn");
  bm.className="btn bm-btn "+(st.bm?"on":"");
  bm.textContent=st.bm?"⭐登録済":"☆ブクマ";
  SFX.coin();
}
window.bmToggleBattle=bmToggleBattle;
