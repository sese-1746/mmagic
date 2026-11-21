export const viewport = {width:1280,height:720};
export const saveKey = "aether-fragment-v1";
export const settingsKey = "aether-fragment-settings-v1";
export const systemScripts = ["world.js","weapons.js","combat-skills.js","encounters.js","travel.js","game.js"];
export const coverPath = import.meta.env.BASE_URL + "assets/menu.webp";

export type Preferences = {sound:boolean; motion:"system"|"reduced"};
export const defaultPreferences:Preferences = {sound:true,motion:"system"};
export type GameMode = "boot"|"menu"|"play"|"pause"|"gameover"|"settings";
