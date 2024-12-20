import { Injectable } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { LangChainService } from '../langchain/langchain.service';
import * as fs from 'fs';
import beautifyHelper from 'src/helper/beautifyFile';
import * as path from 'path';

export interface PostData {
    title: string;
    tags: string[];
    link: string;
    reactions: number;
    content?: string;
    cmt: number;
}

interface ArticleElement {
    tag: string;
    text: string;
    children?: ArticleElement[];
}

@Injectable()
export class WebScrapingService {
    private onlyBrowser: Browser | null = null;
    private promiseBrowser: Promise<Browser> | null = null;
    private pageUsage = [];

    constructor(private readonly langChainService: LangChainService) {
        console.log('WebScrapingService initialized');
    }

    async initBrowser() {
        if (this.onlyBrowser && this.onlyBrowser.isConnected()) {
            return this.onlyBrowser;
        }

        if (this.promiseBrowser) {
            return this.promiseBrowser;
        }

        this.promiseBrowser = puppeteer
            .launch({
                headless: false,
                args: ['--no-sandbox'],
            })
            .then((browser) => {
                this.onlyBrowser = browser;
                return this.onlyBrowser;
            })
            .catch((error) => {
                console.error('Error in launching browser: ', error);
                throw error;
            });

        return this.promiseBrowser;
    }

