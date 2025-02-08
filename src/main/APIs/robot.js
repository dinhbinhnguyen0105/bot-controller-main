const path = require("path");
const { ipcMain } = require("electron");
const UserAgent = require('user-agents');
const { put, del, get, read } = require("../utils/dbHandler");
const { Controller } = require("../puppeteer/controller");
const { deleteDirectory } = require("../utils/utils");

const robotAPIs = () => {
    ipcMain.on("robot:get-name", async (event, req) => {
        let username = false;
        const uidInfo = await get(req.uid);
        const controller = new Controller({
            headless: false,
            userAgent: uidInfo.config.userAgent,
            proxy: uidInfo.config.proxy,
            userDataDir: path.join(__dirname, "..", "..", "bin", "browsers", uidInfo.info.uid)
        })
        await controller.initBrowser();
        controller.browser.on("disconnected", () => {
            event.sender.send("robot:get-name", {
                message: `The ${uidInfo.info.uid}'s browser has been closed.`,
                data: username,
            });
        });
        event.sender.send("robot:get-name", {
            message: `The ${uidInfo.info.uid}'s browser is open.`,
            data: true,
        });
        const isLogged = await controller.facebookCheckLogin();
        if (isLogged) {
            username = await controller.facebookGetName();
            if (!username) {
                username = "ERROR";
            } else {
                uidInfo.info.username = username;
                await put(uidInfo);
            }
        } else {
            username = "to signed in";
        };
        await controller.cleanup();
    });
    ipcMain.on("robot:create-uid", async (event, req) => {
        const userAgent = new UserAgent({ deviceCategory: "desktop" });
        const uidInfo = {};
        uidInfo.info = {
            ...req.payload,
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
                data: true,
            }))
            .catch(err => {
                console.error(err);
                event.sender.send("robot:create-uid", {
                    message: `An error occurred while saving ${uidInfo.info.uid}`,
                    data: true,
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
                data: false,
            });
        }
        const jsonData = JSON.parse(jsonString);
        const listUid = jsonData.map(info => {
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
            put(uidInfo)
                .then(() => event.sender.send("robot:import-uid", {
                    message: `Saved: ${uidInfo.info.uid}`,
                    data: true,
                }))
                .catch(err => {
                    console.error(err);
                    event.sender.send("robot:import-uid", {
                        message: `An error occurred while saving ${uidInfo.info.uid}`,
                        data: false,
                    });
                });
        };
    });
    ipcMain.on("robot:list-uid", async (event, req) => {
        read()
            .then(res => res.map(item => Object.values(item)[0]))
            .then(listUid => event.sender.send("robot:list-uid", {
                message: "Successfully read all UIDs",
                data: listUid,
            }))
            .catch(error => {
                console.error(error);
                event.sender.send("robot:list-uid", {
                    message: "Error listing all UIDs.",
                    data: false,
                });
            });
    });
    ipcMain.on("robot:put-uid", async (event, req) => {
        put(req.payload)
            .then(() => event.sender.send("robot", {
                method: "put-uid",
                message: `Successfully edit ${req.payload.info.uid} information.`,
                data: true,
            }))
            .catch(error => {
                console.error(error);
                event.sender.send("robot", {
                    method: "get-uids",
                    message: `Error editing ${req.payload.info.uid}`,
                    data: false,
                });
            });
    });
    ipcMain.on("robot:del-uid", async (event, req) => {
        const userDataDir = path.join(__dirname, "..", "..", "bin", "browsers", req.payload);
        del(req.payload)
            .then(() => {
                event.sender.send("robot", {
                    method: "del-uid",
                    message: `${req.payload} uid has been deleted.`,
                    data: true,
                });
                deleteDirectory(userDataDir);
            })
            .catch((err) => {
                event.sender.send("robot", {
                    method: "del-uid",
                    message: `An error occurred while deleting ${req.payload}.`,
                    data: false,
                });
                console.error(`An error occurred while deleting ${req.payload}.`);
                throw err;
            });
    });
    ipcMain.on("robot:launch-browser", async (event, req) => {
        const uidInfo = await get(req.payload);
        const controller = new Controller({
            headless: false,
            userAgent: uidInfo.config.userAgent,
            proxy: uidInfo.config.proxy,
            userDataDir: path.join(__dirname, "..", "..", "bin", "browsers", uidInfo.info.uid)
        })
        await controller.initBrowser();

        event.sender.send("robot", {
            method: "launch-browser",
            message: `The ${req.payload}'s browser is open.`,
            data: true,
        })
        controller.browser.on("disconnected", () => {
            event.sender.send("robot", {
                method: "launch-browser",
                message: `The ${req.payload}'s browser has been closed..`,
                data: false,
            });
        });
    });

};

module.exports = { robotAPIs };

// method: "get-uidss"
// method: "get-name"
// method: "put-uid"
