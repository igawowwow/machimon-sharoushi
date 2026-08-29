"use strict";
/* ============================================================
   ui-quiz.js — 出題形式別レンダラー
   true_false: ○×(従来)
   tap_error : 問題文の誤り箇所をタップ(事件モード・segments定義がある×問)
   choice    : 択一・事例相談(選択肢から1つ選ぶ)
   形式を増やす時はここに renderer と answer ハンドラを足す。
   ============================================================ */
function quizFormat(q){
  /* 一般モードでは○×互換を維持し、事件モードでのみ拡張形式を使う */
  if(q.format==="sentaku")return "sentaku"; /* 本試験の選択式(長文+空欄A〜E+20択) */
  if(q.format==="choice")return "choice";
  if(q.format==="fill_blank")return "fill_blank";
  if(q.format==="reorder")return "reorder";
  if(G&&G.mode==="case"&&q.segments&&q.a===false)return "tap_error";
  return "true_false";
}
/* 選択式の20択に付ける丸番号(①〜⑳)。範囲外は素の数字にフォールバック。 */
const SEN_NUM="①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
/* ============================================================
   暗記防止(V1-A): 選択肢の「見せ方」だけを出題ごとに変える。
   正解(ok)・解説・条文・法的内容は一切変えない=位置/順番の暗記でなく知識で解く状態に。
   ・choice/fill_blank(五肢択一・選択式): 5肢の表示順をシャッフル(アイウエオ割当が毎回変わる)
   ・kosuu(個数問題): 肢「一つ〜五つ」は順序に意味があるためシャッフルしない(自然順)
   ・true_false(○×)・reorder・tap_error: 対象外(反転・順序破壊は誤りを生むため禁止)
   表示順は G.choiceOrder(表示位置p → 元index oi)に固定し、回答判定・全肢レビューが
   同じ並びを参照する。answerChoice の引数は従来どおり「q.choices の元index」で不変(後方互換)。 */
function shouldShuffleChoices(q){
  return !!q&&!q.kosuu&&Array.isArray(q.choices)&&(quizFormat(q)==="choice"||quizFormat(q)==="fill_blank");
}
/* この問題の描画で使う表示順(表示位置→元index)。battle() が quizPrepShuffle で確定させる。
   未確定(直接呼び出し・監査)や対象外は自然順[0,1,2,…]=従来と完全一致。 */
function choiceOrderFor(q){
  const n=(q&&Array.isArray(q.choices))?q.choices.length:0;
  if(typeof G!=="undefined"&&G&&Array.isArray(G.choiceOrder)&&G.choiceOrder.length===n&&G._coId===q.id)return G.choiceOrder;
  return Array.from({length:n},(_,i)=>i);
}
/* 出題ごとに1回だけ表示順を確定(battle 描画の冒頭で呼ぶ)。旧セーブ/テストで G 無しでも安全。 */
function quizPrepShuffle(q){
  if(typeof G==="undefined"||!G)return;
  G._coId=q?q.id:null;
  G.choiceOrder=shouldShuffleChoices(q)?shuffle(q.choices.map((_,i)=>i)):null;
  /* 選択式(sentaku): 20択の表示順をシャッフル(V1整合)し、各空欄の割当を初期化(先頭マス選択)。
     正解(blanks.ok=options index)は不変=見せ方(並び)だけを変える。 */
  if(q&&q.format==="sentaku"&&Array.isArray(q.options)&&Array.isArray(q.blanks)){
    G.snOrder=shuffle(q.options.map((_,i)=>i));
    G.snPick={};
    G.snSel=q.blanks.length?q.blanks[0].key:null;
    G.snScore=null;
  }else{G.snOrder=null;G.snPick=null;G.snSel=null;}
}
if(typeof window!=="undefined"){window.quizPrepShuffle=quizPrepShuffle;}
/* ============================================================
   attackKind — 正解の「質」で攻撃を差別化する純判定(UI非依存)。
   速度(会心)は種別を決めない。法律は熟読が本質なので速度報酬は弱める方針。
   ctx: {wasDue, repeat, hadWrong, format, checkPassed}
     wasDue     : 期限が来た復習問題を(後日=同日でなく)正解した
     repeat     : 今日すでに解いた問題(同日連打は習得扱いにしない現行を尊重)
     hadWrong   : 過去に誤答記録がある問題(苦手)を再び正解した
     format     : 出題形式("tap_error"=誤り箇所タップ)
     checkPassed: 解説の理解チェックまで通過した
   優先度: 奥義 > 記憶会心 > 弱点 > 精密 > 通常
   倍率は控えめ(既存の coin/xp・長期記憶ボーナスを土台に少し色付けするだけ)。
   ============================================================ */
