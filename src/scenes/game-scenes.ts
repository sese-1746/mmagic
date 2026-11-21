import Phaser from "phaser";
import {coverPath, viewport, type GameMode} from "../config/game-config";

export class BootScene extends Phaser.Scene {
  constructor(private ready: (artLoaded:boolean)=>void) { super("boot"); }
  preload() { this.load.image("workshop",coverPath); }
  create() { this.ready(this.textures.exists("workshop")); }
}

class WorkshopScene extends Phaser.Scene {
  constructor(key:"menu"|"play") { super(key); }
  create() {
    const menu = this.scene.key === "menu";
    const {width,height} = viewport;
    if (this.textures.exists("workshop")) {
      const cover = this.add.image(width/2,height/2,"workshop");
      cover.setScale(Math.max(width / cover.width, height / cover.height));
      if (!menu) cover.setTint(0x564557);
    }
    const centerX = width * .73;
    const centerY = height * .49;
    const ring = this.add.graphics();
    ring.lineStyle(1,0xdec193,menu ? .24 : .1);
    for (const radius of [146,160,186]) ring.strokeCircle(centerX,centerY,radius);
    if (!menu) return;
    const dust = this.add.graphics();
    dust.fillStyle(0xecc281,.55);
    for (let i=0;i<24;i++) dust.fillCircle(30 + (i*173)%1200, 30 + (i*97)%680, i%3 ? 1 : 2);
    this.tweens.add({targets:dust,y:-26,alpha:.25,duration:4500,yoyo:true,repeat:-1,ease:"Sine.inOut"});
    this.tweens.timeScale = document.documentElement.dataset.motion === "reduced" ? 0 : 1;
  }
}

export function createStage(onReady:(artLoaded:boolean)=>void) {
  const stage = new Phaser.Game({
    type:Phaser.CANVAS,
    parent:"game-stage",
    backgroundColor:"#201823",
    scale:{...viewport,mode:Phaser.Scale.ENVELOP,autoCenter:Phaser.Scale.CENTER_BOTH},
    audio:{noAudio:true},
    input:{keyboard:false,mouse:false,touch:false,gamepad:false},
    scene:[new BootScene(onReady)]
  });
  stage.scene.add("menu",new WorkshopScene("menu"));
  stage.scene.add("play",new WorkshopScene("play"));
  return stage;
}

export function setStage(stage:Phaser.Game, mode:GameMode, insideGame:boolean) {
  const pane = mode === "menu" || (mode === "settings" && !insideGame) ? "menu" : "play";
  const previous = pane === "menu" ? "play" : "menu";
  if (stage.scene.isActive("boot")) stage.scene.stop("boot");
  stage.scene.stop(previous);
  if (stage.scene.isPaused(pane)) stage.scene.resume(pane);
  else if (!stage.scene.isActive(pane)) stage.scene.start(pane);
  const tweens=stage.scene.getScene(pane).tweens;
  if (tweens) tweens.timeScale = document.documentElement.dataset.motion === "reduced" ? 0 : 1;
  if (mode === "pause" || mode === "gameover" || mode === "settings") stage.scene.pause(pane);
}
