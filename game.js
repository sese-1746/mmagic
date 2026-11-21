"use strict";

const saveKey = "aether-fragment-v1";
const tabs = [["research","研究台","⬡"], ["analysis","解析台","◈"], ["atlas","要素图鉴","✦"], ["field","灵气场","◎"], ["infusion","注魔台","◇"], ["event","腐化事件","◌"]];
const fresh = () => ({
  chapter: 0, open: 0, view: "research", inventory: {wind: 4, earth: 4, fire: 4, water: 4, order: 4, chaos: 4},
  known: [...primal], notes: {}, ink: 8, corruption: 0, residue: 0, region: 0,
  nodes: regions.map(region => region[2].map(() => ({life: 100, pure: false}))),
  relicUses: {}, failures: 0, lock: null, surge: 0, eventAt: 35
});

let state = fresh();
let saveAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(saveKey));
  if (saved && Number.isInteger(saved.open) && saved.open >= 0 && saved.open <= chapters.length) {
    state = {...state, ...saved};
  }
} catch {}
let selected = null;
let relic = null;
let mix = [];
let altar = [null, null, null, null];
let notice = "研究从雾港铜哨的第一道刻痕开始。";

const get = id => document.getElementById(id);
const amount = id => state.inventory[id] || 0;
const add = (id, n) => { state.inventory[id] = amount(id) + n; };
const know = id => { if (!state.known.includes(id)) state.known.push(id); };
const clamp = (n, max = 100) => Math.max(0, Math.min(n, max));
const corrupt = n => { state.corruption = clamp(state.corruption + n); };
const icon = id => '<span class="rune" style="--rune:' + aspects[id][2] + '" aria-hidden="true">' + aspects[id][1] + '</span>';
const name = id => aspects[id][0];
const btn = (label, action, value = "", opts = "") => '<button type="button" data-action="' + action + '" data-value="' + value + '" ' + opts + '>' + label + '</button>';
const heading = (small, title, desc) => '<div class="screen-heading"><div class="eyebrow">' + small + '</div><h1>' + title + '</h1><p>' + desc + '</p></div>';
const eventReady = () => state.corruption >= state.eventAt;
const examined = index => state.relicUses[index] || 0;
const discoverable = () => new Set(chapters.slice(0, Math.min(chapters.length, state.open + 1)).map(ch => ch[3]).filter(Boolean));

function update(message) {
  if (message) notice = message;
  try {
    localStorage.setItem(saveKey, JSON.stringify(state));
    saveAvailable = true;
  } catch { saveAvailable = false; }
  render();
}

function render() {
  const focused = document.activeElement;
  const focusKey = focused?.dataset.action && [focused.dataset.action, focused.dataset.value];
  const navScroll = get("nav").scrollLeft;
  const inventory = get("inventory");
  const tileScroll = inventory.querySelector(".tiles")?.scrollLeft || 0;
  document.documentElement.style.setProperty("--corruption", state.corruption / 100);
  get("meters").innerHTML = '<span>墨水 <b>' + state.ink + '</b></span><span>残渣 <b>' + state.residue + '</b></span><span class="corruption">腐化 <b>' + state.corruption + '%</b><meter min="0" max="100" value="' + state.corruption + '" aria-label="腐化"></meter></span>';
  get("nav").innerHTML = tabs.map(([id, label, symbol]) => btn('<span aria-hidden="true">' + symbol + '</span>' + label + (id === "event" && eventReady() ? '<i class="signal"></i>' : ''), "view", id, state.view === id ? 'aria-current="page"' : '')).join("");
  const available = Object.keys(aspects).filter(id => state.known.includes(id) || amount(id));
  inventory.innerHTML = '<div class="eyebrow">工作台储备</div><h2>要素库存</h2><div class="tiles">' + available.map(id => btn(icon(id) + '<span>' + name(id) + '</span><b>' + amount(id) + '</b>', "select", id,
    'class="tile' + (state.corruption >= 50 && id === "chaos" ? ' distorted' : '') + '" draggable="' + (amount(id) > 0) + '" aria-pressed="' + (id === selected) + '" ' + (amount(id) ? '' : 'disabled'))).join("") + '</div><p class="muted">' + (selected ? '已选中 ' + name(selected) : '点击选取或拖到工作槽') + '</p>';
  get("screen").innerHTML = ({research, analysis, atlas, field, infusion, event: eventScreen}[state.view] || research)();
  get("notice").textContent = notice;
  get("save").textContent = saveAvailable ? "本地自动存档" : "浏览器当前无法写入存档";
  get("nav").scrollLeft = navScroll;
  inventory.querySelector(".tiles").scrollLeft = tileScroll;
  if (focusKey) {
    const [action, value] = focusKey;
    const next = [...document.querySelectorAll("[data-action]")].find(el => el.dataset.action === action && el.dataset.value === value);
    next?.focus({preventScroll: true});
  }
}

