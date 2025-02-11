const { read } = require("../src/main/utils/dbHandler");
const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require("path");

const db = levelup(leveldown("/Users/dinhbinh/Dev/electron-project/bot-controller/bot-controller-main/src/bin/db/uid"));

(async () => {
    const data = await new Promise((resolve, reject) => {
        const results = [];
        db.createReadStream()
            .on("data", data => {
                const key = data.key.toString();
                const value = data.value.toString();
                // results.push({ [key]: JSON.parse(value) });
                console.log(value);
            })
            .on("error", error => reject(error))
            .on("end", () => {
                resolve(results);
            });
    });
    console.log(data)
})();