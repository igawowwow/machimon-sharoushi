"use strict";
/* ============================================================
   ui-home.js — ホーム・ショップ・ガチャ・図鑑・分析・記録・起動
   ============================================================ */

/* ============ 段階解放ヘルパ(E3) ============ */
/* 物語(js/story)未ロード時は常に解放=旧UIの到達性を壊さない。fallback=解放。 */
function hUnlocked(key){ try{ return (typeof sqGate==="function") ? sqGate(key) : true; }catch(e){ return true; } }
function hLockHint(){ try{ return (typeof sqGateHint==="function") ? sqGateHint() : "物語を進めると解放"; }catch(e){ return "物語を進めると解放"; } }
/* メニューchip: 解放済みは通常ボタン、未解放はグレーのロック表示(理由付き・タップで説明)。
   label/icon/key/onclick は全て内部固定文字列(ユーザー入力なし)。 */
/* #68: 未解放の機能は「グレーの鍵タイル」で並べない。初見のホームが鍵だらけになり、
   押せないものを1つずつ判断させることになるため(=初見の判断コストが最大の離脱要因)。
   代わりに hLocked へ積み、メニュー末尾の1行「🔒 まだ解放されていない機能 N」に畳む。
   物語が進めば自動で通常のchipに戻る(到達性・段階解放の仕組み自体は不変)。 */
var hLocked=[]; /* let にすると同一グローバルへ2回ロードするテストハーネスで再宣言エラーになる */
function hChip(key,onclick,icon,label){
  if(hUnlocked(key)) return `<button class="hchip" onclick="${onclick}">${icon}<span>${label}</span></button>`;
  hLocked.push({key:key,label:label});
  return "";
}
/* 冒険ステータス帯(adv-chip)のロック分も同様に畳む(「?」の鍵を並べない)。 */
function hAdvLock(key,label){
  hLocked.push({key:key,label:label});
  return "";
}
/* 畳んだロック機能の1行サマリ。タップで「どこで解放されるか」の一覧を出す。 */
function hLockedRow(){
  if(!hLocked.length)return "";
  return `<button class="hmenu-task" onclick="lockedMenu()">🔒 まだ解放されていない機能 <b style="color:#8A8494">${hLocked.length}</b> ─ 物語を進めると開く<span style="float:right">▶</span></button>`;
}

