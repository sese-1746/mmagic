import type Phaser from "phaser";
import {saveKey,systemScripts,type GameMode} from "./config/game-config";
import {dialogContent,type DialogKind} from "./ui/dialogs";
import {loadPreferences,playFeedback,storePreferences} from "./ui/preferences";
import "./ui/frontend.css";

type Runtime = {snapshot():{open:number;total:number;duel:boolean}; reset():void; retryDuel():void};
declare global { interface Window { aetherRuntime?:Runtime } }

const element = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const menu=element<HTMLElement>("menu");
const workspace=element<HTMLElement>("workspace");
const boot=element<HTMLElement>("boot");
const progress=element<HTMLProgressElement>("boot-progress");
const bootStatus=element<HTMLElement>("boot-status");
const dialog=element<HTMLDialogElement>("game-dialog");
const panel=element<HTMLElement>("dialog-body");
const warning=element<HTMLElement>("asset-warning");
const start=menu.querySelector<HTMLButtonElement>('[data-shell="play"]')!;
const preferences=loadPreferences();
let mode:GameMode="boot";
let stage:Phaser.Game | undefined;
let stageModule:typeof import("./scenes/game-scenes") | undefined;
let currentDialog:DialogKind | null=null;
let settingsFromPause=false;
let insideGame=false;

storePreferences(preferences);
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",()=>{
  storePreferences(preferences);
  setMode(mode);
});

function setMode(next:GameMode) {
  mode=next;
  document.body.dataset.gameMode=next;
  if (stage && stageModule && next!=="boot") stageModule.setStage(stage,next,insideGame);
}

function hasSave() {
  try { return Boolean(localStorage.getItem(saveKey)); } catch { return false; }
}

function showMenu() {
  const snapshot=window.aetherRuntime?.snapshot();
  const saved=hasSave();
  insideGame=false;
  closeDialog(false);
  boot.hidden=true;
  workspace.hidden=true;
  menu.hidden=false;
  start.textContent=saved ? "继续旅程" : "开始旅程";
  element("new-journey").hidden=!saved;
  element("menu-progress").textContent=saved && snapshot ? "研究归档 · "+snapshot.open+" / "+snapshot.total : "";
  setMode("menu");
  start.focus();
}

function enterGame() {
  insideGame=true;
  closeDialog(false);
  menu.hidden=true;
  workspace.hidden=false;
  setMode("play");
  window.scrollTo(0,0);
  element("screen").focus({preventScroll:true});
}

function showDialog(kind:DialogKind) {
  currentDialog=kind;
  panel.innerHTML=dialogContent(kind,preferences,Boolean(window.aetherRuntime?.snapshot().duel));
  if (!dialog.open) dialog.showModal();
  panel.querySelector<HTMLElement>("button, input, select")?.focus();
  if (kind==="pause" || kind==="gameover" || kind==="settings") setMode(kind);
}

function closeDialog(restore=true) {
  if (restore && currentDialog==="settings" && settingsFromPause) {
    settingsFromPause=false;
    showDialog("pause");
    return;
  }
  currentDialog=null;
  settingsFromPause=false;
  if (dialog.open) dialog.close();
  if (restore) setMode(insideGame?"play":"menu");
}

document.addEventListener("click",event=>{
  const control=(event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[data-shell]");
  if (!control || control.disabled) return;
  switch(control.dataset.shell) {
    case "play": return enterGame();
    case "pause": return showDialog("pause");
    case "settings":
      settingsFromPause=currentDialog==="pause";
      return showDialog("settings");
    case "about": return showDialog("about");
    case "reset": return showDialog("reset");
    case "close": return closeDialog();
    case "menu": return showMenu();
    case "confirm-reset":
      window.aetherRuntime?.reset();
      return enterGame();
    case "retry":
      window.aetherRuntime?.retryDuel();
      closeDialog();
      element("screen").focus({preventScroll:true});
      window.scrollTo(0,0);
      return;
  }
});

dialog.addEventListener("cancel",event=>{event.preventDefault();closeDialog();});
document.addEventListener("keydown",event=>{
  if (event.key==="Escape" && !event.repeat && mode==="play" && !dialog.open) {
    event.preventDefault();
    showDialog("pause");
  }
});
dialog.addEventListener("change",event=>{
  const control=event.target;
  if (control instanceof HTMLInputElement && control.name==="sound") {
    preferences.sound=control.checked;
    playFeedback("sample",preferences.sound);
  }
  if (control instanceof HTMLSelectElement && control.name==="motion") {
    preferences.motion=control.value==="reduced"?"reduced":"system";
  }
  storePreferences(preferences);
});
window.addEventListener("aether:impact",event=>{
  const cue=(event as CustomEvent<{hit:boolean}>).detail;
  playFeedback(cue.hit?"impact":"ward",preferences.sound);
});
window.addEventListener("aether:defeat",()=>{if (insideGame) showDialog("gameover");});
window.addEventListener("error",event=>{
  if (!(event.target instanceof HTMLImageElement)) return;
  event.target.classList.add("missing-art");
  warning.hidden=false;
},true);

function loadScript(file:string) {
  return new Promise<void>((resolve,reject)=>{
    const script=document.createElement("script");
    script.src=import.meta.env.BASE_URL+file;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error(file));
    document.head.append(script);
  });
}

async function startup() {
  const artwork=new Promise<boolean>(resolve=>{
    const timer=window.setTimeout(()=>resolve(false),4500);
    import("./scenes/game-scenes").then(module=>{
      stageModule=module;
      stage=module.createStage(loaded=>{
        window.clearTimeout(timer);
        resolve(loaded);
        if (mode!=="boot") setMode(mode);
      });
    }).catch(()=>{window.clearTimeout(timer);resolve(false);});
  });
  try {
    for (const file of systemScripts) {
      await loadScript(file);
      progress.value++;
      bootStatus.textContent="正在准备工作间 · "+progress.value+" / "+progress.max;
    }
    if (!window.aetherRuntime) throw new Error("runtime");
  } catch {
    bootStatus.textContent="游戏程序加载失败。请重新载入页面再试。";
    const reload=document.createElement("button");
    reload.type="button";reload.textContent="重新载入";
    reload.addEventListener("click",()=>location.reload());
    bootStatus.after(reload);
    return;
  }
  const hasArt=await artwork;
  if (!hasArt) warning.hidden=false;
  progress.value=progress.max;
  showMenu();
}
void startup();
