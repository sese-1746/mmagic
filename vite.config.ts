import {readdirSync, readFileSync} from "node:fs";
import {defineConfig} from "vite";

const systemFiles = ["world.js","weapons.js","combat-skills.js","encounters.js","travel.js","game.js"];
const cssArtwork = new Set(["hall.webp","alchemy.webp","travel.webp"]);

export default defineConfig({
  base: "./",
  server: {port:8766,strictPort:true},
  build: {chunkSizeWarningLimit:1600},
  plugins: [{
    name: "package-game-data",
    generateBundle() {
      for (const file of systemFiles) {
        this.emitFile({type:"asset", fileName:file, source:readFileSync(file)});
      }
      for (const entry of readdirSync("assets",{recursive:true,withFileTypes:true})) {
        if (!entry.isFile() || !entry.name.endsWith(".webp") || cssArtwork.has(entry.name)) continue;
        const fileName = entry.parentPath.replaceAll("\\","/") + "/" + entry.name;
        this.emitFile({type:"asset",fileName,source:readFileSync(fileName)});
      }
    }
  }]
});
