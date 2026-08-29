"use strict";
/* ============================================================
   ui-stats.js — 学習分析(科目別+論点ヒートマップ)・記録
   analysis/records は ui-home.js から移設(2026-07-14)。
   論点=図解カード(ZUKAI)単位。zkey で問題を論点にグルーピングし、
   習得度を色で可視化。タップで図解+その論点だけの集中特訓へ。
   ============================================================ */

/* ---- 論点別の習得集計 ---- */
function topicStats(){
  const map={};
  Q.forEach(q=>{
    const k=zkey(q);if(!k)return;
    const m=map[k]||(map[k]={total:0,seen:0,mastered:0,c:0,w:0});
    m.total++;
    const st=ST.q[q.id];
    if(st&&(st.c+st.w)>0){m.seen++;m.c+=st.c;m.w+=st.w;}
    if(st&&(st.s||0)>=2)m.mastered++;
  });
  return map;
}
function topicIds(k){return Q.filter(q=>zkey(q)===k).map(q=>q.id);}
function heatCls(m){
  if(!m.seen)return "h0";               /* 未着手 */
  const pct=m.mastered/m.total;
  return pct>=0.7?"h3":pct>=0.3?"h2":"h1"; /* 緑/黄/赤 */
}
function heatmapHtml(){
  const stats=topicStats();
  const keys=Object.keys(stats).sort((a,b)=>{
    const sa=ZINFO[a]?ZINFO[a].s:9,sb=ZINFO[b]?ZINFO[b].s:9;
    return sa-sb||(stats[a].mastered/stats[a].total)-(stats[b].mastered/stats[b].total);
  });
  let lastS=-1,out="";
  keys.forEach(k=>{
    const s=ZINFO[k]?ZINFO[k].s:8;
    if(s!==lastS){lastS=s;out+=`<div class="heat-sub">${SUBJECTS[s]}</div>`;}
    const m=stats[k];
    const pct=Math.round(m.mastered/m.total*100);
    out+=`<button class="btn heat-chip ${heatCls(m)}" onclick="topicOpen('${k}')">${esc(ZUKAI[k].t.split("(")[0].slice(0,9))}<b>${m.seen?pct+"%":"未"}</b></button>`;
  });
  return out;
}
/* ---- 論点詳細(図解+特訓) ---- */
function topicOpen(k){
  const m=topicStats()[k];if(!m)return;
  const acc=(m.c+m.w)?Math.round(m.c/(m.c+m.w)*100):0;
  showOvl(`<div style="text-align:left;max-height:56dvh;overflow-y:auto">${zcardHtml(k)}</div>
    <div class="stat-row"><span>この論点の問題</span><b>${m.total}問</b></div>
    <div class="stat-row"><span>習得(2連続正解)</span><b style="color:${m.mastered/m.total>=0.7?"#2B9E82":"var(--red)"}">${m.mastered}/${m.total}</b></div>
    <div class="stat-row"><span>正答率</span><b>${m.seen?acc+"%":"未挑戦"}</b></div>
    <button class="btn mode-btn yellowbg" style="margin-top:8px" onclick="hideOvl();startTopic('${k}')">${px("excal",26)}<span>この論点だけ集中特訓<span class="d">全${m.total}問と連戦</span></span></button>
    <button class="btn go-btn" style="width:100%;margin-top:6px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
function startTopic(k){
  const pool=shuffle(topicIds(k));if(!pool.length)return;
  const hp=pool.length*playerDmg();
  G=Object.assign(base(),{mode:"reco",ids:pool,idx:0,bossHP:hp,bossMax:hp,topicName:"論点特訓: "+ZUKAI[k].t.split("(")[0].slice(0,10)});
  battle();
}

/* ---- 誤答のクセ分析(解説画面の「なぜ間違えた?」選択 = ST.q[id].mr を集計) ---- */
const MR_INFO={
 num:{t:"数字を勘違い",adv:"数字は単発でなく図解カードの早見表で「面」で覚えるのが近道。論点ヒートマップから該当カードを開こう"},
 cmp:{t:"以上/超えるの見落とし",adv:"「以上・以内=その数を含む」「超える・未満=含まない」。問題文の下線・数字ハイライトを最初に見るクセをつけよう"},
 mix:{t:"別の制度と混同",adv:"混同ペアは比較表が特効薬。図解カードの対比表(労災/健保/雇用の待期など)を見比べて違いだけ覚えよう"},
 term:{t:"用語が分からない",adv:"解説の「📖用語かんたん解説」と青下線タップを毎回読もう。用語が分かるだけで解ける問題は多い"},
 read:{t:"問題文の読み違え",adv:"主語(誰が)と語尾(〜できる/〜ねばならない)を指でなぞって読む。ひっかけの8割は主語と語尾にいる"},
 guess:{t:"なんとなく答えた",adv:"当てずっぽうはOK。ただし解説の「もっとやさしく言うと」まで読んでから次へ進もう"}
};
function mrStats(){
  /* 理由→その理由で間違えた問題id配列。旧=文字列(単一) / 新=集計オブジェクト の両対応 */
  const m={};
  for(const k in ST.q){
    const r=ST.q[k].mr;if(!r)continue;
    if(typeof r==="string"){if(MR_INFO[r])m[r]=(m[r]||[]).concat(k);}
    else for(const kind in r){if((r[kind]|0)>0&&MR_INFO[kind])m[kind]=(m[kind]||[]).concat(k);}
  }
  return m;
}
function mrHtml(){
  const m=mrStats();
  const keys=Object.keys(m).sort((a,b)=>m[b].length-m[a].length);
  if(!keys.length)return "";
  const max=m[keys[0]].length;
  const rows=keys.map(k=>`<button class="btn mi-row" style="width:100%;font-family:inherit;cursor:pointer" onclick="startMrDrill('${k}')">
    <span>${esc(MR_INFO[k].t)}</span>
    <div class="mi-bar"><i style="width:${m[k].length/max*100}%;background:var(--red)"></i></div>
    <span class="mprog">${m[k].length}問 ▶</span></button>`).join("");
  return `<div class="sec">誤答のクセ分析(タップでその問題と再戦)</div>${rows}
    <div class="pass-box" style="margin-top:0"><div class="sub" style="margin-top:0">💡 <b>いちばん多いクセ「${esc(MR_INFO[keys[0]].t)}」への処方箋:</b> ${esc(MR_INFO[keys[0]].adv)}</div></div>`;
}
function startMrDrill(kind){
  const ids=shuffle((mrStats()[kind]||[]).filter(id=>qById(id)));
  if(!ids.length)return;
  const hp=ids.length*playerDmg();
  G=Object.assign(base(),{mode:"reco",ids,idx:0,bossHP:hp,bossMax:hp,topicName:"クセ退治: "+MR_INFO[kind].t});
  battle();
}

/* ============ 学習分析 ============ */
function analysis(){
  stopTimer();
  const p=passPct(),due=dueIds().length,weak=weakestSubjects(2);
  const rows=SUBJECTS.map((name,i)=>{
    const pw=subjectPower(i);
    const isWeak=weak.includes(i);
    return `<div class="pass-box" style="margin:0 0 8px;${isWeak?"border-color:var(--red)":""}">
      <div class="row"><span>${isWeak?"⚠️":""}${name}</span><span style="color:${pw>=80?"#2B9E82":pw>=50?"#C58900":"var(--red)"}">${pw}%</span></div>
      <div class="pass-bar" style="height:10px"><i style="width:${pw}%"></i></div>
      ${isWeak?'<div class="sub" style="color:var(--red)">いちばんの弱点。おすすめ20問に自動で混ざる</div>':""}
    </div>`;}).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">📊 学習分析</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="pass-box">
    <div class="row"><span>📈 総合定着度</span><span style="font-size:16px">${p}%</span></div>
    <div class="pass-bar"><i style="width:${p}%"></i></div>
    <div class="sub">習得50% + 記憶定着(忘却曲線)30% + 周回クリア20% で算出</div>
  </div>
  <button class="btn mode-btn pinkbg" onclick="startReview()" ${due?"":"disabled"}>
    ${px("ghost",30)}<span>今日の復習 ${due?due+"問":"完了✅"}<span class="d">記憶が薄れる直前に復習=最強の勉強法</span></span>
  </button>
  <button class="btn mode-btn bluebg" onclick="startReco()">
    ${px("sage",30)}<span>今日のおすすめ20問<span class="d">復習+弱点科目+新問のベストミックス</span></span>
  </button>
  ${mrHtml()}
  <div class="sec">論点ヒートマップ(タップで図解+集中特訓)</div>
  <div class="pcard"><div class="heat-legend"><span class="heat-chip h3">🟢 70%〜</span><span class="heat-chip h2">🟡 30〜69%</span><span class="heat-chip h1">🔴 〜29%</span><span class="heat-chip h0">⬜ 未着手</span></div>
  <div class="heat-grid">${heatmapHtml()}</div></div>
  <div class="sec">科目別 定着度</div>
  ${rows}
  <div class="footer-note">忘却曲線(1→3→7→16→35→70日)で復習間隔を自動管理。<br>間違えた問題は翌日また出る。それが合格への最短ルート。</div>`;
}

/* ============ 記録(ランキング基盤) ============ */
function records(){
  stopTimer();
  /* 直近7日の解答数 */
  const days=[];const d=new Date();
  for(let i=6;i>=0;i--){const x=new Date(d);x.setDate(d.getDate()-i);const k=x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate();days.push(ST.hist[k]||{a:0,c:0});}
  const week=days.reduce((s,x)=>s+x.a,0);
  const rows=[
    ["📊 レベル",`Lv.${ST.lv}${ST.reb?` (転生${ST.reb})`:""}`],
    ["✅ 累計正解",ST.totalC+"問"],
    ["📝 模試ベスト",ST.mock.best?ST.mock.best+"/36(クリア"+ST.mock.clears+"回)":"未受験"],
    ["🔥 最大コンボ",ST.maxCombo],
    ["⚔ サバイバル最高",ST.survBest+"体"],
    ["📅 連続ログイン",ST.days+"日(通算"+ST.loginTotal+"日)"],
    ["📝 今週の解答数",week+"問"],
    ["👑 周回クリア",ST.clears+"回"],
    ["🎰 ガチャ累計",ST.gTotal+"回"],
    ["🎁 宝箱累計",ST.cnt.chest+"個"],
    ["⚡ 必殺技発動",ST.cnt.sp+"回"]
  ].map(([k,v])=>`<div class="stat-row"><span>${k}</span><b>${v}</b></div>`).join("");
  const bars=days.map((x,i)=>{
    const h=Math.min(60,x.a*2);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:70%;height:${Math.max(4,h)}px;background:${i===6?"var(--pink)":"var(--mint)"};border:2px solid var(--ink);border-radius:5px 5px 0 0"></div>
      <span style="font-size:8px;font-weight:900;color:#8A8494">${x.a}</span></div>`;}).join("");
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 戻る</button>
    <span style="font-weight:900;font-size:14px">🏅 きろく</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="sec">この7日間の解答数</div>
  <div class="pass-box"><div style="display:flex;align-items:flex-end;height:80px;gap:3px">${bars}</div></div>
  <div class="sec">自己ベスト</div>
  ${rows}
  <div class="footer-note">🌏 全国・都道府県ランキングは今後のアップデートで対応予定(サーバー実装後)。<br>いまは「昨日の自分」がライバルだ。</div>`;
}
window.analysis=analysis;window.records=records;
window.topicOpen=topicOpen;window.startTopic=startTopic;window.startMrDrill=startMrDrill;
