"use strict";

const people = {
  vendor: {name: "收灯人·岑", rune: "◇", role: "行商", greeting: "灯油剩得不多了。你带的是新笔记，还是能换货的潮印？", topics: [
    ["潮印从哪里来？", "每份新研究归档后，书库会盖两枚潮印。擂台首胜也有奖赏。我还收存研究留下的残渣。"],
    ["为什么收集残渣？", "残渣在掌心会指向最近的水脉。我把它们装进灯罩，赶夜路时就不会走进干涸的井。"]
  ]},
  keeper: {name: "守阵人·黎", rune: "⬡", role: "演练导师", greeting: "脚跟离开铜圈就算输。抬头看我的起手，阵图会比我先告诉你下一招。", topics: [
    ["起手动作怎么看？", "对手准备重击时，用守势截住冲击并积蓄灵息。等对手蓄势露出破绽，再把灵息用在共鸣上。"],
    ["输掉会怎样？", "铜圈会接住破碎的护盾。可以马上重试，你的要素和潮印都留在身上。"]
  ]},
  echo: {name: "镜中旅人", rune: "◌", role: "裂谷挑战者", unlock: 8, greeting: "我从镜子的另一边来。你以为回声总是慢一步？试试先等我出招。", topics: [
    ["你为什么留在裂谷？", "这面镜子照得见归途，却照不见归人。我在等灯塔重新亮起。"],
    ["你的阵有什么弱点？", "映出护壁时，镜面会卸走大半伤害。等它聚光再出手，裂纹就会落在同一处。"]
  ]}
};

const offers = [
  {id:"ink", label:"雾港墨囊", detail:"获得 8 墨水", cost:2, unlock:0},
  {id:"mist", label:"铜瓶凝雾", detail:"获得 2 雾", cost:2, unlock:0},
  {id:"order", label:"秩序石片", detail:"获得 3 秩序", cost:3, unlock:0},
  {id:"frost", label:"凝霜匣", detail:"获得 2 霜", cost:3, unlock:5},
  {id:"clean", label:"净化灯芯", detail:"降低 12% 腐化", cost:4, unlock:4}
];

const stances = {
  gather:{label:"蓄势", detail:"攻击伤害增加 3", damage:0, shield:0, opening:3},
  strike:{label:"冲击", detail:"用守势削减伤害", shield:0, opening:0},
  guard:{label:"护壁", detail:"抵消部分伤害，可趁机恢复", damage:0, opening:0}
};
const rivals = [
  {id:"keeper", name:"守阵人·黎", rune:"⬡", health:24, hit:7, shield:4, unlock:0, coins:4, reward:"mist", pattern:["gather","strike","guard"]},
  {id:"kiln", name:"灰炉巡卫", rune:"✦", health:35, hit:10, shield:6, unlock:4, coins:6, reward:"glass", pattern:["guard","strike","gather","strike"]},
  {id:"echo", name:"镜中旅人", rune:"◌", health:44, hit:12, shield:8, unlock:8, coins:8, reward:"prism", pattern:["gather","strike","guard","strike","gather"]}
];
const moves = {
  pulse:{label:"脉冲", detail:"造成 5 伤害", cost:0, damage:5},
  brace:{label:"守势", detail:"抵消至多 8 伤害，积蓄 2 灵息", cost:0},
  burst:{label:"共鸣", detail:"造成 14 伤害，消耗 2 灵息", cost:2, damage:14},
  mend:{label:"回护", detail:"恢复 8 护盾，消耗 1 灵息", cost:1}
};
const duelHealth = 26;
let conversation = {person:"vendor", topic:null};

function market() {
  const {person, topic} = conversation;
  const npc = people[person];
  return heading("余潮书库", "行旅驿站", "与旅人交谈，或用研究和首胜获得的潮印购买补给。") +
    '<div class="workbar" aria-label="选择交谈的角色">' + Object.entries(people).map(([id, character]) => btn(character.name, "npc", id,
      (id === person ? 'aria-pressed="true" ' : '') + (state.open < (character.unlock || 0) ? "disabled" : ""))).join("") +
    '</div><article class="card conversation"><span class="portrait" aria-hidden="true">' + npc.rune + '</span><div><div class="eyebrow">' + npc.role +
    '</div><h2>' + npc.name + '</h2><blockquote aria-live="polite">' + (topic === null ? npc.greeting : npc.topics[topic][1]) +
    '</blockquote><div class="encounter-actions">' + npc.topics.map(([question], i) => btn(question, "topic", i, 'aria-pressed="' + (topic === i) + '"')).join("") +
    (person === "vendor" ? "" : btn("查看擂台", "view", "arena")) + '</div></div></article>' +
    (person !== "vendor" ? "" : '<h2 class="subheading">行商货单</h2><div class="cards">' + offers.map(offer => {
      const locked = state.open < offer.unlock;
      const ready = !locked && state.coins >= offer.cost && (offer.id !== "clean" || state.corruption > 0);
      return '<article class="card"><h3>' + offer.label + '</h3><p>' + offer.detail + '</p>' +
        btn(locked ? '完成 ' + offer.unlock + ' 项研究后开放' : '购买 · ' + offer.cost + ' 潮印', "buy", offer.id, ready ? "" : "disabled") + '</article>';
    }).join("") + '<article class="card"><h3>收购残渣</h3><p>交付 2 残渣，换取 1 潮印。</p>' +
    btn("出售 · 2 残渣", "sell", "", state.residue >= 2 ? "" : "disabled") + '</article></div>');
}

