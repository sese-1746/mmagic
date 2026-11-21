"use strict";

const people = {
  vendor: {name: "收灯人·岑", role: "行商", greeting: "灯油剩得不多了。你带的是新笔记，还是能换货的潮印？", topics: [
    ["潮印从哪里来？", "每份新研究归档后，书库会盖两枚潮印。擂台首胜也有奖赏。我还收存研究留下的残渣。"],
    ["为什么收集残渣？", "残渣在掌心会指向最近的水脉。我把它们装进灯罩，赶夜路时就不会走进干涸的井。"]
  ]},
  keeper: {name: "守阵人·黎", role: "演练导师", greeting: "脚跟离开铜圈就算输。抬头看我的起手，阵图会比我先告诉你下一招。", topics: [
    ["起手动作怎么看？", "对手准备重击时，用守势截住冲击并积蓄灵息。等对手蓄势露出破绽，再把灵息用在共鸣上。"],
    ["输掉会怎样？", "铜圈会接住破碎的护盾。可以马上重试，你的要素和潮印都留在身上。"]
  ]},
  echo: {name: "镜中旅人", role: "裂谷挑战者", unlock: 8, greeting: "我从镜子的另一边来。你以为回声总是慢一步？试试先等我出招。", topics: [
    ["你为什么留在裂谷？", "这面镜子照得见归途，却照不见归人。我在等灯塔重新亮起。"],
    ["你的阵有什么弱点？", "映出护壁时，镜面会卸走大半伤害。等它聚光再出手，裂纹就会落在同一处。"]
  ]}
};

const characters = {
  scholar: {name:"闻汐", kind:"research", art:"player", bio:"在余潮书库修补笔记的残响解析者。", skills:[
    ["读阵", "每项研究可揭示一个正确槽位，完成研究额外得到 1 份要素。"],
    ["鉴析", "看见合成成功率，以及对手各类要素的存量。"],
    ["回收", "每场首次成功使用耗素技能，返还 1 份到研究库存。"]
  ]},
  duelist: {name:"陆砚", kind:"combat", art:"duelist", bio:"在灰炉遗址守过夜的阵师。", skills:[
    ["稳印", "攻击法术威力 +2，命中率 +12 个百分点。"],
    ["血刻", "可选择失去 4 护盾，使本次攻击法术威力额外 +6。落空时也会支付代价。"]
  ]},
  trader: {name:"桑铃", kind:"exploration", art:"trader", bio:"沿盐井旧道运送补给的行旅商人。", skills:[
    ["行商折价", "每次购买少付 1 潮印，最低 1 潮印。"],
    ["备行", "冒险旅行少积累 3 腐化。"],
    ["夺素", "每个研究进度可从每位对手身上夺取 1 份要素。"]
  ]},
  wanderer: {name:"祁渡", kind:"exploration", art:"wanderer", bio:"熟悉潮汐和旧港岔路的领路人。", skills:[
    ["识途", "主持旅行时，路线的主产出额外增加 1 份。"],
    ["夺素", "每个研究进度可从每位对手身上夺取 1 份要素。"]
  ]}
};
const classLabels = {combat:"战斗", research:"研究", exploration:"探索"};
const roleOf = id => characters[id] || characters.scholar;

function activeCharacter() {
  return roleOf(state.character);
}

function roster() {
  const fighting = state.battle && !state.battle.result;
  return heading("角色卡", "选择角色", fighting ? "演练进行中。结束或退出演练后即可换人。" : "选择一名角色出场。各角色的技能适用于不同玩法。") +
    '<div class="role-cards">' + Object.entries(characters).map(([id, character]) => {
      const equipped = id === state.character;
      return '<article class="role-card' + (equipped ? ' equipped' : '') + '"><div class="role-art">' +
        '<span class="role-category">' + classLabels[character.kind] + '</span>' + portrait(character.art) +
        '</div><div class="role-copy"><h2>' + character.name + '</h2><p>' + character.bio +
        '</p><div class="role-skill">' + character.skills.map(([title,detail]) => '<strong>' + title + '</strong><p>' + detail + '</p>').join("") + '</div>' +
        btn(equipped ? "当前出场" : "选择" + character.name, "choose-role", id, equipped || fighting ? "disabled" : 'class="primary"') +
        '</div></article>';
    }).join("") + '</div>';
}

