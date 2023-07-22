const axios = require("axios");
const axiosRetry = require("axios-retry");
const cheerio = require("cheerio");
const xlsx = require("xlsx");

axiosRetry(axios, { retries: 3 });

async function crawl() {
    console.log("entered crawl function");

    try {
        const baseURL = await axios.get("https://cherokeeconnectga.com/directory");
        const $ = cheerio.load(baseURL.data);
        const realtors = [];

        // go through each agent and get link
        // $("#SFylpcrd a").each(async (index, element) => {
        //     const realtorURL = $(element).attr("href");
        //     console.log("checking realtor:", realtorURL)
        // });

        // if (!realtortURL) {
        //     console.log("skipping realtor:", realtor);
        //     return;
        // }

        // const currentPageURL = `${baseURL}/${realtorURL}`
        // console.log("checking page:", currentPageURL);

        try {
            // const realtorPageHTML = await axios.get(`${currentPageURL}`);
            // const $realtorPage = cheerio.load(realtorPageHTML.data);







            // // get the elements with the class "col-md-3"
            // const colMd3Elements = $agentPage('.col-md-3');


            // const colMd3 = colMd3Elements.eq(0);

            // const agentName = $(element).find("td:nth-child(1) a").text().trim();
            // const directPhone = colMd3.find('p:nth-child(3) a').text().trim();
            // const officePhone = colMd3.find('p:nth-child(4) a').text().trim();
            // const agentWebsite = colMd3.find('p:nth-child(5) a').attr('href');

            // // its from the 2nd "col-md-3" element
            // const officeAddressLines = colMd3Elements.eq(1).find('p:nth-child(1)').text().trim();
            // // format the address
            // // split at every new line ('\n')
            // // map through each line and trim
            // const officeAddress = officeAddressLines.split('\n').map(line => line.trim());
            // // destructure to get different lines as different variables
            // const [officeName, addressLine1, addressLine2, phoneNumber] = officeAddress;
            // // split the addressLine2 and extract the last element, which is always the zip code
            // // if no addressLine2, keep it empty
            // const zipCode = addressLine2 ? addressLine2.split(' ').pop() : '';

            // const agent = { agentName, directPhone, officePhone, agentWebsite, officeName, addressLine1, addressLine2, zipCode };
            // agents.push(agent);
        } catch (error) {
            console.error("An error occurred while fetching realtor page:", error);
        }
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