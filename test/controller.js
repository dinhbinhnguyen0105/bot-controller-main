const path = require("path");
const fs = require("fs");

const { Controller } = require("../src/main/puppeteer/controller");
const { FacebookController } = require("../src/main/puppeteer/facebook/facebookController");
const { put, get } = require("../src/main/utils/dbHandler");

const { checkUidStatus } = require("./checkUidStatus");

const controller = async () => {
    const browserDir = path.join(__dirname, "..", "src", "bin", "browsers");
    const strGroups = fs.readFileSync(path.join(__dirname, "groups.json"));
    const strPayload = fs.readFileSync(path.join(__dirname, "payload.json"));
    const groups = JSON.parse(strGroups);
    const payload = JSON.parse(strPayload);

    for (config of payload) {
        if (config.uid === "61571105674637" || config.uid === "61571181960732" || config.uid === "61571228397595") continue;
        const uidInfo = await get(config.uid);
        if (!checkUidStatus(uidInfo.info.uid)) continue;
        const actions = {
            joinGroups: groups.slice(config.joinGroupsIndex, config.joinGroupsIndex + 3),
            reelAndLike: true,
            addFriend: groups[config.joinGroupsIndex].gid,
            postToNewFeed: config.postToNewFeed,
        };

        const facebookController = new FacebookController({
            headless: false,
            userAgent: uidInfo.config.userAgent,
            proxy: uidInfo.config.proxy,
            userDataDir: path.join(browserDir, uidInfo.info.uid),
        });

        await facebookController.initBrowser();
        const isLogin = await facebookController.facebookCheckLogin();
        if (isLogin) {
            await facebookController.reelAndLike();
            await facebookController.joinGroups(actions.joinGroups.map(group => group.gid));
            await facebookController.addFriend(actions.addFriend, 3);
            await facebookController.postToNewFeed(actions.postToNewFeed);
        }
        await facebookController.cleanup();
    }
}

(async () => {
    await controller();
})();