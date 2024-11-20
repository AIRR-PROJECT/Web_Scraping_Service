const puppeteer = require("puppeteer");
const fs = require("fs");
const beautify_js = require("js-beautify");

let onlyBrowser = null;
let promiseBrowser = null;
let pageUsage = [];

setInterval(() => {
    if (pageUsage.length === 0 && onlyBrowser) {
        console.log("Closing browser due to inactivity...");
        onlyBrowser.close();
        onlyBrowser = null;
    }
}, 1000 * 60 * 10);

const initBrowser = async () => {
    if (onlyBrowser && onlyBrowser.isConnected()) {
        return onlyBrowser;
    }

    if (promiseBrowser) {
        return promiseBrowser;
    }

    promiseBrowser = puppeteer
        .launch({
            headless: false,
            args: ["--no-sandbox"],
        })
        .then((browser) => {
            onlyBrowser = browser;
            return onlyBrowser;
        })
        .catch((error) => {
            console.error("Error in launching browser: ", error);
        });

    return promiseBrowser;
};

const beautifyJSON = (json) => {
    let temp = json.replace(/(\r\n|\n|\r)/gm, "");
    temp = beautify_js(temp, { indent_size: 4, '--no-preserve-newlines': true });
    return temp;
}

const scrape_page_content = (page, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let url = data.link;
            // Navigate to the desired URL
            await page.goto(url);
    
            // Delay for 5 seconds before extracting blog data
            console.log("Waiting for 5 seconds before extracting blog data...");
            await new Promise(resolve => setTimeout(resolve, 5000))
    
            // Wait for the search results to load (again waiting for `data-loaded="true"`)
            await page.waitForSelector("body[data-loaded=true]", {
                timeout: 20000, // Wait up to 20 seconds
            });
    
            // Scrape Info
            const article_Json = await page.evaluate(() => {
                const article_container = document.querySelector("#main-content > div.article-wrapper > article#article-show-container");
                if (!article_container) {
                    return null;
                }
                const article_body = article_container.querySelector(".crayons-article__main > #article-body");
                const article_children = Array.from(article_body.children);
    
                // Extract headings and content
                const articleJSON = [];
                const stack = []; // Stack to manage nesting
    
                // Function to create a new container for headings
                const createContainer = (tag, text) => ({
                    tag,
                    text: text.trim(),
                    children: [],
                });
    
                article_children.forEach((element) => {
                    if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
                        const container = createContainer(element.tagName, element.textContent);
    
                        // Determine where to nest this heading
                        while (stack.length > 0 && stack[stack.length - 1].tag >= element.tagName) {
                            stack.pop(); // Pop less-priority headings
                        }
    
                        if (stack.length === 0) {
                            articleJSON.push(container); // Top-level heading
                        } else {
                            stack[stack.length - 1].children.push(container); // Nest under parent
                        }
    
                        stack.push(container); // Push the current heading to the stack
                    } else if (element.tagName === 'P' || element.tagName === 'CODE') {
                        const text = element.textContent.trim();
                        if (stack.length > 0 && text) {
                            stack[stack.length - 1].children.push({ tag: element.tagName, text });
                        } else {
                            articleJSON.push({ tag: element.tagName, text });
                        }
                    }
                });
    
                return articleJSON;
            });
    
            // Write back to string
            let s = "";
            const traverseCollectElement = (aritcleJson, special) => {
                aritcleJson.forEach((element) => {
                    s +=  `${special}` + element.text + "\n";
                    if (element.children && element.children.length > 0) {
                        traverseCollectElement(element.children, special + "\t");
                        s += "\n";
                    }
                });
            }
            traverseCollectElement(article_Json, "");
            data.content = s; // Add back to data
            resolve(data); // Resolve result
    
        } catch (error) {
            console.error("Error during scraping:", error);
            reject(error);
        } finally {
            // Close the page to manage resource usage
            await page.close();
        }
    })
};

