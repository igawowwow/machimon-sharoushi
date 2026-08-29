"use strict";
/* ============================================================
   ui-quest.js — メインクエスト(線形のストーリー進行)
   「やること多すぎ」への回答: 常に「次はこれ」を1ボタンで示す。
   章=科目(0..8)、各章: ①修行(習得+5) → ②ボス討伐 → ③事件簿(ある章のみ) → 次章。
   終章(ch=9): 試験の神を倒してストーリークリア。
   進行は ST.msq={ch,step,tgt,done} に保存。既存の実績(eKill/cases/clears)は自動で消化。
   ============================================================ */
const MSQ_CASE={0:"rouki1",1:"anei1",2:"rousai1",5:"kenpo1",6:"kokunen1",7:"kounen1"};
/* ブラック企業帝国 討伐ストーリー。敵は各章のブラック企業、だが最終盤で
   「悪は企業だけではない——知らないこと・言えない空気・追い詰められた事情」に反転する。 */
const MSQ_STORY=[
 {corp:"(株)残業マグマ",intro:[
  {sp:"hero",n:"あなた",t:"ここが帝国の最初の砦…(株)残業マグマ。タイムカードが熱で溶けるという…"},
  {sp:"ghost",n:"入社2年目の社員",t:"月120時間の残業。「若いうちの苦労は買ってでもしろ」って言われて…同期は先月、駅のホームで倒れた。"},
  {sp:"oni",n:"監督官ロウキ",t:"残業は情熱の証!文句があるなら労基法で殴ってみせよ!"}],
  clear:[
  {sp:"oni",n:"監督官ロウキ",t:"36協定…割増賃金…知っている者には、こうも通じぬのか…"},
  {sp:"hero",n:"あなた",t:"残業マグマは鎮火した。だが帝国はまだ広い。"}]},
 {corp:"ノーヘル工業",intro:[
  {sp:"hero",n:"あなた",t:"第2の砦、ノーヘル工業。安全装置を「気合」で代替する工場だ。"},
  {sp:"ghost",n:"57歳の工員",t:"指を挟んだ日、班長に「ヘルメットの記録だけは残すな」と言われた。ここで40年、家族を養ってきたんだ。逆らえるわけがない。"},
  {sp:"helm",n:"安全鬼アンエイ",t:"安全はコスト!ケガは根性不足じゃ!"}],
  clear:[
  {sp:"helm",n:"安全鬼アンエイ",t:"50人ラインも、健診の保存年数も…ぜんぶ法律に書いてあったとは…"},
  {sp:"hero",n:"あなた",t:"工場に安全装置が戻った。次へ行こう。"}]},
 {corp:"モミケシ運輸",intro:[
  {sp:"hero",n:"あなた",t:"モミケシ運輸——労災を「なかったこと」にする配送網。"},
  {sp:"skull",n:"元配達員",t:"配送中に転んで腰をやった。労災を出したら次の日から仕事が来なくなった。「個人事業主」だからって。俺、明日から何を食えばいい?"},
  {sp:"fire",n:"ロウサイ大王",t:"労災は事故ではなく「自己」責任!フハハ!"}],
  clear:[
  {sp:"fire",n:"ロウサイ大王",t:"退職しても権利は消えぬ…1人でも適用…ワシの帝国が…"},
  {sp:"hero",n:"あなた",t:"もみ消された伝票が、全部日の目を見た。"}]},
 {corp:"ツカイステ派遣",intro:[
  {sp:"hero",n:"あなた",t:"ツカイステ派遣。契約を細切れにして、人を使い捨てる館だ。"},
  {sp:"ghost",n:"3年更新を重ねた女性",t:"「来月から来なくていい」を、もう5回言われた。保険にも入れず、産休の話をしたら更新されなかった。私の3年は、なんだったんだろう。"},
  {sp:"ghost",n:"シツギョウ魔人",t:"雇用保険?入れなければ払わずに済むわ!"}],
  clear:[
  {sp:"ghost",n:"シツギョウ魔人",t:"20時間と31日…その線を、労働者が知っているとは…"},
  {sp:"hero",n:"あなた",t:"使い捨てられた人たちに、失業手当と再出発が届いた。"}]},
 {corp:"スルヌケ商会",intro:[
  {sp:"hero",n:"あなた",t:"スルヌケ商会。保険料の「経費削減」が得意技の問屋だ。"},
  {sp:"daruma",n:"板挟みの経理係",t:"保険料を払えば会社が潰れる、払わなければ社員が守られない。社長も本当は泣いていた。誰が悪いのか、私にはもう分からない。"},
  {sp:"bag",n:"取立番長",t:"払わぬが勝ちよ!取れるもんなら取ってみな!"}],
  clear:[
  {sp:"bag",n:"取立番長",t:"故意なら給付額の100%徴収…追徴金に延滞金…払った方が安かった…"},
  {sp:"hero",n:"あなた",t:"帳簿が白くなった。帝国の金庫が軋み始めている。"}]},
 {corp:"ジヒバラ製薬",intro:[
  {sp:"hero",n:"あなた",t:"ジヒバラ製薬。ここでは保険証が「3年勤続のご褒美」らしい。"},
  {sp:"ghost",n:"外国人技能実習生",t:"熱が40度出ても、保険証をもらえなかった。「3年頑張れば正社員」——その言葉だけを信じて、国の家族に仕送りしています。"},
  {sp:"pill",n:"ケンポ将軍",t:"健康は自己管理!保険はワシの気分次第よ!"}],
  clear:[
  {sp:"pill",n:"ケンポ将軍",t:"入社した日から被保険者…5日以内に届出…気分の入る余地などなかった…"},
  {sp:"hero",n:"あなた",t:"全員の保険証が発行された。安心して病院に行ける。"}]},
 {corp:"ナイナイ興業",intro:[
  {sp:"hero",n:"あなた",t:"ナイナイ興業。「年金は都市伝説」と社員を洗脳する会社だ。"},
  {sp:"skull",n:"39歳・独身の社員",t:"「年金なんて払うだけ損」——先輩の言葉を信じて未納を続けた。去年、事故で歩けなくなって初めて知った。障害年金の申請には、あの時払っていた記録が要ったんだ。"},
  {sp:"sage",n:"コクネン仙人",t:"未納こそ賢者の道!フォッフォッフォ!"}],
  clear:[
  {sp:"sage",n:"コクネン仙人",t:"免除・猶予・追納…払えぬ者を守る道が、こんなにあったとは…"},
  {sp:"hero",n:"あなた",t:"「知らない」が一番高くつく——社員たちの目が覚めた。"}]},
 {corp:"モグリ建設",intro:[
  {sp:"hero",n:"あなた",t:"モグリ建設。従業員全員を「一人親方」にして厚生年金から逃げる城だ。"},
  {sp:"hammer",n:"一人親方にされた職人",t:"社会保険に入れないよう「独立」させられた。仲間が現場で亡くなった時、遺族には遺族年金も出なかった。あいつの子ども、まだ小学生なんだ。"},
  {sp:"king",n:"コウネン皇帝",t:"雇わなければ払わずに済む!それが帝王学よ!"}],
  clear:[
  {sp:"king",n:"コウネン皇帝",t:"実態で判断される…偽装は通らぬ…二階への階段は皆のものだったか…"},
  {sp:"hero",n:"あなた",t:"職人たちに厚生年金の記録が付き始めた。帝国の中枢が見えてきた。"}]},
 {corp:"ゼングレー総研",intro:[
  {sp:"hero",n:"あなた",t:"帝国の参謀・ゼングレー総研。「法律は全部グレー」と囁くコンサルだ。"},
  {sp:"ghost",n:"追い詰められた社長",t:"最初はたった一度の「見て見ぬふり」だった。下請けを切られないため、社員を守るため——気づけば、自分が一番憎んでいたものになっていた。"},
  {sp:"wiz",n:"統計老師",t:"白と黒の間には無限の灰色がある…読み切れるかな?"}],
  clear:[
  {sp:"wiz",n:"統計老師",t:"判例・条文・統計…グレーに見えたのは、わしの目が曇っていただけか…"},
  {sp:"hero",n:"あなた",t:"参謀が去り、帝国の玉座が露わになった。最後の戦いへ。"}]}
];
/* 終章と、クリア後の「君はどう生きる」 */
const MSQ_FINAL={
 intro:[
  {sp:"god",n:"試験の神",t:"よくぞここまで来た。だが問おう——お前が倒してきた社長たちは、生まれつきの悪だったか?"},
  {sp:"god",n:"試験の神",t:"残業マグマの社長は、かつて納期に追われ家族を顧みず働いた労働者だった。モミケシ運輸の所長は、労災を出せば本社に切られる下請けだった。"},
  {sp:"god",n:"試験の神",t:"「知らない」こと。「言えない」空気。「頼る先」を誰も教えないこと。——帝国の正体は、それだ。"},
  {sp:"god",n:"試験の神",t:"ならば——お前は誰を裁く?いや、違う。お前が本当にやるべきは、彼らを『良い経営者』に変えることだ。"},
  {sp:"god",n:"試験の神",t:"働く人を守る一番の近道は、会社を強くすることだ。潰れない会社、伸びる会社の中でこそ、人は守られる。それを証明してみせよ。"}],
 epilogue:[
  {sp:"hero",n:"あなた",t:"帝国は崩れた。だが私は、彼らを裁いて終わりにはしなかった。倒すのではなく、隣に立つことにした。"},
  {sp:"king",n:"元・残業マグマ社長",t:"あんたに労務を一から教わって、目が覚めたよ。残業を減らしたら、辞める社員が消えた。採用費も、ミスも減った。守るコストじゃない——強くなる投資だったんだな。"},
  {sp:"megami",n:"加藤さん",t:"あの会社、今は『働きやすい優良企業』の認定を取ったんです。私、辞めずに戻りました。社長が変わると、こんなに会社って変わるんですね。"},
  {sp:"hammer",n:"元・偽装請負の職人",t:"社長が俺たちをちゃんと雇い直してくれた。社会保険も年金も付いた。安心して働けるから、いい仕事ができる。会社の受注も、前より増えたんだ。"},
  {sp:"hero",n:"あなた",t:"分かったことがある。労働者を守る一番の近道は、経営者を敵にすることじゃない。経営者を、良い経営者にすることだ。"},
  {sp:"hero",n:"あなた",t:"人を大切にする会社は、強い。強い会社は、人を守れる。この二つは、対立じゃない。同じ一つの輪だ。"},
  {sp:"hero",n:"あなた",t:"社労士は、経営者の一番のパートナーだ。会社を伸ばし、その中で働く人を守る。両方を同時に叶える——それが、この仕事の誇りだ。"},
  {sp:"trophy",n:"",t:"この物語は、ここで終わる。だが君の物語は、合格した先から始まる。次の経営者の隣に立ち、会社と人を、一緒に強くするために。——さあ、君は、どう生きる?"}]
};
const MSQ_TRAIN_ADD=3; /* 各章の修行ノルマ: 習得を+3(M5でテンポ優先に緩和。学習は雑魚ラッシュで自然に積む) */
function msqMastered(si){return Q.filter(x=>x.s===si&&(qstat(x.id).s||0)>=2).length;}
function msqSubjTotal(si){return Q.filter(x=>x.s===si).length;}
/* ── 悪魔への道 章進行アクセサ ──
   ST.msq を素直に読む: ch=現在章(=制覇済み章数 clearedCh)、step=章内フェーズ(chapterPhase)。
   章内フェーズ数 m は 修行→ボス(→事件簿がある章のみ)で 2 or 3。全9章制覇で頂(本試験=試験の悪魔)。 */
