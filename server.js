// axios is used for making HTTP requests
const axios = require("axios");
// cheerio is used to manipulate HTML
const cheerio = require("cheerio");

async function crawl() {
    console.log("entered crawl function");

    // HTTP GET request to store the HTML content, which is the response, on given webpage
    // await waits for the response to be received before moving on
    const pageHTML = await axios.get("https://www.georgiamls.com/real-estate-agents/directory/a/1");

    // makes it possible to manipulate the HTML from the webpage
    const $ = cheerio.load(pageHTML.data);

    // // goes through each letter page
    // // !!!!!!!! this goes through first page of each letter. i need to go through every page of each letter
    // $("#alphabet li a").each((index, element) => {
    //     const paginationURL = $(element).attr("href")
    // })

    // an array to store all data of agents
    const agents = [];

    // retrieving the data through each row
    $("tr").each((index, element) => {
        const agentName = $(element).find("td:nth-child(1) a").text().trim();
        const phone = $(element).find("td:nth-child(2) a").text().trim();
        const phoneOffice = $(element).find("td:nth-child(3) a").text().trim();
        const office = $(element).find("td:nth-child(4) a").text().trim();
  
        // create an object with the information
        const agent = { agentName, phone, phoneOffice, office };
        // add the object to the agents array
        agents.push(agent);
      });


      

};

crawl();