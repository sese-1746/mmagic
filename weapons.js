"use strict";

const defaultWeapon = "copper";
const weapons = {
  copper: {name:"铜芯短杖", stars:3, stats:{power:1}},
  reed: {name:"青藤护杖", stars:3, stats:{guard:2}},
  prism: {name:"棱镜仪杖", stars:4, stats:{power:1, accuracy:7},
    requirement:"完成 3 项研究", unlocked:() => state.open >= 3},
  watch: {name:"巡夜环杖", stars:4, stats:{guard:3, healing:2},
    requirement:"赢得任意一场演练", unlocked:() => state.wins.length > 0},
  margin: {name:"无字批注", stars:5, stats:{power:2, accuracy:4},
    requirement:"完成 6 项研究", unlocked:() => state.open >= 6,
    signature:{role:"scholar", name:"摹痕", detail:"每场首次回收可返还最多 2 份同种主耗材，返还量以实际消耗为限。", stats:{recovery:1}}},
  brand: {name:"朱砂回印", stars:5, stats:{power:2, accuracy:5},
    requirement:"击败灰炉巡卫", unlocked:() => state.wins.includes("kiln"),
    signature:{role:"duelist", name:"回印", detail:"使用血刻时只消耗 2 点护盾。", stats:{bloodDiscount:2}}},
  scale: {name:"等潮秤", stars:5, stats:{power:1, accuracy:6},
    requirement:"累计完成 3 次旅行", unlocked:() => Object.values(state.travelHistory).reduce((total, routes) => total + routes.length, 0) >= 3,
    signature:{role:"trader", name:"平砝", detail:"守势额外抵消 2 点伤害。", stats:{guard:2}}},
  compass: {name:"岔路仪", stars:5, stats:{power:2, accuracy:3},
    requirement:"完成倒影裂谷岸考察", unlocked:() => Object.values(state.travelHistory).some(routes => routes.includes("mirrorbank")),
    signature:{role:"wanderer", name:"侧步", detail:"夺素当回合抵消最多 4 点伤害。", stats:{stealGuard:4}}}
};
const weaponNames = {
  power:"攻击法术威力", accuracy:"攻击法术命中率", guard:"守势减伤", healing:"回护恢复"
};
const weaponAvailable = weapon => !weapon.unlocked || weapon.unlocked();

function equippedWeapon(character) {
  return state.gear[character] || defaultWeapon;
}

function weaponEffects(id, character) {
  const weapon = weapons[id];
  const effects = {power:0, accuracy:0, guard:0, healing:0, recovery:0, bloodDiscount:0, stealGuard:0};
  if (!weapon) return effects;
  Object.assign(effects,weapon.stats);
  if (weapon.signature?.role === character) {
    for (const [stat,bonus] of Object.entries(weapon.signature.stats)) effects[stat] += bonus;
  }
  return effects;
}

function weaponLabel(id, character) {
  const weapon = weapons[id];
  return weapon ? weapon.name + ' · ' + weapon.stars + '★' +
    (weapon.signature?.role === character ? " · 专属激活" : "") : "未装备";
}

function armory() {
  const character = activeCharacter();
  const cannotEquip = Boolean(state.battle && !state.battle.result);
  const equipped = equippedWeapon(state.character);
  const header = heading("装备", "炼金武器库", "为当前角色装备武器。五星武器的基础属性对所有角色生效，专属效果只对对应角色生效。");
  return header + '<div class="workbar weapon-current"><strong>' + character.name + ' · ' + weaponLabel(equipped,state.character) + '</strong>' +
    (cannotEquip ? '<span>演练结束或退出后可更换装备。</span>' : btn("切换角色", "view", "roster")) + '</div>' +
    [3,4,5].map(stars => '<section class="weapon-group"><h2>' + stars + '★ ' + (stars === 5 ? "专属武器" : "武器") + '</h2><div class="weapon-grid">' +
      Object.entries(weapons).filter(([,weapon]) => weapon.stars === stars).map(([id,weapon]) => {
        const available = weaponAvailable(weapon);
        const wearing = equipped === id;
        const matches = weapon.signature?.role === state.character;
        return '<article class="weapon-card stars-' + stars + (wearing ? ' equipped' : '') + (available ? '' : ' locked') + '">' +
          '<div class="weapon-art"><img src="assets/weapons/' + id + '.webp" alt="" width="230" height="200"></div><div class="weapon-copy">' +
          '<h3>' + weapon.name + '</h3><p>' + Object.entries(weapon.stats).map(([stat,n]) => weaponNames[stat] + ' +' + n +
            (stat === "accuracy" ? ' 个百分点' : '')).join(" · ") + '</p>' +
          (weapon.signature ? '<div class="weapon-signature"><strong>' + weapon.signature.name + ' · ' + roleOf(weapon.signature.role).name + '专属</strong>' +
            '<p>' + weapon.signature.detail + '</p><span>' + (matches ? "当前角色可激活" : "当前角色仅获得基础属性") + '</span></div>' : '') +
          (!available ? '<p class="weapon-requirement">解锁条件 · ' + weapon.requirement + '</p>' : '') +
          btn(wearing ? "已装备" : available ? "装备" + weapon.name : "尚未解锁", "equip-weapon", id, wearing || !available || cannotEquip ? "disabled" : 'class="primary"') +
          '</div></article>';
      }).join("") + '</div></section>').join("");
}

function equipWeapon(id) {
  if (!Object.hasOwn(weapons,id) || !weaponAvailable(weapons[id]) || (state.battle && !state.battle.result)) return;
  state.gear[state.character] = id;
  update(activeCharacter().name + "已装备「" + weapons[id].name + "」。");
}