function offerCost(offer) {
  return Math.max(1, offer.cost - (state.character === "trader" ? 1 : 0));
}

const offers = [
  {id:"ink", label:"雾港墨囊", detail:"获得 8 墨水", cost:2, unlock:0},
  {id:"mist", label:"铜瓶凝雾", detail:"获得 2 雾", cost:2, unlock:0},
  {id:"order", label:"秩序石片", detail:"获得 3 秩序", cost:3, unlock:0},
  {id:"frost", label:"凝霜匣", detail:"获得 2 霜", cost:3, unlock:5},
  {id:"clean", label:"净化灯芯", detail:"降低 12% 腐化", cost:4, unlock:4}
];

const stances = {
  gather:{label:"蓄势", detail:"攻击伤害增加 3", shield:0, opening:3, line:"对手汇聚灵息，护盾露出了空隙。"},
  strike:{label:"冲击", detail:"用守势削减伤害", shield:0, opening:0, line:"对手的法印已经成形，下一招将是冲击。"},
  guard:{label:"护壁", detail:"抵消部分伤害，可趁机恢复", opening:0, line:"对手面前升起一道护壁。"}
};
const rivals = [
  {id:"keeper", name:"守阵人·黎", entrance:"站稳。先看看我的起手。", yieldLine:"这一阵算你赢。你的守势很稳。", health:24, hit:7, shield:4, unlock:0, coins:4, reward:"mist", supplies:{wind:4,order:4}, pattern:["gather","strike","guard"]},
  {id:"kiln", name:"灰炉巡卫", entrance:"铜圈校准完毕。演练协议启动。", yieldLine:"护壁解除。已记录你的出招。", health:35, hit:10, shield:6, unlock:4, coins:6, reward:"glass", supplies:{fire:4,earth:3,glass:1}, pattern:["guard","strike","gather","strike"]},
  {id:"echo", name:"镜中旅人", entrance:"看着镜面。你能分出哪一招先到吗？", yieldLine:"我听见了你的回声。下次，再快一步。", health:44, hit:12, shield:8, unlock:8, coins:8, reward:"prism", supplies:{prism:1,water:4,frost:3}, pattern:["gather","strike","guard","strike","gather"]}
];
const duelHealth = 26;
let conversation = {person:"vendor", topic:null};
let duelCue = null;

function portrait(id, classes = "") {
  return '<img class="character-art art-' + id + ' ' + classes + '" alt="" src="assets/' + id + '.webp" width="440" height="440" draggable="false">';
}

function speech(speaker, label, line, detail = "") {
  return '<div class="speech" aria-live="polite"><div class="speaker"><strong>' + speaker + '</strong>' +
    (label ? '<span>' + label + '</span>' : "") + '</div><p>' + line + '</p>' +
    (detail ? '<div class="speech-detail">' + detail + '</div>' : "") + '</div>';
}

