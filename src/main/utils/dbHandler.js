const fs = require("fs");
const path = require("path");
const leveldown = require("leveldown");
const levelup = require("levelup");

const dbPath = path.join(__dirname, "..", "..", "bin", "db", "uid");

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
};

const db = levelup(leveldown(dbPath));

function read() {
    return new Promise((resolve, reject) => {
        const results = [];
        db.createReadStream()
            .on("data", data => {
                const key = data.key.toString();
                const value = data.value.toString();
                results.push({ [key]: JSON.parse(value) });
            })
            .on("error", error => reject(error))
            .on("end", () => {
                resolve(results);
            });
    });
}

function get(uid) {
    return new Promise((resolve, reject) => {
        db.get(uid, (err, value) => {
            if (err) reject(err);
            resolve(JSON.parse(value.toString()));
        });
    });
}

function put(payload) {
    return new Promise((resolve, reject) => {
        console.log(payload.info.uid.toString());
        db.put(payload.info.uid.toString(), JSON.stringify(payload), err => {
            if (err) reject(err);
            console.log("Data inserted!");
            resolve(true);
        });
    });
}

function del(uid) {
    return new Promise((resolve, reject) => {
        db.del(uid, err => {
            if (err) reject(err);
            console.log(`${uid} deleted!`)
            resolve(true);
        });
    });
}


(async () => {
    read()
        .then(res => JSON.stringify(res))
        .then(res => {
            fs.writeFileSync(path.join("/Users/dinhbinh/Dev/electron-project/bot-controller/bot-controller-main/test/exportUID.json"), res, { encoding: "utf8" })
        })
});


module.exports = {
    read,
    get,
    put,
    del,
};