/* ============ ホーム ============ */
function home(){
  stopTimer();hideOvlSilent();
  hLocked=[]; /* #68: このホーム描画で畳んだロック機能を集め直す(hChip/hAdvLockが積む) */
  if(typeof setBgmScene==="function")setBgmScene("town");
  if(typeof achCheckUnlock==="function")achCheckUnlock();
  if(typeof grantAchTitles==="function")grantAchTitles(); /* D1: 収集報酬称号を帰宅時に反映 */
  const due=dueIds().length;
  const p=passPct(),s=stats();
  const eqT=eqItem("t");
  /* 任務サマリ(デイリー+ウィークリー)の達成数を1行に圧縮。詳細は tasksMenu() へ。 */
  /* 主役ヒーローは1枚だけ: 物語(storyHeroCard)が出るなら旧「悪魔への道」の今日の冒険(msqTodayCard)は出さない
     ＝二重表示の解消。物語未ロード/章未登録なら従来どおり msqTodayCard が主役として残る。 */
  const storyCard=typeof storyHeroCard==="function"?storyHeroCard():"";
  /* #68: ホーム最上位の「大CTA」は常に1枚だけにする。
     優先順=物語(storyHeroCard) > 冒頭アーク(introCard) > 悪魔への道(msqTodayCard)。
     選ばれなかったカードの機能は消えない(地図/メニュー/冒険ステータス帯から到達可能)。
     冒頭アークのカードは「これから挑む試練」(Phase A/B=未対峙)の間だけ主役になり、
     対峙後(Phase C=最終目標の据え置き表示)は行動できる「今日の冒険」に主役を譲る。 */
  const introPhaseAB=!!(ST.intro&&!ST.intro.met);
  const introCardHtml=(introPhaseAB&&typeof introCard==="function")?introCard():"";
  const heroCard=storyCard||introCardHtml||msqTodayCard();
  const dqDone=(ST.dq&&ST.dq.cl)?ST.dq.cl.filter(Boolean).length:0;
  const wkDone=(ST.wq&&ST.wq.cl)?ST.wq.cl.filter(Boolean).length:0;
  const taskDone=dqDone+wkDone,taskTot=MISSIONS.length+WEEKLY.length;
  /* ── 情報階層(2026-07 整理) ──
     ①上部常時: コイン/チケット/BGM + 極小ロゴ + プレイヤーカード + streak/journey(北極星)。
     ②唯一の主役ヒーロー = 今日の冒険(msqTodayCard)。③直下に復習(SRSの要)を二次CTAで。
     ④残りは均一な弱いchipメニューに集約。⑤重い塊(科目ボス/事件簿/模試/道場/サバイバル等/週間/デイリー)は
        bossMenu()/trialsMenu()/tasksMenu()(js/ui-home-menus.js)へ再配置=到達性は維持しつつ視覚的優先順位のみ変更。 */
  app.innerHTML=`
  <div class="topbar">
    <span class="coin-chip">${px("coin",16)} ${ST.coins}</span>
    <span class="tk-chip">${px("ticket",14)}×${ST.tickets}${ST.ssrT?` ✨×${ST.ssrT}`:""}</span>
    <button class="small-btn" onclick="toggleBgm(this)" title="BGM">${ST.opt.bgm?"🎶":"🎼"}</button>
  </div>
  ${dailyMsg?`<div class="banner bin" onclick="loginCal()">${px("coin",14)} ${dailyMsg} <u>📅カレンダー</u></div>`:""}
  ${streakMsg?`<div class="banner" style="background:linear-gradient(135deg,#FFE1EB,#FFF3C4)">${streakMsg}</div>`:""}
  <div class="logo">
    <div class="t dot" style="font-size:20px">社労士<em>クエスト</em></div>
    <div class="s">${ST.loop}周目 ｜ ${rankTitle()}</div>
  </div>
  ${typeof streakCardHtml==="function"?streakCardHtml():""}
  ${typeof powDeltaHtml==="function"?powDeltaHtml():""}
  <button class="pcard" style="width:100%;font-family:inherit;cursor:pointer;text-align:left" onclick="statusModal()">
    <div class="prow"><span class="lv">Lv.${ST.lv}${ST.reb?`<span class="reb"> ★転生${ST.reb}</span>`:""}</span>
      <span>${eqT?px(eqT.sp,16)+" "+eqT.name:""}</span></div>
    <div class="xpbar"><i style="width:${Math.min(100,ST.xp/xpForNext(ST.lv)*100)}%"></i></div>
    <div class="prow" style="margin-top:2px"><span style="font-size:9.5px;color:#8A8494">XP ${ST.xp}/${xpForNext(ST.lv)} ｜ 定着度${p}% ｜ タップでステータス</span></div>
    <div class="pass-bar" style="margin-top:4px"><i style="width:${p}%"></i></div>
  </button>
  ${(hUnlocked("map")&&typeof journeyCard==="function")?journeyCard():""/* #68: 序盤(地図が開く前)は
     「悪魔への道」カードを出さない。初見にとっては物語カードと二重の大カードになり、しかも
     初見に悪魔戦はぶつけない設計なので案内が噛み合わない。地図解放=第一章 第1話 以降に登場する。 */}
  ${/* #68: 冒険ステータス帯。序盤(図鑑=記録が開く前)は丸ごと出さない。
       ロックを畳んだ結果「実績」1個だけがぽつんと残る不格好を避けるため。
       実績は図鑑の1タブなので、図鑑の解放と歩調を合わせる(解放後に帯ごと復活)。 */
    hUnlocked("zukan")?`<div class="adv-row">
    ${hUnlocked("map")?`<button class="adv-chip" onclick="worldMap()">🗺️<b>${ST.msq&&ST.msq.done?9:Math.min(9,(ST.msq&&ST.msq.ch)||0)}/9</b><small>帝国制圧</small></button>`:hAdvLock("map","冒険の地図")}
    ${hUnlocked("party")?`<button class="adv-chip" onclick="zukan('c')">🤝<b>${partyCount()}/${COMPANIONS.length}</b><small>仲間</small></button>`:hAdvLock("party","仲間")}
    ${hUnlocked("office")?`<button class="adv-chip${(typeof officeAccrueDays==="function"&&officeAccrueDays()>0)?" ready":""}" onclick="office()">🏢<b>Lv${officeRank()}</b><small>${(typeof officeAccrueDays==="function"&&officeAccrueDays()>0)?"💰顧問料":"事務所"}</small></button>`:hAdvLock("office","事務所")}
    <button class="adv-chip" onclick="zukan('a')">🏅<b>${achDone().length}/${ACHIEVEMENTS.length}</b><small>実績</small></button>
  </div>`:""}
  ${typeof btResumeHtml==="function"?btResumeHtml():""/* 中断されたバトルがあれば再開導線を最優先で出す */}
  ${heroCard}
  ${typeof qsHomeChip==="function"?qsHomeChip():""}
  ${!hUnlocked("review")
    ?"" /* 復習(SRS導線)は第6話で解放。新規プレイヤーには出さず冒険に集中させる */
    :due>0
    ?`<button class="btn go-btn" style="width:100%;margin:0 0 8px;padding:11px;background:linear-gradient(135deg,#FFE1EB,#EFEAF8);color:#33303E;font-size:13px" onclick="startReview()">👻 記憶の綻びを繕う ─ 今日の復習(${due}問・XP2倍) ▶</button>`
    :`<div class="banner" style="background:#DFF5EC;font-size:11px;margin-bottom:8px">✅ 今日の復習は完了。冒険に集中しよう</div>`}
  <button class="hmenu-task" onclick="tasksMenu()">📋 今日の任務 <b style="color:#2B62D9">${taskDone}/${taskTot}</b> 達成 ─ 週間チャレンジ＆デイリー任務<span style="float:right">▶</span></button>
  <div class="sec">🧭 メニュー</div>
  <div class="hmenu">
    ${hChip("map","worldMap()","🗺️","冒険の地図")}
    ${hChip("boss","bossMenu()","⚔","科目ボス")}
    ${hChip("trials","trialsMenu()","🎯","試練")}
    ${hChip("gear","shop()","🛡","装備")}
    ${hChip("gacha","gacha()","🎰",(typeof gachaFreeAvail==="function"&&gachaFreeAvail())?"ガチャ🎁":"ガチャ")}
    ${hChip("zukan","zukan('e')","📚","図鑑")}
    ${hChip("office","office()","🏢","事務所")}
    <button class="hchip" onclick="records()">🏅<span>記録</span></button>
    <button class="hchip" onclick="analysis()">📊<span>分析</span></button>
  </div>
  ${hLockedRow()/* 未解放ぶんは鍵タイルで並べず、この1行に畳む(hChip/hAdvLockが積んだもの) */}
  ${typeof pwaInstallBtnHtml==="function"?pwaInstallBtnHtml():""}
  <div class="footer-note">本試験(第56回ほか)の出題論点をベースにした改題○×。<br>【R6本試験 改題】タグ=令和6年の実際の出題肢がもと。数値は法改正で変わるため直前期に最新法令で要確認。</div>`;
  dailyMsg="";streakMsg="";
  if(typeof goldSync==="function")goldSync(); /* N3: 金色テーマ追従＋100%到達の一度きり祝福 */
}
/* 効果音のON-OFF。殿要望(2026-08-21)で上部バーの🔇ボタンは撤去した
   ―― 画面上端にあるため意図せず押され、気づかないまま無音になっていた。
   ON-OFFは設定の「🔔 効果音の音量」スライダー(0で無音)に一本化する。
   関数自体はサウンドテスト等からの参照があるため残す(el は任意)。 */