function market() {
  const {person, topic} = conversation;
  const npc = people[person];
  return heading("余潮书库", "行旅驿站", "与旅人交谈，或用研究和首胜获得的潮印购买补给。") +
    '<div class="workbar" aria-label="选择交谈的角色">' + Object.entries(people).map(([id, character]) => btn(character.name, "npc", id,
      (id === person ? 'aria-pressed="true" ' : '') + (state.open < (character.unlock || 0) ? "disabled" : ""))).join("") +
    '</div><section class="encounter scene-market"><div class="encounter-stage"><div class="stage-art">' +
    portrait(activeCharacter().art, "listener") + portrait(person, "speaking") + '</div></div>' +
    speech(npc.name, npc.role, conversation.receipt || (topic === null ? npc.greeting : npc.topics[topic][1])) +
    '<div class="encounter-actions scene-actions">' + npc.topics.map(([question], i) => btn(question, "topic", i, 'aria-pressed="' + (topic === i) + '"')).join("") +
    (person === "vendor" ? "" : btn("查看擂台", "view", "arena")) + '</div></section>' +
    (person !== "vendor" ? "" : '<h2 class="subheading">行商货单</h2>' +
      (state.character === "trader" ? '<p class="hint">桑铃 · 行商折价已计入货单。</p>' : "") + '<div class="cards">' + offers.map(offer => {
      const locked = state.open < offer.unlock;
      const cost = offerCost(offer);
      const ready = !locked && state.coins >= cost && (offer.id !== "clean" || state.corruption > 0);
      return '<article class="card"><h3>' + offer.label + '</h3><p>' + offer.detail + '</p>' +
        btn(locked ? '完成 ' + offer.unlock + ' 项研究后开放' : '购买 · ' + cost + ' 潮印', "buy", offer.id, ready ? "" : "disabled") + '</article>';
    }).join("") + '<article class="card"><h3>收购残渣</h3><p>交付 2 残渣，换取 1 潮印。</p>' +
    btn("出售 · 2 残渣", "sell", "", state.residue >= 2 ? "" : "disabled") + '</article></div>');
}

function fighter(label, value, max, css) {
  return '<div class="fighter ' + css + '"><strong>' + label + '</strong><span>护盾 ' + value + ' / ' + max + '</span>' +
    '<progress max="' + max + '" value="' + value + '" aria-label="' + label + '护盾"></progress></div>';
}

function opponentHit(battle, rival) {
  return enemyElement(battle) ? rival.hit : Math.max(3, rival.hit - 5);
}

function opponentSupplies(battle, character) {
  const types = Object.entries(battle.enemyElements).filter(([,count]) => count);
  return '<div class="duel-intel"><strong>对手剩余要素 · ' + countsTotal(battle.enemyElements) + '</strong>' +
    (character.kind === "research" && types.length ? '<div class="pool-tokens">' +
    types.map(([id,n]) => '<span>' + icon(id) + name(id) + ' ×' + n + '</span>').join("") + '</div>' : "") + '</div>';
}
function preparationScreen() {
  const {rival:id, elements} = state.preparation;
  const rival = rivals.find(candidate => candidate.id === id);
  const total = countsTotal(elements);
  const valid = total === carryLimit && Object.entries(elements).every(([aspect, n]) => n <= amount(aspect));
  const inventory = Object.keys(aspects).filter(aspect => amount(aspect) || elements[aspect]);
  return '<section class="card loadout"><h2>对阵' + rival.name + '</h2><p>从库存挑选恰好 ' + carryLimit +
    ' 份要素，种类不限。耗尽后可再从研究库存调用至多 ' + reserveLimit + ' 份。未用携带要素在结束或退出时退回。</p>' +
    '<div class="loadout-total"><strong>已选 ' + total + ' / ' + carryLimit + '</strong><progress max="' + carryLimit + '" value="' + total + '" aria-label="已选携带要素"></progress></div>' +
    '<div class="loadout-grid">' + inventory.map(aspect => {
      const n = elements[aspect] || 0;
      const label = name(aspect);
      return '<div class="loadout-item"><span>' + icon(aspect) + label + ' <small>库存 ' + amount(aspect) + '</small></span>' +
        '<div>' + btn("−", "load-less", aspect, 'aria-label="减少' + label + '" ' + (!n ? "disabled" : "")) +
        '<b>' + n + '</b>' + btn("＋", "load-more", aspect, 'aria-label="增加' + label + '" ' + (total >= carryLimit || n >= amount(aspect) ? "disabled" : "")) +
        '</div></div>';
    }).join("") + '</div>' +
    (Object.keys(aspects).reduce((count, aspect) => count + amount(aspect), 0) < carryLimit ? '<p>库存不足 8 份。可前往灵气场静置补充。</p>' : "") +
    '<div class="encounter-actions">' + btn(state.battle ? "继续演练" : "开始演练", "start-duel", "", 'class="primary" ' + (valid ? "" : "disabled")) +
    btn("取消配装", "cancel-load") + '</div></section>';
}

