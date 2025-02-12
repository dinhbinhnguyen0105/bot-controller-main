const { read, get } = require("../src/main/utils/dbHandler");
const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require("path");

const db = levelup(leveldown("/Users/dinhbinh/Dev/electron-project/bot-controller/bot-controller-main/src/bin/db/uid"));

(() => {
    get("61567362557063")
        .then(res => console.log(res))
        .catch(err => console.error(err))
})();