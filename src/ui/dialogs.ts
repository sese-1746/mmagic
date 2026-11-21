import {type Preferences} from "../config/game-config";

export type DialogKind = "pause"|"settings"|"gameover"|"reset"|"about";
const action = (label:string,id:string,primary=false) =>
  '<button type="button" data-shell="'+id+'"'+(primary?' class="primary"':"")+'>'+label+'</button>';

export function dialogContent(kind:DialogKind,prefs:Preferences,duel:boolean) {
  let title:string;
  let content:string;
  switch(kind) {
    case "pause":
      title="游戏已暂停";
      content='<p>研究进度和当前演练已保存在此浏览器。</p><div class="dialog-actions">'+action("继续游戏","close",true)+
        (duel?action("重新配装","retry"): "")+action("设置","settings")+action("返回主菜单","menu")+'</div>';
      break;
    case "settings":
      title="设置";
      content='<div class="setting-list"><label><span>战斗音效</span><input type="checkbox" name="sound" '+(prefs.sound?"checked":"")+'></label>'+
        '<label><span>动效</span><select name="motion"><option value="system">跟随系统</option><option value="reduced" '+(prefs.motion==="reduced"?"selected":"")+'>减少动效</option></select></label></div>'+
        '<div class="dialog-actions">'+action("完成","close",true)+'</div>';
      break;
    case "gameover":
      title="护盾已破裂";
      content='<p>未使用的携带要素已退回。可以重新配装挑战，或回到擂台查看记录。</p><div class="dialog-actions">'+
        action("重新配装","retry",true)+action("查看演练记录","close")+action("返回主菜单","menu")+'</div>';
      break;
    case "reset":
      title="开始新存档？";
      content='<p>继续将清除这个浏览器中的研究、装备和旅行进度。</p><div class="dialog-actions">'+
        action("取消","close",true)+action("清除进度并开始","confirm-reset")+'</div>';
      break;
    case "about":
      title="关于以太残响";
      content='<p>一款关于遗物、要素研究和灵气衰竭的炼金叙事解谜游戏。可用鼠标、键盘或触屏；进入工作间后按 Esc 暂停。</p>'+
        '<div class="dialog-actions">'+action("返回","close",true)+'</div>';
  }
  return '<p class="brand-en">AETHER FRAGMENT</p><h2 id="dialog-title">'+title+'</h2>'+content;
}