function arena() {
  const battle = state.battle;
  const title = heading("炼金演练", "回响擂台", "配装时从库存选取 8 份要素。留意对手的起手，安排每回合的技能与消耗。");
  if (state.preparation) return title + preparationScreen();
  if (battle && !battle.elements && !battle.result) {
    return title + '<div class="workbar">' + btn("为旧演练配置要素", "challenge", battle.rival, 'class="primary"') + btn("退出演练", "leave-duel") + '</div>';
  }
  if (!battle) {
    return title + '<div class="cards">' + rivals.map(rival => {
      const unlocked = state.open >= rival.unlock;
      const won = state.wins.includes(rival.id);
      return '<article class="card rival' + (unlocked ? "" : " locked") + '"><div class="rival-art">' + portrait(rival.id) + '</div><h3>' + rival.name + '</h3>' +
        '<p>' + (unlocked ? '护盾 ' + rival.health + ' · ' + (won ? '已领取首胜奖励' : '首胜 ' + rival.coins + ' 潮印与 2 ' + name(rival.reward)) : '完成 ' + rival.unlock + ' 项研究后开放') + '</p>' +
        btn(won ? "再次配装" : "选择携带要素", "challenge", rival.id, unlocked ? "" : "disabled") + '</article>';
    }).join("") + '</div>';
  }
  const rival = rivals.find(candidate => candidate.id === battle.rival);
  const character = roleOf(battle.character);
  const next = rival.pattern[battle.round % rival.pattern.length];
  const stance = stances[next];
  const cue = duelCue;
  duelCue = null;
  const narration = battle.result || battle.round === 0 ? rival.name : "阵图";
  const line = battle.result ? (battle.enemy ? "停手。你的护盾已经碎了，可以再来一场。" : rival.yieldLine)
    : battle.round === 0 ? rival.entrance : stance.line;
  const detail = battle.result ? battle.result + (battle.prize ? " · " + battle.prize : "") :
    '下一步 · ' + stance.label + (next === "strike" ? '（' + opponentHit(battle,rival) + ' 伤害）' : "") + ' · ' + stance.detail;
  return title + '<section class="encounter scene-duel"><div class="encounter-stage"><div class="duel-stats">' +
    fighter(character.name, battle.player, duelHealth, "player") + fighter(rival.name, battle.enemy, rival.health, "opponent") +
    '</div><div class="stage-art">' + portrait(character.art, (cue ? "cast-" + cue.move + (cue.received ? " struck" : "") : "") + (battle.player ? "" : " fallen")) +
    portrait(rival.id, (cue?.damage ? "recoil" : "") + (battle.enemy ? "" : " fallen")) + '</div>' +
    (cue?.damage ? '<span class="impact foe-impact" aria-hidden="true">−' + cue.damage + '</span>' : "") +
    (cue?.received ? '<span class="impact player-impact" aria-hidden="true">−' + cue.received + '</span>' : "") + '</div>' +
    '<div class="duel-meta"><span>第 ' + (battle.round + 1) + ' 回合</span></div>' +
    speech(narration, "", line, detail) +
    opponentSupplies(battle,character) +
    (battle.result ? '<div class="scene-actions">' + btn("返回擂台", "leave-duel", "", 'class="primary"') + '</div>' : skillPanel(battle)) + (battle.log.length ?
      '<p class="last-action" role="status">' + battle.log[0] + '</p>' + (battle.log.length > 1 ?
      '<details class="duel-history"><summary>先前回合</summary><ol>' + battle.log.slice(1).map(entry => '<li>' + entry + '</li>').join("") + '</ol></details>' : "") : "") +
      '</section>';
}

