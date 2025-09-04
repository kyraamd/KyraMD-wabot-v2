const chalk = require("chalk");
const fs = require("fs");

//========== Setting Owner ==========//
global.owner = "6288980698613"
global.namaowner = "Kyr4Core"
global.namabot = "KyraMD"
global.versisc = "2.0.0"
global.pairing = "PERAWANQ" 


//========== Setting ID ==========//
global.idsaluran = '120363367787013309@newsletter'
global.namasaluran = 'KyraMD x Baileys'
global.idsaluran = "https://t.me/kyr4core"


//========== Setting Message ==========//
global.mess = {
 owner: "Maaf hanya untuk owners bot",
 admin: "Maaf hanya untuk admin groups",
 botAdmin: "Maaf bot harus dijadikan admin",
 group: "Maaf hanya dapat digunakan di dalam group",
 private: "Silahkan gunakan fitur di private chat",
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.blue(">> Update File :"), chalk.black.bgWhite(`${__filename}`))
delete require.cache[file]
require(file)
})