const ATK={
  normal:  {key:"normal",  name:"通常攻撃", word:"着実に一撃を入れた",         fx:1, cls:"",     mult:1},
  precise: {key:"precise", name:"精密攻撃", word:"誤り箇所を正確に見抜いた",   fx:2, cls:"crit", mult:1.1},
  weak:    {key:"weak",    name:"弱点攻撃", word:"かつての苦手を克服した",     fx:2, cls:"crit", mult:1.15},
  memory:  {key:"memory",  name:"記憶会心", word:"忘却を乗り越えた記憶の一撃", fx:3, cls:"crit", mult:1.2},
  ultimate:{key:"ultimate",name:"奥義",     word:"理解しきった奥義が炸裂",     fx:3, cls:"crit", mult:1.25}
};
function attackKind(q,ctx){
  ctx=ctx||{};
  if(ctx.checkPassed)return "ultimate";        /* 理解チェック突破 */
  if(ctx.wasDue&&!ctx.repeat)return "memory";  /* 期限到来の復習を後日正解 */
  if(ctx.hadWrong)return "weak";               /* 苦手(誤答記録あり)を克服 */
  if(ctx.format==="tap_error")return "precise";/* 誤り箇所を看破 */
  return "normal";
}
if(typeof window!=="undefined"){window.attackKind=attackKind;window.ATK=ATK;}
/* 装備の学習行動効果: 六法しおり等(eqStat("hint"))は択一・穴埋めで誤答肢を1つ除外する。
   実力測定モード(試験の神/模試)では無効。残りが2肢を切る除外はしない。 */
function hintExclude(q){
  if(!q.choices||isExam()||(eqStat("hint")+cpBonus("hint"))<=0)return -1;
  const wrong=q.choices.map((c,i)=>c.ok?-1:i).filter(i=>i>=0);
  return wrong.length>=2?wrong[Math.floor(Math.random()*wrong.length)]:-1;
}
function quizAnswerArea(q){
  const f=quizFormat(q);
  if(f==="sentaku")return `<div id="snWrap">${sentakuInner(q)}</div>`;
  if(f==="choice"||f==="fill_blank"){
    const exOrig=hintExclude(q);        /* 除外する誤答肢=元index(-1=除外なし) */
    const order=choiceOrderFor(q);      /* 表示位置p → 元index oi(kosuu/○×等は自然順) */
    /* 個数問題(kosuu)の肢は「一つ〜五つ」で自明。ア〜オの記述と番号が衝突するためアイウエオ見出しは付けない */
    const lbl=(p)=>q.kosuu?"":`<b>${"アイウエオ"[p]||p+1}</b> `;
    return (f==="fill_blank"?`<div class="tapq-note">✏️ 【 ? 】に入る語句・数字を選べ(本試験の選択式対策)</div>`:"")+
    (q.kosuu?`<div class="tapq-note">🔢 上のア〜オのうち<b>正しい記述はいくつ</b>あるか、下から選べ</div>`:"")+
    (exOrig>=0?`<div class="tapq-note" style="background:#EAF7F0;color:#1E7A57">📖 六法しおりの力で誤りの肢が1つ消えた!</div>`:"")+
    `<div class="choice-col">${order.map((oi,p)=>{const c=q.choices[oi];
      return oi===exOrig?`<button class="btn choice-btn hint-out" disabled>${lbl(p)}<s>${esc(c.t)}</s></button>`
      :`<button class="btn choice-btn" id="ch${oi}" onclick="answerChoice(${oi})">${lbl(p)}${esc(c.t)}</button>`;}).join("")}</div>`;
  }
  if(f==="reorder"){
    G.seq=[];
    return `<div class="tapq-note">🔢 ${esc(q.reorderPrompt||"正しい順番にタップせよ")}</div>
    <div class="choice-col" id="reCol">${shuffle(q.reorder.map((s,i)=>({s,i}))).map(o=>
      `<button class="btn choice-btn" id="re${o.i}" onclick="answerReorder(${o.i})">${esc(o.s)}</button>`).join("")}</div>
    <div class="tapq-note" id="reProg" style="background:#EAF1FF;color:#2B62D9">選択順: ─</div>`;
  }
  if(f==="tap_error"){
    return `<div class="tapq-note">📝 上の文には<b>間違いが1か所</b>ある。誤っている下線部を <b>${q.segments.map((_,i)=>SEG_NUM[i]).join("")}</b> から1つ選べ(○×ではない)</div>
    <div class="choice-col">${q.segments.map((s,i)=>
      `<button class="btn seg-btn" id="seg${i}" onclick="answerSeg(${i})"><b class="seg-num">${SEG_NUM[i]||i+1}</b> ${esc(s)}</button>`).join("")}</div>`;
  }
  return `<div class="answer-row">
    <button class="btn ans-btn maru" id="btnO" onclick="answer(true)">○</button>
    <button class="btn ans-btn batsu" id="btnX" onclick="answer(false)">×</button>
  </div>`;
}
/* tap_error 形式は全文を下線+番号付きで見せる(本試験の「下線部択一」スタイル)。
   文脈が分からないまま断片だけ並ぶと何を問われているか伝わらないため。 */
