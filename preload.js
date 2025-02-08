const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPIs", {
    send: (channel, data) => {
        if (data.method === "import") {
            console.log(data);
            // console.log(data.body.get("file"));
        }
        ipcRenderer.send(channel, data);
    },
    on: (channel, func) => ipcRenderer.on(channel, (event, args) => func(args))
});