window.toggleMute=(el)=>{muted=!muted;ST.opt.mute=muted;saveST();if(el)el.textContent=muted?"🔇":"🔊";};
window.home=home;

/* ============ ステータス・転生 ============ */
function statusModal(){
  const s=stats();
  const eqRows=["w","a","c","t"].map(sl=>{
    const it=eqItem(sl);
    return `<div class="stat-row"><span>${SLOT_NAME[sl]} ${it&&it.fx?`<small>${it.fx}</small>`:""}</span><span>${it?px(it.sp,18)+" "+it.name:"なし"}</span></div>`;
  }).join("");
  const eqTotal=[
    ["⚔ダメージ",eqStat("dmg")],["🛡ミス無効",eqStat("sh")],["⏱時間+秒",eqStat("t")],
    ["⚡クリ猶予+秒",eqStat("crit")],["🪙コイン%",eqStat("coin")],["📖XP%",eqStat("xp")],["🍀運",eqStat("luck")],["📖誤答肢除外",eqStat("hint")]
  ].filter(x=>x[1]>0).map(x=>`${x[0]}+${x[1]}`).join(" ｜ ");
  showOvl(`
    ${px("hero",56,"floaty")}
    <h3>ステータス</h3>
    <div style="font-size:22px;font-weight:900">Lv.${ST.lv}${ST.reb?` <span style="color:#C58900;font-size:14px">★転生${ST.reb}</span>`:""}</div>
    <div class="stat-row"><span>📖 知識 <small>習得問題+レベルで上昇 → 攻撃力+${statDmgBonus()}</small></span><b>${s.kn}</b></div>
    <div class="stat-row"><span>🧠 暗記 <small>復習消化で上昇 → コイン+${Math.round(statCoinBonus()*100)}%</small></span><b>${s.mem}</b></div>
    <div class="stat-row"><span>⚡ 集中 <small>クリティカルで上昇 → 制限時間+${statTimeBonus()}秒</small></span><b>${s.foc}</b></div>
    <div class="stat-row"><span>🍀 運 <small>宝箱・ガチャで上昇 → レア運UP</small></span><b>${s.luck}</b></div>
    ${eqRows}
    ${eqTotal?`<div class="stat-row" style="background:#FFF3C4;border-radius:8px;padding:6px 8px"><span>🛡 装備効果 合計</span><b style="font-size:10px">${eqTotal}</b></div>`:""}
    ${typeof playerPower==="function"?`<div class="stat-row" style="background:#EFEAF8;border-radius:8px;padding:6px 8px"><span>⚔ 総合戦力 <small>装備+強化+凸+セット+Lv</small></span><b style="font-size:16px;color:#2B62D9">${playerPower()}</b></div>`:""}
    ${typeof activeSets==="function"&&activeSets().length?`<div class="stat-row" style="background:#F3EBFF;border-radius:8px;padding:6px 8px"><span>🔗 発動中セット</span><b style="font-size:10px;color:#7A3BC9">${activeSets().map(s=>s.name).join(" / ")}</b></div>`:""}
    <div class="stat-row"><span>🔔 効果音 <small>正解・コイン等の音。BGMはホーム上部の🎶ボタン</small></span>
      <button class="small-btn" onclick="toggleSe(this)">${ST.opt.mute?"OFF":"ON"}</button></div>
    <div class="stat-row"><span>📦 引っ越しコード <small>学習データを書き出して別の端末・新アプリへ移せる</small></span>
      <span><button class="small-btn" onclick="hideOvl();saveExport()">書き出す</button>
      <button class="small-btn" onclick="hideOvl();saveImport()">取り込む</button></span></div>
    ${window.__srqHasBundledFonts?`<div class="stat-row"><span>📄 ライセンス表示 <small>同梱フォントの利用条件(SIL Open Font License 1.1 全文)</small></span>
      <button class="small-btn" onclick="srqLicenses()">開く</button></div>`:""}
    ${typeof pwaInstallBtnHtml==="function"?pwaInstallBtnHtml():""}
    ${canRebirth()
      ?`<button class="btn mode-btn yellowbg" style="margin-top:10px" onclick="rebirthConfirm()">${px("star",26)}<span>転生する<span class="d">Lv1に戻る代わりに永続ボーナス+5%(コイン・XP)</span></span></button>`
      :`<div class="sub2" style="margin-top:8px">Lv.${REBIRTH_LV}で「転生」解放(永続ボーナス+5%/回)</div>`}
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>
  `);
}
function rebirthConfirm(){
  showOvl(`
    ${px("star",56,"floaty")}
    <h3>転生の儀</h3>
    <div class="sub2">レベルとXPが1に戻る。<br>装備・コイン・学習記録はそのまま。<br>代わりに<b>コイン・XP獲得+5%が永続</b>で付く。<br>(現在: 転生${ST.reb}回 = +${ST.reb*5}%)</div>
    <button class="btn mode-btn yellowbg" style="margin-top:12px" onclick="rebirthDo()">${px("star",26)}<span>転生する!</span></button>
    <button class="btn go-btn" style="width:100%;margin-top:6px;padding:11px" onclick="hideOvl()">やめておく</button>
  `);
}
function rebirthDo(){
  if(!doRebirth())return;
  hideOvl();
  SFX.levelup();confetti(50);flash("#FFE9A8",300);
  bigBanner("★転生"+ST.reb+"回目★","#C58900",30);
  setTimeout(home,900);
}
/* 設定の断捨離(殿2026-08-29: この辺の設定はいらない)。
   ・初学者モード → トグル廃止。解答100問までは自動で入門補助が効く(beginnerAuto)
   ・文字を大きく → 廃止(標準サイズに統一)
   ・1コースの長さ → 廃止(標準12問に固定。sanitizeStateが旧セーブも標準へ寄せる)
   ・BGM/効果音の音量スライダー・サウンドテスト → 廃止。音は既定音量で、
     BGMのON-OFFはホーム上部の🎶、効果音のON-OFFは設定の1ボタンに集約 */
