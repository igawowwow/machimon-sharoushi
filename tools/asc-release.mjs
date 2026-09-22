#!/usr/bin/env node
/* ============================================================
   tools/asc-release.mjs — App Store Connect 申請の自動化(CI用)

   Macを触らずに審査提出まで行くための頭脳部。GitHub Actions の
   macOSランナー(.github/workflows/ios-release.yml)から2回呼ばれる:

   plan   : ビルド前。ASCに問い合わせて
              ・次のビルド番号(既存の最大+1)
              ・使うバージョン文字列(編集可能な版があればそれ、無ければ次のマイナー)
            を決め、GITHUB_OUTPUT へ書く。ファイル編集やコミットはしない
            (xcodebuild へビルド設定として渡すため)。
   submit : アップロード後。ビルドの処理完了(VALID)を待ち、
            バージョン作成(必要時)→ビルド紐付け→リリースノート→審査提出。

   認証は環境変数: ASC_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY(p8全文)。
   依存ゼロ(Node18+)。--selftest は鍵・ネット不要の純ロジック検証。
   ============================================================ */
import fs from "node:fs";
import crypto from "node:crypto";

const BUNDLE_ID = process.env.BUNDLE_ID || "com.ville.machimon";
const KEY_ID = process.env.ASC_KEY_ID || "";
const ISSUER = process.env.ASC_ISSUER_ID || "";
const BASE = "https://api.appstoreconnect.apple.com";

/* 「この状態ならビルド差し替え・メタ編集ができる」とみなす版の状態 */
const EDITABLE = new Set([
  "PREPARE_FOR_SUBMISSION","DEVELOPER_REJECTED","REJECTED",
  "METADATA_REJECTED","INVALID_BINARY"
]);

function b64url(b){ return Buffer.from(b).toString("base64url"); }
function jwtToken(){
  const pem = process.env.ASC_PRIVATE_KEY;
  if(!pem || !KEY_ID || !ISSUER) throw new Error("ASC_KEY_ID / ASC_ISSUER_ID / ASC_PRIVATE_KEY が未設定");
  const now = Math.floor(Date.now()/1000);
  const h = b64url(JSON.stringify({alg:"ES256",kid:KEY_ID,typ:"JWT"}));
  const p = b64url(JSON.stringify({iss:ISSUER,iat:now,exp:now+1100,aud:"appstoreconnect-v1"}));
  const key = crypto.createPrivateKey(pem);
  const sig = crypto.sign("sha256", Buffer.from(h+"."+p), {key, dsaEncoding:"ieee-p1363"});
  return h+"."+p+"."+b64url(sig);
}
async function api(method, path, body){
  const res = await fetch(BASE+path, {
    method,
    headers:{Authorization:"Bearer "+jwtToken(),"Content-Type":"application/json"},
    body: body!=null ? JSON.stringify(body) : undefined
  });
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : {};
  if(!res.ok){
    const msg = JSON.stringify(json.errors||json).slice(0,500);
    const err = new Error(`ASC ${res.status} ${method} ${path} :: ${msg}`);
    err.status = res.status; err.body = json;
    throw err;
  }
  return json;
}

async function appId(){
  const r = await api("GET", `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}`);
  const id = r.data && r.data[0] && r.data[0].id;
  if(!id) throw new Error(`bundleId ${BUNDLE_ID} のアプリが見つからない`);
  return id;
}

