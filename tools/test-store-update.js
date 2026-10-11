"use strict";
/* ============================================================
   test-store-update.js — App Storeの新しい版のお知らせの検証(npm test から呼ばれる)
   ・Web(非ネイティブ)では完全no-op(fetchすら呼ばない)
   ・ストアの版が本体より新しいときだけダイアログを出す
   ・「アップデートする」で App Store を開く／「あとで」でその日は出さない
   ・index.html / sw.js の同梱検査、www/ へ版が書きこまれること
   ============================================================ */
const fs=require("fs"), path=require("path"), vm=require("vm");
const DIR=process.argv[2]||path.join(__dirname,"..");
let fail=0;
function t(name,cond,detail){ console.log((cond?"PASS":"FAIL")+" "+name+(cond?"":" -> "+String(detail).slice(0,200))); if(!cond)fail++; }
function rd(f){ return fs.readFileSync(path.join(DIR,f),"utf8"); }
const SRC=rd("js/machimon/store-update.js");

/* ---- 実行ハーネス: window/document/fetch/localStorage/Plugins をモックして1回走らせる ---- */
async function run(opts){
  const calls={fetch:[]}, timers=[], els={}, store={...(opts.store||{})};
  function el(){ const e={style:{},children:[],parentNode:null,
    appendChild(c){c.parentNode=e;e.children.push(c);if(c.id)els[c.id]=c;return c;},
    removeChild(c){e.children=e.children.filter(x=>x!==c);c.parentNode=null;if(c.id)delete els[c.id];}};
    Object.defineProperty(e,"innerHTML",{set(h){e._html=h;(h.match(/id="([^"]+)"/g)||[]).forEach(m=>{els[m.slice(4,-1)]=el();});},get(){return e._html;}});
    return e; }
  const body=el();
  const win={
    Capacitor: opts.native===false ? undefined : {
      isNativePlatform:()=>true,
      Plugins:{}
    },
    __mmAppVer: opts.mine,
    location:{href:""},
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}
  };
  const ctx={
    window:win, localStorage:win.localStorage,
    document:{body,createElement:el,getElementById:id=>els[id]||null},
    setTimeout:(fn)=>{timers.push(fn);return 1;},
    fetch:async(url)=>{
      calls.fetch.push(String(url));
      if(opts.offline) throw new Error("offline");
      return {ok:true,json:async()=>({results:opts.storeVer?[{version:opts.storeVer}]:[]})};
    },
    console, Date
  };
  vm.runInNewContext(SRC,ctx,{filename:"store-update.js"});
  for(const fn of timers.splice(0)) fn();
  for(let i=0;i<6;i++) await new Promise(r=>setImmediate(r));
  return {calls,store,els,win,body,shown:!!els.storeUpd};
}
function today(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }

(async()=>{
  let r=await run({native:false});
  t("Web: 何もしない(fetchゼロ)",r.calls.fetch.length===0&&!r.shown,JSON.stringify(r.calls.fetch));

  r=await run({storeVer:"9.9"});
  t("いまの版が分からない(版を渡さないビルド): 何もしない",r.calls.fetch.length===0&&!r.shown,"");

  r=await run({mine:"1.4",storeVer:"1.5"});
  t("新しい版あり: ダイアログを出す",r.shown,"");
  t("問い合わせ先は自分のアプリ(日本のストア)",/lookup\?id=6814888501&country=jp/.test(r.calls.fetch[0]||""),r.calls.fetch[0]);
  t("文面に版の番号が入る",/バージョン 1\.5/.test(r.els.storeUpd._html),r.els.storeUpd._html);
  r.els.storeUpdGo.onclick();
  t("アップデートする: App Storeを開く",r.win.location.href==="itms-apps://apps.apple.com/jp/app/id6814888501",r.win.location.href);

  r=await run({mine:"1.4",storeVer:"1.5"});
  r.els.storeUpdLater.onclick();
  t("あとで: ダイアログを閉じる",r.body.children.length===0,r.body.children.length);
  t("あとで: きょうの日付で覚える",r.store["mm-store-later"]==="1.5|"+today(),JSON.stringify(r.store));

  r=await run({mine:"1.4",storeVer:"1.5",store:{"mm-store-later":"1.5|"+today()}});
  t("あとで済み: 同じ日は出さない",!r.shown,"");
  r=await run({mine:"1.4",storeVer:"1.5",store:{"mm-store-later":"1.5|2000-1-1"}});
  t("あとで済み: 別の日はまた出す",r.shown,"");
  r=await run({mine:"1.4",storeVer:"1.6",store:{"mm-store-later":"1.5|"+today()}});
  t("あとで済みでも: さらに新しい版なら出す",r.shown,"");

  r=await run({mine:"1.5",storeVer:"1.5"});
  t("同じ版: 出さない",!r.shown,"");
  r=await run({mine:"1.5",storeVer:"1.4"});
  t("本体のほうが新しい(審査中の版など): 出さない",!r.shown,"");
  r=await run({mine:"1.9",storeVer:"1.10"});
  t("1.10 は 1.9 より新しい",r.shown,"");
  r=await run({mine:"1.10",storeVer:"1.9"});
  t("1.9 は 1.10 より古い",!r.shown,"");
  r=await run({mine:"1.4",storeVer:"1.4.1"});
  t("1.4.1 は 1.4 より新しい",r.shown,"");

  r=await run({mine:"1.4",offline:true});
  t("オフライン: 静かに諦める",!r.shown,"");
  r=await run({mine:"1.4",storeVer:""});
  t("ストアの返事が空: 出さない",!r.shown,"");

  t("index.html が読み込む",rd("index.html").includes('<script src="js/machimon/store-update.js"></script>'),"");
  t("sw.js のオフライン一覧にある",rd("sw.js").includes('"./js/machimon/store-update.js"'),"");
  t("リリース手順が版を渡して、入ったことを確かめる",/APP_VERSION="\$VER" npm run ios:sync/.test(rd("tools/ios-release.sh"))&&/__mmAppVer/.test(rd("tools/ios-release.sh")),"");
  t("www/ の組み立てが版を書きこむ",/window\.__mmAppVer=/.test(rd("tools/build-www.js")),"");

  console.log(fail?("\n"+fail+" 件失敗"):"\nALL PASS");
  process.exit(fail?1:0);
})();