window.toggleSe=(el)=>{
  const next=!ST.opt.mute;              /* 真実は保存値。muted閉域と食い違っても保存値基準で反転 */
  ST.opt.mute=next;
  try{ muted=next; }catch(e){}
  saveST();
  if(el)el.textContent=next?"OFF":"ON";
  if(!next)SFX.coin();                  /* ONにした瞬間だけ鳴らして効いたと分かる */
};
window.statusModal=statusModal;window.rebirthConfirm=rebirthConfirm;window.rebirthDo=rebirthDo;

/* ============ 装備・ショップ ============ */
function shop(){
  stopTimer();
  const secs=["w","a","c","t"].map(sl=>{
    const owned=ownedOf(sl);
    const chips=owned.map(it=>{
      const on=ST.eq[sl]===it.id;
      const au=typeof gearAuraCls==="function"?gearAuraCls(it):"";
      const plus=(typeof gearPlusLabel==="function")?gearPlusLabel(it.id):(enhLv(it.id)>0?` <b style="color:#C58900">+${enhLv(it.id)}</b>`:"");
      const evb=(typeof gearEvolBadge==="function")?gearEvolBadge(it.id):"";
      return `<button class="btn term-chip ${au}" style="${on?"background:var(--yellow)":""};text-align:left" onclick="equipIt('${sl}','${it.id}')">${px(it.sp,16)} <span class="${RAR[it.rar].cls}">${RAR[it.rar].n}</span> ${it.name} ${plus}${evb}${on?" ✓":""}${it.fx?`<br><span style="font-size:8.5px;font-weight:700;color:${on?"#7A5B00":"#2B9E82"}">${it.fx}</span>`:""}</button>`;
    }).join("");
    /* 装備中の1品は「強化する」行を出す(素材+コインで代表statを伸ばす=M4の核) */
    const eqId=ST.eq[sl];
    const enhRow=(eqId&&typeof enhanceRowHtml==="function")?enhanceRowHtml(eqId):"";
    /* 次に買えるショップ品 */
    const next=ITEMS.filter(x=>x.slot===sl&&x.shop!==undefined&&!ST.inv[x.id]).sort((a,b)=>a.shop-b.shop)[0];
    const buyRow=next?`<div class="shop-item ${next.rar>=3?"legend":""}">${px(next.sp,40)}<span><span class="n"><span class="${RAR[next.rar].cls}">${RAR[next.rar].n}</span> ${next.name}</span><br><span class="fx">${next.fx||""}</span></span>
      <button class="btn buy-btn" onclick="buyItem('${next.id}')" ${ST.coins>=next.shop?"":"disabled"}>${px("coin",13)}${next.shop}</button></div>`
      :`<div class="shop-item"><span class="fx">ショップ系列はコンプ!あとはガチャ限定のみ</span></div>`;
    return `<div class="sec">${SLOT_NAME[sl]}(タップで装備)</div><div class="term-grid" style="padding-bottom:6px">${chips||'<span class="fx" style="font-size:11px;font-weight:700;color:#8A8494">まだ持っていない</span>'}</div>${enhRow}${buyRow}`;
  }).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span class="coin-chip">${px("coin",16)} ${ST.coins}</span>
    <button class="small-btn" onclick="gacha()">🎰ガチャ</button>
  </div>
  <div class="logo"><div class="t dot" style="font-size:26px">装備<em>&ショップ</em></div>
  <div class="s">敵を倒して強化石を集め、装備を鍛える。ダブりは限界突破(凸)で上限UP</div></div>
  ${typeof examEnvGaugeHtml==="function"?examEnvGaugeHtml():""}
  ${typeof powerPanelHtml==="function"?powerPanelHtml():""}
  ${secs}
  ${typeof setListHtml==="function"?setListHtml():""}
  <div class="sec">消耗品</div>
  <div class="shop-item">${px("potion",40)}<span><span class="n">回復ドリンク(所持:${ST.potions})</span><br><span class="fx">バトル中にライフ+1(最大3)</span></span>
    <button class="btn buy-btn" onclick="buyPotion()" ${ST.coins>=120?"":"disabled"}>${px("coin",13)}120</button></div>`;
  if(typeof goldSync==="function")goldSync(); /* N3: 金色テーマ追従＋100%到達の一度きり祝福 */
}
function equipIt(sl,id){
  if(!ST.inv[id])return;
  ST.eq[sl]=(ST.eq[sl]===id&&sl!=="w")?null:id; /* 武器以外は外せる */
  SFX.buy();saveST();shop();
  /* 装備した瞬間にその装備の攻撃/発動エフェクトをプレビュー(外した時は出さない) */
  if(ST.eq[sl]===id&&typeof gearPreview==="function")gearPreview(sl,id);
}
function buyItem(id){
  const it=ITEM[id];
  if(!it||it.shop===undefined||ST.inv[id]||ST.coins<it.shop)return;
  ST.coins-=it.shop;ST.inv[id]=1;ST.eq[it.slot]=id;
  SFX.buy();coinBurst(document.querySelector(".coin-chip"),6);saveST();shop();
  if(typeof gearPreview==="function")gearPreview(it.slot,id); /* 購入=即装備。手に入れた武器の振り味をお披露目 */
}
function buyPotion(){
  if(ST.coins<120)return;
  ST.coins-=120;ST.potions++;SFX.buy();saveST();shop();
}
window.shop=shop;window.equipIt=equipIt;window.buyItem=buyItem;window.buyPotion=buyPotion;

/* ============ ガチャ ============ */
function gacha(){
  stopTimer();
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span class="coin-chip">${px("coin",16)} ${ST.coins}</span>
    <span style="display:flex;align-items:center;gap:6px">
      <span class="tk-chip">${px("ticket",14)}×${ST.tickets}</span>
      <button class="small-btn" onclick="gachaHistory()">📜履歴</button>
    </span>
  </div>
  <div class="logo"><div class="t dot" style="font-size:26px">法具<em>ガチャ</em></div>
  <div class="s">装備・称号を引き当てろ!(ダブりは限界突破=凸で強化上限UP)</div></div>
  <div style="text-align:center;margin:10px 0">${px("gachaball",90,"floaty")}</div>
  ${gachaFreeAvail()
    ?`<button class="btn mode-btn" style="background:linear-gradient(135deg,#D9F7E8,#FFF3C4)" onclick="gachaDo('free')">🎁<span>本日の無料ガチャ<span class="d">毎日1回タダで引ける!</span></span><span class="cnt">FREE</span></button>`
    :""}
  <button class="btn mode-btn yellowbg" onclick="gachaDo(1)">
    ${px("gachaball",30)}<span>1回引く<span class="d">${ST.tickets>0?"チケット1枚を使う":GACHA.cost1+"コイン"}</span></span>
  </button>
  <button class="btn mode-btn pinkbg" onclick="gachaDo(10)" ${(ST.coins>=GACHA.cost10||(ST.tickets||0)>=10)?"":"disabled"}>
    ${px("gachaball",30)}<span>10連ガチャ<span class="d">SR以上1枠確定! ｜ チケット10枚でもOK(所持${ST.tickets||0})</span></span><span class="cnt">${(ST.tickets||0)>=10?"チケ10":GACHA.cost10}</span>
  </button>
  ${ST.ssrT>0?`<button class="btn mode-btn" style="background:linear-gradient(135deg,#FFF3C4,#FFE1EB)" onclick="gachaDo('ssr')">
    ✨<span>SSR確定ガチャ<span class="d">ログインボーナスの特別チケット</span></span><span class="cnt">×${ST.ssrT}</span></button>`:""}
  ${(()=>{const left=GACHA.pity-ST.gPity,pct=Math.min(100,ST.gPity/GACHA.pity*100),near=left<=5;
    return `<div class="pity-box ${near?"near":""}">
      <div class="pity-top"><span>🎯 SSR以上まで あと<b>${left}回</b>${near?" 🔥もう1回!":""}</span><span class="pity-n">${ST.gPity}/${GACHA.pity}</span></div>
      <div class="pity-bar"><i style="width:${pct}%"></i></div></div>`;})()}
  ${(()=>{const g=ST.gGauge||0,gp=Math.min(100,g/GAUGE_NEED*100);
    return `<div class="pity-box">
      <div class="pity-top"><span>📚 勉強ゲージ: あと<b>${GAUGE_NEED-g}問正解</b>でチケ+1</span><span class="pity-n">${g}/${GAUGE_NEED}</span></div>
      <div class="pity-bar"><i style="width:${gp}%"></i></div></div>`;})()}
  ${gachaFreeAvail()?"":`<div class="rate-tbl" style="margin-top:6px">🎁 無料ガチャは受取済み — また明日(毎日1回)</div>`}
  <div class="rate-tbl">${typeof gachaRateTblHtml==="function"?gachaRateTblHtml():""}<br>
  <b>SSR以上 ${typeof gachaHiRateText==="function"?gachaHiRateText():""}</b> — 渋いぶん当たりは本物。${GACHA.pity}回ごとにSSR以上確定なので必ず報われる<br>
  10連はSR以上1枠確定 ｜ 累計${ST.gTotal}回${(typeof totalToppa==="function"&&totalToppa()>0)?` ｜ 限界突破 累計凸${totalToppa()}`:""}</div>`;
}
function gachaDo(n){
  if(n==="free"){
    if(!gachaFreeAvail())return;
    ST.gFreeDay=today();
    const r=gachaRoll();saveST();
    gachaReveal([r]);return;
  }
  if(n==="ssr"){
    if(ST.ssrT<=0)return;
    ST.ssrT--;
    const r=gachaRoll(3);saveST();
    gachaReveal([r]);return;
  }
  if(n===1){
    if(ST.tickets>0)ST.tickets--;
    else if(ST.coins>=GACHA.cost1)ST.coins-=GACHA.cost1;
    else return;
    const r=gachaRoll();saveST();
    gachaReveal([r]);return;
  }
  /* 10連: チケット10枚 でも コイン でも引ける。足りない時は無言で終わらせず理由を出す。 */
  if((ST.tickets||0)>=10){ST.tickets-=10;}
  else if(ST.coins>=GACHA.cost10){ST.coins-=GACHA.cost10;}
  else{
    const needT=10-(ST.tickets||0),needC=GACHA.cost10-ST.coins;
    if(typeof bigBanner==="function")bigBanner("10連にはチケット10枚(あと"+needT+")かコイン"+GACHA.cost10+"(あと"+needC+")","#8A8494",13);
    return;
  }
  const rs=gachaTen();saveST();
  gachaReveal(rs);
}
/* gachaResHtml / gachaReveal(段階的開封演出)は js/gacha-fx.js に分離(M3) */
window.gacha=gacha;window.gachaDo=gachaDo;