const SEG_NUM="①②③④⑤⑥";
function quizQuestionCard(q){
  const f=quizFormat(q);
  if(f==="tap_error")return `<div class="q-card"><p class="q-text">${q.segments.map((s,i)=>
    `<u class="useg"><b>${SEG_NUM[i]||i+1}</b>${esc(s)}</u>`).join("")}</p></div>`;
  /* 個数問題: 問いかけ文の下に ア〜オ の5記述を1行ずつ見出し付きで並べる(本試験さながらの体裁) */
  if(q.kosuu&&Array.isArray(q.statements))return `<div class="q-card"><p class="q-text">${linkTerms(esc(q.q))}</p>`+
    `<div class="kosuu-list">${q.statements.map((s,i)=>
      `<div class="kosuu-st"><b>${"アイウエオ"[i]||i+1}</b><span>${linkTerms(esc(s.t))}</span></div>`).join("")}</div></div>`;
  return `<div class="q-card"><p class="q-text">${linkTerms(esc(q.q))}</p></div>`;
}
function quizDisableAll(){
  document.querySelectorAll(".choice-btn,.seg-btn,.ans-btn,.sn-slot,.sn-opt,.sn-grade").forEach(b=>b.disabled=true);
}
/* ============================================================
   選択式(sentaku)レンダラ + 1マスずつ解答するハンドラ。
   本文の[[A]]〜[[E]]をタップ可能なスロットに、20択をプールで提示。
   スロットを選び→候補20から語句を選ぶ(同じ語句は自動で1マスに限定=重複割当を作らない)。
   採点は各空欄1点(5点満点)。完答=正解(ok=true)としてバトルへ返す(部分点はラベルで表示)。
   XSS: 本文テキスト・選択肢・解説は全て esc。スロットの引数(A〜E)・番号は生値を入れない。 ============ */