function msqPhaseTotal(ch){return MSQ_CASE[ch]?3:2;}
function msqRoad(){
  const m=ST.msq;
  if(m.done)return {cur:9,total:9,phase:0,phaseTotal:0,cleared:9,done:true};
  if(m.ch>=9)return {cur:9,total:9,phase:0,phaseTotal:0,cleared:9,fin:true};
  const pt=msqPhaseTotal(m.ch);
  return {cur:m.ch+1,total:9,phase:Math.min(m.step+1,pt),phaseTotal:pt,cleared:m.ch};
}
/* ホーム/地図共通の「悪魔への道 第◯章/9・章内 ステップn/m」ラベル */
function msqRoadLabel(){
  const r=msqRoad();
  if(r.done)return "悪魔への道 完遂 ─ 本試験に挑む準備完了";
  if(r.fin)return "悪魔への道 頂 ─ 本試験(試験の神)";
  return `悪魔への道 第${r.cur}章/9 ・ 章内ステップ${r.phase}/${r.phaseTotal}`;
}
/* 現在の状態を評価し、達成済みステップを自動で進める。進んだ内容を配列で返す */
function msqAdvance(){
  const m=ST.msq,adv=[];
  let guard=0;
  while(guard++<40){
    if(m.ch>=9){ /* 終章 */
      if(!m.done&&ST.clears>=1){m.done=1;adv.push("clear");}
      break;
    }
    if(m.step===0){
      if(m.tgt==null)m.tgt=Math.min(msqMastered(m.ch)+MSQ_TRAIN_ADD,msqSubjTotal(m.ch));
      if(msqMastered(m.ch)>=m.tgt){m.step=1;adv.push("train");}else break;
    }else if(m.step===1){
      if(ST.eKill[m.ch]){m.step=2;adv.push("boss");}else break;
    }else{
      const cid=MSQ_CASE[m.ch];
      if(!cid||(ST.cases[cid]&&ST.cases[cid].cleared)){
        adv.push("chapter");
        ST.coins+=300;ST.chests++;
        m.ch++;m.step=0;m.tgt=null;
      }else break;
    }
  }
  if(adv.length)saveST();
  return adv;
}
function msqStepInfo(){
  const m=ST.msq;
  if(m.done)return {label:"👑 悪魔への道 完遂。本試験シミュレーション(真ラスボス周回)へ",cta:"startTrue()",btn:"厚生労働神に挑む"};
  if(m.ch>=9)return {label:"本試験シミュレーション: 試験の神を倒せ("+(badgeCount()>=9?"挑戦可能":"全ボス討伐で解放")+")",cta:badgeCount()>=9?"startLast()":"questHub()",btn:"試験の神に挑む"};
  const name=SUBJECTS[m.ch];
  if(m.step===0){
    const cur=msqMastered(m.ch),tgt=m.tgt==null?cur+MSQ_TRAIN_ADD:m.tgt;
    return {label:`修行: ${name}の習得をあと${Math.max(0,tgt-cur)}個増やす`,cta:`startTrain(${m.ch})`,btn:"修行に出る"};
  }
  if(m.step===1)return {label:`ボス討伐: ${BOSSES[m.ch].name}を倒せ`,cta:(masteryPct(m.ch)*100>=unlockNeed())?`startBoss(${m.ch})`:`startTrain(${m.ch})`,btn:(masteryPct(m.ch)*100>=unlockNeed())?"ボスに挑む":"修行して解放する"};
  return {label:`事件簿: ${CASES.find(c=>c.id===MSQ_CASE[m.ch]).title}を解決せよ`,cta:`caseOpen('${MSQ_CASE[m.ch]}')`,btn:"事件に向かう"};
}
/* ホーム最上部のメインクエストカード */
function msqHomeCard(){
  const before=ST.msq.ch;
  const adv=msqAdvance();
  if(adv.includes("chapter")){
    const clearedCh=Math.max(0,ST.msq.ch-1);
    const st=MSQ_STORY[clearedCh]&&MSQ_STORY[clearedCh].clear;
    const nextCh=ST.msq.ch; /* 次の砦を予告(クリフハンガー) */
    setTimeout(()=>{bigBanner("🏢 "+((MSQ_STORY[clearedCh]||{}).corp||"章")+" 崩壊! +300コイン+宝箱","#C58900",20);SFX.levelup();if(st)storyShow(st,()=>{if(typeof townTeaser==="function")townTeaser(nextCh);});else if(typeof townTeaser==="function")townTeaser(nextCh);},400);
  }
  if(adv.includes("clear"))setTimeout(()=>{confetti(60);SFX.levelup();storyShow(MSQ_FINAL.epilogue,null);},400);
  const m=ST.msq,info=msqStepInfo();
  const chLabel=m.done?"完":m.ch>=9?"終章":`第${m.ch+1}章`;
  const corp=m.ch<9?`「${MSQ_STORY[m.ch].corp}」`:"";
  const total=10,prog=Math.min(m.ch+(m.step/3),total),pct=Math.round(prog/total*100);
  const bar=`<span style="display:block;height:6px;max-width:230px;margin-top:6px;border-radius:4px;overflow:hidden;background:rgba(255,255,255,.22)"><i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#FFD98A,#FF9EC4)"></i></span>`;
  return `<button class="btn mode-btn" style="background:linear-gradient(135deg,#33303E,#6E5FA0);color:#fff" onclick="worldMap()">
    ${px("excal",36)}<span>🗺️ 冒険の地図 ${chLabel}${corp}<span class="d" style="color:#D8CFF5">📍 ${info.label}</span>${bar}</span>
    <span class="cnt">${pct}%</span></button>`;
}
/* メインクエストボタン: 章の初回は討伐ストーリーを流してから出撃 */
function msqGo(){
  const m=ST.msq,info=msqStepInfo();
  const act=()=>{new Function(info.cta)();};
  if(!m.done&&m.ch<9&&!ST.story["msqi"+m.ch]){
    ST.story["msqi"+m.ch]=1;saveST();
    storyShow(MSQ_STORY[m.ch].intro,act);
  }else if(!m.done&&m.ch>=9&&!ST.story["msqfinal"]){
    ST.story["msqfinal"]=1;saveST();
    storyShow(MSQ_FINAL.intro,act);
  }else act();
}
/* ホーム最上位の唯一の主要CTA「今日の冒険」。
   msqStepInfo(次の一手)を核に、現在章/現在地/次の目的/推奨時間/出題数/主要報酬/物語予告を1枚に集約。
   期限到来の復習(due)があれば「冒険の前段」として自然に組み込み、別の大ボタンにしない。 */