    scrapeByKeyWord(keyword: string): Promise<string | PostData[]> {
        return new Promise(async (resolve, reject) => {
            const browser = await this.initBrowser();
            const page = await browser.newPage();
            this.pageUsage.push(page);

            try {
                // Navigate to the desired URL
                await page.goto('https://dev.to/');

                // Search for "react"
                await page.type('input[type="text"]#search-input', keyword);
                await page.click('button[type="submit"][aria-label="Search"]');

                // Wait for the search results to load (again waiting for `data-loaded="true"`)
                await page.waitForFunction(
                    () => document.readyState === 'complete',
                    {
                        timeout: 20000, // Wait up to 20 seconds
                    },
                );
                await page.waitForSelector('body[data-loaded=true]', {
                    timeout: 20000, // Wait up to 20 seconds
                });

                // Apply "Most Relevant" filter
                await page.waitForSelector(
                    '#sorting-option-tabs > ul > li:nth-child(1) > a',
                );
                await page.click(
                    '#sorting-option-tabs > ul > li:nth-child(1) > a',
                );

                // Wait for filtered results
                await page.waitForSelector('#substories');

                // Wait for loadingDiv to be removed
                await page.waitForFunction(
                    () => {
                        const substories =
                            document.querySelector('#substories');
                        if (!substories) return false;

                        const loadingDiv = substories.querySelector(
                            '.crayons-story[title="Loading posts..."]',
                        );
                        return !loadingDiv;
                    },
                    { timeout: 20000 },
                ); // Wait for up to 20 seconds

                // Delay for 5 seconds before extracting blog data
                console.log(
                    'Waiting for 5 seconds before extracting blog data...',
                );
                await new Promise((res) => setTimeout(res, 6000));

                // Extract and save data
                const postsData: PostData[] = await page.evaluate(() => {
                    const substories = document.querySelector('#substories');
                    if (!substories) return [];

                    const posts = substories.querySelectorAll('.crayons-story');
                    return Array.from(posts).map((post) => {
                        const linkPostElement: HTMLAnchorElement =
                            post.querySelector(
                                'a.crayons-story__hidden-navigation-link',
                            );
                        const contentontainerElement = post.querySelector(
                            'div > div > div.crayons-story__indention',
                        );

                        const titleElement =
                            contentontainerElement.querySelector('h3');
                        const tagsElement =
                            contentontainerElement.querySelectorAll(
                                'div.crayons-story__tags > a',
                            );
                        const statisticsElement =
                            contentontainerElement.querySelector(
                                'div.crayons-story__bottom',
                            );
                        const reactionsElement: HTMLElement =
                            statisticsElement.querySelector(
                                'div.crayons-story__details > a:nth-child(1) > div > span.aggregate_reactions_counter',
                            );
                        const cmtElement: HTMLElement =
                            statisticsElement.querySelector(
                                'div.crayons-story__details > a:nth-child(2)',
                            );

                        const link = linkPostElement.href;
                        const title = titleElement
                            ? titleElement.innerText
                            : 'No Title';
                        const tags = tagsElement
                            ? Array.from(tagsElement).map(
                                  (tag) => tag.textContent,
                              )
                            : [];
                        const reactions = reactionsElement
                            ? +reactionsElement.innerText.split('\u00A0')[0]
                            : 0;
                        const cmt = cmtElement
                            ? +cmtElement.innerText.split('\u00A0')[0]
                            : 0;

                        return { title, tags, link, reactions, cmt };
                    });
                });

                // Scrape content from each page parallelly
                let executingPromises = new Set();
                let scrapePromises = [];
                let limit = 4;
                let maxPosts = 5;
                let finalResult = [];
                let hasFailed = false;
                for (let data of postsData) {
                    if (maxPosts > 0) maxPosts--;
                    else break;
                    if (hasFailed) {
                        break;
                    }
                    const page = await browser.newPage();
                    this.pageUsage.push(page);
                    const task = this.scrape_page_content(page, data)
                        .then((result) => {
                            finalResult.push(result);
                            executingPromises.delete(task);
                            this.pageUsage.pop();
                        })
                        .catch((error) => {
                            console.error('Error during scraping:', error);
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
                    throw new Error('Failed to scrape all pages');
                }

                // Resolve the path to the 'public/web_data' directory
                const outputDir = path.join(process.cwd(), 'public/web_data');
                console.log(`Output directory: ${outputDir}`);
                // Ensure the directory exists
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Write data to file
                const outputFilePath = path.join(outputDir, 'output.txt');
                const ws = fs.createWriteStream(outputFilePath, { flags: 'w' });

                // Convert and beautify JSON
                const convertJSON = JSON.stringify(finalResult, null, 2); // Optional: Beautify JSON directly
                const beautify_json = beautifyHelper.beautifyJSON(convertJSON);

                ws.write(beautify_json);
                ws.end();

                console.log(`Data written to: ${outputFilePath}`);

                // Summarize the blog content
                this.langChainService.blogSummarize(postsData);

                resolve(postsData);
            } catch (error) {
                console.error('Error during scraping:', error);
                reject('Error during scraping');
            } finally {
                // Close the page to manage resource usage
                await page.close();
                this.pageUsage.pop();
            }
        });
    }

    scrape_page_content = (page: Page, data: PostData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let url = data.link;
                // Navigate to the desired URL
                await page.goto(url);

                // Delay for 5 seconds before extracting blog data
                console.log(
                    'Waiting for 5 seconds before extracting blog data...',
                );
                await new Promise((res) => setTimeout(res, 5000));

                // Wait for the search results to load (again waiting for `data-loaded="true"`)
                await page.waitForSelector('body[data-loaded=true]', {
                    timeout: 20000, // Wait up to 20 seconds
                });

                // Scrape Info
                const article_Json: ArticleElement[] = await page.evaluate(
                    () => {
                        const article_container = document.querySelector(
                            '#main-content > div.article-wrapper > article#article-show-container',
                        );
                        if (!article_container) {
                            return null;
                        }
                        const article_body = article_container.querySelector(
                            '.crayons-article__main > #article-body',
                        );
                        const article_children = Array.from(
                            article_body.children,
                        );

                        // Extract headings and content
                        const articleJSON: ArticleElement[] = [];
                        const stack = []; // Stack to manage nesting

                        // Function to create a new container for headings
                        const createContainer = (
                            tag: string,
                            text: string,
                        ) => ({
                            tag,
                            text: text.trim(),
                            children: [],
                        });

                        article_children.forEach((element) => {
                            if (
                                element.tagName === 'H1' ||
                                element.tagName === 'H2' ||
                                element.tagName === 'H3'
                            ) {
                                const container = createContainer(
                                    element.tagName,
                                    element.textContent,
                                );

                                // Determine where to nest this heading
                                while (
                                    stack.length > 0 &&
                                    stack[stack.length - 1].tag >=
                                        element.tagName
                                ) {
                                    stack.pop(); // Pop less-priority headings
                                }

                                if (stack.length === 0) {
                                    articleJSON.push(container); // Top-level heading
                                } else {
                                    stack[stack.length - 1].children.push(
                                        container,
                                    ); // Nest under parent
                                }

                                stack.push(container); // Push the current heading to the stack
                            } else if (
                                element.tagName === 'P' ||
                                element.tagName === 'CODE'
                            ) {
                                const text = element.textContent.trim();
                                if (stack.length > 0 && text) {
                                    stack[stack.length - 1].children.push({
                                        tag: element.tagName,
                                        text,
                                    });
                                } else {
                                    articleJSON.push({
                                        tag: element.tagName,
                                        text,
                                    });
                                }
                            }
                        });

                        return articleJSON;
                    },
                );

                // Write back to string
                let s = '';
                const traverseCollectElement = (
                    aritcleJson: ArticleElement[],
                    special,
                ) => {
                    aritcleJson.forEach((element) => {
                        s += `${special}` + element.text + '\n';
                        if (element.children && element.children.length > 0) {
                            traverseCollectElement(
                                element.children,
                                special + '\t',
                            );
                            s += '\n';
                        }
                    });
                };
                traverseCollectElement(article_Json, '');
                data.content = s; // Add back to data
                resolve(data); // Resolve result
            } catch (error) {
                console.error('Error during scraping:', error);
                reject(error);
            } finally {
                // Close the page to manage resource usage
                await page.close();
            }
        });
    };
}
