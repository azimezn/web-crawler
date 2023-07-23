const axios = require("axios");
const axiosRetry = require("axios-retry");
const cheerio = require("cheerio");
// puppeteer is needed because content is loading dynamically, i need to scroll for more content
const puppeteer = require("puppeteer");
const xlsx = require("xlsx");

axiosRetry(axios, { retries: 3 });

async function crawl() {
    console.log("crawling...")
    const realtors = [];

    try {
        const mainPage = await axios.get("https://cherokeeconnectga.com/directory/#!directory");
        const $ = cheerio.load(mainPage.data);

        // use puppeteer to scroll down and load more content
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto("https://cherokeeconnectga.com/directory/#!directory");
        // wait for initial content to load
        await page.waitForTimeout(3000);

        let scroll = 0;

        // before crawling, scroll down to load more realtors
        for (let i = 0; i < 1000; i++) {
            scroll++
            console.log(`scrolled ${scroll} times`)
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            // wait after scrolling to load
            await page.waitForTimeout(2000);
        }
        // wait for specific elements to load after scrolling
        await page.waitForSelector("#SFylpcrd a", { timeout: 5000 });

        // get all the realtor URLs with puppeteer
        const realtorURLs = await page.evaluate(() => {
            const realtorLinks = document.querySelectorAll("#SFylpcrd a");
            return Array.from(realtorLinks).map(link => link.href);
        });
        console.log("Realtor URLs:", realtorURLs);

        // go through each realtorURL
        for (const realtorURL of realtorURLs) {
            console.log("checking realtor:", realtorURL);

            if (!realtorURL) {
                console.log("skipping realtor:", realtorURL);
                continue;
            }

            // now we're on the realtor's page
            await page.goto(realtorURL);
            // wait for page to load
            await page.waitForTimeout(3000);

            // wait for .SFbizinf element to load before extracting its HTML content
            await page.waitForSelector(".SFbizinf");

            // extract information with puppeteer
            const realtorName = await page.evaluate(() => {
                const realtorNameElement = document.querySelector('.SFlst h3');
                return realtorNameElement ? realtorNameElement.textContent.trim() : null;
            });

            const agentName = await page.evaluate(() => {
                const agentNameElement = document.querySelector('.SFlst .SFbizctcctc');
                return agentNameElement ? agentNameElement.textContent.trim() : null;
            });

            const phoneNumber = await page.evaluate(() => {
                const phoneNumberElement = document.querySelector('.SFlst .SFbizctcphn');
                return phoneNumberElement ? phoneNumberElement.textContent.trim() : null;
            });

            const addressLine1 = await page.evaluate(() => {
                const addressLine1Element = document.querySelector('.SFbizinf [itemprop="streetAddress"]');
                return addressLine1Element ? addressLine1Element.textContent.trim() : null;
            });

            const addressLine2 = await page.evaluate(() => {
                const addressLine1Element = document.querySelector('.SFbizinf [itemprop="addressLocality"]');
                return addressLine1Element ? addressLine1Element.textContent.trim() : null;
            });

            // regex to match the zipcode, get the first element in the array
            const zipCode = addressLine2 ? (addressLine2.match(/\b\d{5}\b/) || [])[0] : '';

            const realtor = { realtorName, agentName, phoneNumber, addressLine1, addressLine2, zipCode, realtorURL };
            realtors.push(realtor);

            console.log("Realtor:", realtor);
        };

        // close the browser after the crawling is done
        await browser.close();

    } catch (error) {
        console.error("An error occurred:", error);
    }

    console.log("Realtors:", realtors);
    console.table(realtors);

    const realtorDataSheet = xlsx.utils.json_to_sheet(realtors);
    const realtorDataWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(realtorDataWorkbook, realtorDataSheet, "Realtor Data");
    xlsx.writeFile(realtorDataWorkbook, "realtor_data.xlsx", { bookType: "xlsx", type: "buffer" }, (err) => {
        if (err) {
            console.error("An error occurred while exporting the realtor data:", err);
        } else {
            console.log("Realtor data exported to realtor_data.xlsx");
        }
    });
};

crawl();