function msqTodayCard(){
  const adv=msqAdvance();
  if(adv.includes("chapter")){
    const clearedCh=Math.max(0,ST.msq.ch-1);
    const st=MSQ_STORY[clearedCh]&&MSQ_STORY[clearedCh].clear;
    const nextCh=ST.msq.ch; /* 次の砦を予告(クリフハンガー) */
    setTimeout(()=>{bigBanner("🏢 "+((MSQ_STORY[clearedCh]||{}).corp||"章")+" 崩壊! +300コイン+宝箱","#C58900",20);SFX.levelup();if(st)storyShow(st,()=>{if(typeof townTeaser==="function")townTeaser(nextCh);});else if(typeof townTeaser==="function")townTeaser(nextCh);},400);
  }
  if(adv.includes("clear"))setTimeout(()=>{confetti(60);SFX.levelup();storyShow(MSQ_FINAL.epilogue,null);},400);
  const m=ST.msq,info=msqStepInfo(),due=(typeof dueIds==="function"?dueIds().length:0),r=msqRoad();
  const chLabel=m.done?"悪魔への道 完遂":m.ch>=9?"悪魔への道 最終章":`悪魔への道 第${m.ch+1}章/9`;
  const corp=m.ch<9?MSQ_STORY[m.ch].corp:"";
  const loc=m.done?"悪魔への道 完遂 ─ 本試験シミュレーション":m.ch>=9?"頂 ─ 本試験(試験の神)の間":`帝国「${corp}」の砦`;
  const phaseTxt=(!m.done&&m.ch<9)?`章内ステップ${r.phase}/${r.phaseTotal}`:"";
  let teaser="";
  if(m.ch<9){const ln=MSQ_STORY[m.ch].intro.find(x=>x.sp!=="hero");if(ln)teaser=ln.t;}
  else if(!m.done)teaser=MSQ_FINAL.intro[0].t;
  let n=6,reward="習得+XP・コイン";
  if(m.done||m.ch>=9){n=(typeof LASTCFG==="function"?LASTCFG().n:40);reward="周回クリア・称号";}
  else if(m.step===0){const cur=msqMastered(m.ch),tgt=m.tgt==null?cur+MSQ_TRAIN_ADD:m.tgt;n=Math.max(1,tgt-cur);reward=`習得+${n}・XP・コイン`;}
  else if(m.step===1){n=msqSubjTotal(m.ch);reward="討伐バッジ・コイン・宝箱";}
  else {n=6;reward="事件解決・仲間・報酬";}
  const mins=Math.max(3,Math.round(n*0.6));
  let hint="";
  if(!m.done&&m.ch<9&&m.step===1){const rec=Math.ceil(bossHPMax(m.ch)/9);hint=` ｜ ボス推奨⚔${rec}${playerDmg()<rec?"⚠装備強化を":""}`;}
  const total=10,prog=Math.min((m.done?10:m.ch)+(m.done?0:m.step/3),total),pct=Math.round(prog/total*100);
  const pre=due>0?`<div style="margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(255,220,235,.16);font-size:10px;color:#FFE1EB">🩹 まず<b>記憶の綻びを繕う</b>(今日の復習${due}問・XP2倍)。繕ってから砦へ向かう。</div>`:"";
  const btn=due>0?"復習して冒険へ":info.btn;
  const tz=teaser?esc(teaser):"";
  return `<div class="sec" style="margin-top:2px">🌅 今日の冒険 ─ 悪魔への道を進む</div>
  <button class="btn td-card" style="background:linear-gradient(135deg,#33303E,#6E5FA0);color:#fff;display:block;text-align:left;padding:12px" onclick="startTodayAdventure()">
    <span style="display:flex;align-items:center;gap:8px">
      ${px("excal",38,"floaty")}
      <span style="flex:1">
        <span style="font-size:11px;color:#FFD98A;font-weight:900">${chLabel}${corp?"｜"+esc(corp):""}</span><br>
        <b style="font-size:15px">📍 ${esc(loc)}</b></span>
      <span class="cnt" style="color:#fff">${pct}%</span></span>
    ${tz?`<span style="display:block;margin-top:5px;font-size:10px;color:#CFCBDE;font-style:italic">「${tz.slice(0,42)}${teaser.length>42?"…":""}」</span>`:""}
    <span style="display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;font-size:9.5px;color:#D8CFF5">
      <span>🎯 ${esc(info.label)}</span>${phaseTxt?`<span>🧭 ${phaseTxt}</span>`:""}<span>⏱ 約${mins}分・${n}問${hint}</span><span>🎁 ${reward}</span></span>
    ${pre}
    <span style="display:block;margin-top:8px;text-align:center;background:#FFD98A;color:#33303E;font-weight:900;border-radius:10px;padding:9px;font-size:14px">${esc(btn)} ▶</span>
  </button>`;
}
/* 今日の冒険ボタン: due>0なら復習を前段に、なければメインクエストへ */
function startTodayAdventure(){
  if(typeof qsEv==="function")qsEv("home_primary_cta_clicked"); /* #68 計測(端末内のみ) */
  if(typeof dueIds==="function"&&dueIds().length>0){startReview();return;}
  msqGo();
}
window.msqRoad=msqRoad;window.msqRoadLabel=msqRoadLabel;window.msqPhaseTotal=msqPhaseTotal;
window.msqAdvance=msqAdvance;window.msqHomeCard=msqHomeCard;window.msqStepInfo=msqStepInfo;window.msqGo=msqGo;
window.msqTodayCard=msqTodayCard;window.startTodayAdventure=startTodayAdventure;
