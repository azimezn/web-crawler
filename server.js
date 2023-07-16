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

                // let currentPageURL = `${baseURL}/real-estate-agents/directory/${letter}/${currentPageNumber}`
                let currentPageURL = `${baseURL}/real-estate-agents/directory/a/1`
                console.log("checking page:", currentPageURL);

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
                    console.log("agent page html", `${baseURL}${agentURL}`)

                    const agentPageHTML = await axios.get(`${baseURL}${agentURL}`);
                    const $agentPage = cheerio.load(agentPageHTML.data);

                    // Get the elements with the class "col-md-3"
                    const colMd3Elements = $agentPage('.col-md-3');

                    // Extract information from the first element
                    const colMd3 = colMd3Elements.eq(0); // Use .eq(0) to select the first element

                    // Extract the agent name
                    // const agentName = colMd3.find('strong').text().trim();
                    const agentName = $(element).find("td:nth-child(1) a").text().trim();

                    // Extract the direct phone number
                    const directPhone = colMd3.find('p:nth-child(3) a').text().trim();

                    // Extract the office phone number
                    const officePhone = colMd3.find('p:nth-child(4) a').text().trim();

                    // Extract the agent website URL
                    const agentWebsite = colMd3.find('p:nth-child(5) a').attr('href');

                    // Extract the office name
                    // const officeName = colMd3.find('p:nth-child(1) a').text().trim();
                    const officeName = $(element).find("td:nth-child(4) a").text().trim();

                    // // Extract the office address
                    // const officeAddress = colMd3.find('p:nth-child(1)').html()
                    //     .replace(/<br>/g, '\n') // Replace <br> tags with line breaks
                    //     .replace(/<\/?[^>]+(>|$)/g, '') // Remove any remaining HTML tags
                    //     .trim();

                    const agent = { agentName, directPhone, officePhone, agentWebsite, officeName };
                    agents.push(agent);
                    console.log("Agents:", agents);
                });




            }
        };

        // show the agent data - agents is an array of objects
        // console.log("Agents:", agents);
        // console.table(agents);

        // // export the agent data to Excel
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

    } catch (error) {
        console.error("An error occurred:", error);
    }

};

crawl();