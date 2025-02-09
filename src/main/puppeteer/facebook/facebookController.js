const path = require("path");
const { Controller } = require("../controller")

class FacebookController extends Controller {
    async checkLogin() {
        try {
            const uid = path.basename(this.puppeteerOptions.userDataDir);
            const loginUrl = "https://www.facebook.com/login";
            await this.page.goto(loginUrl);
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUrl = this.page.url();
            if (currentUrl.includes("home.php")) {
                return true;
            }
            else {
                console.error(`User is not logged into Facebook in userDataDir: [${uid}]`)
                return false;
            };
        } catch (err) {
            console.error("Check login failed: ", err);
            await this.cleanup();
            throw err;
        }
    }
    async getName() {
        try {
            await this.page.goto("https://www.facebook.com/profile.php", { timeout: 60000 });
            await this.humanDelay(1000, 1000);
            await this.page.waitForSelector("h1");//, { visible: true }
        } catch (err) {
            console.error(err);
            return false;
        }
        const usernameElms = await this.page.$$("h1");
        for (let usernameElm of usernameElms) {
            const isVisible = await this.checkVisibleElement(usernameElm);
            if (isVisible) {
                const username = await usernameElm.evaluate(elm => elm.textContent);
                return username.trim();
            };
        };
        return false;
    }
    async reelAndLike() {
        await this.humanDelay(1000, 3000);
        await this.page.goto("https://www.facebook.com/reel/");

        const pageLang = await this.page.$eval("html", html => html.lang);
        if (!pageLang.includes("vi") && !pageLang.includes("en")) {
            console.error("The website is not available in the supported language");
            return false;
        };

        const ARIA_LABEL = {
            next: pageLang.includes("vi") ? "thẻ tiếp theo" : "next card",
            like: pageLang.includes("vi") ? "thích" : "like",
        };

        const iterations = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
        for (let i = 0; i < iterations; i++) {
            await this.humanDelay(8000, 30000);
            await this.humanDelay(1000, 1000);
            // click next
            await this.page.waitForSelector("div[role='button']");
            const buttonElms = await this.page.$$("div[role='button']");
            for (let btnElm of buttonElms) {
                const isNextBtn = await btnElm.evaluate((elm, ariaLabel) => {
                    const label = elm.getAttribute("aria-label");
                    if (label && label.toLowerCase().includes(ariaLabel)) return true;
                    else return false;
                }, ARIA_LABEL.next);
                if (isNextBtn) {
                    const isVisible = true;
                    if (isVisible) {
                        await this.humanDelay(1000, 3000);
                        await this.humanClick(btnElm);
                        console.log("Clicked Next btn");
                        await this.humanDelay(1000, 3000);
                        break;
                    } else { continue; };
                } else { continue; };
            };

            if (Math.random() > 0.5) {
                // Like
                await this.page.waitForSelector("div[role='button']");
                const buttonElms = await this.page.$$("div[role='button']");

                for (let btnElm of buttonElms) {
                    const isLikeBtn = await btnElm.evaluate((elm, ariaLabel) => {
                        const label = elm.getAttribute("aria-label");
                        if (label && label.toLowerCase().includes(ariaLabel)) return true;
                        else return false;
                    }, ARIA_LABEL.like);
                    if (isLikeBtn) {
                        const isVisible = await this.checkVisibleElement(btnElm);
                        if (isVisible) {
                            await this.humanDelay(1000, 3000);
                            await this.humanClick(btnElm);
                            console.log("Clicked Like btn");
                            await this.humanDelay(1000, 3000);
                            break;
                        } else { continue; };
                    } else { continue; };
                };
            };
        };
    }
    async joinGroups(listOfGID) {
        const SELECTOR = {
            joinButton: "",
            button: "div[role='button']",
        };
        const ARIA_LABEL = {
            joinButton: null,
        };
        const listJoined = [];
        await this.humanDelay(1000, 3000);
        await this.page.goto("https://www.facebook.com/home.php");
        const pageLang = await this.page.$eval("html", html => html.lang);
        if (pageLang.toLowerCase().trim() === "vi") {
            ARIA_LABEL.joinButton = "tham gia nhóm";
        } else if (pageLang.toLowerCase().trim() === "en") {
            ARIA_LABEL.joinButton = "join group";
        };

        for (let gid of listOfGID) {
            await this.humanDelay(1000, 3000);
            await this.page.goto(`https://www.facebook.com/groups/${gid}`);
            try {
                await this.page.waitForSelector(SELECTOR.button,);
            } catch (err) {
                if (err.name.toLowerCase().trim() === "timeouterror") {
                    console.error(`Failed to join group [${gid}]`);
                    continue;
                } else {
                    console.error(err);
                    throw (err);
                };
            };
            const buttonElms = await this.page.$$(SELECTOR.button);
            for (let buttonElm of buttonElms) {
                const isJoinBtn = await buttonElm.evaluate((elm, ariaLabel) => {
                    const ariaLabelValue = elm.getAttribute("aria-label");
                    if (ariaLabelValue && ariaLabelValue.toLowerCase().trim().includes(ariaLabel.joinButton)) return true;
                    return false;
                }, ARIA_LABEL);
                if (isJoinBtn) {
                    const isVisible = await this.checkVisibleElement(buttonElm);
                    if (isVisible) {
                        await this.humanDelay(1000, 3000);
                        await this.humanClick(buttonElm);
                        await this.humanDelay(1000, 3000);
                        listJoined.push(gid);
                        console.log(`Successfully joined group [${gid}]`);
                        break;
                    } else { continue; };
                } else { continue; };
            }

        };
        return listJoined;
    }
    async addFriend(gid, friendCount) {
        await this.humanDelay(1000, 3000);
        await this.page.goto(`https://www.facebook.com/groups/${gid}/members`);
        const SELECTOR = {
            addFriend: null,
            list: "div[role='list']"
        };
        const pageLang = await this.page.$eval("html", html => html.lang);
        if (pageLang.toLowerCase().trim() === "vi") {
            SELECTOR.addFriend = "div[aria-label='Tham gia nhóm']";
        } else if (pageLang.toLowerCase().trim() === "en") {
            SELECTOR.addFriend = "div[aria-label='Add friend']";
        };
        await this.page.waitForSelector(SELECTOR.list);
        const listElms = await this.page.$$(SELECTOR.list);
        const latestListElm = listElms[listElms.length - 1];
        await this.humanDelay();
        await this.humanScrollDown();
        await this.humanScrollToElement(latestListElm);

        await latestListElm.waitForSelector(SELECTOR.addFriend);
        const addFriendBtnElms = await latestListElm.$$(SELECTOR.addFriend);

        for (let i = 0; i < friendCount; i++) {
            const index = Math.floor(Math.random() * addFriendBtnElms.length);
            await this.humanDelay();
            await this.humanScrollToElement(addFriendBtnElms[index]);
            await this.humanDelay();
            await this.humanClick(addFriendBtnElms[index]);
            console.log("Add friend: ", i);
        };
    }
    async postToNewFeed(newFeedOptions) {
        const pageLang = await this.page.$eval("html", html => html.lang);
        if (!pageLang.includes("vi") && !pageLang.includes("en")) {
            console.error("The website is not available in the supported language");
            return false;
        };
        await this.page.goto("https://www.facebook.com/home.php");
        await this.humanDelay(1000, 3000);
        await this.page.waitForSelector("div[role='region']", { visible: true });
        const regionElm = await this.page.$("div[role='region']");
        await regionElm.waitForSelector("div[role='button']", { visible: true });
        const openDialogBtnElm = await regionElm.$("div[role='button']");
        await this.humanClick(openDialogBtnElm);

        await this.page.waitForSelector("div[role='dialog']");

        let dialog;
        const prevDialogs = await this.page.$$("div[role='dialog']");
        for (let prevDialog of prevDialogs) {
            const isVisibleDialog = await this.checkVisibleElement(prevDialog);
            if (isVisibleDialog) {
                dialog = prevDialog;
                break;
            }
        }

        const isLoadingDialog = await dialog.evaluate(elm => {
            if (elm.querySelector("div[role='status']")) return true;
            return false;
        });

        if (isLoadingDialog) {
            console.log("wait loading dialog disappear.")
            await this.waitForElementToDisappear(dialog);
        }

        const dialogs = await this.page.$$("div[role='dialog']");

        for (let _ of dialogs) {
            const isVisibleDialog = await this.checkVisibleElement(_);
            if (isVisibleDialog) {
                dialog = _;
                break;
            };
        };
        await dialog.waitForSelector("div[role='textbox']");
        const textInputElm = await dialog.$("div[role='textbox']");
        await this.humanDelay(100, 1000);
        await this.humanType(textInputElm, newFeedOptions.content);

        await dialog.waitForSelector("div[role='button']");
        let buttonElms = await dialog.$$("div[role='button']");
        for (let btn of buttonElms) {
            const isImgBtn = await btn.evaluate(elm => {
                const label = elm.getAttribute("aria-label");
                if (label && label.toLowerCase().includes("video")) return true;
                else return false;
            });
            if (isImgBtn) {
                await this.humanDelay(1000, 3000);
                await this.humanClick(btn);
                break;
            };
        };

        await dialog.waitForSelector("input[type='file']");
        const imgInputElm = await dialog.$("input[type='file']");
        await this.humanDelay(1000, 3000);
        await imgInputElm.uploadFile(...newFeedOptions.images);
        await this.humanDelay(30000, 40000);

        await dialog.waitForSelector("div[role='button']");
        buttonElms = await dialog.$$("div[role='button']");
        for (let btn of buttonElms) {
            const isPostBtn = await btn.evaluate(elm => {
                const label = elm.getAttribute("aria-label");
                if (label && (label.toLowerCase().trim() === "đăng" || label.toLowerCase().trim() === "post")) return true;
                else return false;
            });
            if (isPostBtn) {
                await this.humanDelay(1000, 3000);
                await this.humanClick(btn);
                console.log("Posting")
                await this.humanDelay(2000, 3000);
                break;
            };
        };
    }
    async listToMarketplace(marketOptions) {
        await this.humanDelay(1000, 3000);
        await this.page.goto("https://www.facebook.com/marketplace/create/item");

        const pageLang = await this.page.$eval("html", html => html.lang);
        const lang = pageLang.trim();
        if (!pageLang.includes("vi") && !pageLang.includes("en")) {
            console.error("The website is not available in the supported language");
            return false;
        };
        // const options = {
        //     images: [],
        //     content: {
        //         title: "",
        //         descriptions: "",
        //     }
        // }
        // https://www.facebook.com/marketplace/create/item
        // role="main"
        // aria-label="Marketplace"//role="form"
        // role="button"//aria-expanded="false"
        //label aria-label="Title" -> input
        // aria-label="Price"   -> input    
        // aria-label="Category" -> click aria-label="Dropdown menu"
        // aria-label="Condition"
        // aria-label="Description"
        // aria-label="Location" => click ->  delete all -> type "" ->  {
        //ul role="listbox" //aria-label="5 suggested searches" 
        //li role="option" -> 1
        // }

        const ARIA_LABEL = {
            title: lang === "vi" ? "" : "title",
            price: lang === "vi" ? "" : "price",
            category: lang === "vi" ? "" : "category",
            condition: lang === "vi" ? "" : "condition",
            description: lang === "vi" ? "" : "description",
            location: lang === "vi" ? "" : "location",
            categoryDialog: lang === "vi" ? "" : "dropdown menu",
            conditionListbox: lang === "vi" ? "" : "select an option",
        }

        await this.page.waitForSelector("div[role='main']");
        const mainELm = await this.page.$("div[role='main']");
        await mainELm.waitForSelector("div[role='form']");
        const marketplaceElm = await this.page.$("div[role='form']");
        await marketplaceElm.waitForSelector("div[role='button']");

        // Click expand button
        let buttonElms = await marketplaceElm.$$("div[role='button']");
        let isClickExpandBtn = false;
        for (let buttonElm of buttonElms) {
            const isVisible = await this.checkVisibleElement(buttonElm);
            if (isVisible) {
                const ariaExpanded = await buttonElm.evaluate(elm => {
                    if (elm.getAttribute("aria-expanded")) return true;
                });
                if (ariaExpanded) {
                    await this.humanScrollToElement(buttonElm);
                    await this.humanClick(buttonElm);
                    isClickExpandBtn = true;
                    break;
                };
            };
        };
        if (!isClickExpandBtn) {
            console.error("Expand button not found.");
            return false;
        };

        const clickOption = async (label) => {
            let isClick = false;
            await marketplaceElm.waitForSelector("label");
            let labelElms = await marketplaceElm.$$("label");
            for (let labelElm of labelElms) {
                const ariaLabel = await labelElm.evaluate(elm => {
                    if (elm.getAttribute("aria-label")) { return elm.getAttribute("aria-label") }
                    else { false; };
                });
                if (ariaLabel && ariaLabel.toLowerCase().trim() === label) {
                    await this.humanScrollToElement(labelElm);
                    await this.humanClick(labelElm);
                    isClick = true;
                };
            }
            if (!isClick) {
                console.error(`${label} label not found`);
                return false;
            } else { return true; };
        };

        // Select Category
        const isClickCategory = await clickOption(ARIA_LABEL.category);
        if (!isClickCategory) { return false; };
        let isClickCategoryDialog = false;
        await this.page.waitForSelector("div[role='dialog']");
        let dialogs = await this.page.$$("div[role='dialog']");
        for (let dialog of dialogs) {
            const ariaLabel = await dialog.evaluate(elm => {
                const ariaLabel = elm.getAttribute("aria-label");
                if (ariaLabel) { return ariaLabel; }
                else { return false; };
            });
            if (ariaLabel && ariaLabel.toLowerCase().trim() === ARIA_LABEL.categoryDialog) {
                await dialog.waitForSelector("div[role='button']");
                const buttonElms = await dialog.$$("div[role='button']");
                const lastBtn = buttonElms[buttonElms.length - 2];
                // await this.humanScrollToElement(lastBtn);
                await this.humanScrollDown();
                await this.humanClick(lastBtn);
                console.log("Clicked to item of category dialog");
                isClickCategoryDialog = true;
            };
        }
        if (!isClickCategoryDialog) {
            console.error("Cannot click to misc item");
            return false;
        };

        //Select condition
        const isClickCondition = await clickOption(ARIA_LABEL.condition);
        if (!isClickCondition) { return false; };
        let isClickConditionListbox = false;
        await this.page.waitForSelector("div[role='listbox']");
        let listboxs = await this.page.$$("div[role='listbox']");
        for (let listbox of listboxs) {
            const ariaLabel = await listbox.evaluate(elm => {
                const ariaLabel = elm.getAttribute("aria-label");
                if (ariaLabel) { return ariaLabel; }
                else { return false; };
            });
            if (ariaLabel && ariaLabel.toLowerCase().trim() === ARIA_LABEL.conditionListbox) {
                await listbox.waitForSelector("div[role='option']");
                const buttonElms = await listbox.$$("div[role='option']");
                await this.humanScrollToElement(buttonElms[0]);
                await this.humanClick(buttonElms[0]);
                console.log("Clicked to item of condition listbox");
                isClickConditionListbox = true;
            };
        };
        if (!isClickConditionListbox) {
            console.error("Cannot click to new item");
            return false;
        }

    }
}

module.exports = { FacebookController };