function research() {
  const i = state.chapter;
  const solved = i < state.open;
  const [title, desc, , reward] = chapters[i];
  const {cells, anchors, blocked} = board(i);
  const placed = state.notes[i] || {};
  const filled = {...placed, ...anchors};
  const edges = links(cells, filled);
  const ready = completed(anchors, edges);
  const center = (q, r) => [Math.sqrt(3) * 32 * (q + r / 2), 48 * r];
  const coords = Object.fromEntries(cells.map(({q, r, id}) => [id, center(q, r)]));
  const viewWidth = i < 3 ? 310 : i < 10 ? 330 : 430;
  const viewHeight = i < 3 ? 204 : i < 10 ? 254 : 354;
  const points = Array.from({length: 6}, (_, j) => {
    const angle = (j * 60 - 90) * Math.PI / 180;
    return [Math.cos(angle) * 29, Math.sin(angle) * 29].join(",");
  }).join(" ");
  const shapes = cells.map(({id}) => {
    const [x, y] = coords[id];
    const aspect = filled[id];
    const fixed = Boolean(anchors[id]);
    const closed = blocked.includes(id) || (state.lock?.chapter === i && state.lock.id === id);
    const label = fixed ? "固定 " + name(aspect) : closed ? "封闭槽位" : aspect ? name(aspect) + "，点击撤回" : "空槽位 " + id;
    const interactive = !fixed && !closed && !solved;
    return '<g transform="translate(' + x + ' ' + y + ')" class="hex' + (fixed ? ' fixed' : '') + (closed ? ' closed' : '') + '" ' +
      (interactive ? 'tabindex="0" role="button" data-action="cell" data-value="' + id + '" ' : 'role="img" ') +
      'aria-label="' + label + '"><polygon points="' + points + '"/>' +
      (aspect ? '<text class="glyph" y="4" style="fill:' + aspects[aspect][2] + '">' + aspects[aspect][1] + '</text><text class="cell-name" y="19">' + name(aspect) + '</text>' :
        '<text class="empty" y="4">' + (closed ? '×' : '·') + '</text>') + '</g>';
  }).join("");
  const wires = edges.map(([a,b]) => {
    const [x1,y1] = coords[a], [x2,y2] = coords[b];
    return '<line x1="' + (x1*.65+x2*.35) + '" y1="' + (y1*.65+y2*.35) + '" x2="' + (x2*.65+x1*.35) + '" y2="' + (y2*.65+y1*.35) + '"/>';
  }).join("");
  const controls = solved ? '<span class="success">✓ 已归档</span>' : btn("提交研究", "submit", "", 'class="primary"') + btn("清空阵图", "clear", "", Object.keys(placed).length ? "" : "disabled");
  return heading('研究进度 · ' + state.open + ' / ' + chapters.length, title, desc) +
    '<div class="chapterbar" aria-label="选择研究">' + chapters.map((_, j) => btn(String(j+1).padStart(2,"0"), "chapter", j,
      'aria-label="第 ' + (j+1) + ' 章 ' + chapters[j][0] + '" ' + (j === i ? 'aria-current="step"' : '') + (j > state.open ? ' disabled' : ''))).join("") + '</div>' +
    '<div class="board"><div class="board-meta"><span>研究阵图</span><span class="' + (ready ? 'success' : '') + '">' + (ready ? "锚点已连通" : "连接所有金边锚点") + '</span></div>' +
    '<svg aria-label="六边形研究阵图" viewBox="' + [-viewWidth/2,-viewHeight/2,viewWidth,viewHeight].join(" ") + '">' + shapes + '<g class="wires" aria-hidden="true">' + wires + '</g></svg>' +
    '<div class="board-bottom"><span>' + (solved ? "笔记已保存" : "相邻的成分与复合要素才能连接") + '</span>' + controls + '</div></div>' +
    '<p class="hint">' + (state.open === chapters.length ? "全部研究已完成。你留下的笔记将指引下一位残响解析者。" :
      i === 0 ? "试试把「雾」放在风与水之间。可在解析台取得雾，也可在图鉴用风和水合成。"
      : '从库存选取或拖放要素。再次点击或右键撤回，已使用的要素与墨水不会返还。' + (reward && !solved ? ' 本页开放「' + name(reward) + '」试配。' : '')) + '</p>';
}

