"use strict";
/* ============================================================
   ui-notebook.js — 復習ノート・ログインカレンダー
   ============================================================ */
/* ============ ログインカレンダー ============ */
function loginCal(){
  const cur=((ST.loginTotal-1)%30)+1;
  const cells=[];
  for(let d=1;d<=30;d++){
    const rw=loginReward(d);
    const spc=(d===7||d===14||d===30);
    cells.push(`<div class="cal-cell ${d<=cur?"got":""} ${spc?"spc":""} ${d===cur?"today2":""}">${d}<br>${spc?"✨SSR":rw.tickets?"🎟":"🪙"}</div>`);
  }
  showOvl(`
    <h3>📅 ログインカレンダー</h3>
    <div class="sub2">通算${ST.loginTotal}日目 ｜ 7・14・30日目は<b>SSR確定チケット</b>!</div>
    <div class="cal-grid">${cells.join("")}</div>
    <button class="btn go-btn" style="width:100%;padding:11px" onclick="hideOvl()">とじる</button>
  `);
}
window.loginCal=loginCal;

/* ============ 復習ノート(既存機能) ============ */
function notebook(tab){
  stopTimer();
  const tabs=`<div class="tab-row">
    <button class="btn tab-btn ${tab==="miss"?"act":""}" onclick="notebook('miss')">ミス(${wrongIds().length})</button>
    <button class="btn tab-btn ${tab==="bm"?"act":""}" onclick="notebook('bm')">⭐(${bmIds().length})</button>
    <button class="btn tab-btn ${tab==="z"?"act":""}" onclick="notebook('z')">📖図解</button>
    <button class="btn tab-btn ${tab==="g"?"act":""}" onclick="notebook('g')">🔤用語</button>
  </div>`;
  const head=`<div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📕 復習ノート</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>`;
  if(tab==="g"){
    app.innerHTML=head+tabs+
      `<div class="banner">わからない言葉はここで引ける。タップで「意味+図解テキスト」。</div>`+
      `<div class="term-grid">`+
      TERM_KEYS.slice().sort((a,b)=>a.localeCompare(b,"ja")).map(k=>`<button class="btn term-chip" onclick="showTerm('${k}')">${k}</button>`).join("")+
      `</div>`;
    return;
  }
  if(tab==="z"){
    let body=`<div class="banner">やさしいテキスト+図解、全${Object.keys(ZUKAI).length}枚。青い下線の用語はタップで意味が出る。</div>`;
    for(let si=0;si<SUBJECTS.length;si++){
      const keys=Object.keys(ZINFO).filter(k=>ZINFO[k].s===si);
      if(!keys.length)continue;
      body+=`<div class="sec">${SUBJECTS[si]}</div>`+keys.map(k=>zcardHtml(k)).join("");
    }
    app.innerHTML=head+tabs+body;
    return;
  }
  const ids=tab==="miss"?wrongIds():bmIds();
  const items=ids.map(id=>{
    const q=qById(id),st=qstat(id),zk=zkey(q);
    return `<div class="note-item">
      <b>${linkTerms(esc(q.q))}</b>
      <span class="ans">正解:${q.a?"○":"×"}</span>
      <span class="ex">${linkTerms(esc(q.e))}</span>
      ${zk&&ZUKAI[zk]?zcardHtml(zk):""}
      <div class="nrow">
        <span style="color:#8A8494;font-size:10px">${SUBJECTS[q.s]} ｜ ミス${st.w}回</span>
        <button class="btn bm-btn ${st.bm?"on":""}" onclick="toggleBm(${id},'${tab}')">${st.bm?"⭐解除":"☆ブクマ"}</button>
      </div>
    </div>`;}).join("");
  app.innerHTML=head+tabs+
  `${items||`<div class="banner">まだ何もない。${tab==="miss"?"ミスした問題が自動でここに溜まる":"バトル中の解説画面で☆を押すと登録される"}</div>`}
  ${ids.length?`<button class="btn mode-btn ${tab==="miss"?"pinkbg":"mintbg"}" onclick="${tab==="miss"?"startRevenge()":"startBookmark()"}">
    ${px(tab==="miss"?"skull":"star",30)}<span>この${ids.length}問で演習する</span></button>`:""}`;
}
function toggleBm(id,tab){const st=qstat(id);st.bm=!st.bm;saveST();notebook(tab);}
window.notebook=notebook;window.toggleBm=toggleBm;

