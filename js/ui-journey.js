"use strict";
/* ============================================================
   ui-journey.js — 悪魔への道(メタ進行の背骨) D3
   ------------------------------------------------------------
   北極星は一つ=【試験の悪魔(本試験の化身)】を倒すこと。
   バラバラだった育成(知識の定着・帝国制圧=科目攻略・戦力・事務所・仲間・図鑑)を
   ひとつの「悪魔攻略度(readiness)」に束ね、常に「次の一手」を示す。

   ・攻略度は "表示専用" の羅針盤。悪魔戦そのものは装備無効の実力勝負(isExam)なので、
     この数値が上がっても答えが当たりやすくなることは無い=学習の芯を壊さない。
   ・重みは知識(定着)を最重視(0.40)。装備/事務所/仲間は"支援・動機"として軽め。
     → 知識+帝国+図鑑(=学習駆動)で 0.67、支援系で 0.33。学習が主役。
   ・全入力は typeof ガード+0除算防止で、新フィールドの無い旧セーブでも安全に0扱い。
   ============================================================ */

/* 0除算せず 0..100 の整数% に丸める */
function jrPct(cur,max){max=+max;if(!(max>0))return 0;return Math.max(0,Math.min(100,Math.round(cur/max*100)));}

/* 攻略度を成す6本の柱。どれも「悪魔に近づく寄り道」= 各々に入口(go)がある */
function journeyPillars(){
  const P=[];
  const pass=(typeof passPct==="function")?passPct():0;
  P.push({key:"know",icon:"📖",name:"知識の定着",w:0.40,cur:pass,max:100,pct:jrPct(pass,100),
    help:"本試験そのもの。悪魔に最も効く",go:"startReco()",goLabel:"おすすめ20問で鍛える"});

  const chDone=(typeof ST!=="undefined"&&ST.msq)?((ST.msq.done)?9:Math.min(9,ST.msq.ch||0)):0;
  P.push({key:"empire",icon:"🗺️",name:"帝国制圧(科目攻略)",w:0.20,cur:chDone,max:9,pct:jrPct(chDone,9),
    help:"9科目をまんべんなく攻略する道",go:"worldMap()",goLabel:"冒険の地図へ"});

  const pw=(typeof playerPower==="function")?playerPower():0;
  const tgt=(typeof bossPowerReq==="function")?Math.max(1,bossPowerReq(8)):320;
  P.push({key:"power",icon:"⚔",name:"戦力(装備)",w:0.15,cur:Math.min(pw,tgt),max:tgt,pct:jrPct(pw,tgt),
    help:"苦戦を減らし、修行がぐっと捗る",go:"shop()",goLabel:"装備を鍛える"});

  const or=(typeof officeRank==="function")?officeRank():0;
  const omax=(typeof OFFICE_RANKS!=="undefined")?Math.max(1,OFFICE_RANKS.length-1):4;
  P.push({key:"office",icon:"🏢",name:"事務所",w:0.10,cur:or,max:omax,pct:jrPct(or,omax),
    help:"顧問料でコイン→装備・ガチャに還元",go:"office()",goLabel:"事務所を育てる"});

  const partyN=(typeof partyCount==="function")?partyCount():0;
  const partyMax=(typeof COMPANIONS!=="undefined")?Math.max(1,COMPANIONS.length):9;
  P.push({key:"party",icon:"🤝",name:"仲間",w:0.08,cur:partyN,max:partyMax,pct:jrPct(partyN,partyMax),
    help:"常時ボーナスで冒険を後押し",go:"zukan('c')",goLabel:"仲間を見る"});

  const be=(typeof bestiaryPct==="function")?bestiaryPct():0;
  const gi=(typeof zukanItemPct==="function")?zukanItemPct():0;
  const col=Math.round((be+gi)/2);
  P.push({key:"zukan",icon:"📚",name:"図鑑コンプ",w:0.07,cur:col,max:100,pct:col,
    help:"敵と装備を知り尽くす収集の道",go:"zukan('e')",goLabel:"図鑑を埋める"});
  return P;
}
/* 攻略度(0..100)= Σ 重み×柱の% */
function demonReadiness(){
  const s=journeyPillars().reduce((a,p)=>a+p.w*p.pct,0);
  return Math.max(0,Math.min(100,Math.round(s)));
}
/* 攻略度→段差(手応えの層)。長期目標のマイルストーンを言葉で示す */
function readinessTier(r){
  if(r>=80)return {t:"合格圏 ― 悪魔を討てる",c:"#2B9E82"};
  if(r>=60)return {t:"合格ラインが見えた",c:"#2B62D9"};
  if(r>=30)return {t:"挑戦圏 ― 善戦できる",c:"#C58900"};
  return {t:"旅立ちの途上",c:"#8A8494"};
}
/* いま一番おすすめの「次の一手」。本筋(冒険)を軸に、導入未突破/期限復習を優先 */
function nextBestAction(){
  if(typeof ST!=="undefined"&&ST.intro){
    if(!ST.intro.easy)return {label:"はじまりの試練で最初の一勝を挙げる",cta:"introStart()",btn:"試練に挑む",icon:"skull"};
    if(!ST.intro.met)return {label:"試験の悪魔と対峙する",cta:"startDemon()",btn:"悪魔に挑む",icon:"mao"};
  }
  const due=(typeof dueIds==="function")?dueIds().length:0;
  if(due>0)return {label:"記憶の綻びを繕う(復習"+due+"問・XP2倍)",cta:"startReview()",btn:"復習する",icon:"ghost"};
  if(typeof msqStepInfo==="function"){const info=msqStepInfo();return {label:info.label,cta:info.cta,btn:info.btn,icon:"excal"};}
  return {label:"おすすめ20問で知識を鍛える",cta:"startReco()",btn:"鍛える",icon:"scroll"};
}
/* 「次の一手」を実行(導入→悪魔→期限復習→本筋の冒険 の順で最適な入口へ) */
function journeyGo(){
  if(typeof ST!=="undefined"&&ST.intro){
    if(!ST.intro.easy&&typeof introStart==="function")return introStart();
    if(!ST.intro.met&&typeof startDemon==="function")return startDemon();
  }
  if(typeof dueIds==="function"&&dueIds().length>0&&typeof startReview==="function")return startReview();
  if(typeof startTodayAdventure==="function")return startTodayAdventure();
  if(typeof startReco==="function")return startReco();
}