function buy(value) {
  const offer = offers.find(item => item.id === value);
  if (!offer || state.open < offer.unlock || (value === "clean" && !state.corruption)) return;
  const cost = offerCost(offer);
  if (state.coins < cost) return;
  state.coins -= cost;
  if (value === "ink") state.ink += 8;
  else if (value === "clean") corrupt(-12);
  else {
    know(value);
    add(value, value === "order" ? 3 : 2);
  }
  conversation.receipt = "收好，你的" + offer.label + "。我收下 " + cost + " 枚潮印。";
  update("已购入" + offer.label + "。");
}

function challenge(value) {
  const rival = rivals.find(candidate => candidate.id === value);
  if (!rival || state.open < rival.unlock || (state.battle && (state.battle.elements || state.battle.result || state.battle.rival !== value))) return;
  state.preparation = {rival:value, elements:{}};
  update();
}

function adjustLoad(id, delta) {
  const elements = state.preparation?.elements;
  if (!elements || !Object.hasOwn(aspects, id)) return;
  const next = (elements[id] || 0) + delta;
  if (delta > 0 && (next > amount(id) || countsTotal(elements) >= carryLimit)) return;
  if (next > 0) elements[id] = next;
  else delete elements[id];
  update();
}

function startDuel() {
  const draft = state.preparation;
  if (!draft || countsTotal(draft.elements) !== carryLimit) return;
  const rival = rivals.find(candidate => candidate.id === draft.rival);
  if (!rival || state.open < rival.unlock || Object.entries(draft.elements).some(([id,n]) => amount(id) < n)) return;
  const battle = state.battle || {rival:rival.id, character:state.character, player:duelHealth, enemy:rival.health,
    enemyElements:{...rival.supplies}, researchAt:state.open, round:0, result:null, log:[]};
  for (const [id,n] of Object.entries(draft.elements)) add(id, -n);
  battle.elements = draft.elements;
  state.battle = battle;
  state.preparation = null;
  pickSkill("echo", battle.elements);
  update("与" + rival.name + "的演练开始。");
}

