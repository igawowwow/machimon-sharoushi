"use strict";
/* ============================================================
   ui-map.js — 冒険の地図(ワールドマップ)
   9章の敵ブラック企業+終章(試験の神)を、下(出発)→上(頂上)へ登る旅路として描く。
   現在地から挑む王道RPGの背骨。進行は ST.msq(ui-quest.js)を参照。
   ============================================================ */
function msqNodes(){
  const ns=[];
  for(let i=0;i<9;i++)ns.push({ch:i,name:(MSQ_STORY[i]||{}).corp||SUBJECTS[i],sp:BOSSES[i].sp,boss:BOSSES[i].name,subj:SUBJECTS[i]});
  ns.push({ch:9,name:"試験の神の頂",sp:"god",boss:"試験の神",subj:"最終決戦",final:true});
  return ns;
}
function msqNodeState(ch){
  const m=ST.msq;
  if(m.done)return "done";
  if(ch<m.ch)return "done";
  if(ch===m.ch||(ch===9&&m.ch>=9))return "current";
  return "lock";
}
function worldMap(){
  stopTimer();hideOvlSilent();
  if(typeof setBgmScene==="function")setBgmScene("field");
  msqAdvance(); /* 到達状況を最新化 */
  const newmates=cpCheckJoin();
  if(newmates.length){saveST();setTimeout(()=>{const c=newmates[0];bigBanner("🤝 "+c.name+" が仲間に!","#2B62D9",18);SFX.levelup();storyShow([{sp:c.sp,n:c.name,t:c.join}],null);},350);}
  const m=ST.msq,ns=msqNodes();
  const info=msqStepInfo();
  const doneN=ns.filter(n=>msqNodeState(n.ch)==="done").length;
  let rows="";
  for(let i=ns.length-1;i>=0;i--){
    const n=ns[i],st=msqNodeState(n.ch);
    const conn=i>0?`<div class="map-road ${msqNodeState(ns[i-1].ch)!=="lock"?"lit":""}"></div>`:"";
    if(st==="lock"){
      rows+=`<div class="map-node lock"><div class="map-badge">?</div><div class="map-info"><b>???</b><span>${n.final?"最終決戦":n.subj}</span></div></div>${conn}`;
    }else if(st==="done"){
      rows+=`<div class="map-node done"><div class="map-badge">${px(n.sp,42)}<span class="map-crown">👑</span></div><div class="map-info"><b>${esc(n.name)}</b><span>討伐済 — ${n.subj}</span></div></div>${conn}`;
    }else{
      let extra="";
      if(!m.done&&n.ch===m.ch&&m.ch<9){
        if(m.step===0){ /* 修行: 習得の進み具合をバーで見せる */
          const cur=msqMastered(m.ch),tgt=m.tgt==null?cur+MSQ_TRAIN_ADD:m.tgt;
          const pc=tgt>0?Math.min(100,cur/tgt*100):100;
          extra=`<div style="display:flex;align-items:center;gap:8px;margin:2px 0 7px">
            <div class="mi-bar" style="max-width:none;flex:1"><i style="width:${pc}%"></i></div>
            <span style="font-size:11px;font-weight:900;color:#2B62D9">習得 ${cur}/${tgt}</span></div>`;
        }else if(m.step===1&&typeof bossHPMax==="function"){ /* ボス: 推奨攻撃力と今の攻撃力 */
          const rec=Math.ceil(bossHPMax(m.ch)/9),dmg=(typeof playerDmg==="function")?playerDmg():rec;
          extra=`<div style="font-size:11px;font-weight:800;margin:0 0 7px;color:#7A5B00">推奨攻撃力 ⚔${rec} ／ 今 ⚔${dmg} ${dmg<rec?'<b style="color:#D9534F">⚠修行して強くなろう</b>':'<b style="color:#2B9E82">✔いけそう</b>'}</div>`;
        }
      }
      rows+=`<div class="map-node current"><div class="map-badge cur">${px(n.sp,52,"floaty")}<span class="map-you">${px("hero",26)}</span></div>
        <div class="map-info"><b>${esc(n.name)}</b><span>${n.final?"最終決戦":n.subj}</span>
        <div class="map-step">📍 ${esc(info.label)}</div>
        ${extra}
        <button class="btn go-btn map-go" onclick="msqGo()">${esc(info.btn)} ▶</button></div></div>${conn}`;
    }
  }
  app.innerHTML=`
  <div class="topbar">
    <button class="small-btn" onclick="home()">← 拠点へ</button>
    <span style="font-weight:900;font-size:14px">🗺️ 冒険の地図</span>
    <span class="coin-chip">${px("coin",14)} ${ST.coins}</span>
  </div>
  <div class="pass-box" style="margin-top:2px">
    <div class="row"><span>👹 悪魔への道</span><span>${(r=>r.done?"完遂":r.fin?"頂(本試験)":`第${r.cur}章/9 ・ ステップ${r.phase}/${r.phaseTotal}`)(msqRoad())}</span></div>
    <div class="row"><span>👑 ブラック企業帝国 制圧</span><span>${doneN-(m.done?1:0)}/9社</span></div>
    <div class="pass-bar"><i style="width:${Math.min(100,(doneN-(m.done?1:0))/9*100)}%"></i></div>
    <div class="sub">九つの砦を制した頂に【試験の悪魔＝本試験】が待つ。下から登り、今いる場所から挑もう。</div>
  </div>
  ${typeof regionBanner==="function"?regionBanner(0):""}
  ${cpPartyBar()}
  <div class="map-wrap">${rows}
    <div class="map-start">🚩 冒険のはじまり — 見習い社労士、旅立ちの地</div>
  </div>`;
}
function cpPartyBar(){
  const mates=COMPANIONS.filter(c=>ST.party&&ST.party[c.id]);
  if(!mates.length)return `<div class="sub" style="text-align:center;margin:8px 0">仲間はまだいない。章をクリアすると事務所の仲間が加わる。</div>`;
  return `<div class="sec">🤝 事務所の仲間(${mates.length}人) — 常時発動</div>
    <div class="party-row">${mates.map(c=>`<button class="btn party-chip" onclick="cpShow('${c.id}')">${px(c.sp,26)}<span>${esc(c.name.split("・").pop())}</span><small>${esc(c.desc)}</small></button>`).join("")}</div>`;
}
function cpShow(id){const c=CP[id];if(!c)return;
  showOvl(`${px(c.sp,56,"floaty")}<h3>${esc(c.name)}</h3>
    <div class="sub2" style="text-align:left">${esc(c.join)}</div>
    <div class="stat-row" style="margin-top:8px"><span>常時効果</span><b style="color:#2B62D9">${esc(c.desc)}</b></div>
    <button class="btn go-btn" style="width:100%;margin-top:10px;padding:11px" onclick="hideOvl()">とじる</button>`);
}
window.worldMap=worldMap;window.cpShow=cpShow;
