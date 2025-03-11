// const start = async () => {
//     const { page, browser } = await connect({})
// }
const createSchema = require("./schema.js");
const { connect } = require("puppeteer-real-browser");

const links = [
  "https://www.bet365.com/#/AC/B1/C1/D8/E170044339/F3/I8/",
  "https://www.bet365.com/#/AC/B1/C1/D8/E170231829/F3/I8/",
];

const idletime = 15000; // in millisecond

async function run() {
  const { browser, page } = await connect({
    defaultViewport: null,
    headless: false,

    args: [],
    customConfig: {},

    turnstile: true,

    connectOption: {
      defaultViewport: null,
    },
    disableXvfb: false,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
  });

  for (let i = 0; i < links.length; i++) {
    console.log(`Opening: ${links[i]}`);
    const page = await browser.newPage();

    try {
      await page.goto(links[i], { waitUntil: "networkidle2" });

      await new Promise((res) => setTimeout(res, idletime)); // Wait for 15 sec

      await page.waitForSelector("body");
      //   console.log("Body found");

      const html = await page.content();
      console.log("HTML loaded");

      createSchema(html, `data_${i}.json`); // Save with unique filename
      console.log(`Data saved for: ${links[i]}`);
    } catch (error) {
      console.error(`Error processing ${links[i]}:`, error);
    } finally {
      await page.close();
    }
  }
  //   await browser.cookies();
}

run();