function takeTurn() {
  const battle = state.battle;
  if (!battle?.elements || battle.result) return;
  const plan = skillPlan(battle);
  if (!plan) return;
  const value = skillChoice.id;
  const skill = combatSkills[value];
  const rival = rivals.find(candidate => candidate.id === battle.rival);
  const next = rival.pattern[battle.round % rival.pattern.length];
  const stance = stances[next];
  for (const [id,n] of Object.entries(plan.costs)) {
    if (plan.reserve) add(id, -n);
    else battle.elements[id] -= n;
  }
  if (plan.reserve) battle.borrowed = (battle.borrowed || 0) + countsTotal(plan.costs);
  battle.player -= plan.healthCost;
  const landed = plan.accuracy === 100 || Math.random() * 100 < plan.accuracy;
  if (plan.refund && landed) {
    add(plan.refund,1);
    battle.recovered = true;
  }
  if (plan.steal) {
    battle.enemyElements[plan.steal]--;
    know(plan.steal);
    add(plan.steal,1);
    const chapter = battle.researchAt ?? state.open;
    (state.thefts[chapter] ??= []).push(rival.id);
  }
  battle.player = clamp(battle.player + plan.heal, duelHealth);
  const damage = landed && plan.power ? Math.max(0, plan.power + stance.opening - (stance.shield ?? rival.shield)) : 0;
  battle.enemy = clamp(battle.enemy - damage, rival.health);
  const strikes = battle.enemy && next === "strike";
  const received = strikes ? Math.max(0, opponentHit(battle,rival) - plan.shield) : 0;
  const enemySpent = strikes && enemyElement(battle);
  if (enemySpent) battle.enemyElements[enemySpent]--;
  battle.player = clamp(battle.player - received, duelHealth);
  duelCue = {move:value, damage, received};
  const used = Object.entries(plan.costs).map(([id,n]) => name(id) + " ×" + n).join("、");
  battle.log = ['第 ' + (battle.round + 1) + ' 回合 · ' + skill.label + '对' + stance.label + '，' +
    (landed ? '造成 ' + damage + ' 伤害' : '攻击落空') + '，受到 ' + received + ' 伤害。' +
    (used ? (plan.reserve ? ' 从研究库存消耗 ' : ' 消耗 ') + used + '。' : "") +
    (plan.healthCost ? ' 血刻消耗 ' + plan.healthCost + ' 护盾。' : "") +
    (plan.refund && landed ? ' 回收 ' + name(plan.refund) + ' ×1。' : "") +
    (plan.steal ? ' 夺取 ' + name(plan.steal) + ' ×1，已存入研究库存。' : "") +
    (plan.heal ? ' 回护 +' + plan.heal + '。' : ""), ...battle.log].slice(0, 5);

  if (!battle.enemy) {
    releaseElements(battle);
    battle.result = "演练获胜";
    if (state.wins.includes(rival.id)) return update("演练获胜，首次奖励已领取。");
    state.wins.push(rival.id);
    state.coins += rival.coins;
    know(rival.reward);
    add(rival.reward, 2);
    battle.prize = "首胜获得 " + rival.coins + " 潮印和 2 " + name(rival.reward);
    return update(battle.prize + "。");
  }
  if (!battle.player) {
    releaseElements(battle);
    battle.result = "护盾已破裂";
    return update("演练结束，可以重新挑战。");
  }
  battle.round++;
  update();
}

function actEncounter(action, value) {
  if (state.view === "market") {
    switch (action) {
      case "npc":
        if (!Object.hasOwn(people, value) || state.open < (people[value].unlock || 0)) return;
        conversation = {person:value, topic:null};
        return update();
      case "topic":
        if (!people[conversation.person].topics[value]) return;
        conversation.topic = Number(value);
        conversation.receipt = null;
        return update();
      case "buy": return buy(value);
      case "sell":
        if (state.residue < 2) return;
        state.residue -= 2;
        state.coins++;
        conversation.receipt = "两份残渣，换一枚潮印。它们还能照一段夜路。";
        return update("卖出 2 残渣，获得 1 潮印。");
    }
  }
  if (state.view !== "arena") return;
  switch (action) {
    case "challenge": return challenge(value);
    case "load-more": return adjustLoad(value, 1);
    case "load-less": return adjustLoad(value, -1);
    case "cancel-load": state.preparation = null; return update();
    case "start-duel": return startDuel();
    case "skill-pick":
      if (!state.battle?.elements) return;
      pickSkill(value, battleSupply(state.battle).pool);
      return update();
    case "skill-primary": {
      if (!state.battle?.elements) return;
      const count = battleSupply(state.battle).pool[value];
      if (!count) return;
      skillChoice.primary = value;
      if (skillChoice.secondary === value) skillChoice.secondary = null;
      if (count < skillChoice.units) skillChoice.units = combatSkills[skillChoice.id].min;
      return update();
    }
    case "skill-secondary":
      if (!state.battle?.elements || !battleSupply(state.battle).pool[value] || skillChoice.primary === value) return;
      skillChoice.secondary = value;
      return update();
    case "skill-units": skillChoice.units = Number(value); return update();
    case "skill-overcast": skillChoice.overcast = !skillChoice.overcast; return update();
    case "skill-cast": return takeTurn();
    case "leave-duel": {
      const ended = state.battle?.result;
      if (state.battle) releaseElements(state.battle);
      state.preparation = null;
      state.battle = null;
      return update(ended ? "已返回擂台。" : "已退出演练。");
    }
  }
}
