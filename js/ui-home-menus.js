"use strict";
/* ============================================================
   ui-home-menus.js — ホーム整理(2026-07)で「奥へ」移した導線をまとめる
   showOvl のモーダルとして開く。挙動・演出は一切変えず、既存の start 系/画面関数を
   そのまま呼ぶ(到達性は維持・視覚的優先順位のみ整理)。
     bossMenu()  = 科目ボス9枚グリッド + ラスボス + 真ラスボス(旧ホーム末尾ブロック)
     trialsMenu()= 事件簿 / 簡易模試 / 過去問道場 / サバイバル / リベンジ / ブックマーク / おすすめ / ノート
     tasksMenu() = 今週のチャレンジ + デイリー任務(+ ログインカレンダー)
   ============================================================ */

/* ── 科目ボス(修行→⚔解放)+ラスボス+真ラスボス ── */
function bossMenu(){
  const need=unlockNeed();
  const bosses=BOSSES.map((b,i)=>{
    const beaten=!!ST.badges[i];
    const mp=Math.round(masteryPct(i)*100);
    const open=beaten||mp>=need;
    /* 戦力プレッシャー(M4): 推奨戦力と現在戦力を比較し、不足なら⚠で「鍛えよ」を明示 */
    const req=typeof bossPowerReq==="function"?bossPowerReq(i):0;
    const short=typeof playerPower==="function"&&playerPower()<req;
    const hp=typeof bossHPScaled==="function"?bossHPScaled(i):bossHPMax(i);
    return `<button class="btn boss-card ${beaten?"beaten":""} ${open?"":"lock"}" onclick="hideOvlSilent();${open?`startBoss(${i})`:`startTrain(${i})`}">
      ${px(b.sp,44,open?"floaty":"")}
      ${beaten?'<span class="crown">👑討伐済</span>':open?'<span class="crown" style="color:#2B62D9">⚔挑戦できる!</span>':'<span class="crown" style="color:#8A8494">🔒タップで修行</span>'}
      <span class="bn">${b.name}</span><span class="bs">習得${mp}%/${need}%${open?` HP${hp} 推奨戦力${req}${short?"⚠鍛えよ":"✅"}`:""}</span>
    </button>`;}).join("");
  const lastReady=badgeCount()>=9;
  showOvl(`<div style="text-align:left;max-height:70dvh;overflow-y:auto">
    <h3 style="text-align:center">⚔ 科目ボス</h3>
    <div class="sub2" style="text-align:center">🔒はタップで修行=時間無制限 → 習得${need}%で⚔解放</div>
    ${typeof examEnvGaugeHtml==="function"?examEnvGaugeHtml({compact:true}):""}
    ${typeof playerPower==="function"?`<div class="banner" style="background:linear-gradient(135deg,#FFF3C4,#EFEAF8);font-size:11px">⚔ 総合戦力 <b style="font-size:15px">${playerPower()}</b> ｜ 🪙強化石×${ST.mat||0} ｜ <u onclick="hideOvlSilent();shop()" style="cursor:pointer">装備を鍛える▶</u></div>`:""}
    <div class="boss-grid">${bosses}</div>
    <div class="sec">ラスボス(周回クリアの関門)</div>
    ${lastReady
      ?`<button class="btn mode-btn" style="background:#33303E;color:#fff" onclick="hideOvlSilent();startLast()">${px("god",38)}<span>試験の神に挑む ${typeof goldReadyBadge==="function"?goldReadyBadge():""}<span class="d" style="color:#CFCBDE">本番同様: 過去問${LASTCFG().n}問・時間制限・${LASTCFG().need}問正解(約7割)で勝利。装備無効の実力勝負${typeof isGold==="function"&&isGold()?" ｜ 🏆本番同等条件で挑める":""}</span></span></button>`
      :`<div class="banner" style="background:#EFEAF8">👑 全9ボスを倒すとラスボス【試験の神】出現(いま ${badgeCount()}/9)。倒せば周回クリア</div>`}
    ${ST.clears>=1?`<div class="sec">真ラスボス</div>
    <button class="btn mode-btn" style="background:linear-gradient(135deg,#3A3450,#6E5FA0);color:#fff" onclick="hideOvlSilent();startTrue()">${px("mao",38)}<span>厚生労働神<span class="d" style="color:#D8CFF5">全科目ミックス・HP${TRUE_BOSS.hp+ST.trueWin*10}。装備は有効。帝国にとどめを刺せ${ST.trueWin?`(撃破${ST.trueWin}回)`:""}</span></span></button>`:""}
  </div>
  <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
}

/* ── 試練: 事件簿 / 模試 / 道場 / サバイバル / リベンジ / ブックマーク / おすすめ / ノート ── */
function trialsMenu(){
  const wc=wrongIds().length,bc=bmIds().length,due=dueIds().length;
  showOvl(`<div style="text-align:left;max-height:70dvh;overflow-y:auto">
    <h3 style="text-align:center">🎯 試練</h3>
    <div class="sub2" style="text-align:center">実力を試すやり込みモード。お好みでどうぞ。</div>
    <!-- 科目特訓(S1 A): 旧「今日の冒険=悪魔への道」の中身。ホームの“今日の冒険”は物語1枚に一本化したため、
         悪魔への道を1歩進める導線はここに別名で残す(機能は消さない・到達性維持)。 -->
    <button class="btn mode-btn" style="background:linear-gradient(135deg,#33303E,#6E5FA0);color:#fff" onclick="hideOvlSilent();startTodayAdventure()">
      ${px("excal",34)}<span>⚔ 科目特訓(悪魔への道)<span class="d" style="color:#D8CFF5">${typeof msqRoadLabel==="function"?esc(msqRoadLabel()):"○×→過去問→問題集ドリルで9科目を制圧"}</span></span>
    </button>
    <button class="btn mode-btn" style="background:linear-gradient(135deg,#FFE1EB,#EFEAF8)" onclick="hideOvlSilent();caseBook()">
      ${px("oni",34)}<span>📖 事件簿(全${CASES.length}章)<span class="d">労基/安衛/労災/雇用/徴収/健保/国年/厚年/労一の全9章 — 調査・証拠・ボス対決</span></span>
      <span class="cnt">${CASES.filter(c=>ST.cases[c.id]&&ST.cases[c.id].cleared).length?CASES.filter(c=>ST.cases[c.id]&&ST.cases[c.id].cleared).length+"👑":""}</span>
    </button>
    <button class="btn mode-btn" style="background:linear-gradient(135deg,#EAF1FF,#DFF5EC)" onclick="hideOvlSilent();startMock()">
      ${px("scroll",34)}<span>📝 簡易模試(36問)<span class="d">9科目×4問・科目別成績表と基準点判定${ST.mock&&ST.mock.best?` ｜ ベスト${ST.mock.best}/36`:""}</span></span>
    </button>
    ${typeof nendoDojoCard==="function"&&nendoDojoCard()?nendoDojoCard().replace('onclick="nendoDojo()"','onclick="hideOvlSilent();nendoDojo()"'):`<button class="btn mode-btn" style="background:linear-gradient(135deg,#2B2540,#5A4A8C);color:#fff" onclick="hideOvlSilent();nendoDojo()">${px("scroll",34)}<span>📜 過去問道場(年度別)<span class="d" style="color:#D8CFF5">年度別にやり込む本試験形式の過去問</span></span></button>`}
    <!-- MACHIMON: 街づくり×マチモン育成モード。学習履歴(ST.q)は本編と共有するため、
         どちらで解いても同じ記憶が育つ。未ロード環境ではボタンを出さない。 -->
    ${(typeof MM!=="undefined"&&MM.ui)?`<button class="btn mode-btn" style="background:linear-gradient(135deg,#FFF3C4,#DFF5EC)" onclick="hideOvlSilent();MM.ui.open()">
      ${px("medal",34)}<span>🏙 MACHIMON(街づくり)<span class="d">事件を解決して街を広げ、マチモンを育てる — 解いた分だけ世界が育つモード</span></span>
    </button>`:""}
    <div class="term-grid" style="padding-bottom:4px">
      <button class="btn term-chip" style="text-align:left" onclick="hideOvlSilent();startSurvival()">⚔ サバイバル<br><span style="font-size:8.5px;color:#8A8494">ライフ3連戦</span></button>
      <button class="btn term-chip" style="text-align:left" onclick="hideOvlSilent();startRevenge()" ${wc?"":"disabled"}>💀 リベンジ${wc?"("+wc+")":""}<br><span style="font-size:8.5px;color:#8A8494">${wc?"ミス問と再戦(2倍)":"対象なし"}</span></button>
      <button class="btn term-chip" style="text-align:left" onclick="hideOvlSilent();startBookmark()" ${bc?"":"disabled"}>⭐ ブックマーク${bc?"("+bc+")":""}<br><span style="font-size:8.5px;color:#8A8494">${bc?"⭐印だけ出題":"未登録"}</span></button>
    </div>
    <div class="navrow" style="margin-top:8px">
      <button class="small-btn" onclick="hideOvlSilent();startReview()" ${due?"":"disabled"}>👻復習${due?"("+due+")":"✅"}</button>
      <button class="small-btn" onclick="hideOvlSilent();startReco()">🧙おすすめ20問</button>
      <button class="small-btn" onclick="hideOvlSilent();notebook('miss')">📕ノート</button>
    </div>
  </div>
  <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
}

/* ── 今日の任務: 今週のチャレンジ + デイリー任務(+ カレンダー) ── */
function tasksMenu(){
  const missions=MISSIONS.map((m,i)=>{
    const pr=Math.min(missionProgress(m),m.need),done=ST.dq.cl[i];
    return `<div class="mi-row ${done?"done":""}"><span>${done?"✅":"🎯"} ${m.txt}</span>
      <div class="mi-bar"><i style="width:${pr/m.need*100}%"></i></div>
      <span class="mprog">${pr}/${m.need}</span></div>`;}).join("");
  const weekly=WEEKLY.map((m,i)=>{
    const pr=Math.min(ST.wq[m.key]||0,m.need),done=ST.wq.cl[i];
    return `<div class="mi-row ${done?"done":""}"><span>${done?"✅":"📅"} ${m.txt}</span>
      <div class="mi-bar"><i style="width:${pr/m.need*100}%;background:var(--purple)"></i></div>
      <span class="mprog">${pr}/${m.need}</span></div>`;}).join("");
  showOvl(`<div style="text-align:left;max-height:70dvh;overflow-y:auto">
    <h3 style="text-align:center">📋 今日の任務</h3>
    <div class="sec">今週のチャレンジ(月曜リセット)</div>
    ${weekly}
    <div class="sec">📅 デイリー任務</div>
    ${missions}
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:10px" onclick="hideOvlSilent();loginCal()">📅 ログインカレンダー ▶</button>
  </div>
  <button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px" onclick="hideOvl()">とじる</button>`);
}

/* ── #68: まだ解放されていない機能の一覧(ホームの鍵タイルを畳んだ先) ──
   「押せないタイル」をホームに並べる代わりにここへ集約。何が・どこで開くかだけを伝える。
   hLocked は ui-home.js が home() 描画時に積む(key/label)。未ロード時は空で安全。 */
function lockedMenu(){
  const list=(typeof hLocked!=="undefined"&&Array.isArray(hLocked))?hLocked:[];
  const where=(k)=>{try{return (typeof SRStory!=="undefined"&&SRStory.gateWhere)?SRStory.gateWhere(k):"物語の先";}catch(e){return "物語の先";}};
  const rows=list.map(x=>`<div class="stat-row"><span>🔒 <b>${esc(x.label)}</b></span><span style="font-size:11px;color:#8A8494">${esc(where(x.key))}で解放</span></div>`).join("");
  showOvl(`<div style="text-align:left;max-height:70dvh;overflow-y:auto">
    <h3 style="text-align:center">🔒 これから開く機能</h3>
    <div class="sub2" style="text-align:center">物語を進めると、一つずつ使えるようになる。<br>いまは目の前の冒険に集中してOK。</div>
    ${rows||'<div class="banner" style="background:#DFF5EC">すべて解放済み!</div>'}
  </div>
  <button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px" onclick="hideOvl()">とじる</button>`);
}

window.bossMenu=bossMenu;window.trialsMenu=trialsMenu;window.tasksMenu=tasksMenu;window.lockedMenu=lockedMenu;