/* ---------- ホーム: 背骨を1枚で束ねる羅針盤カード ---------- */
function journeyCard(){
  if(typeof ST==="undefined"||!ST.intro)return "";
  const r=demonReadiness(),tier=readinessTier(r),na=nextBestAction();
  const won=(ST.intro.win||0)>0;
  return `<div class="sec" style="margin-top:2px">👹 悪魔への道 ─ 目標は「本試験の化身」を倒すこと</div>
  <button class="btn" style="width:100%;font-family:inherit;text-align:left;background:linear-gradient(135deg,#2A1533,#5B2B6E);color:#fff;padding:12px;display:block" onclick="journeyHub()">
    <span style="display:flex;align-items:center;gap:10px">
      ${px("mao",40,won?"":"floaty")}
      <span style="flex:1">
        <span style="font-size:10px;color:#E7C6F0;font-weight:900">${won?"👑 撃破済 ─ 実力を保て":esc(tier.t)}</span><br>
        <b style="font-size:15px">悪魔攻略度 <span style="color:#FFD98A">${r}%</span></b>
        <span style="display:block;height:7px;margin-top:5px;border-radius:5px;overflow:hidden;background:rgba(255,255,255,.2);position:relative">
          <i style="display:block;height:100%;width:${r}%;background:linear-gradient(90deg,#FFD98A,#FF9EC4)"></i></span>
      </span>
      <span style="font-size:11px;color:#E7C6F0;white-space:nowrap">全体地図 ▶</span>
    </span>
    <span style="display:block;margin-top:7px;font-size:10px;color:#E7C6F0">🧭 次の一手: <b style="color:#fff">${esc(na.label)}</b></span>
  </button>`;
}