function analysis() {
  return heading("遗物档案", "解析台", "选择遗物或拖入解析槽，依次揭示其内含的要素。") +
    '<div class="analysis-slot" data-relic-slot><span class="sigil">◈</span><div>' +
    (relic === null ? '<strong>六边形解析槽</strong><p class="muted">将遗物拖到这里，或从档案中选择。</p>' :
      '<strong>' + relics[relic][0] + '</strong><p class="muted">' + relics[relic][1] + '</p>') + '</div>' +
    (relic === null ? "" : btn("解析遗物", "analyze", relic, 'class="primary" ' + (examined(relic) >= Object.keys(relics[relic][3]).length ? "disabled" : ""))) + '</div>' +
    '<div class="cards">' + relics.map(([title, desc, unlock, yields], i) => {
      const count = examined(i);
      return '<article class="card"><h3>' + title + '</h3><p>' + desc + '</p><div class="reveal">' +
        Object.keys(yields).map((id, j) => j < count ? '<span>' + icon(id) + name(id) + ' ×' + yields[id] + '</span>' : '<span aria-label="未解析">◇</span>').join("") + '</div>' +
        btn(state.open < unlock ? '完成 ' + unlock + ' 项研究后开放' : i === relic ? "已放入槽位" : "放入解析槽", "relic", i,
          state.open < unlock ? "disabled" : 'draggable="true" aria-pressed="' + (i === relic) + '"') + '</article>';
    }).join("") + '</div>';
}

function atlas() {
  return heading("成分与配方", "要素图鉴", "从库存选取成分，点击或拖到合成位。合成每次消耗两份成分，产出一份复合要素。") +
    '<div class="workbar">' + [0,1].map(i => btn(mix[i] ? icon(mix[i]) + name(mix[i]) : '合成位 ' + (i+1), "mix", i)).join("") +
    btn("合成要素", "craft", "", 'class="primary" ' + (mix.filter(Boolean).length < 2 ? "disabled" : "")) + '</div><div class="cards">' +
    Object.entries(aspects).map(([id, [, , , parts]]) => {
      const visible = state.known.includes(id) || discoverable().has(id);
      return '<article class="card lexicon">' + (visible ? '<h3>' + icon(id) + name(id) + '</h3><p>' +
        (parts ? parts.map(name).join(" ＋ ") : '元始要素') + '</p>' : '<h3>◇ 未知要素</h3><p>推进研究以解读配方</p>') + '</article>';
    }).join("") + '</div>';
}

