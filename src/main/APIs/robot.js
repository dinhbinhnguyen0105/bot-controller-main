const path = require("path");
const { ipcMain } = require("electron");
const UserAgent = require('user-agents');
const { put, del, get, read } = require("../utils/dbHandler");
const { FacebookController } = require("../puppeteer/facebook/facebookController")
const { deleteDirectory } = require("../utils/utils");

const robotAPIs = () => {
    ipcMain.on("robot:create-uid", async (event, req) => {
        const userAgent = new UserAgent({ deviceCategory: "desktop" });
        const uidInfo = {};
        uidInfo.info = {
            ...req.payload.uid,
            note: "",
            type: "takecare",
        };
        uidInfo.config = {
            userAgent: userAgent.toString(),
            proxy: "",
        };
        put(uidInfo)
            .then(() => event.sender.send("robot:create-uid", {
                message: `Saved: ${uidInfo.info.uid}`,
                status: true,
                data: uidInfo,
            }))
            .catch(err => {
                console.error(err);
                event.sender.send("robot:create-uid", {
                    message: `An error occurred while saving ${uidInfo.info.uid}`,
                    data: false,
                });
            });
    });
    ipcMain.on("robot:import-uid", async (event, req) => {
        const today = new Date();
        const formattedDate = new Intl.DateTimeFormat('en-CA', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
        }).format(today);
        const base64Data = req.payload.replace(/^data:.*,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const jsonString = buffer.toString('utf-8');
        try {
            JSON.parse(jsonString);
        } catch (err) {
            console.error(err);
            event.sender.send("robot:import-uid", {
                message: "Incorrect format in import file.",
                data: [],
            });
        }
        const jsonData = JSON.parse(jsonString);
        const listUid = jsonData.map(info => {
            return info;
            const userAgent = new UserAgent({ deviceCategory: "desktop" });
            return {
                info: {
                    ...info,
                    date: formattedDate,
                    note: "",
                    type: "takecare"
                },
                config: {
                    userAgent: userAgent.toString(),
                    proxy: ""
                }
            };
        });
        for (let uidInfo of listUid) {
            await put(uidInfo);
        };
        event.sender.send("robot:import-uid", {
            message: "imported successfully.",
            status: true,
            data: listUid,
        });
        return;
    });
    ipcMain.on("robot:list-uid", async (event, req) => {
        read()
            .then(res => res.map(item => Object.values(item)[0]))
            .then(listUid => event.sender.send("robot:list-uid", {
                message: "Successfully read all UIDs",
                status: true,
                data: listUid,
            }))
            .catch(error => {
                console.error(error);
                event.sender.send("robot:list-uid", {
                    message: "Error listing all UIDs.",
                    status: false,
                    data: false,
                });
            });
    });
    ipcMain.on("robot:put-uid", async (event, req) => {
        put(req.payload)
            .then(() => event.sender.send("robot:put-uid", {
                message: "Successfully read all UIDs",
                status: true,
                data: req.payload,
            }))
            .catch(error => {
                console.error(error);
                event.sender.send("robot:put-uid", {
                    message: `Error editing ${req.payload.info.uid}`,
                    status: false,
                    data: false,
                });
            });
    });
    ipcMain.on("robot:del-uid", async (event, req) => {
        const userDataDir = path.join(__dirname, "..", "..", "bin", "browsers", req.payload);
        del(req.payload)
            .then(() => deleteDirectory(userDataDir))
            .then(() => event.sender.send("robot:list-uid", {
                message: "Successfully read all UIDs",
                status: false,
                data: req.payload,
            }))
            .catch((err) => {
                event.sender.send("robot", {
                    method: "del-uid",
                    message: `An error occurred while deleting ${req.payload}.`,
                    status: false,
                    data: false,
                });
                console.error(`An error occurred while deleting ${req.payload}.`);
                throw err;
            });
    });
    ipcMain.on("robot:launch-browser", async (event, req) => {
        const uidInfo = await get(req.payload);
        const controller = new FacebookController({
            headless: false,
            userAgent: uidInfo.config.userAgent,
            proxy: uidInfo.config.proxy,
            userDataDir: path.join(__dirname, "..", "..", "bin", "browsers", uidInfo.info.uid)
        })
        await controller.initBrowser();
        controller.browser.on("disconnected", () => {
            event.sender.send("robot:launch-browser", {
                message: `The ${req.payload}'s browser has been closed..`,
                data: uidInfo,
            });
        });
    });
    ipcMain.on("robot:get-name", async (event, req) => {
        let username = "";
        const uidInfo = await get(req.payload);
        const controller = new FacebookController({
            headless: false,
            userAgent: uidInfo.config.userAgent,
            proxy: uidInfo.config.proxy,
            userDataDir: path.join(__dirname, "..", "..", "bin", "browsers", uidInfo.info.uid)
        })
        await controller.initBrowser();
        controller.browser.on("disconnected", () => {
            event.sender.send("robot:get-name", {
                message: `Name retrieved successfully."`,
                status: true,
                data: uidInfo.info.username,
            })
        });
        const isLogged = await controller.checkLogin();
        if (isLogged) {
            username = await controller.getName();
            if (!username) {
                uidInfo.info.username = false;
            } else {
                uidInfo.info.username = username;
            }
        } else {
            uidInfo.info.username = false;
        };
        await put(uidInfo);
        await controller.cleanup();
    });
};

module.exports = { robotAPIs };

// method: "get-uidss"
// method: "get-name"
// method: "put-uid"
