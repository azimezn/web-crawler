// used to make HTTP requests
const axios = require("axios");
// using axiosRetry because it crashes before finishing
const axiosRetry = require("axios-retry");
// used to manipulate HTML
const cheerio = require("cheerio");
// used to export data to excel
const xlsx = require("xlsx");

// axios retires up to 3 times
axiosRetry(axios, { retries: 3 });

async function crawl() {
    console.log("entered crawl function");

    // wrapping the code in a try block to catch and handle potential errors
    try {
        const baseURL = "https://www.georgiamls.com";

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

                const currentPageURL = `${baseURL}/real-estate-agents/directory/${letter}/${currentPageNumber}`
                console.log("checking page:", currentPageURL);

                try {
                    const currentPageHTML = await axios.get(currentPageURL);
                    const $ = cheerio.load(currentPageHTML.data);

                    // retrieving the data through each row of current page
                    $("tr").each(async (index, element) => {
                        // get URL for specific agent
                        const agentURL = $(element).find("td:nth-child(1) a").attr("href");
                        console.log("checking agent:", agentURL)

                        // if agentURL is undefined, skip it
                        if (!agentURL) {
                            console.log("skipping agent:", agentURL);
                            return;
                        }
                        console.log("agent page URL", `${baseURL}${agentURL}`)

                        try {

                            const agentPageHTML = await axios.get(`${baseURL}${agentURL}`);
                            const $agentPage = cheerio.load(agentPageHTML.data);

                            // get the elements with the class "col-md-3"
                            const colMd3Elements = $agentPage('.col-md-3');

                            // extract information from the 1st "col-md-3" element
                            const colMd3 = colMd3Elements.eq(0); // Use .eq(0) to select the first element

                            const agentName = $(element).find("td:nth-child(1) a").text().trim();
                            const directPhone = colMd3.find('p:nth-child(3) a').text().trim();
                            const officePhone = colMd3.find('p:nth-child(4) a').text().trim();
                            const agentWebsite = colMd3.find('p:nth-child(5) a').attr('href');
                            // const officeName = $(element).find("td:nth-child(4) a").text().trim();

                            // its from the 2nd "col-md-3" element
                            const officeAddressLines = colMd3Elements.eq(1).find('p:nth-child(1)').text().trim();
                            // format the address
                            // split at every new line ('\n')
                            // map through each line and trim
                            const officeAddress = officeAddressLines.split('\n').map(line => line.trim());
                            // destructure to get different lines as different variables
                            const [officeName, addressLine1, addressLine2, phoneNumber] = officeAddress;
                            // split the addressLine2 and extract the last element, which is always the zip code
                            // if no addressLine2, keep it empty
                            const zipCode = addressLine2 ? addressLine2.split(' ').pop() : '';

                            const agent = { agentName, directPhone, officePhone, agentWebsite, officeName, addressLine1, addressLine2, zipCode };
                            agents.push(agent);
                        } catch (error) {
                            console.error("An error occurred while fetching agent page:", error);
                        }
                    });
                } catch (error) {
                    console.error("An error occurred while fetching current page:", error);
                }
            }
        };

        // show the agent data - agents is an array of objects
        console.log("Agents:", agents);
        console.table(agents);

        // export the agent data to Excel
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