function sentakuPassageHtml(q){
  const parts=String(q.passage||"").split(/\[\[([A-E])\]\]/);
  let html="";
  for(let i=0;i<parts.length;i++){
    if(i%2===0){html+=esc(parts[i]);continue;}
    const key=parts[i];
    const oi=(G&&G.snPick&&G.snPick[key]!=null)?G.snPick[key]:null;
    const filled=oi!=null;
    const sel=(G&&G.snSel===key);
    const txt=filled?esc(q.options[oi]):"　？　";
    html+=`<button class="sn-slot${sel?" sel":""}${filled?" filled":""}" onclick="sentakuSlot('${key}')"><b>${key}</b>${txt}</button>`;
  }
  return `<p class="q-text sn-passage">${html}</p>`;
}
function sentakuPoolHtml(q){
  const used={};if(G&&G.snPick)for(const k in G.snPick){const v=G.snPick[k];if(v!=null)used[v]=1;}
  const order=(G&&G.snOrder&&G.snOrder.length===q.options.length)?G.snOrder:q.options.map((_,i)=>i);
  return `<div class="sn-pool">${order.map((oi,p)=>{
    const u=used[oi];
    return `<button class="btn sn-opt${u?" used":""}" onclick="sentakuOpt(${oi})"><b>${SEN_NUM[p]||(p+1)}</b> ${esc(q.options[oi])}</button>`;
  }).join("")}</div>`;
}
function sentakuInner(q){
  const total=(q.blanks||[]).length;
  const filled=(q.blanks||[]).filter(b=>G&&G.snPick&&G.snPick[b.key]!=null).length;
  const all=total>0&&filled>=total;
  return sentakuPassageHtml(q)+
    `<div class="tapq-note">✏️ 空欄【A】〜【E】をタップ→下の選択肢から語句を選べ(各1点・5点満点)。選択中: <b>${(G&&G.snSel)||"—"}</b> ｜ 記入 ${filled}/${total}</div>`+
    sentakuPoolHtml(q)+
    `<div class="choice-col"><button class="btn go-btn sn-grade" id="snGrade" onclick="sentakuGrade()"${all?"":" disabled"}>${all?"採点する ▶":"5マス全て埋めてから採点"}</button></div>`;
}
function sentakuRerender(){
  const q=(typeof curQ==="function")?curQ():null;
  const w=document.getElementById("snWrap");
  if(q&&w)w.innerHTML=sentakuInner(q);
}
window.sentakuSlot=(key)=>{
  if(!G||!G.awaiting)return;
  G.snPick=G.snPick||{};
  if(G.snSel===key&&G.snPick[key]!=null)delete G.snPick[key]; /* 選択中マスの再タップ=記入取消 */
  G.snSel=key;sentakuRerender();
};
window.sentakuOpt=(oi)=>{
  if(!G||!G.awaiting)return;
  const q=(typeof curQ==="function")?curQ():null;if(!q||!q.blanks)return;
  G.snPick=G.snPick||{};
  if(!G.snSel){const e=q.blanks.find(b=>G.snPick[b.key]==null);G.snSel=e?e.key:q.blanks[0].key;}
  for(const k in G.snPick){if(G.snPick[k]===oi&&k!==G.snSel)delete G.snPick[k];} /* 同じ語句は1マスに限定 */
  G.snPick[G.snSel]=oi;
  const nx=q.blanks.find(b=>G.snPick[b.key]==null);G.snSel=nx?nx.key:G.snSel; /* 次の空きへ自動送り */
  sentakuRerender();
};
window.sentakuGrade=()=>{
  if(!G||!G.awaiting)return;
  const q=(typeof curQ==="function")?curQ():null;if(!q||!q.blanks)return;
  if(!q.blanks.every(b=>G.snPick&&G.snPick[b.key]!=null))return; /* 全マス必須 */
  if(typeof stopTimer==="function")stopTimer();
  let score=0;q.blanks.forEach(b=>{if(G.snPick[b.key]===b.ok)score++;});
  G.snScore=score;(G.snScores=G.snScores||{})[q.id]=score; /* 選択式演習の結果集計(空欄=得点) */
  const ok=(score===q.blanks.length); /* 完答=撃破。部分点はラベルで見せる */
  resolve({ok,label:`選択式 ${score}/${q.blanks.length}点${ok?" ─ 完答!":" ─ 空欄の正解を下で確認"}`});
};
/* 回答ハンドラ(ui-battle の resolve に結果を渡す) */
window.answerSeg=(i)=>{
  if(!G||!G.awaiting)return;
  const q=curQ();stopTimer();
  const ok=(i===q.errorIndex);
  const el=document.getElementById("seg"+i);
  if(el)el.classList.add(ok?"seg-hit":"seg-miss");
  const hit=document.getElementById("seg"+q.errorIndex);
  if(hit&&!ok)hit.classList.add("seg-hit");
  const n=SEG_NUM[q.errorIndex]||"";
  resolve({ok,label:ok?`誤り箇所を看破! ${n}「${q.errorPart}」→ ${q.correction}`:`誤りは${n}「${q.errorPart}」(正: ${q.correction})`});
};
window.answerChoice=(i)=>{
  if(!G||!G.awaiting)return;
  const q=curQ();stopTimer();
  const ok=!!q.choices[i].ok;
  const el=document.getElementById("ch"+i);
  if(el)el.classList.add(ok?"seg-hit":"seg-miss");
  const right=q.choices.findIndex(c=>c.ok);
  const rEl=document.getElementById("ch"+right);
  if(rEl&&!ok)rEl.classList.add("seg-hit");
  G.pickedChoice=i;
  const rt=q.choices[right]||{};
  const rightPos=choiceOrderFor(q).indexOf(right); /* 正解肢の表示位置(シャッフル後のアイウエオ) */
  let label;
  if(q.kosuu)label=ok?`正しい個数を見抜いた!(${esc(rt.t||"")})`:`正解は「${esc(rt.t||"")}」`;
  else label=ok?"正しい助言を選んだ!":`正解は「${"アイウエオ"[rightPos<0?right:rightPos]}」`;
  resolve({ok,label});
};
window.answerReorder=(i)=>{
  if(!G||!G.awaiting||G.seq.includes(i))return;
  const q=curQ();
  G.seq.push(i);
  const b=document.getElementById("re"+i);
  if(b){b.disabled=true;b.classList.add("seg-hit");b.innerHTML=`<b>${G.seq.length}.</b> `+b.innerHTML;}
  const prog=document.getElementById("reProg");
  if(prog)prog.textContent="選択順: "+G.seq.map(x=>q.reorder[x]).join(" → ");
  if(G.seq.length>=q.reorder.length){
    stopTimer();
    const ok=G.seq.every((v,idx)=>v===idx);
    resolve({ok,label:ok?"完璧な順番!":"正しい順番: "+q.reorder.join(" → ")});
  }
};
/* 択一の全肢レビュー(解説に埋め込む) */
function choiceReviewHtml(q){
  /* 選択式(sentaku): 各空欄の正解語句・なぜそれか・条文を提示(あなたの解答が誤りなら併記) */
  if(q.format==="sentaku"&&Array.isArray(q.blanks)){
    return `<div class="exp-row"><b>各空欄の正解(各1点・${(q.blanks.length)}点満点)</b></div>`+q.blanks.map(b=>{
      const term=(q.options&&q.options[b.ok]!=null)?q.options[b.ok]:"";
      const pv=(typeof G!=="undefined"&&G&&G.snPick&&G.snPick[b.key]!=null)?q.options[G.snPick[b.key]]:null;
      const good=pv!=null&&G.snPick[b.key]===b.ok;
      const yours=(pv!=null&&!good)?`<br><span class="why">あなたの解答: ${esc(pv)}(✕)</span>`:"";
      return `<div class="choice-rev ${good?"ok":""}"><b>【${esc(b.key)}】</b> ${good?"○":""}正解=${esc(term)}<br><span class="why">${esc(b.why||"")}${b.law?" 〔"+esc(b.law)+"〕":""}</span>${yours}</div>`;
    }).join("");
  }
  /* 個数問題は「一つ〜五つ」の肢ではなく、ア〜オ各記述の正誤と根拠を復習する */
  if(q.kosuu&&Array.isArray(q.statements)){
    const ans=(q.choices&&q.choices.find(c=>c.ok)||{}).t||"";
    return `<div class="exp-row"><b>各記述の正誤(正しいものは${esc(ans)})</b></div>`+q.statements.map((s,i)=>
      `<div class="choice-rev ${s.ok?"ok":""}">${s.ok?"○":"×"} <b>${"アイウエオ"[i]}</b> ${esc(s.t)}<br><span class="why">${esc(s.why||"")}</span></div>`).join("");
  }
  if(!q.choices)return "";
  /* 全肢レビューも出題時と同じ表示順で見せる(アイウエオが本番の並びと一致)。ok/根拠は肢に付随=不変 */
  return `<div class="exp-row"><b>全肢チェック</b></div>`+choiceOrderFor(q).map((oi,p)=>{const c=q.choices[oi];
    return `<div class="choice-rev ${c.ok?"ok":""}">${c.ok?"○":"×"} <b>${"アイウエオ"[p]}</b> ${esc(c.t)}<br><span class="why">${esc(c.why||"")}</span></div>`;}).join("");
}
