import {test,expect,type Page} from "@playwright/test";

const button = (page:Page,name:string) => page.getByRole("button",{name,exact:true});
async function start(page:Page) {
  await page.goto("/");
  await button(page,"开始旅程").click();
  await expect(page.locator("#workspace")).toBeVisible();
}

test("主菜单、暂停及设置可用，研究 HUD 正常更新",async({page})=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
  await start(page);
  await expect(page.locator("#game-stage canvas")).toBeVisible();
  await button(page,"读阵").click();
  await expect(page.getByText(/青框槽位放入「雾」/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("游戏已暂停");
  await button(page,"设置").click();
  await page.getByLabel("战斗音效").uncheck();
  await page.getByLabel("动效").selectOption("reduced");
  await button(page,"完成").click();
  await button(page,"返回主菜单").click();
  await expect(button(page,"继续旅程")).toBeVisible();
  await button(page,"继续旅程").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduced");
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("窄屏触摸可装备武器并返回主菜单",async({page,isMobile})=>{
  await start(page);
  const armory=button(page,"武器库");
  if (isMobile) await armory.tap();
  else await armory.click();
  await expect(page.getByRole("heading",{name:"炼金武器库"})).toBeVisible();
  await expect(page.locator(".weapon-card")).toHaveCount(8);
  await expect(page.locator(".weapon-art img").first()).toHaveJSProperty("naturalWidth",230);
  const equip=button(page,"装备青藤护杖");
  if (isMobile) {
    const box=await equip.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await equip.tap();
  } else await equip.click();
  await expect(page.locator(".weapon-current")).toContainText("青藤护杖");
  await button(page,"暂停").click();
  await button(page,"返回主菜单").click();
  await button(page,"继续旅程").click();
  await expect(page.locator(".weapon-current")).toContainText("青藤护杖");
});

test("美术缺失时显示提示并继续运行",async({page})=>{
  await page.route("**/assets/menu.webp",route=>route.abort());
  await start(page);
  await expect(page.getByText("部分美术资源未能加载。可继续游玩。")).toBeVisible();
  await expect(page.getByRole("heading",{name:"潮声入纸"})).toBeVisible();
});

test("败北后可重新配装，重开存档需要确认",async({page})=>{
  await page.addInitScript(()=>{
    if (!localStorage.getItem("aether-fragment-v1")) localStorage.setItem("aether-fragment-v1",JSON.stringify({
      open:0,chapter:0,view:"arena",battle:{rival:"keeper",character:"scholar",weapon:"copper",player:1,enemy:24,round:1,result:null,log:[],elements:{wind:2},enemyElements:{wind:4}}
    }));
  });
  await page.goto("/");
  await button(page,"继续旅程").click();
  await button(page,"使用试探").click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("护盾已破裂");
  await button(page,"重新配装").click();
  await expect(page.getByRole("heading",{name:"对阵守阵人·黎"})).toBeVisible();
  await button(page,"暂停").click();
  await button(page,"返回主菜单").click();
  await button(page,"开始新存档").click();
  await button(page,"取消").click();
  await expect(button(page,"继续旅程")).toBeVisible();
  await button(page,"开始新存档").click();
  await button(page,"清除进度并开始").click();
  await expect(page.getByRole("heading",{name:"潮声入纸"})).toBeVisible();
});

test("其他角色可装备五星，专属效果仅对对应角色生效",async({page})=>{
  await page.addInitScript(()=>{
    if (!localStorage.getItem("aether-fragment-v1")) localStorage.setItem("aether-fragment-v1",JSON.stringify({
      open:4,chapter:4,wins:["kiln"],view:"armory"
    }));
  });
  await page.goto("/");
  await button(page,"继续旅程").click();
  const weapon=page.locator(".weapon-card").filter({has:page.getByRole("heading",{name:"朱砂回印",exact:true})});
  await expect(weapon).toContainText("当前角色仅获得基础属性");
  await button(page,"装备朱砂回印").click();
  await expect(page.locator(".weapon-current")).toContainText("闻汐 · 朱砂回印");
  await button(page,"切换角色").click();
  await button(page,"选择陆砚").click();
  await button(page,"武器库").click();
  await expect(weapon).toContainText("当前角色可激活");
  await button(page,"装备朱砂回印").click();
  await expect(page.locator(".weapon-current")).toContainText("专属激活");
  await button(page,"回响擂台").click();
  await page.locator('[data-action="challenge"][data-value="keeper"]').click();
  for (const name of ["增加风","增加水"]) for (let i=0;i<4;i++) await button(page,name).click();
  await button(page,"开始演练").click();
  await page.locator('[data-action="skill-pick"][data-value="pulse"]').click();
  await button(page,"血刻 · 失去 2 护盾，威力再 +6").click();
  await button(page,"施放脉冲").click();
  await expect(page.getByText(/血刻消耗 2 护盾/)).toBeVisible();
  await expect(page.getByLabel("陆砚护盾")).toHaveJSProperty("value",24);
});