/* ============ 図鑑 ============ */
function zukan(tab){
  stopTimer();
  const tabs=`<div class="tab-row">
    <button class="btn tab-btn ${tab==="e"?"act":""}" onclick="zukan('e')">👹敵 ${typeof bestiaryPct==="function"?bestiaryPct():zukanEnemyPct()}%</button>
    <button class="btn tab-btn ${tab==="i"?"act":""}" onclick="zukan('i')">🛡装備 ${zukanItemPct()}%</button>
    <button class="btn tab-btn ${tab==="l"?"act":""}" onclick="zukan('l')">📖法律 ${zukanLawPct()}%</button>
    <button class="btn tab-btn ${tab==="a"?"act":""}" onclick="zukan('a')">🏅実績 ${achPct()}%</button>
    <button class="btn tab-btn ${tab==="c"?"act":""}" onclick="zukan('c')">🤝仲間 ${Math.round(partyCount()/COMPANIONS.length*100)}%</button>
  </div>`;
  const head=`<div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📚 図鑑</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>`;
  let body="";
  if(tab==="e"){
    /* 充実したベスティアリ(ui-bestiary.js)。未ロード時は旧・ボスのみ表示にフォールバック */
    if(typeof bestiaryTab==="function"){body=bestiaryTab();}
    else{
      const cells=BOSSES.map((b,i)=>{
        const seen=ST.eSeen[i],kill=ST.eKill[i];
        return `<div class="zukan-cell ${seen?"":"mystery"}">${px(b.sp,40)}<br>${seen?b.name:"???"}<span class="zr">${kill?"👑討伐済":seen?"遭遇":"未遭遇"}</span></div>`;
      }).join("")
      +`<div class="zukan-cell ${badgeCount()>=9||ST.clears>=1?"":"mystery"}">${px("god",40)}<br>${badgeCount()>=9||ST.clears>=1?"試験の神":"???"}<span class="zr">${ST.clears>=1?"👑撃破":"未討伐"}</span></div>`
      +`<div class="zukan-cell ${ST.clears>=1?"":"mystery"}">${px("mao",40)}<br>${ST.clears>=1?"厚生労働神":"???"}<span class="zr">${ST.trueWin?"👑撃破":"未討伐"}</span></div>`;
      body=`<div class="banner">敵を倒すと図鑑に記録される。全討伐でコンプ!</div><div class="zukan-grid">${cells}</div>`;
    }
  }else if(tab==="i"){
    /* D1: 装備コレクション図鑑(シリーズ別・収集報酬・シルエット)。未ロード時は簡易一覧へ */
    if(typeof gearZukanHtml==="function"){body=gearZukanHtml();}
    else{
      const cells=ITEMS.map(it=>{
        const own=ST.inv[it.id];
        return `<div class="zukan-cell ${own?"":"mystery"}">${px(it.sp,36)}<br><span class="${RAR[it.rar].cls}">${RAR[it.rar].n}</span> ${own?it.name:"???"}<span class="zr">${own?(it.fx||""):(it.shop!==undefined?"ショップ":it.ach?"実績":"ガチャ")}</span></div>`;
      }).join("");
      body=`<div class="banner">全${ITEMS.length}種。ショップ・ガチャ・宝箱・実績で集めよう</div><div class="zukan-grid">${cells}</div>`;
    }
  }else if(tab==="l"){
    const keys=Object.keys(ZUKAI);
    const cells=keys.map(k=>{
      const got=ST.zk[k];
      return `<button class="btn zukan-cell ${got?"":"mystery"}" style="font-family:inherit" onclick="${got?`zukanCard('${k}')`:""}">${px("book"in PX?"book":"scroll",34)}<br>${got?ZUKAI[k].t.split("(")[0].slice(0,8):"???"}<span class="zr">${got?"タップで図解":"問題を解くと解放"}</span></button>`;
    }).join("");
    body=`<div class="banner">論点図解 全${keys.length}枚。その論点の問題を解くと解放される</div><div class="zukan-grid">${cells}</div>`;
  }else if(tab==="a"){
    const done=achDone(),set=new Set(done.map(a=>a.id));
    const cells=ACHIEVEMENTS.map(a=>{
      const ok=set.has(a.id);
      return `<div class="zukan-cell ${ok?"":"mystery"}">${px(a.icon,34)}<br>${ok?esc(a.name):"???"}<span class="zr">${ok?esc(a.desc):"未達成"}</span></div>`;
    }).join("");
    body=`<div class="banner">実績バッジ 全${ACHIEVEMENTS.length}種。冒険の節目で解放される(${done.length}/${ACHIEVEMENTS.length})</div><div class="zukan-grid">${cells}</div>`;
  }else{
    const cells=COMPANIONS.map(c=>{
      const got=ST.party&&ST.party[c.id];
      return `<button class="btn zukan-cell ${got?"":"mystery"}" style="font-family:inherit" onclick="${got?`cpShow('${c.id}')`:""}">${px(c.sp,36)}<br>${got?esc(c.name.split("・").pop()):"???"}<span class="zr">${got?esc(c.desc):`第${c.joinCh+1}章クリアで加入`}</span></button>`;
    }).join("");
    body=`<div class="banner">事務所の仲間 全${COMPANIONS.length}人。章をクリアすると加わる(${partyCount()}/${COMPANIONS.length})</div><div class="zukan-grid">${cells}</div>`;
  }
  app.innerHTML=head+tabs+body;
}
function zukanCard(k){
  showOvl(`<div style="text-align:left;max-height:64dvh;overflow-y:auto">${zcardHtml(k)}</div>
    <button class="btn go-btn" style="width:100%;margin-top:8px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
window.zukan=zukan;window.zukanCard=zukanCard;

/* 学習分析(analysis)・記録(records)は ui-stats.js に移設(論点ヒートマップ追加のため) */

