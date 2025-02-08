const path = require("path");
const { app, BrowserWindow } = require("electron");
const { robotAPIs } = require("./src/main/APIs/robot");

const createMainWindow = () => {
    const window = new BrowserWindow({
        title: "Bot controller",
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            enableBlinkFeatures: false,
        },
    });
    window.loadURL("http://localhost:5173/");
    return window;
}

app.whenReady().then(() => {
    createMainWindow();
    app.on("activate", () => (BrowserWindow.getAllWindows().length === 0 && createMainWindow()));
    app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());

    robotAPIs();
});