function field() {
  const [, unlock, nodes] = regions[state.region];
  const inaccessible = state.open < unlock;
  return heading("区域节点", "灵气场", "稳定度低于 45 时抽取会明显加深腐化。静置能恢复灵气，枯竭节点将永久关闭。") +
    '<div class="workbar">' + regions.map(([title, req], i) => btn(title, "region", i, (state.region === i ? 'aria-current="true" ' : "") + (state.open < req ? "disabled" : ""))).join("") +
    btn("静置并调墨", "rest", "", 'class="primary"') + '</div>' + (inaccessible ? "" :
    '<div class="cards">' + nodes.map(([title, outputs, cost], i) => {
      const node = state.nodes[state.region][i];
      const nodeCost = node.pure ? Math.max(3, cost - 4) : cost;
      return '<article class="card"><h3>' + title + '</h3><p>' + (node.life === 0 ? "枯竭" : node.pure ? "纯净节点" : "普通节点") +
        ' · 稳定度 ' + node.life + '%</p><meter min="0" max="100" value="' + node.life + '" aria-label="节点稳定度"></meter><div class="node-actions">' +
        outputs.map(id => btn(icon(id) + '抽取' + name(id) + ' ×' + (state.corruption >= 65 ? 1 : 2), "extract", i + ":" + id, node.life ? "" : "disabled")).join("") +
        '</div><p>每次抽取降低 ' + nodeCost + ' 稳定度</p>' +
        btn(node.pure ? "已培育" : "培育 · 秩序 ×3", "purify", i, state.open < 5 || node.pure || !node.life ? "disabled" : "") +
        (state.open < 5 ? '<p>完成 5 项研究后开放培育</p>' : '') + '</article>';
    }).join("") + '</div>') +
    '<p class="hint">静置可补充墨水、恢复未枯竭节点，并从工作台沉积中提取元始要素。腐化越高，休整的恢复越慢。</p>';
}

function risk() {
  return (altar[0] !== altar[2] ? 27 : 0) + (altar[1] !== altar[3] ? 27 : 0) +
    Math.floor(state.corruption / 3) + state.region * 8;
}

function infusion() {
  const active = state.open >= 4;
  return heading("对称注魔", "注魔台", active ? "以四份要素换取墨水和秩序。让两对相对的槽位保持相同，以降低事故风险。" : "完成 4 项研究后开放。") +
    (active ? '<div class="altar"><span class="sigil">◇</span>' + altar.map((id, i) =>
      btn(id ? icon(id) + name(id) : ["上","右","下","左"][i] + "槽", "altar", i, 'class="altar-slot slot-' + i + '"')).join("") +
    '</div><div class="workbar"><span>风险 ' + (altar.every(Boolean) ? risk() + "%" : "待放入四份要素") + '</span>' +
    btn("启动注魔", "infuse", "", 'class="primary" ' + (altar.every(Boolean) ? "" : "disabled")) + '</div>' : "");
}

function eventScreen() {
  return heading("灵气异象", "腐化事件", eventReady() ?
    "裂隙从纸页下浮起，未干的墨迹开始自行改写。你可以封住裂隙，或借它完成几次刻写。" :
    "裂隙已经沉寂。腐化上升至 " + state.eventAt + "% 时会再次出现。") +
    '<div class="cards"><article class="card"><h3>封闭裂隙</h3><p>消耗 3 秩序，降低 30 腐化，并解除被锁槽位。</p>' +
    btn("清除腐化", "event-clean", "", eventReady() && amount("order") >= 3 ? "" : "disabled") + '</article><article class="card"><h3>借用裂隙</h3><p>接下来 5 次放置免耗墨水，立即增加 12 腐化。</p>' +
    btn("接受腐化", "event-accept", "", eventReady() && state.corruption < 100 && !state.surge ? "" : "disabled") + '</article><article class="card"><h3>沉降残渣</h3><p>每 2 份残渣经过滤可得到 1 混沌，并降低 5 腐化。</p>' +
    btn("处理残渣", "residue", "", state.residue >= 2 ? "" : "disabled") + '</article></div>';
}

function put(id, aspect, remove = false) {
  if (state.view !== "research" || state.chapter < state.open) return;
  const {anchors, blocked, cells} = board(state.chapter);
  if (!cells.some(cell => cell.id === id) || anchors[id] || blocked.includes(id) ||
      (state.lock?.chapter === state.chapter && state.lock.id === id)) return;
  const placed = state.notes[state.chapter] ??= {};
  if (placed[id]) {
    delete placed[id];
    return update("已撤回刻写。");
  }
  if (remove || !aspect || !amount(aspect)) return update("先从库存选一个要素。");
  if (!state.ink && !state.surge) return update("墨水不足，可前往灵气场静置调墨。");
  add(aspect, -1);
  if (state.surge) state.surge--;
  else state.ink--;
  placed[id] = aspect;
  if (aspect === "chaos" && state.corruption >= 50 && Math.random() < .3) {
    const open = cells.filter(cell => !anchors[cell.id] && !placed[cell.id] && !blocked.includes(cell.id));
    if (open.length && Math.random() < .5) {
      state.lock = {chapter: state.chapter, id: open[Math.floor(Math.random() * open.length)].id};
      return update("畸变的混沌锁住了一个空槽。静置可解除。");
    }
    if (amount(aspect)) {
      add(aspect, -1);
      return update("混沌畸变，吞噬了额外一份混沌。");
    }
  }
  update("已刻写 " + name(aspect) + "。");
}

