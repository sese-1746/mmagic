"use strict";

const destinations = {
  bridge: {
    name:"回潮盐桥", unlock:0, intro:"港门外的盐桥刚露出水面。渡口石刻写着：潮音减弱时，沿西侧低阶走。",
    scene:"桥柱挂着一袋旧货，袋绳正被潮水一点点拉紧。近处的石阶上也积着可用的盐泥。",
    paths:[
      {label:"采集石阶的盐泥", line:"你在石阶上刮下一层盐泥，涨潮前回到渡口。", yields:{earth:2,water:1}, taint:0},
      {label:"涉水解开旧货袋", line:"货袋里藏着凝雾铜瓶。回程时，浑浊的潮水漫过了袖口。", yields:{mist:3,water:2}, taint:5}
    ]
  },
  kilnroad: {
    name:"灰炉引水道", unlock:4, intro:"灰炉停火多年，炉后的引水道仍会在夜里吐出带热的蒸汽。",
    scene:"你找到了守炉人的检修门。门外散着紫铜刻片，门内有一炉尚未褪色的玻璃珠。",
    paths:[
      {label:"收起检修门外的刻片", line:"刻片背面写着水渠的开闸次序。你照样抄进了笔记。", yields:{order:2,fire:1}, taint:0},
      {label:"走入余温尚存的炉室", line:"你取走几粒琉璃。关门时，炉壁的烟垢已经自行卷起。", yields:{glass:3,fire:2}, taint:7}
    ]
  },
  mirrorbank: {
    name:"倒影裂谷岸", unlock:8, intro:"裂谷浅岸上有两串脚印。一串通向水边，另一串在镜面里继续向前。",
    scene:"霜花沿着脚印生长。更远处的水面托着一块折光标尺，标尺下有回声一阵阵上浮。",
    paths:[
      {label:"在岸边采霜并记录脚印", line:"第一笔霜花融在纸上，留下了和水面倒影相反的线条。", yields:{frost:2,order:1}, taint:0},
      {label:"伸手过镜取回标尺", line:"标尺落在你手里，镜中的脚印也跟到了岸上。", yields:{prism:2,mist:3}, taint:9}
    ]
  }
};
const travelLimit = 2;
const tripsAt = chapter => state.travelHistory[chapter] || [];
const travelReward = yields => Object.entries(yields).map(([id,n]) => name(id) + " ×" + n).join("、");
const travelTaint = (path, character) => Math.max(0,path.taint - (character === "trader" ? 3 : 0));

function travelScreen() {
  const visit = state.expedition;
  const history = tripsAt(state.open);
  const title = heading("沿岸考察", "旅行", "沿路线寻找补给。每个研究进度最多完成 2 次考察，同一路线只可完成一次。完成新研究后更新次数。");
  if (visit) {
    const route = destinations[visit.route];
    return title + '<section class="encounter scene-travel"><div class="travel-view">' +
      portrait(characters[visit.character].art) + '</div>' + speech(route.name, "途中记录", route.intro + route.scene) +
      '<div class="travel-paths">' + route.paths.map((path,i) => {
        const taint = travelTaint(path,visit.character);
        return '<article class="card"><p>' + travelReward(path.yields) +
          (taint ? ' · 腐化 +' + taint : '') + (visit.character === "wanderer" ? ' · 主产出额外 +1' : '') + '</p>' +
          btn(path.label, "travel-choose", i, i === 0 ? "" : 'class="primary"') + '</article>';
      }).join("") +
      '</div><div class="scene-actions">' + btn("折返驿站", "travel-cancel") + '</div></section>';
  }
  const report = state.tripReport;
  return title + '<div class="encounter scene-travel"><div class="travel-view"></div>' +
    (report ? speech(destinations[report.route].name, "归来记录", destinations[report.route].paths[report.path].line,
      "采集 " + travelReward(report.yields)) : "") +
    '</div><div class="workbar travel-status"><strong>本轮考察 ' + history.length + ' / ' + travelLimit + '</strong>' +
    (state.character === "wanderer" ? '<span>祁渡 · 识途：主产出额外 +1</span>' :
      state.character === "trader" ? '<span>桑铃 · 备行：冒险点的腐化 −3</span>' : "") + '</div>' +
    '<div class="cards">' + Object.entries(destinations).map(([id,route]) => {
      const locked = state.open < route.unlock;
      const visited = history.includes(id);
      return '<article class="card"><h3>' + route.name + '</h3><p>' + route.intro + '</p>' +
        btn(locked ? '完成 ' + route.unlock + ' 项研究后开放' : visited ? "本轮已考察" : "出发", "travel-start", id,
          locked || visited || history.length >= travelLimit ? "disabled" : "") + '</article>';
    }).join("") + '</div>';
}

function startTravel(value) {
  if (!Object.hasOwn(destinations,value) || state.expedition) return;
  const history = tripsAt(state.open);
  if (state.open < destinations[value].unlock || history.includes(value) || history.length >= travelLimit) return;
  state.expedition = {route:value, chapter:state.open, character:state.character};
  state.tripReport = null;
  update();
}

function finishTravel(value) {
  const visit = state.expedition;
  const path = visit && destinations[visit.route].paths[value];
  if (!path) return;
  const history = tripsAt(visit.chapter);
  if (history.includes(visit.route) || history.length >= travelLimit) return;
  const yields = {...path.yields};
  if (visit.character === "wanderer") yields[Object.keys(yields)[0]]++;
  for (const [id,n] of Object.entries(yields)) {
    know(id);
    add(id,n);
  }
  corrupt(travelTaint(path,visit.character));
  state.travelHistory[visit.chapter] = [...history,visit.route];
  state.tripReport = {route:visit.route,path:Number(value),yields};
  state.expedition = null;
  update("考察归来，带回 " + travelReward(yields) + "。");
}
