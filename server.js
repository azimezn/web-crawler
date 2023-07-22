const axios = require("axios");
const axiosRetry = require("axios-retry");
const cheerio = require("cheerio");
// puppeteer is needed because content is loading dynamically, i need to scroll for more content
const puppeteer = require("puppeteer");
const xlsx = require("xlsx");

axiosRetry(axios, { retries: 3 });

async function crawl() {
    console.log("entered crawl function");

    try {
        console.log("entered first try catch");
        const mainPage = await axios.get("https://cherokeeconnectga.com/directory/#!directory");
        const $ = cheerio.load(mainPage.data);
        const realtors = [];

        // use puppeteer to scroll down and load more content
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto("https://cherokeeconnectga.com/directory/#!directory");
        // wait for initial content to load
        await page.waitForTimeout(3000);

        // wait for specific elements to load after scrolling
        await page.waitForSelector("#SFylpcrd a", { timeout: 5000 });

        // get all the realtor URLs with puppeteer
        const realtorURLs = await page.evaluate(() => {
            const realtorLinks = document.querySelectorAll("#SFylpcrd a");
            return Array.from(realtorLinks).map(link => link.href);
        });

        // go through each realtorURL
        for (const realtorURL of realtorURLs) {
            console.log("checking realtor:", realtorURL);

            if (!realtorURL) {
                console.log("skipping realtor:", realtorURL);
                return;
            }

            // now we're on the realtor's page
            await page.goto(realtorURL);
            // wait for page to load
            await page.waitForTimeout(3000);

            // extract realtor name with puppeteer
            const realtorName = await page.evaluate(() => {
                const realtorNameElement = document.querySelector('.SFlst h3');
                return realtorNameElement ? realtorNameElement.textContent.trim() : null;
            });
            console.log(realtorName);
        };


        // const realtor = { realtorName };
        // realtor.push(realtors);
        // } catch (error) {
        //     console.error("An error occurred while fetching realtor page:", error);
        // }

        // close the browser after the crawling is done
        await browser.close();

    } catch (error) {
        console.error("An error occurred:", error);
    }
};


// console.log("Realtors:", realtors);
// console.table(realtors);

// const agentDataSheet = xlsx.utils.json_to_sheet(agents);
// const agentDataWorkbook = xlsx.utils.book_new();
// xlsx.utils.book_append_sheet(agentDataWorkbook, agentDataSheet, "Agent Data");
// xlsx.writeFile(agentDataWorkbook, "agent_data.xlsx", { bookType: "xlsx", type: "buffer" }, (err) => {
//     if (err) {
//         console.error("An error occurred while exporting the agent data:", err);
//     } else {
//         console.log("Agent data exported to agent_data.xlsx");
//     }
// });

crawl();