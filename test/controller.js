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
    // const payload = JSON.parse(strPayload);

    const payload = [
        {
            "uid": "61571228397595",
            "reelAndLike": true,
            "joinGroupsIndex": 0,
            "addFriend": "",
            "postToNewFeed": {
                "images": [
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_0.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_1.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_2.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_3.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_4.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_5.jpg",
                    "/Users/dinhbinh/Workspace/mymanager-v2/bin/db/products/real-estate/images/re.r.020725.5/re.r.020725.5_6.jpg"
                ],
                "content": "CHO THUÊ\n\ncho thuê nhà Phường 8\n- Kết cấu: 1 trệt\nGồm 1pk, 1 bếp, 3pn, 3wc\n+ Sân vườn rộng rãi, để xe hơi thoải mái\n+ Không kinh doanh\n+ Cọc 2 đóng 1 (HĐ lâu dài)\n- Khu vực dân trí cao, an ninh tốt\n- Giá: 16triệu/tháng\nLH: 0375 155 525\nID: RE.R.020725.5 "
            }
        },
    ];

    for (config of payload) {
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
        const isLogin = await facebookController.checkLogin();
        // const isLogin = true;
        if (isLogin) {
            await facebookController.reelAndLike();
            await facebookController.joinGroups(actions.joinGroups.map(group => group.gid));
            await facebookController.addFriend(actions.addFriend, 3);
            await facebookController.postToNewFeed(actions.postToNewFeed);
            // await facebookController.listToMarketplace({});
        }
        await facebookController.cleanup();
    }
}

(async () => {
    await controller();
})();