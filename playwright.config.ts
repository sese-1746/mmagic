import {defineConfig,devices} from "@playwright/test";

const channel=process.env.PLAYWRIGHT_CHANNEL;
const command=process.env.PLAYWRIGHT_PREVIEW ? "preview" : "dev";
export default defineConfig({
  testDir:"./tests",
  workers:2,
  use:{baseURL:"http://127.0.0.1:8770",channel,trace:"retain-on-failure"},
  projects:[
    {name:"desktop",use:{...devices["Desktop Chrome"],channel}},
    {name:"touch",use:{...devices["Pixel 7"],channel}}
  ],
  webServer:{command:"node node_modules/vite/bin/vite.js "+command+" --host 127.0.0.1 --port 8770 --strictPort",
    url:"http://127.0.0.1:8770",reuseExistingServer:!process.env.CI}
});
