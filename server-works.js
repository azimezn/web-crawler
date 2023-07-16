// used to make HTTP requests
const axios = require("axios");
// used to manipulate HTML
const cheerio = require("cheerio");
// used to export data to excel
const xlsx = require("xlsx");

async function crawl() {
    console.log("entered crawl function");

    // wrapping the code in a try block to catch and handle potential errors
    try {
        const baseURL = "https://www.georgiamls.com/";

        // an array to store all data of agents
        const agents = [];

        // to iterate over the alphabet letters
        const letters = "abcdefghijklmnopqrstuvwxyz".split("");

        // loop over each letter
        for (const letter of letters) {

            // HTTP GET request to store the HTML content, which is the response, on given webpage
            // await waits for the response to be received before moving on
            const firstPageHTML = await axios.get(`${baseURL}/real-estate-agents/directory/${letter}/1`);
            // makes it possible to manipulate the HTML from the webpage
            const $ = cheerio.load(firstPageHTML.data);

            // extract the total number of pages from the webpage html
            const totalPagesText = $(".listing-pagination-count").text();
            // get the specific info using a regular expression
            // results in null or an array with two elements - ["page 1 of 15", "15"]
            const totalPagesMatch = totalPagesText.match(/Page 1 of (\d+)/);
            // if totalPages is not null, the 2nd index of totalPagesMatch will be used
            const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : NaN;
            console.log(totalPages);

            for (let currentPageNumber = 1; currentPageNumber <= totalPages; currentPageNumber++) {

                let currentPageURL = `${baseURL}/real-estate-agents/directory/${letter}/${currentPageNumber}`
                console.log("checking page:", currentPageURL);

                const currentPageHTML = await axios.get(currentPageURL);
                const $ = cheerio.load(currentPageHTML.data);

                // retrieving the data through each row of current page
                $("tr").each((index, element) => {
                    const agentName = $(element).find("td:nth-child(1) a").text().trim();
                    const phone = $(element).find("td:nth-child(2) a").text().trim();
                    const phoneOffice = $(element).find("td:nth-child(3) a").text().trim();
                    const office = $(element).find("td:nth-child(4) a").text().trim();

                    // create an object with the information
                    const agent = { agentName, phone, phoneOffice, office };
                    // add the object to the agents array
                    agents.push(agent);
                })
            }
        };

        // show the agent data - agents is an array of objects
        // console.log("Agents:", agents);
        console.table(agents);

        // Export the agent data to Excel
        const agentDataSheet = xlsx.utils.json_to_sheet(agents);
        const agentDataWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(agentDataWorkbook, agentDataSheet, "Agent Data");
        xlsx.writeFile(agentDataWorkbook, "agent_data.xlsx", { bookType: "xlsx", type: "buffer" }, (err) => {
            if (err) {
                console.error("An error occurred while exporting the agent data:", err);
            } else {
                console.log("Agent data exported to agent_data.xlsx");
            }
        });

    } catch (error) {
        console.error("An error occurred:", error);
    }

};

crawl();