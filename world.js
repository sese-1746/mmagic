"use strict";

const aspects = {
  wind: ["风", "△", "#8db8bc"], earth: ["地", "▽", "#c4a077"],
  fire: ["火", "▲", "#e69579"], water: ["水", "▼", "#81a9d7"],
  order: ["秩序", "◇", "#e0ca91"], chaos: ["混沌", "◌", "#bd97d4"],
  mist: ["雾", "⟁", "#9bc4cf", ["wind", "water"]],
  clay: ["陶", "◈", "#d0a582", ["earth", "water"]],
  spark: ["焰星", "✦", "#efae7d", ["wind", "fire"]],
  glass: ["琉璃", "♢", "#c2b9ed", ["fire", "earth"]],
  seal: ["刻印", "⬡", "#dec084", ["earth", "order"]],
  frost: ["霜", "✳", "#aeb7e8", ["water", "chaos"]],
  prism: ["折光", "◬", "#f3d695", ["glass", "order"]],
  echo: ["回响", "◎", "#a4d0bc", ["mist", "spark"]],
  rift: ["裂隙", "✶", "#d9a7e4", ["frost", "chaos"]],
  bloom: ["醒壤", "❋", "#b6cd99", ["clay", "seal"]],
  dawn: ["曙光", "☼", "#f5d6a3", ["prism", "echo"]],
  hush: ["静域", "⊙", "#c0aee4", ["rift", "bloom"]]
};
const primal = Object.keys(aspects).slice(0, 6);

const relics = [
  ["雾港的铜哨", "吹口里凝着一整夜也未蒸发的露。", 0, {wind: 3, water: 3, mist: 1}],
  ["盐井沉片", "片上指纹的主人曾在井水退去前封住隧道。", 0, {earth: 3, water: 3, clay: 1}],
  ["熄炉观火镜", "镜缘凉透了，镜心还留着一道橙光。", 0, {fire: 3, wind: 2, spark: 1, glass: 1}],
  ["旧测绘仪", "每到整点，偏移的指针就会颤一下。", 1, {order: 3, earth: 3, seal: 1}],
  ["斑蚀潮钟", "这只钟追踪的是潮湿石壁里的水声。", 3, {water: 3, chaos: 3, frost: 1}],
  ["航灯内芯", "灯塔守夜人把两个不同的方向刻在同一面上。", 6, {glass: 2, mist: 2, spark: 2, order: 2}],
  ["裂谷育种匣", "薄霜下面压着一张记录发芽日的纸。", 10, {frost: 2, chaos: 2, clay: 2, seal: 2}]
];

const regions = [
  ["余潮书库", 0, [
    ["回廊风井", ["wind", "water"], 4],
    ["页岩书龛", ["earth", "order"], 5]
  ]],
  ["灰炉遗址", 3, [
    ["余温之眼", ["fire", "earth"], 7],
    ["折断风标", ["wind", "chaos"], 10]
  ]],
  ["倒影裂谷", 8, [
    ["凝夜泉", ["water", "chaos"], 14],
    ["镜下白脉", ["order", "glass"], 9],
    ["裂谷回声", ["frost", "mist"], 12]
  ]]
];

