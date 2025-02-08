const path = require("path");
const puppeteer = require("puppeteer-extra");
// const puppeteer = require("puppeteer")
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

class Controller {
    constructor(puppeteerOptions) {
        puppeteer.use(StealthPlugin());
        this.browser = null;
        this.page = null;


        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--window-position=0,0",
            "--ignore-certificate-errors",
            "--ignore-certificate-errors-spki-list",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            puppeteerOptions.userAgent && `--user-agent=${puppeteerOptions.userAgent}`,
        ];
        if (puppeteerOptions?.proxy) {
            if (puppeteerOptions.proxy.split(":").length !== 4) {
                this.proxyOption = undefined;
            } else {
                const [proxyIP, proxyPort, proxyUsername, proxyPassword] = puppeteerOptions.proxy.split(":");
                this.proxyOption = { proxyUsername, proxyPassword, proxyIP, proxyPort };
                args.push(`--proxy-server=${proxyIP}:${proxyPort}`);
            }
        } else {
            this.proxyOption = undefined;
        };
        this.puppeteerOptions = {
            ignoreHTTPSErrors: true,
            args: args,
            executablePath: executablePath,
            ...puppeteerOptions,
        };
    }
    async initBrowser() {
        this.browser = await puppeteer.launch(this.puppeteerOptions);
        this.page = await this.browser.newPage();
        if (this.proxyOption) {
            await this.page.authenticate({
                username: this.proxyOption.proxyUsername,
                password: this.proxyOption.proxyPassword
            });
        };
        await this.page.setUserAgent(this.puppeteerOptions.userAgent);
        await this.page.setExtraHTTPHeaders({ "User-Agent": this.puppeteerOptions.userAgent });
        await this.page.evaluateOnNewDocument((ua) => {
            Object.defineProperty(navigator, "userAgent", { get: () => ua });
        }, this.puppeteerOptions.userAgent);
        await this.page.setViewport({
            width: 1920 + Math.floor(Math.random() * 100),
            height: 1080 + Math.floor(Math.random() * 100),
            deviceScaleFactor: Math.random() * 0.5 + 1,
            isMobile: false,
            hasTouch: false
        });
        console.log("Browser initialized successfully");
        console.log("Browser info: ", {
            userDataDir: path.basename(this.puppeteerOptions.userDataDir),
            proxyIP: this.proxyOption && this.proxyOption.proxyIP,
            userAgent: this.puppeteerOptions.userAgent,
        });
        this.page.goto("https://bot.sannysoft.com/");
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.browser;
        // try {
        // } catch (err) {
        //     console.error("Initialization failed:", err);
        //     console.error(err);
        //     throw err;
        // }
    }

    async facebookCheckLogin() {
        try {
            const uid = path.basename(this.puppeteerOptions.userDataDir);
            const loginUrl = "https://www.facebook.com/login";
            await this.page.goto(loginUrl, { timeout: 60000 });
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUrl = this.page.url();
            if (currentUrl.includes("home.php")) {
                return true;
            }
            else {
                console.error(`User is not logged into Facebook in userDataDir: [${uid}]`);
                return false;
            };
        } catch (err) {
            console.error("Check login failed: ", err);
            // await this.cleanup();
            return false;
        }
    }

    async facebookGetName() {
        try {
            await this.page.goto("https://www.facebook.com/profile.php", { timeout: 60000 });
            await this.#humanDelay(1000, 1000);
            await this.page.waitForSelector("h1");//, { visible: true }
        } catch (err) {
            console.error(err);
            return false;
        }
        const usernameElms = await this.page.$$("h1");
        for (let usernameElm of usernameElms) {
            const isVisible = await this.#checkVisibleElement(usernameElm);
            if (isVisible) {
                const username = await usernameElm.evaluate(elm => elm.textContent);
                return username.trim();
            };
        };
        return false;
    }

    async #humanClick(elementHandler) {
        try {
            const boundingBox = await elementHandler.boundingBox();
            if (boundingBox) {
                const x = boundingBox.x + boundingBox.width / 2;
                const y = boundingBox.y + boundingBox.height / 2;

                await this.page.mouse.move(x, y, { steps: 25 });
                await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
                await this.page.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
                await this.page.mouse.up();
                return true;
            } else {
                console.error("Selector not found:", elementHandler);
                return false;
            };
        } catch (error) {
            console.error("Error in humanClick:", error);
        };
    }
    async #humanType(elementHandler, text) {
        await this.#humanClick(elementHandler);
        for (let char of text) {
            await this.page.keyboard.type(char, {
                delay: Math.random() * 100 + 50,
            });
            if (Math.random() < 0.05) {
                await this.page.keyboard.press('Backspace', { delay: 50 });
                await this.page.keyboard.type(char, { delay: 50 });
            };
            if (Math.random() < 0.3) {
                await this.page.mouse.move(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    { steps: 5 }
                );
            };
            if (Math.random() < 0.1) {
                await this.#humanDelay(200, 500);
            };
        };
    }
    async #humanMove(x, y) {
        const steps = 10 + Math.floor(Math.random() * 15);
        const gravity = 0.1 + Math.random() * 0.3;
        await this.page.mouse.move(x, y, {
            steps: steps,
            easing: 'easeOut' + (Math.random() < 0.5 ? 'Quad' : 'Cubic')
        });
    }
    async #humanDelay(min = 1000, max = 5000) {
        const delay = Math.floor(min + Math.random() * (max - min));
        const jitter = delay * 0.3 * Math.random();
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
    async #humanScrollToElement(elementHandler) {
        const boundingBox = await elementHandler.boundingBox();
        if (boundingBox) {
            let elementY = boundingBox.y;
            let viewportHeight = await this.page.evaluate(() => window.innerHeight);
            let currentScrollY = await this.page.evaluate(() => window.scrollY);
            while (currentScrollY + viewportHeight < elementY || currentScrollY > elementY) {
                let scrollStep = Math.floor(Math.random() * 200) + 100;
                if (currentScrollY + viewportHeight < elementY) {
                    await this.page.mouse.wheel({ deltaY: scrollStep });
                    currentScrollY += scrollStep;
                } else {
                    await this.page.mouse.wheel({ deltaY: -scrollStep });
                    currentScrollY -= scrollStep;
                };
                await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
            }
        } else {
            throw new Error("bounding");
        };
    }
    async #humanScrollDown() {
        const steps = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
        for (let i = 0; i < steps; i++) {
            let scrollDistance = Math.floor(Math.random() * 400) + 100;
            if (Math.random() < 0.2) scrollDistance = -scrollDistance / 2;
            await this.page.mouse.wheel({ deltaY: scrollDistance });
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
        };
    }
    async #checkVisibleElement(elementHandler) {
        if (!await this.#isValidElement(elementHandler)) return false;
        const visibleElm = await this.page.evaluate(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const isNotHidden = window.getComputedStyle(element).visibility !== 'hidden';
            const isInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
            return isVisible && isNotHidden && isInViewport;
        }, elementHandler);
        return visibleElm;
    }
    async #isValidElement(elementHandler) {
        if (!elementHandler) {
            console.error("Element handler is null or undefined.");
            return false;
        };
        const isElement = await elementHandler.evaluate(elm => elm instanceof Element);
        if (!isElement) {
            console.error("Element handler is not a valid DOM element.");
            return false;
        };
        const hasGetBoundingClientRect = typeof elementHandler.boundingBox === 'function';
        if (!hasGetBoundingClientRect) {
            console.error("Element handler does not have getBoundingClientRect method.");
            return false;
        };
        return true;
    }
    async #waitForElementToDisappear(elementHandler) {
        await this.page.waitForFunction(element => !document.body.contains(element), {}, elementHandler);
    }
    isController() {
        this.page.on('close', () => {
            this.page = null;
        });
        this.browser.on('disconnected', () => {
            this.browser = null;
        });
    }

    async cleanup() {
        try {
            if (this.page && !this.page.isClosed()) {
                await this.page.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
            console.log("Browser closed successfully");
        } catch (error) {
            console.error("Cleanup failed:", error);
        }
    }
}

module.exports = { Controller };

// (async () => {
//     const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
//     const controller = new Controller({
//         headless: false,
//         executablePath: executablePath,
//         userAgent: uidInfo.userAgent,
//         userDataDir: userDataDir,
//         proxyOptions: {
//             uri: "42.118.140.59:27434",
//             username: "XSlGcX",
//             password: "qFabfI",
//         }
//     });
//     await controller.initBrowser()
// })();