/* ---------- 「悪魔への道」全体マップ画面(背骨の本体) ---------- */
function journeyHub(){
  stopTimer();if(typeof hideOvlSilent==="function")hideOvlSilent();
  if(typeof setBgmScene==="function")setBgmScene("town");
  if(typeof msqAdvance==="function")msqAdvance(); /* 到達状況を最新化 */
  const r=demonReadiness(),tier=readinessTier(r),pillars=journeyPillars(),na=nextBestAction();
  const won=(ST.intro&&(ST.intro.win||0)>0);
  /* マイルストーン目盛り(段差を可視化) */
  const ticks=[30,60,80].map(v=>`<span style="position:absolute;left:${v}%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.35)"></span>`).join("");
  const apex=`
  <div style="background:linear-gradient(135deg,#2A1533,#5B2B6E);color:#fff;border-radius:14px;padding:14px 13px;text-align:center">
    ${px("mao",64,won?"":"floaty")}
    <div style="font-weight:900;font-size:15px;margin-top:2px">試験の悪魔(本試験の化身)</div>
    <div style="font-size:10px;color:#E7C6F0;margin-top:2px">${won?"👑 一度は討った。実力を保ち、何度でも挑め":"すべての道は、ここへ通じる"}</div>
    <div style="font-size:26px;font-weight:900;color:#FFD98A;margin-top:8px">攻略度 ${r}%</div>
    <div style="position:relative;height:12px;margin:7px 2px 3px;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.18)">
      <i style="display:block;height:100%;width:${r}%;background:linear-gradient(90deg,#FFD98A,#FF9EC4)"></i>${ticks}</div>
    <div style="display:flex;justify-content:space-between;font-size:8px;color:#C9AFD6;margin:0 2px">
      <span>0</span><span>🎯30 挑戦圏</span><span>60 合格ライン</span><span>80 合格圏</span></div>
    <div style="font-weight:900;font-size:12px;color:${tier.c==='#8A8494'?'#D8C4E0':'#FFE9A8'};margin-top:6px">${esc(tier.t)}</div>
  </div>`;
  const mainCta=`
  <button class="btn go-btn" style="width:100%;margin-top:10px;padding:12px;font-size:15px" onclick="journeyGo()">
    🧭 次の一手: ${esc(na.btn)} ▶</button>
  <div style="font-size:10px;color:#8A8494;text-align:center;margin:5px 2px 0">📍 ${esc(na.label)}</div>`;
  const pillarRows=pillars.map(p=>`
    <button class="btn" style="width:100%;font-family:inherit;text-align:left;background:var(--card,#fff);border:1px solid rgba(122,91,217,.18);border-radius:12px;padding:9px 11px;margin-bottom:6px;display:block" onclick="${p.go}">
      <span style="display:flex;align-items:center;gap:9px">
        <span style="font-size:19px;line-height:1">${p.icon}</span>
        <span style="flex:1">
          <b style="font-size:12.5px">${esc(p.name)}</b>
          <span style="display:block;font-size:8.5px;color:#8A8494;margin-top:1px">${esc(p.help)}</span>
          <span style="display:block;height:6px;margin-top:5px;border-radius:4px;overflow:hidden;background:#EFEAF8"><i style="display:block;height:100%;width:${p.pct}%;background:linear-gradient(90deg,#7A5BD9,#FF9EC4)"></i></span>
        </span>
        <span style="text-align:right;white-space:nowrap"><b style="font-size:14px;color:#5B2B6E">${p.pct}%</b><br><span style="font-size:8px;color:#8A8494">${p.cur}/${p.max}</span></span>
      </span>
      <span style="display:block;margin-top:5px;font-size:9.5px;color:#2B62D9;font-weight:800">${esc(p.goLabel)} ▶</span>
    </button>`).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 拠点へ</button>
    <span style="font-weight:900;font-size:14px">👹 悪魔への道</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  ${apex}
  ${mainCta}
  <div class="sec">🎒 今日の気分で選ぶ寄り道 ─ どれも悪魔に効く</div>
  <div style="font-size:9.5px;color:#8A8494;margin:0 2px 7px">攻略度を上げる要素はぜんぶここ。バーが低い柱ほど、いま伸ばすと効く。</div>
  ${pillarRows}
  <div class="footer-note">攻略度は道しるべ。悪魔戦は装備無効の実力勝負なので、この数値が上がっても"答えが当たる"ことはない。上げる正体は、あなたの知識だ。</div>`;
}

if(typeof window!=="undefined"){
  window.journeyPillars=journeyPillars;window.demonReadiness=demonReadiness;
  window.readinessTier=readinessTier;window.nextBestAction=nextBestAction;
  window.journeyGo=journeyGo;window.journeyCard=journeyCard;window.journeyHub=journeyHub;
}