const chapters = [
  ["潮声入纸", "铜哨的孔壁有三道刻痕。风穿过去时，水汽会在中间那一道结雾。", ["wind", "mist", "water"], "mist"],
  ["沉泥定形", "把沉片浸回水中，碎裂的部分沿着旧指纹重新合拢。", ["water", "clay", "earth"], "clay"],
  ["炉息余温", "守炉人的记录说，火熄灭前会把一瞬的余温交给穿堂风。", ["wind", "spark", "fire"], "spark"],
  ["砂中藏光", "熔炉已停了几十年。一束光仍困在冷却后的炉砂里。", ["earth", "glass", "fire", "spark", "wind"], "glass"],
  ["刻印成约", "书库的封条刻在岩层上。把错位的线重新排好，石门就会松动。", ["order", "seal", "earth", "clay", "water"], "seal"],
  ["潮冷结霜", "潮钟敲响后，指针上出现一层会自行移动的薄霜。", ["chaos", "frost", "water", "mist", "wind"], "frost"],
  ["折光标尺", "守夜人用两面折光镜测同一颗星，算出了裂谷的入口。", ["seal", "order", "prism", "glass", "fire", "spark", "wind"], "prism"],
  ["双声回廊", "靠近回廊尽头时，你听见了刚才留在另一侧的脚步。", ["water", "mist", "echo", "spark", "fire", "glass", "earth"], "echo"],
  ["黑潮裂隙", "望进裂隙时，潮钟的声音从一圈圈浮霜中传出。", ["rift", "frost", "water", "clay", "earth", "seal", "order"], "rift"],
  ["土脉复苏", "地底的细根避开了污染沉积，沿着封印留下的划痕生长。", ["bloom", "seal", "earth", "clay", "water", "mist", "echo"], "bloom"],
  ["航灯重明", "镜面只剩一块完好。根据旧刻度转动它，微光就能重新掠过峡谷。", ["dawn", "prism", "glass", "fire", "spark", "echo", "mist", "water", "frost", "chaos"], "dawn"],
  ["为深井封口", "把育种匣放到井边，冻住的根须会朝向井壁里最安静的地方。", ["hush", "rift", "frost", "water", "clay", "bloom", "seal", "order", "prism", "glass"], "hush"],
  ["根系备忘", "井壁上年轻的根须勾出了一份新的地下水图。", ["hush", "bloom", "clay", "earth", "glass", "prism", "dawn", "echo", "mist", "wind"], null],
  ["潮钟复测", "把钟移到裂谷边缘，你终于测出两次潮声之间的时间差。", ["chaos", "rift", "hush", "bloom", "seal", "order", "prism", "dawn", "echo", "spark"], null],
  ["旧城来信", "关掉航灯后，峡谷另一端亮起灯火。对面有人按旧约回应。", ["wind", "spark", "echo", "dawn", "prism", "order", "seal", "bloom", "hush", "rift", "frost", "water"], null],
  ["残响归档", "你把最后一张图夹进书脊，给未来的人留下一份可重新测量的记录。", ["hush", "rift", "chaos", "frost", "water", "mist", "echo", "dawn", "prism", "glass", "earth", "clay", "bloom"], null]
];

const directions = [[1,0], [0,1], [-1,1], [-1,0], [0,-1], [1,-1]];
const key = (q, r) => q + "," + r;
const distance = ([q, r]) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const earlyWalk = [[-1,0],[0,0],[1,0]];
const middleWalk = [[-2,0],[-1,0],[0,0],[1,0],[2,0],[1,1],[0,2]];
const lateWalk = [[-3,0],[-2,0],[-1,0],[0,-1],[1,-2],[2,-2],[3,-2],[3,-1],[2,0],[1,1],[0,2],[-1,3],[-2,3]];

function board(index) {
  const sequence = chapters[index][2];
  const radius = index < 3 ? 1 : index < 10 ? 2 : 3;
  const walk = (radius === 1 ? earlyWalk : radius === 2 ? middleWalk : lateWalk).slice(0, sequence.length);
  const turn = ([q, r]) => {
    for (let i = 0; i < index % 6; i++) [q, r] = [-r, q + r];
    return [q, r];
  };
  const route = walk.map(turn);
  const anchors = {};
  const marks = sequence.length < 7 ? [0, sequence.length - 1] : [0, Math.floor((sequence.length - 1) / 2), sequence.length - 1];
  for (const i of marks) anchors[key(...route[i])] = sequence[i];
  const blocked = index < 10 ? [] : [[0,0],[1,0],[-1,1]].map(turn).map(pair => key(...pair));
  const cells = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (distance([q,r]) <= radius) cells.push({q, r, id: key(q,r)});
    }
  }
  return {cells, anchors, blocked};
}

function canConnect(a, b) {
  return aspects[a]?.[3]?.includes(b) || aspects[b]?.[3]?.includes(a);
}

function links(cells, filled) {
  const edges = [];
  for (const {q, r, id} of cells) {
    if (!filled[id]) continue;
    for (const [dq, dr] of directions.slice(0, 3)) {
      const next = key(q + dq, r + dr);
      if (canConnect(filled[id], filled[next])) edges.push([id, next]);
    }
  }
  return edges;
}

function completed(anchors, edges) {
  const ids = Object.keys(anchors);
  const seen = new Set(ids.slice(0, 1));
  const queue = [...seen];
  for (const id of queue) {
    for (const [a, b] of edges) {
      const next = a === id ? b : b === id ? a : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return ids.every(id => seen.has(id));
}