/* ---- 純ロジック ---- */
export function nextBuildNumber(existing){
  const nums = existing.map(v=>parseInt(v,10)).filter(n=>Number.isFinite(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}
export function bumpMinor(v){
  const parts = String(v||"1.0").split(".");
  while(parts.length<2) parts.push("0");
  parts[parts.length-1] = String((parseInt(parts[parts.length-1],10)||0)+1);
  return parts.join(".");
}
export function pickVersion(versions){
  /* versions: [{id, versionString, appStoreState}] 新しい順。
     編集可能な版があればそれを使う。無ければ最新の版番号を+1して新規作成。 */
  for(const v of versions){
    if(EDITABLE.has(v.appStoreState)) return {action:"use", id:v.id, versionString:v.versionString};
  }
  const latest = versions[0];
  return {action:"create", id:"", versionString: bumpMinor(latest ? latest.versionString : "1.0")};
}

function ghOut(kv){
  const f = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(kv).map(([k,v])=>`${k}=${v}`).join("\n")+"\n";
  if(f) fs.appendFileSync(f, lines);
  process.stdout.write(lines);
}

/* ---- plan ---- */
async function plan(){
  const app = await appId();
  const b = await api("GET", `/v1/builds?filter[app]=${app}&sort=-uploadedDate&limit=20`);
  const buildNums = (b.data||[]).map(x=>x.attributes && x.attributes.version).filter(Boolean);
  const build = nextBuildNumber(buildNums);
  const vs = await api("GET", `/v1/apps/${app}/appStoreVersions?filter[platform]=IOS&limit=10`);
  const versions = (vs.data||[]).map(v=>({id:v.id, versionString:v.attributes.versionString, appStoreState:v.attributes.appStoreState}));
  const pick = pickVersion(versions);
  console.error(`計画: ビルド${build} / バージョン${pick.versionString}(${pick.action==="use"?"既存版に載せる: "+versions.find(v=>v.id===pick.id).appStoreState:"新規作成"})`);
  ghOut({ build_number:build, version_string:pick.versionString, version_id:pick.id, version_action:pick.action });
}

/* ---- submit ---- */
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function waitBuild(app, buildNumber, versionString, timeoutMin){
  const deadline = Date.now() + timeoutMin*60*1000;
  for(;;){
    const r = await api("GET",
      `/v1/builds?filter[app]=${app}&filter[version]=${buildNumber}&filter[preReleaseVersion.version]=${encodeURIComponent(versionString)}&limit=1`);
    const b = r.data && r.data[0];
    const st = b && b.attributes && b.attributes.processingState;
    console.error(`ビルド${buildNumber}: ${st||"未出現"}`);
    if(st==="VALID") return b.id;
    if(st==="FAILED"||st==="INVALID") throw new Error(`ビルド${buildNumber} の処理が ${st}。App Store Connect のメールを確認`);
    if(Date.now()>deadline) throw new Error(`ビルド${buildNumber} が ${timeoutMin}分待っても VALID にならない`);
    await sleep(60*1000);
  }
}

async function submit(opts){
  const app = await appId();
  const buildId = await waitBuild(app, opts.build, opts.version, opts.waitMin);

  let versionId = opts.versionId;
  if(!versionId){
    console.error(`バージョン ${opts.version} を新規作成`);
    const r = await api("POST","/v1/appStoreVersions",{data:{type:"appStoreVersions",
      attributes:{platform:"IOS",versionString:opts.version,releaseType:"AFTER_APPROVAL"},
      relationships:{app:{data:{type:"apps",id:app}}}}});
    versionId = r.data.id;
  }

  console.error("ビルドを版へ紐付け");
  await api("PATCH", `/v1/appStoreVersions/${versionId}/relationships/build`,
    {data:{type:"builds",id:buildId}});

  if(opts.notes){
    const whatsNew = fs.readFileSync(opts.notes,"utf8").trim();
    const locs = await api("GET", `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=10`);
    for(const l of (locs.data||[])){
      console.error(`リリースノート設定: ${l.attributes.locale}`);
      await api("PATCH", `/v1/appStoreVersionLocalizations/${l.id}`,
        {data:{type:"appStoreVersionLocalizations",id:l.id,attributes:{whatsNew}}});
    }
  }

  console.error("審査提出を作成");
  let subId;
  try{
    const r = await api("POST","/v1/reviewSubmissions",{data:{type:"reviewSubmissions",
      attributes:{platform:"IOS"},
      relationships:{app:{data:{type:"apps",id:app}}}}});
    subId = r.data.id;
  }catch(e){
    /* 既に未提出の提出物があると409。拾って使う */
    if(e.status!==409) throw e;
    const r = await api("GET", `/v1/reviewSubmissions?filter[app]=${app}&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,UNRESOLVED_ISSUES&limit=5`);
    const open = (r.data||[]).find(s=>s.attributes.state==="READY_FOR_REVIEW"||s.attributes.state==="UNRESOLVED_ISSUES");
    if(!open) throw e;
    subId = open.id;
    console.error("既存の未提出レビューを再利用: "+subId);
  }

  try{
    await api("POST","/v1/reviewSubmissionItems",{data:{type:"reviewSubmissionItems",
      relationships:{
        reviewSubmission:{data:{type:"reviewSubmissions",id:subId}},
        appStoreVersion:{data:{type:"appStoreVersions",id:versionId}}}}});
  }catch(e){
    if(e.status!==409) throw e;   /* 既にアイテム済みなら先へ */
    console.error("この版は既に提出物に含まれている");
  }

  console.error("提出を確定(submitted:true)");
  await api("PATCH", `/v1/reviewSubmissions/${subId}`,
    {data:{type:"reviewSubmissions",id:subId,attributes:{submitted:true}}});
  console.error(`✅ 審査提出完了: v${opts.version} (ビルド${opts.build})`);
}

/* ---- 自己テスト(鍵・ネット不要) ---- */
function selftest(){
  if(nextBuildNumber(["12","11","3"])!==13) throw new Error("nextBuildNumber NG");
  if(nextBuildNumber([])!==1) throw new Error("nextBuildNumber空 NG");
  if(bumpMinor("1.2")!=="1.3"||bumpMinor("2.9")!=="2.10"||bumpMinor("3")!=="3.1") throw new Error("bumpMinor NG");
  let p=pickVersion([{id:"a",versionString:"1.2",appStoreState:"PREPARE_FOR_SUBMISSION"}]);
  if(p.action!=="use"||p.id!=="a") throw new Error("pickVersion編集可 NG");
  p=pickVersion([{id:"b",versionString:"1.2",appStoreState:"READY_FOR_SALE"}]);
  if(p.action!=="create"||p.versionString!=="1.3") throw new Error("pickVersion新規 NG");
  p=pickVersion([{id:"c",versionString:"1.3",appStoreState:"READY_FOR_SALE"},{id:"d",versionString:"1.2",appStoreState:"DEVELOPER_REJECTED"}]);
  if(p.action!=="use"||p.id!=="d") throw new Error("pickVersion後方の編集可 NG");
  console.log("selftest OK");
}

const args = process.argv.slice(2);
const cmd = args[0];
function arg(name, dflt){ const i=args.indexOf(name); return i>=0 ? args[i+1] : dflt; }
(async()=>{
  if(cmd==="--selftest"||cmd==="selftest") return selftest();
  if(cmd==="plan") return plan();
  if(cmd==="submit") return submit({
    build: arg("--build"), version: arg("--version"),
    versionId: arg("--version-id","")||"", notes: arg("--notes",""),
    waitMin: parseInt(arg("--wait-min","45"),10)
  });
  console.error("usage: asc-release.mjs plan | submit --build N --version V [--version-id ID] [--notes FILE] | --selftest");
  process.exit(2);
})().catch(e=>{ console.error("❌ "+(e&&e.message||e)); process.exit(1); });