function submit() {
  const i = state.chapter;
  if (i !== state.open) return;
  const {cells, anchors} = board(i);
  if (!completed(anchors, links(cells, {...state.notes[i], ...anchors}))) {
    if (!Object.keys(state.notes[i] || {}).length) return update("先在阵图上刻写要素。");
    state.notes[i] = {};
    state.residue++;
    corrupt(++state.failures >= 2 ? 9 : 5);
    return update("研究失稳，阵图清空并留下 1 份残渣。");
  }
  const reward = chapters[i][3];
  if (reward) {
    know(reward);
    add(reward, 2);
  }
  state.open++;
  state.ink += 5;
  state.failures = 0;
  state.lock = null;
  update("研究已归档，获得 5 墨水" + (reward ? "和 2 " + name(reward) : "") + "。");
}

function rest() {
  const recovery = state.corruption >= 65 ? 4 : 8;
  state.ink = Math.max(state.ink, state.corruption >= 65 ? 8 : 14);
  for (const id of primal) if (amount(id) < 4) add(id, 4 - amount(id));
  for (const group of state.nodes) {
    for (const node of group) if (node.life) node.life = clamp(node.life + recovery + (node.pure ? 8 : 0));
  }
  state.lock = null;
  if (state.nodes[state.region].some(node => node.pure && node.life)) corrupt(-3);
  update("已调墨、补充元始要素，并恢复可用节点。");
}

function extract(value) {
  const [index, id] = value.split(":");
  const node = state.nodes[state.region][index];
  const [, outputs, cost] = regions[state.region][2][index];
  if (!node.life || !outputs.includes(id)) return;
  const strained = node.life < 45;
  node.life = clamp(node.life - (node.pure ? Math.max(3, cost - 4) : cost));
  const yieldCount = state.corruption >= 65 ? 1 : 2;
  know(id);
  add(id, yieldCount);
  corrupt((strained ? 6 : 0) + (node.pure ? 0 : state.region * 2) + (node.life ? 0 : 8));
  update("抽得 " + yieldCount + " " + name(id) + (node.life ? (strained ? "，过度抽取加深了腐化。" : "。") : "，节点已枯竭。"));
}

function enough(ids) {
  return ids.every(id => amount(id) >= ids.filter(other => id === other).length);
}

function fillSlot(slots, index, id) {
  if (id && amount(id)) slots[index] = id;
  else if (slots[index]) slots[index] = null;
  update(id && !amount(id) ? "所选要素库存不足。" : undefined);
}

function craft() {
  const result = Object.keys(aspects).find(id => {
    const parts = aspects[id][3];
    return mix[0] && mix[1] && parts && parts.includes(mix[0]) && mix[1] === parts.find(part => part !== mix[0]);
  });
  if (!result || !(state.known.includes(result) || discoverable().has(result))) return update("两份成分未匹配已开放的配方。");
  if (!enough(mix)) return update("成分库存不足。");
  for (const id of mix) add(id, -1);
  know(result);
  add(result, 1);
  mix = [];
  update("合成了 " + name(result) + "。");
}

function infuse() {
  if (state.open < 4 || !altar.every(Boolean) || !enough(altar)) return update("需要四份可用要素。");
  const danger = risk();
  for (const id of altar) add(id, -1);
  altar = [null, null, null, null];
  if (Math.random() * 100 < danger) {
    corrupt(10 + Math.floor(danger / 10));
    state.residue += 2;
    return update("注魔失稳，咒波泄漏并留下 2 份残渣。");
  }
  state.ink += 8;
  add("order", 3);
  update("注魔成功，获得 8 墨水和 3 秩序。");
}