const main = async (keyword) => {
    const browser = await initBrowser();
    const page = await browser.newPage();
    pageUsage.push(page);

    try {
        // Navigate to the desired URL
        await page.goto("https://dev.to/");

        // Wait for the search results to load (again waiting for `data-loaded="true"`)
        await page.waitForSelector("body[data-loaded=true]", {
            timeout: 20000, // Wait up to 20 seconds
        });

        // Search for "react"
        await page.type('input[type="text"]#search-input', keyword);
        await page.click('button[type="submit"][aria-label="Search"]');

        // Wait for the search results to load (again waiting for `data-loaded="true"`)
        await page.waitForSelector("body[data-loaded=true]", {
            timeout: 20000, // Wait up to 20 seconds
        });

        // Apply "Most Relevant" filter
        await page.waitForSelector("#sorting-option-tabs > ul > li:nth-child(1) > a");
        await page.click("#sorting-option-tabs > ul > li:nth-child(1) > a");

        // Wait for filtered results
        await page.waitForSelector("#substories");

        // Wait for loadingDiv to be removed
        await page.waitForFunction(() => {
            const substories = document.querySelector("#substories");
            if (!substories) return false;

            const loadingDiv = substories.querySelector('.crayons-story[title="Loading posts..."]');
            return !loadingDiv;
        }, { timeout: 20000 }); // Wait for up to 20 seconds

        // Delay for 5 seconds before extracting blog data
        console.log("Waiting for 5 seconds before extracting blog data...");
        await new Promise(resolve => setTimeout(resolve, 6000))

        // Extract and save data
        const postsData = await page.evaluate(() => {
            const substories = document.querySelector("#substories");
            if (!substories) return [];

            const posts = substories.querySelectorAll(".crayons-story");
            return Array.from(posts).map(post => {
                const linkPostElement = post.querySelector("a.crayons-story__hidden-navigation-link");
                const contentontainerElement = post.querySelector("div > div > div.crayons-story__indention");

                const titleElement = contentontainerElement.querySelector("h3");
                const tagsElement = contentontainerElement.querySelectorAll("div.crayons-story__tags > a");
                const statisticsElement = contentontainerElement.querySelector("div.crayons-story__bottom");
                const reactionsElement = statisticsElement.querySelector("div.crayons-story__details > a:nth-child(1) > div > span.aggregate_reactions_counter")
                const cmtElement = statisticsElement.querySelector("div.crayons-story__details > a:nth-child(2)")

                const link = linkPostElement.href;
                const title = titleElement ? titleElement.innerText : "No Title";
                const tags = tagsElement ? Array.from(tagsElement).map(tag => tag.textContent) : [];
                const reactions = reactionsElement ? +(reactionsElement.innerText.split("\u00A0")[0]) : 0;
                const cmt = cmtElement ? +(cmtElement.innerText.split("\u00A0")[0]) : 0;

                return { title, tags, link, reactions, cmt };
            });
        });

        // Scrape content from each page parallelly
        let executingPromises = new Set();
        let scrapePromises = [];
        let limit = 4;
        let finalResult = [];
        let hasFailed = false;
        for (let data of postsData) {
            if (hasFailed) {
                break;
            }
            const page = await browser.newPage();
            pageUsage.push(page);
            const task = scrape_page_content(page, data)
                .then(result => {
                    finalResult.push(result);
                    executingPromises.delete(task);
                    pageUsage.pop();
                })
                .catch(error => {
                    console.error("Error during scraping:", error);
                    hasFailed = true;
                    executingPromises.delete(task);
                });
            executingPromises.add(task);
            scrapePromises.push(task);
            if (executingPromises.size >= limit) {
                await Promise.race(executingPromises);
            }
        }
        await Promise.all(scrapePromises);
        if (hasFailed) {
            throw new Error("Failed to scrape all pages");
        }

        // Write data to file
        const ws = fs.createWriteStream("public/web_data/output.txt", { flags: "w" });
        const convertJSON = JSON.stringify(postsData);
        const beautify_json = beautifyJSON(convertJSON);
        ws.write(beautify_json);
        ws.end();

        console.log("Data written to output.txt");
    } catch (error) {
        console.error("Error during scraping:", error);
    } finally {
        // Close the page to manage resource usage
        await page.close();
        pageUsage.pop();
    }
};

main("react");
