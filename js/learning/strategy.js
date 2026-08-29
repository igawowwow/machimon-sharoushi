"use strict";
/* ============================================================
   learning/strategy.js — S4(D) 戦略目安(各コース/戦闘の入口に出す短い作戦カード)
   「テーマ(論点) / 目標の目安(何問中何問・想定時間・難易度★) / 攻略のヒント(敵の狙い) /
     推奨準備」を4行で提示する。読ませすぎない=1タップで戦闘に入れるテンポを守る。
   ・plan() は純関数(DOM/Store非依存)。html() は自前 esc で全ての動的文字列を無害化。
   ・学習の芯(問題ID/採点/SRS/報酬)には触れない。表示だけ。
   eval/new Function 不使用。
   ============================================================ */
(function(){
  var G = (typeof window!=="undefined") ? window : globalThis;
  var L = G.SRLearning = G.SRLearning || {};
  var SEL = L.selection;

  function esc(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  /* 突破の目安: 何問中何問正解できれば「通った」と言えるか。
     ○×主体は7割・本試験形式が半分を超えたら6割(本試験の科目基準に寄せる)。 */
  function passNeed(n, quota){
    n = Math.max(1, n|0); quota = Math.min(n, Math.max(0, quota|0));
    var ratio = (quota / n >= 0.5) ? 0.6 : 0.7;
    return Math.max(1, Math.round(n * ratio));
  }

  /* 敵の狙い(=この難度で落としに来るポイント)。quota と rank から選ぶ。 */
  function tipsFor(quota, n, rank){
    var tips = [];
    if(!quota){
      tips.push("まずは○×で論点の形をつかむ回。○ばかり選ぶと半分は外れる作りだ");
    }else{
      tips.push("本試験形式(五肢択一・個数)が" + quota + "問。選択肢は最後まで読み切れ");
    }
    if(rank==="boss" || rank==="mid"){
      tips.push("敵は数字と例外で落としに来る。人数・日数・割合・期間を先に確かめろ");
    }else{
      tips.push("「原則」と「例外」のどちらを聞かれているかを最初に見分けろ");
    }
    return tips;
  }
  function prepFor(theme, quota){
    if(!quota) return "準備は不要。分からなければ解説の図解をそのまま覚えて次へ";
    return "図解ノートで「" + theme + "」の表をひと目見てから挑むと通りやすい";
  }

  /* plan(o): o = { n, exam, stage, rank, subject, theme, need? }
     戻り値は数値と素の文字列のみ(HTMLを含まない)。 */
  function plan(o){
    o = o || {};
    var n = Math.max(1, o.n|0);
    var quota = Math.min(n, Math.max(0, o.exam|0));
    var rank = o.rank || "mob";
    var theme = o.theme || o.subject || "この科目の論点";
    var need = (o.need>0) ? Math.min(n, o.need|0) : passNeed(n, quota);
    return {
      theme: theme,
      n: n,
      exam: quota,
      need: need,
      goal: n + "問中 " + need + "問正解で突破",
      minutes: SEL ? SEL.estMinutes(n, quota) : Math.max(1, Math.ceil(n/4)),
      stars: SEL ? SEL.stars(quota, n, rank) : 1,
      level: SEL ? SEL.rampLabel(quota, n, rank) : "",
      tips: tipsFor(quota, n, rank),
      prep: prepFor(theme, quota)
    };
  }

  function starStr(k){
    k = Math.min(5, Math.max(1, k|0));
    return new Array(k+1).join("★") + new Array(6-k).join("☆");
  }

  /* 入口の作戦カード。compact=true で1行サマリ(道中の再表示用)。 */
  function html(p, compact){
    if(!p) return "";
    if(compact){
      return '<div class="strat-card compact">🎯 <b>' + esc(p.theme) + '</b> ｜ ' +
        esc(p.goal) + ' ｜ 難易度 ' + esc(starStr(p.stars)) + '</div>';
    }
    return ''+
    '<div class="strat-card" role="note" aria-label="このコースの戦略目安">'+
      '<div class="strat-head">🧭 作戦 <span class="strat-lv">'+esc(p.level)+'</span></div>'+
      '<div class="strat-row"><span class="strat-k">テーマ</span>'+
        '<span class="strat-v">'+esc(p.theme)+'</span></div>'+
      '<div class="strat-row"><span class="strat-k">目安</span>'+
        '<span class="strat-v">'+esc(p.goal)+' ｜ 約'+esc(p.minutes)+'分 ｜ 難易度 '+esc(starStr(p.stars))+'</span></div>'+
      '<div class="strat-row"><span class="strat-k">敵の狙い</span>'+
        '<span class="strat-v">'+p.tips.map(function(x){ return esc(x); }).join("<br>")+'</span></div>'+
      '<div class="strat-row"><span class="strat-k">推奨準備</span>'+
        '<span class="strat-v">'+esc(p.prep)+'</span></div>'+
    '</div>';
  }

  L.strategy = { plan:plan, html:html, passNeed:passNeed, starStr:starStr, esc:esc };
})();
