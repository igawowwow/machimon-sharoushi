"use strict";
/* ============================================================
   machimon/ui/record.js — 記録(習熟度マップ・街年表・振り返り)
   ★統計画面を見に行かなくても努力が分かるのが理想だが、
     「これだけやった」を数字で確認したい瞬間のための画面。
   ★表示は全て端末内の実測値。将来予測や合否の示唆はしない。
   ============================================================ */
(function(){
  var G=(typeof window!=="undefined")?window:globalThis;
  var MM=G.MM=G.MM||{}; var UI=MM.ui;

  UI.screens.record=function(){
    var c=UI.ctx(), esc=UI.esc;
    var s=MM.game.summary({ST:c.ST});
    var rc=MM.exam.recap(c);
    var h='<div class="mm-wrap">'+UI.resBar(c)+'<div class="mm-h">📊 記録</div>';

    /* North Star: 週間有効回答数 */
    h+='<div class="mm-q"><b>今週の有効回答 '+MM.game.wea({ST:c.ST})+' 問</b>'
      +'<div class="mm-sub">「有効回答」= 学習として意味のある解答('
      +'同じ日の解き直しや、すでに覚えた問題の連打は数えません)</div>'
      +'<div class="mm-row"><span>今日</span><span>'+s.day.eff+' / '+s.day.ans+' 問</span></div>'
      +'<div class="mm-row"><span>連続正解の自己ベスト</span><span>'+s.best+'</span></div>'
      +'<div class="mm-row"><span>総回答</span><span>'+rc.answers+' 問(正答率 '+rc.pct+'%)</span></div>'
      +'<div class="mm-row"><span>覚えた問題</span><span>'+rc.mastered+' / '+rc.questions+'</span></div>'
      +'</div>';

    /* 科目別の習熟度マップ */
    h+='<div class="mm-h">📚 科目別の定着</div><div class="mm-q">';
    for(var i=0;i<s.subs.length;i++){
      var x=s.subs[i];
      h+='<div class="mm-row"><span>'+esc(x.name)+(x.open?"":" 🔒")+'</span>'
        +'<span style="display:flex;align-items:center;gap:6px"><span class="mm-mast"><i style="width:'+x.pct+'%"></i></span>'
        +x.pct+'%</span></div>';
    }
    h+='</div>';

    /* 街年表: 建物に刻まれた「建った日と、そのとき解いた問題数」 */
    h+='<div class="mm-h">🏠 街の年表</div><div class="mm-q" style="font-size:12px">';
    var rows=[];
    for(var k in c.mm.slots){
      var d=c.mm.slots[k], b=MM.DATA.bldById[d.b]||{name:"?"};
      var a=MM.DATA.areaById[String(k).split(":")[0]]||{name:""};
      rows.push({q:d.q,name:a.name+" / "+b.name+" Lv"+d.lv});
    }
    rows.sort(function(x,y){ return x.q-y.q; });
    if(!rows.length)h+='<div class="mm-sub">まだ建物がありません</div>';
    for(var r=0;r<rows.length;r++){
      h+='<div class="mm-row"><span>'+esc(rows[r].name)+'</span><span class="mm-sub">'+rows[r].q+'問めに建った</span></div>';
    }
    h+='</div>';

    /* 一緒にいた仲間 */
    if(rc.favorite){
      h+='<div class="mm-q" style="font-size:13px">👾 いちばん一緒にいたマチモン: <b>'+esc(rc.favorite.name)+'</b>'
        +' <span class="mm-sub">Lv'+rc.favorite.lv+'</span></div>';
    }
    /* 試験日の設定(任意)。設定すると世界が試験に向かって変わっていく */
    h+='<div class="mm-h">⏰ 試験日</div><div class="mm-q" style="font-size:12px">';
    if(c.mm.exam.date){
      var ph=MM.exam.phase(c);
      h+='<b>'+esc(c.mm.exam.date)+'</b>'+(ph?' — '+esc(ph.name)+'(あと'+ph.left+'日)':'')
        +'<div class="mm-sub">時計塔 '+MM.exam.towerFloors(c)+' 段。積み上げた日数がそのまま塔になります。</div>';
    }else{
      h+='<div class="mm-sub">設定すると、100日前から街が試験に向かって変化していきます。</div>'
        +'<input id="mm-exam" type="date" style="font-size:14px;padding:6px;margin-top:6px">'
        +'<button class="small-btn" style="margin-left:6px;min-height:44px" onclick="MM.ui.setExam()">設定</button>';
    }
    h+='</div>';
    return h+'</div>'+UI.tabs("record");
  };

  UI.setExam=function(){
    var el=G.document&&G.document.getElementById?G.document.getElementById("mm-exam"):null;
    if(!el||!el.value)return;
    var c=UI.ctx();
    if(MM.exam.setDate(c,el.value))MM.game.save();
    UI.go("record");
  };
})();