function act(action, value, aspect = selected) {
  switch (action) {
    case "view": state.view = value; return update();
    case "select": selected = selected === value ? null : value; return update();
    case "chapter": state.chapter = Number(value); return update();
    case "cell": return put(value, aspect);
    case "submit": return submit();
    case "clear": state.notes[state.chapter] = {}; return update("已清空阵图。");
    case "relic": relic = Number(value); return update();
    case "analyze": {
      const [, , unlock, yields] = relics[value];
      const id = Object.keys(yields)[examined(value)];
      if (state.open < unlock || !id) return;
      state.relicUses[value] = examined(value) + 1;
      add(id, yields[id]);
      know(id);
      return update("揭示了 " + yields[id] + " " + name(id) + "。");
    }
    case "mix": return fillSlot(mix, Number(value), mix[value] && mix[value] === aspect ? null : aspect);
    case "craft": return craft();
    case "altar": return fillSlot(altar, Number(value), altar[value] && altar[value] === aspect ? null : aspect);
    case "infuse": return infuse();
    case "region": state.region = Number(value); return update();
    case "rest": return rest();
    case "extract": return extract(value);
    case "purify": {
      const node = state.nodes[state.region][value];
      if (state.open < 5 || amount("order") < 3 || node.pure || !node.life) return update("培育需要 3 秩序和一个未枯竭节点。");
      add("order", -3);
      node.pure = true;
      node.life = clamp(node.life + 20);
      corrupt(-6);
      return update("节点已净化，稳定度有所回升。");
    }
    case "event-clean":
      if (!eventReady() || amount("order") < 3) return;
      add("order", -3);
      corrupt(-30);
      state.lock = null;
      state.eventAt = 35;
      return update("裂隙已封闭。");
    case "event-accept":
      if (!eventReady() || state.corruption >= 100 || state.surge) return;
      corrupt(12);
      state.surge = 5;
      state.eventAt = clamp(state.corruption + 15);
      return update("接下来 5 次刻写无需墨水。");
    case "residue":
      if (state.residue < 2) return;
      state.residue -= 2;
      add("chaos", 1);
      corrupt(-5);
      return update("残渣已沉降，回收了 1 混沌。");
  }
}

document.addEventListener("click", event => {
  const el = event.target.closest("[data-action]");
  if (el && !el.disabled) act(el.dataset.action, el.dataset.value);
});
document.addEventListener("keydown", event => {
  const el = event.target.closest('[data-action="cell"]');
  if (!el || !["Enter", " ", "Delete", "Backspace"].includes(event.key)) return;
  event.preventDefault();
  put(el.dataset.value, selected, ["Delete", "Backspace"].includes(event.key));
});
document.addEventListener("contextmenu", event => {
  const el = event.target.closest('[data-action="cell"]');
  if (!el) return;
  event.preventDefault();
  put(el.dataset.value, null, true);
});
document.addEventListener("dragstart", event => {
  const el = event.target.closest('[draggable="true"]');
  if (!el) return;
  const type = el.dataset.action === "relic" ? "relic" : "aspect";
  event.dataTransfer.setData("application/x-aether-" + type, el.dataset.value);
  event.dataTransfer.effectAllowed = "copy";
});
const slotSelector = '[data-action="cell"],[data-action="mix"],[data-action="altar"]';
document.addEventListener("dragover", event => {
  if (event.target.closest(slotSelector + ",[data-relic-slot]")) event.preventDefault();
});
document.addEventListener("drop", event => {
  const slot = event.target.closest(slotSelector);
  if (slot) {
    event.preventDefault();
    const id = event.dataTransfer.getData("application/x-aether-aspect");
    if (Object.hasOwn(aspects, id) && amount(id)) act(slot.dataset.action, slot.dataset.value, id);
  }
  if (event.target.closest("[data-relic-slot]")) {
    event.preventDefault();
    const value = event.dataTransfer.getData("application/x-aether-relic");
    if (value && relics[value] && state.open >= relics[value][2]) act("relic", value);
  }
});
render();
