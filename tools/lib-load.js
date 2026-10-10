/* テスト共通: index.html の <script src> を順に vm へ読み込む。 const {win,MM,store}=require("./lib-load.js")(); */
const fs=require("fs"),vm=require("vm"),path=require("path");
module.exports=function(){
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const store={};
const el=()=>({innerHTML:"",style:{},remove(){},appendChild(){},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []}});
const win={ console, Math, Date, JSON, Number, String, Object, Array, Map, Set, WeakSet, Promise, RegExp, Error, parseInt, parseFloat, isFinite, isNaN, encodeURIComponent, decodeURIComponent,
  setTimeout:(f)=>0, clearTimeout(){}, setInterval:()=>0, clearInterval(){}, requestAnimationFrame:()=>0, queueMicrotask:(f)=>f(),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  navigator:{userAgent:"node",language:"ja",serviceWorker:null,vibrate(){}},
  location:{href:"http://127.0.0.1/",search:"",hash:"",reload(){},pathname:"/"},
  addEventListener(){}, removeEventListener(){}, dispatchEvent(){}, matchMedia:()=>({matches:false,addListener(){},addEventListener(){}}),
  scrollTo(){}, alert(){}, confirm:()=>true, CustomEvent:function(){}, Event:function(){},
  AudioContext:undefined, __MM_STANDALONE:1, performance:{now:()=>Date.now()},
  getComputedStyle:()=>({}), innerWidth:390, innerHeight:800, devicePixelRatio:2, screen:{width:390,height:800},
  Intl, structuredClone:(x)=>JSON.parse(JSON.stringify(x)), Uint8Array, Float32Array, Int32Array, ArrayBuffer, TextEncoder, TextDecoder, URL, Blob:function(){}, Image:function(){},
  fetch:()=>Promise.reject(new Error("no fetch")), caches:undefined, crypto:{getRandomValues:(a)=>a,randomUUID:()=>"x"},
};
win.window=win; win.globalThis=win; win.self=win;
win.document={ getElementById:()=>el(), querySelector:()=>el(), querySelectorAll:()=>[], createElement:()=>el(), body:el(), documentElement:{style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}}}, addEventListener(){}, removeEventListener(){}, head:el(), hidden:false, visibilityState:"visible", createTextNode:()=>({}), activeElement:null, readyState:"complete", fonts:{ready:Promise.resolve()} };
vm.createContext(win);
for(const s of srcs){ try{ vm.runInContext(fs.readFileSync(path.join(root,s),"utf8"),win,{filename:s}); }catch(e){ console.log("LOAD FAIL",s,e.message); } }
return {win,MM:win.MM,store};
};