function fighter(label, value, max, css) {
  return '<div class="fighter ' + css + '"><strong>' + label + '</strong><span>护盾 ' + value + ' / ' + max + '</span>' +
    '<progress max="' + max + '" value="' + value + '" aria-label="' + label + '护盾"></progress></div>';
}

function arena() {
  const battle = state.battle;
  const title = heading("炼金演练", "回响擂台", "观察对手下一步的动作，再决定攻击、守势或恢复。演练无需消耗库存要素。");
  if (!battle) {
    return title + '<div class="cards">' + rivals.map(rival => {
      const unlocked = state.open >= rival.unlock;
      const won = state.wins.includes(rival.id);
      return '<article class="card rival"><span class="portrait" aria-hidden="true">' + rival.rune + '</span><h3>' + rival.name + '</h3>' +
        '<p>' + (unlocked ? '护盾 ' + rival.health + ' · ' + (won ? '已领取首胜奖励' : '首胜 ' + rival.coins + ' 潮印与 2 ' + name(rival.reward)) : '完成 ' + rival.unlock + ' 项研究后开放') + '</p>' +
        btn(won ? "再次演练" : "发起演练", "challenge", rival.id, unlocked ? "" : "disabled") + '</article>';
    }).join("") + '</div>';
  }
  const rival = rivals.find(candidate => candidate.id === battle.rival);
  const next = rival.pattern[battle.round % rival.pattern.length];
  const stance = stances[next];
  return title + '<div class="duel"><div class="duel-stats">' +
    fighter("解析者", battle.player, duelHealth, "player") + fighter(rival.name, battle.enemy, rival.health, "opponent") +
    '</div><div class="duel-meta"><span>第 ' + (battle.round + 1) + ' 回合</span><span>灵息 ' + battle.charge + ' / 4</span></div>' +
    '<div class="intent"><strong>' + (battle.result || stance.label + (next === "strike" ? ' · ' + rival.hit + ' 伤害' : '')) +
    '</strong>' + (battle.result ? (battle.prize ? '<span>' + battle.prize + '</span>' : "") : '<span>' + stance.detail + '</span>') + '</div>' +
    '<div class="encounter-actions">' + (battle.result ? btn("返回擂台", "leave-duel", "", 'class="primary"') :
      Object.entries(moves).map(([id, move]) => btn('<strong>' + move.label + '</strong><small>' + move.detail + '</small>', "move", id,
        'class="move" ' + (battle.charge < move.cost || (id === "mend" && battle.player === duelHealth) ? "disabled" : ""))).join("") +
      btn("退出演练", "leave-duel")) + '</div><ol class="duel-log" aria-live="polite" aria-label="演练记录">' +
    battle.log.map(line => '<li>' + line + '</li>').join("") + '</ol></div>';
}

function buy(value) {
  const offer = offers.find(item => item.id === value);
  if (!offer || state.open < offer.unlock || state.coins < offer.cost || (value === "clean" && !state.corruption)) return;
  state.coins -= offer.cost;
  if (value === "ink") state.ink += 8;
  else if (value === "clean") corrupt(-12);
  else {
    know(value);
    add(value, value === "order" ? 3 : 2);
  }
  update("已购入" + offer.label + "。");
}

function challenge(value) {
  const rival = rivals.find(candidate => candidate.id === value);
  if (!rival || state.open < rival.unlock || state.battle) return;
  state.battle = {rival:value, player:duelHealth, enemy:rival.health, charge:0, round:0, result:null, log:[]};
  update("与" + rival.name + "的演练开始。");
}

function takeTurn(value) {
  const battle = state.battle;
  if (!battle || battle.result || !Object.hasOwn(moves, value)) return;
  const move = moves[value];
  if (battle.charge < move.cost || (value === "mend" && battle.player === duelHealth)) return;

  const rival = rivals.find(candidate => candidate.id === battle.rival);
  const next = rival.pattern[battle.round % rival.pattern.length];
  const stance = stances[next];
  battle.charge -= move.cost;
  if (value === "brace") battle.charge = clamp(battle.charge + 2, 4);
  if (value === "mend") battle.player = clamp(battle.player + 8, duelHealth);
  const damage = move.damage ? Math.max(0, move.damage + stance.opening - (stance.shield ?? rival.shield)) : 0;
  battle.enemy = clamp(battle.enemy - damage, rival.health);
  const received = battle.enemy && next === "strike" ? Math.max(0, rival.hit - (value === "brace" ? 8 : 0)) : 0;
  battle.player = clamp(battle.player - received, duelHealth);
  battle.log = ['第 ' + (battle.round + 1) + ' 回合 · ' + move.label + '对' + stance.label + '，造成 ' + damage + ' 伤害，受到 ' + received + ' 伤害。', ...battle.log].slice(0, 5);

  if (!battle.enemy) {
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
        return update();
      case "buy": return buy(value);
      case "sell":
        if (state.residue < 2) return;
        state.residue -= 2;
        state.coins++;
        return update("卖出 2 残渣，获得 1 潮印。");
    }
  }
  if (state.view !== "arena") return;
  switch (action) {
    case "challenge": return challenge(value);
    case "move": return takeTurn(value);
    case "leave-duel": {
      const ended = state.battle?.result;
      state.battle = null;
      return update(ended ? "已返回擂台。" : "已退出演练。");
    }
  }
}
