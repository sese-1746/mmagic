"use strict";

const carryLimit = 8;
const reserveLimit = 3;

const combatSkills = {
  echo: {label:"试探", tier:0, min:0, max:0, power:3},
  brace: {label:"守势", tier:0, min:0, max:0, shield:7},
  pulse: {label:"脉冲", tier:1, min:1, max:1, power:7, accuracy:88},
  burst: {label:"共鸣", tier:2, min:2, max:4, power:6, scaling:3, accuracy:82},
  mend: {label:"回护", tier:2, min:1, max:2, healing:6},
  weave: {label:"交织", tier:3, min:2, max:2, extra:2, power:20, accuracy:76},
  snatch: {label:"夺素", tier:0, min:0, max:0, steal:true}
};
const skillTiers = ["基础", "Ⅰ", "Ⅱ", "Ⅲ"];
let skillChoice = {id:"echo", primary:null, secondary:null, units:0};

const enemyElement = battle => Object.keys(battle.enemyElements).find(id => battle.enemyElements[id] > 0);
const stoleFrom = battle => (state.thefts[battle.researchAt ?? state.open] || []).includes(battle.rival);

function countsTotal(counts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function battleSupply(battle) {
  if (countsTotal(battle.elements)) return {pool:battle.elements, reserve:false};
  const quota = Math.max(0, reserveLimit - (battle.borrowed || 0));
  const pool = Object.fromEntries(Object.keys(aspects).filter(id => quota && amount(id)).map(id => [id, Math.min(quota, amount(id))]));
  return {pool, reserve:true, quota};
}

function skillDescription(skill) {
  if (skill.steal) return "夺取 1 份对手要素 · 消耗一回合";
  const cost = !skill.min ? "零消耗" : skill.extra ? skill.min + " 主 + " + skill.extra + " 副" :
    (skill.min === skill.max ? skill.min : skill.min + "–" + skill.max) + " 份同种要素";
  const effect = skill.healing ? "每份恢复 " + skill.healing : skill.shield ? "抵消 " + skill.shield + " 伤害" :
    skill.scaling ? "威力 " + (skill.power + skill.min * skill.scaling) + "–" + (skill.power + skill.max * skill.scaling) : "威力 " + skill.power;
  return effect + " · " + cost;
}

function attackPreview(skill, battle, effects) {
  const trained = Boolean(skill.accuracy && roleOf(battle.character).kind === "combat");
  const overcast = trained && skillChoice.overcast;
  const bloodCost = 4 - effects.bloodDiscount;
  return {
    trained, overcast,
    bloodCost,
    accuracy:Math.min(100, (skill.accuracy || 100) + (trained ? 12 : 0) + (skill.accuracy ? effects.accuracy : 0)),
    healthCost:overcast ? bloodCost : 0,
    power:skill.power ? skill.power + (skill.scaling || 0) * skillChoice.units + (trained ? 2 : 0) +
      (overcast ? 6 : 0) + (skill.accuracy ? effects.power : 0) : 0
  };
}

function pickSkill(id, pool) {
  const skill = combatSkills[id];
  if (!skill) return;
  const types = Object.keys(pool).filter(key => pool[key] > 0);
  const primary = types.find(key => pool[key] >= skill.min) || types[0];
  skillChoice = {id, primary, secondary:types.find(key => key !== primary && pool[key] >= (skill.extra || 1)), units:skill.min};
}

function skillPlan(battle) {
  const {id, primary, secondary, units} = skillChoice;
  const skill = combatSkills[id];
  const role = roleOf(battle.character);
  const effects = weaponEffects(battle.weapon,battle.character);
  const attack = attackPreview(skill,battle,effects);
  if (attack.healthCost >= battle.player) return null;
  if (skill.steal && (role.kind !== "exploration" || stoleFrom(battle) || !enemyElement(battle))) return null;
  const {pool,reserve,quota} = battleSupply(battle);
  const costs = {};
  if (skill.min) {
    if (!primary || units < skill.min || units > skill.max || (pool[primary] || 0) < units) return null;
    costs[primary] = units;
  }
  if (skill.extra) {
    if (!secondary || primary === secondary || (pool[secondary] || 0) < skill.extra) return null;
    costs[secondary] = skill.extra;
  }
  if (reserve && countsTotal(costs) > quota) return null;
  if (skill.healing && battle.player >= duelHealth) return null;
  return {
    costs, reserve, ...attack,
    steal:skill.steal ? enemyElement(battle) : null,
    refund:skill.min && role.kind === "research" && !battle.recovered ? primary : null,
    refundUnits:Math.min(units,1 + effects.recovery),
    heal:skill.healing ? skill.healing * units + effects.healing : 0,
    shield:skill.shield ? skill.shield + effects.guard : skill.steal ? effects.stealGuard : 0
  };
}

function skillPanel(battle) {
  const {pool,reserve,quota} = battleSupply(battle);
  const chosen = combatSkills[skillChoice.id];
  const plan = skillPlan(battle);
  const attack = attackPreview(chosen,battle,weaponEffects(battle.weapon,battle.character));
  const eligible = Object.entries(combatSkills).filter(([, skill]) => !skill.steal || roleOf(battle.character).kind === "exploration");
  const supplies = Object.entries(pool).filter(([, n]) => n > 0);
  const tokens = !reserve ? supplies.map(([id, n]) => '<span>' + icon(id) + name(id) + ' ×' + n + '</span>').join("") : "";
  const picker = (label, action, selected, excluded) => '<div class="skill-picker"><span>' + label + '</span>' +
    supplies.filter(([id]) => id !== excluded).map(([id,n]) => btn(icon(id) + name(id) + ' ' + n, action, id, 'aria-pressed="' + (id === selected) + '"')).join("") + '</div>';
  const choices = !chosen.min ? "" : picker(chosen.extra ? "主元素" : "施法元素", "skill-primary", skillChoice.primary) +
    (chosen.extra ? picker("副元素", "skill-secondary", skillChoice.secondary, skillChoice.primary) : "") +
    (chosen.min === chosen.max ? "" : '<div class="skill-picker"><span>消耗数量</span>' +
      Array.from({length:chosen.max-chosen.min+1}, (_, i) => i + chosen.min).map(n => btn(String(n), "skill-units", n,
        'aria-pressed="' + (n === skillChoice.units) + '" ' + ((pool[skillChoice.primary] || 0) < n ? "disabled" : ""))).join("") + '</div>');
  return '<div class="skill-panel"><div class="duel-pool"><strong>携带要素 · ' + countsTotal(battle.elements) + ' / ' + carryLimit + '</strong>' +
    (tokens ? '<div class="pool-tokens">' + tokens + '</div>' : '<p class="muted">携带要素已耗尽。研究库存本场还可调用 ' + quota + ' / ' + reserveLimit + ' 份。</p>') +
    '</div>' +
    '<div class="skill-grid">' + eligible.map(([id, skill]) => btn('<strong>' + skill.label + ' · ' + skillTiers[skill.tier] +
      '</strong><small>' + skillDescription(skill) + '</small>', "skill-pick", id, 'class="move" aria-pressed="' + (id === skillChoice.id) + '"')).join("") +
    '</div><div class="skill-config">' + choices +
    (chosen.accuracy ? '<p class="muted">本次威力 ' + attack.power + ' · 命中率 ' + attack.accuracy + '%</p>' : "") +
    (plan?.heal ? '<p class="muted">本次回护恢复 ' + plan.heal + ' 护盾</p>' : "") +
    (plan?.shield ? '<p class="muted">本回合可抵消 ' + plan.shield + ' 点伤害</p>' : "") +
    (plan?.refund && plan.refundUnits > 1 ? '<p class="muted">摹痕 · 成功时可返还 ' + plan.refundUnits + ' 份' + name(plan.refund) + '</p>' : "") +
    (attack.trained ? btn("血刻 · 失去 " + attack.bloodCost + " 护盾，威力再 +6", "skill-overcast", "", 'aria-pressed="' + Boolean(skillChoice.overcast) + '" ' +
      (battle.player <= attack.bloodCost && !skillChoice.overcast ? "disabled" : "")) : "") +
    (!plan ? '<p class="muted">' + (chosen.steal ? "对手没有剩余要素，或本研究进度已从该对手夺取过。" :
      attack.healthCost >= battle.player ? "护盾不足以支付血刻。" : chosen.healing && battle.player >= duelHealth ? "护盾已满。" :
      "所选要素或调用额度不足。交织需要两种不同的要素。") + '</p>' : "") +
    '<div class="encounter-actions">' + btn(chosen.steal ? "夺取要素" : chosen.min ? "施放" + chosen.label : "使用" + chosen.label, "skill-cast", "", 'class="primary" ' + (plan ? "" : "disabled")) +
    btn("退出演练", "leave-duel") + '</div></div></div>';
}

function releaseElements(battle) {
  for (const [id, count] of Object.entries(battle.elements || {})) add(id, count);
  battle.elements = {};
}
