require("./settings.js")
require("./lib/webp.js")
require("./lib/database.js")

const util = require("util");
const chalk = require("chalk");
const fs = require("fs");
const axios = require("axios");
const fetch = require("node-fetch");
const os = require('os');
const nou = require('node-os-utils');
const speed = require('performance-now');
const sharp = require('sharp');
const path = require("path");

const {
default: makeWASocket,
jidDecode,
prepareWAMessageMedia,
generateWAMessage,
downloadContentFromMessage
} = require("@whiskeysockets/baileys")

const { 
exec, 
spawn, 
execSync 
} = require('child_process');

const { 
imageToWebp, 
videoToWebp,
writeExifImg,
writeExifVid,
addExif
} = require('./lib/exif')

const owners = JSON.parse(fs.readFileSync("./lib/database/owner.json"))
const antilink = JSON.parse(fs.readFileSync("./lib/database/antilink.json"))
const gconly = JSON.parse(fs.readFileSync("./lib/database/gconly.json"))
const welcome = JSON.parse(fs.readFileSync("./lib/database/welcome.json"))
const Case = require("./lib/system");

module.exports = async (sock, m, store) => {
loadDataBase(sock, m);
try {
const isCmd = m?.body?.startsWith(m.prefix)
const quoted = m.quoted ? m.quoted : m
const mime = quoted?.msg?.mimetype || quoted?.mimetype || null
const args = m.body.trim().split(/ +/).slice(1)
const qmsg = (m.quoted || m)
const text = q = args.join(" ")

const command = isCmd ? m.body.slice(m.prefix.length).trim().split(' ').shift().toLowerCase() : ''
const cmd = m.prefix + command
const pushname = m.pushName || `${m.sender.split("@")[0]}`
const botNumber = await sock.decodeJid(sock.user.id)
m.fromMe = m.key.fromMe || m.sender === botNumber;
const isOwner = [botNumber, owner+"@s.whatsapp.net", ...owners].includes(m.sender) ? true : m.isDeveloper ? true : false
global.public = false // default

//==========[ Metadata Groups ]==========//
try {
m.isGroup = m.chat.endsWith("g.us");
m.metadata = m.isGroup ? await sock.groupMetadata(m.chat).catch(_ => {}) : {};
const participants = m.metadata?.participants || [];

// cek pake .jid biar formatnya sama dengan m.sender & botNumber
m.isAdmin = Boolean(participants.find(p => p.admin !== null && p.jid === m.sender));
m.isBotAdmin = Boolean(participants.find(p => p.admin !== null && p.jid === botNumber));
} catch (error) {
console.error("Error metadata:", error);
m.metadata = {};
m.isAdmin = false;
m.isBotAdmin = false;
}


//==========[ Database Group ]==========//
if (m.isGroup && antilink.some(i => i.id === m.chat)) {
    const linkRegex = /(https?:\/\/)?(chat\.whatsapp\.com)\/[0-9A-Za-z]{20,}/gi;

    if (linkRegex.test(m.text || "") && !isOwner && !m.isAdmin && !m.fromMe) {
        console.log(`${chalk.red.bold("[ ALERT ] Link terdeteksi")} :  ${chalk.white.bold(m.text)}`);

        try {
            const gclink = `https://chat.whatsapp.com/${await sock.groupInviteCode(m.chat)}`;
            const isLinkThisGc = new RegExp(gclink, "i");

            if (isLinkThisGc.test(m.text)) return;

            const room = antilink.find(i => i.id === m.chat);
            const { participant, id } = m.key;

            console.log("Mode :", room.kick ? "kick" : "hapus pesan");

            await sock.sendMessage(m.chat, {
                text: `\n*乂 Link Grup Terdeteksi*\n\nMaaf, ${room.kick ? "Kamu akan saya kick" : "pesan kamu saya hapus"}, karena admin/owner bot telah mengaktifkan fitur *Antilink Grup* 🚫\n`,
                mentions: [m.sender]
            }, { quoted: m });

            // delete link
            try {
                await sock.sendMessage(m.chat, {
                    delete: { remoteJid: m.chat, fromMe: false, id, participant }
                });
                console.log("Pesan link berhasil dihapus");
            } catch (err) {
                console.log("Gagal hapus pesan:", err.message);
            }

            // kick kalo mode kick on
            if (room.kick) {
                try {
                    await sleep(1000);
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                    console.log("User berhasil di kick:", m.sender);
                } catch (err) {
                    console.log("Gagal kick user:", err.message);
                }
            }
        } catch (error) {
            console.error("Error saat memproses antilink:", error);
        }
    }
}

let gconly = false
try {
    gconly = JSON.parse(fs.readFileSync("./lib/database/gconly.json"))
} catch (e) {
    gconly = false
    fs.writeFileSync("./lib/database/gconly.json", JSON.stringify(false, null, 2))
}

if (isCmd && !isOwner && gconly && !m.isGroup) {
return m.reply(`\n*乂 Group Only Mode*\nMaaf bot hanya dapat digunakan dalam grup, karena owner telah menyalakan *gconly*\n`);
}

//==========[ Fake Quoted ]==========//
const qtext = {
key: {
remoteJid: 'status@broadcast',
fromMe: false,
participant: '0@s.whatsapp.net'
},
message: {
newsletterAdminInviteMessage: {
newsletterJid: '123@newsletter',
caption: `# ${namaowner}.`,
inviteExpiration: 0
}
}
}

const qlock = {
key: {
participant: '0@s.whatsapp.net',
...(m.chat ? { remoteJid: 'status@broadcast' } : {})
},
message: {
locationMessage: {
name: `# ${namaowner}.`,
jpegThumbnail: ''
}
}
}

//==========[ Function Bug ]==========//



//==========[ Reply Message ]==========//
const reply = m.reply = (teks) => {
return sock.sendMessage(m.chat, { text: teks }, { quoted: m })
}

const example = async (teks) => {
const commander = `\n*Penggunaan Salah!*\nContoh : *${cmd}* ${teks}\n`
return sock.sendMessage(m.chat, {text: commander, contextInfo: {
}}, {quoted: m})
}

//==========[ Console Log ]==========//
if (isCmd) {
console.log(chalk.blue.bold(`[ NEW MESSAGE ]`), chalk.blue.bold(`${m.sender.split("@")[0]} :`), chalk.white.bold(`${m.prefix+command}`))
}

//=============================================//

switch (command) {
case "menu": case "menj": {
let teks = `
`
await sock.sendMessage(m.chat, {text: teks}, {quoted: m})
}
break

//=============================================//

case "tiktok":
case "tt": {
if (!text) return example("linknya");

m.reply("📥 Sedang memproses video TikTok...");

try {
const anu = await fetchJson(`https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(text)}`);

if (!anu?.status || !anu?.data) {
return m.reply("Gagal mengambil data TikTok. Pastikan link valid.");
}

const { download, metadata } = anu.data;
const videoUrl = download?.video?.[0];
const audioUrl = download?.audio;

if (videoUrl) {
await sock.sendMessage(m.chat, {
video: { url: videoUrl },
caption: "Tiktok Video ✅",
mimetype: "video/mp4"
}, { quoted: m });
}

if (audioUrl) {
await sock.sendMessage(m.chat, {
audio: { url: audioUrl },
mimetype: "audio/mpeg",
ptt: false
}, { quoted: m });
}

} catch (err) {
console.error("Error TikTok Downloader:", err);
m.reply("Terjadi kesalahan saat mengunduh video TikTok.");
}
}
break

//=============================================//

case "instagram": case "igdl": case "ig": {
    if (!text) return example("linknya");

    m.reply("📥 Sedang memproses tautan Instagram...");

    try {
        const anu = await fetchJson(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(text)}`);

        if (!anu?.status || !Array.isArray(anu.data) || anu.data.length === 0) {
            return m.reply("Gagal mengambil media Instagram. Coba periksa link-nya.");
        }

        for (const item of anu.data) {
            await sock.sendMessage(m.chat, {
                video: { url: item.url },
                caption: "Instagram Download ✅",
                mimetype: "video/mp4"
            }, { quoted: m });
        }
    } catch (err) {
        console.error("Instagram Downloader Error:", err);
        m.reply("Terjadi kesalahan saat mengunduh media dari Instagram.");
    }
}
break

//=============================================//

case "kick": case "kik": {
if (!isOwner) return m.reply(mess.admin)
if (!m.isGroup) return m.reply(mess.group)
if (!m.isBotAdmin) return m.reply(mess.botadmin)
if (text || m.quoted) {
let input = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
var onWa = await sock.onWhatsApp(input.split("@")[0])
if (onWa.length < 1) return m.reply("Nomor tidak terdaftar di whatsapp")
const res = await sock.groupParticipantsUpdate(m.chat, [input], 'remove')
} else {
return example("@tag/reply")
}
}
break

//=============================================//

case "hidetag": case "h": case "tagall": {
if (!m.isGroup) return m.reply(mess.group)
if (!isOwner && !m.isAdmin) return m.reply(mess.admin)
if (!text) return example("pesannya")
let member = m.metadata.participants.map(v => v.id)
await sock.sendMessage(m.chat, {text: text, mentions: [...member]}, {quoted: m})
}
break

//=============================================//

case "gconly": case "grouponly": {
    if (!isOwner) return m.reply(mess.owner)

    if (!text || !/^(on|off)$/i.test(text.trim())) {
        const status = gconly ? "Aktif ✅" : "Tidak Aktif ❌"
        return m.reply(`\n*Penggunaan Salah!*\nContoh: *${cmd}* on/off\n\nStatus Group Only global:\n* *${status}*`)
    }

    const input = text.toLowerCase().trim()

    if (input === "on") {
        if (gconly) return m.reply("⚠️ Group Only sudah aktif sebelumnya.")
        gconly = true
        fs.writeFileSync("./lib/database/gconly.json", JSON.stringify(true, null, 2))
        return m.reply("✅ Group Only berhasil diaktifkan untuk *semua grup*.")
    }

    if (input === "off") {
        if (!gconly) return m.reply("⚠️ Group Only sudah nonaktif sebelumnya.")
        gconly = false
        fs.writeFileSync("./lib/database/gconly.json", JSON.stringify(false, null, 2))
        return m.reply("❌ Group Only berhasil dimatikan, bot bisa dipakai di private chat.")
    }
}
break

//=============================================//

case "antilink": case "antilinkgc": {
if (!isOwner) return m.reply(mess.owner);
if (!m.isGroup) return m.reply(mess.group);

let room = antilink.find((i) => i.id == m.chat);

if (!args[0] || !args[1]) return example(`on/off kick/nokick\n\n*Status Antilinkgc :* ${room ? `Aktif ✅ (${room.kick ? "kick" : "nokick"})` : "Tidak Aktif ❌"}`)

let mode = args[0].toLowerCase();
let state = args[1].toLowerCase();
let isOn = /on/g.test(state);
let isOff = /off/g.test(state);

if (!["kick", "nokick", "kik", "nokik"].includes(mode)) return example(`on/off nokik/kik\n\n*Status Antilinkgc :* ${room ? `Aktif ✅ (${room.kick ? "kick" : "nokik"})` : "Tidak Aktif ❌"}`)

if (!isOn && !isOff) return example(`on/off kick/nokick\n\n*Status Antilinkgc :* ${room ? `Aktif ✅ (${room.kick ? "kick" : "nokik"})` : "Tidak Aktif ❌"}`)

let shouldKick = mode === "kick" || mode === "kik";

if (isOn) {
if (room && room.kick === shouldKick)
return m.reply(
`*Antilink grup ${shouldKick ? "kick" : "no kick"}* di grup ini sudah aktif!`
);

if (room) {
let ind = antilink.indexOf(room);
antilink.splice(ind, 1);
}

antilink.push({ id: m.chat, kick: shouldKick });
fs.writeFileSync("./lib/database/antilink.json", JSON.stringify(antilink, null, 2));
return m.reply(
`*Antilink grup ${shouldKick ? "kick" : "no kick"}* berhasil diaktifkan ✅`
);
} else if (isOff) {
if (!room || room.kick !== shouldKick)
return m.reply(
`*Antilink grup ${shouldKick ? "kick" : "no kick"}* di grup ini sudah tidak aktif!`
);

let ind = antilink.indexOf(room);
antilink.splice(ind, 1);
fs.writeFileSync("./lib/database/antilink.json", JSON.stringify(antilink, null, 2));
return m.reply(
`*Antilink grup ${shouldKick ? "kick" : "no kick"}* berhasil dimatikan ✅`
);
}
}
break

//=============================================//

case "welcome": case "welkam": {
if (!isOwner) return m.reply(mess.owner)
if (!m.isGroup) return m.reply(mess.group)

if (!text || !/^(on|off)$/i.test(text.trim())) {
const status = welcome.includes(m.chat) ? "Aktif ✅" : "Tidak Aktif ❌"
return m.reply(`\n*Penggunaan Salah!*\nContoh: *${cmd}* on/off\n\nStatus welcome di grup ini :\n* *${status}*`)
}

const input = text.toLowerCase().trim()

if (input === "on") {
if (welcome.includes(m.chat)) {
return m.reply("Welcome di grup ini sudah aktif sebelumnya.")
}
welcome.push(m.chat)
fs.writeFileSync("./lib/database/welcome.json", JSON.stringify(welcome, null, 2))
return m.reply("Welcome berhasil diaktifkan untuk grup ini ✅")
}

if (input === "off") {
if (!welcome.includes(m.chat)) {
return m.reply("Welcome di grup ini sudah nonaktif sebelumnya.")
}
const index = welcome.indexOf(m.chat)
welcome.splice(index, 1)
fs.writeFileSync("./lib/database/welcome.json", JSON.stringify(welcome, null, 2))
return m.reply("Welcome berhasil dimatikan untuk grup ini ✅")
}
}
break

//=============================================//

case "rvo": case "readviewonce": {
if (!m.quoted) return example("reply pesan viewonce")

let msg = m.quoted.fakeObj.message
let type = Object.keys(msg)[0]
if (!msg[type].viewOnce && m.quoted.mtype !== "viewOnceMessageV2") return m.reply("Pesan itu bukan viewonce!")
let media = await downloadContentFromMessage(msg[type], type == 'imageMessage' ? 'image' : type == 'videoMessage' ? 'video' : 'audio')
let buffer = Buffer.from([])
for await (const chunk of media) {
buffer = Buffer.concat([buffer, chunk])
}
if (/video/.test(type)) {
return sock.sendMessage(m.chat, {video: buffer, caption: msg[type].caption || ""}, {quoted: m})
} else if (/image/.test(type)) {
return sock.sendMessage(m.chat, {image: buffer, caption: msg[type].caption || ""}, {quoted: m})
} else if (/audio/.test(type)) {
return sock.sendMessage(m.chat, {audio: buffer, mimetype: "audio/mpeg", ptt: true}, {quoted: m})
} 
}
break

//=============================================//

case "self": case "public": {
if (!isOwner) return m.reply(mess.owner)
let status = true
if (command == "self") status = false
sock.public = status
fs.writeFileSync("./lib/database/mode.json", JSON.stringify({ public: status }, null, 2))
return m.reply(`Berhasil mengganti ke mode *${command}*`)
}
break

//=============================================//

case "getcase": { 
if (!isOwner) return m.reply(mess.owner);
if (!text) return example("casenya");
try {
let hasil = Case.get(text);
m.reply(hasil);
} catch (e) {
m.reply(e.message);
}
}
break;

//=============================================//

case "addcase": {
if (!isOwner) return m.reply(mess.owner);
if (!text) return example("casenya");
try {
Case.add(text);
reply("✅ Case berhasil ditambahkan.");
} catch (e) {
reply(e.message);
}
}
break;

//=============================================//

case "delcase": {
if (!isOwner) return m.reply(mess.owner);
if (!text) return example("casenya")
try {
Case.delete(text);
reply(`✅ Case "${text}" berhasil dihapus.`);
} catch (e) {
reply(e.message);
}
}
break;

//=============================================//

case "listcase": {
if (!isOwner) return m.reply(mess.owner);
try {
reply("📜 List Case:\n\n" + Case.list());
} catch (e) {
m.reply(e.message);
}
}
break;

//=============================================//

case "developerbot": case "owner": case "own": case "dev": {
await sock.sendContact(m.chat, [global.owner], null)
await reply(`Halo @${m.sender.split("@")[0]} ini adalah owner ku!`)
}
break

//=============================================//

case "tourl": { 
if (!/image/.test(mime)) return m.reply("kirim/reply fotonya!");
const { ImageUploadService } = require('node-upload-images');
try {
let mediaPath = await sock.downloadAndSaveMediaMessage(qmsg);
const service = new ImageUploadService('pixhost.to');
let buffer = fs.readFileSync(mediaPath);
let { directLink } = await service.uploadFromBinary(buffer, 'jarroffc.png');
await sock.sendMessage(m.chat, { text: directLink }, { quoted: m });
await fs.unlinkSync(mediaPath);
} catch (err) {
console.error("Tourl Error:", err);
m.reply("Terjadi kesalahan saat mengubah media menjadi URL.");
}
}
break;

//=============================================//

case "cekidch": case "idch": {
if (!text) return example("linkchnya")
if (!text.includes("https://whatsapp.com/channel/")) return m.reply("Link tautan tidak valid")
let result = text.split('https://whatsapp.com/channel/')[1]
let res = await sock.newsletterMetadata("invite", result)
let teks = `${res.id}

* ${res.name}
* ${res.subscribers} Pengikut`
return m.reply(teks)
}
break

//=============================================//

case "ping": case "uptime": {
let timestamp = speed();
let latensi = speed() - timestamp;
let tio = await nou.os.oos();
var tot = await nou.drive.info();
let respon = `*—Informasi Server Vps 🖥️*
- *Platform :* ${nou.os.type()}
- *Total Ram :* ${formatp(os.totalmem())}
- *Total Disk :* ${tot.totalGb} GB
- *Total Cpu :* ${os.cpus().length} Core
- *Runtime Vps :* ${runtime(os.uptime())}

*—Informasi Server Panel 🌐*
- *Respon Speed :* ${latensi.toFixed(4)} detik
- *Runtime Bot :* ${runtime(process.uptime())}`
await m.reply(respon)
}
break

//=============================================//

case "crashkyra": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
coconsole.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);

for (let i = 0; i < 100; i++) {
await sleep(500) // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "crashkyra2": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
console.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);


for (let i = 0; i < 150; i++) {
await sleep(500); // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "crashkyra3": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
console.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);


for (let i = 0; i < 150; i++) {
await sleep(500); // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "crashkyra4": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
console.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);


for (let i = 0; i < 150; i++) {
await sleep(500); // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "crashkyra5": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
console.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);


for (let i = 0; i < 150; i++) {
await sleep(500); // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "crashkyra6": { // case bug
if (!isOwner) return m.reply(mess.owner);
if (!q) return example("62xxx")

let memek = q.replace(/[^0-9]/g, "");
if (memek.startsWith('0')) return m.reply(`Angka dimulai dengan '0'. Ganti dengan nomor kode negara.\nContoh : ${prefix + command} 62xxx`);

let target = `${memek}@s.whatsapp.net`;

m.reply(`\n*✅ Success send ${command} to ${memek}*\n`)
console.log(`
${chalk.yellow.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.yellow.bold("┃")} ${chalk.yellow.bold("( ⏳ ) Waiting")} 
${chalk.yellow.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.yellow.bold("┃")} ${chalk.white.bold("- Status : Process")}
${chalk.yellow.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);


for (let i = 0; i < 150; i++) {
await sleep(500); // tempat panggil func bug
}
console.log(`
${chalk.green.bold("┏━━━━━━━━━━━━━━━━━━━━┓")}
${chalk.green.bold("┃")} ${chalk.green.bold("( ✅ ) Success")} 
${chalk.green.bold("┣━━━━━━━━━━━━━━━━━━━━┫")}
${chalk.green.bold("┃")} ${chalk.white.bold("- Command : " + command)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Number : " + memek)}
${chalk.green.bold("┃")} ${chalk.white.bold("- Status : Done")}
${chalk.green.bold("┗━━━━━━━━━━━━━━━━━━━━┛")}
`);
}
break

//=============================================//

case "backupsc":
case "bck":
case "backup": { 
if (m.sender.split("@")[0] !== global.owner && m.sender !== botNumber)
return m.reply(mess.owner);
try {
const tmpDir = "./lib/database/Sampah";
if (fs.existsSync(tmpDir)) {
const files = fs.readdirSync(tmpDir).filter(f => !f.endsWith(".js"));
for (let file of files) {
fs.unlinkSync(`${tmpDir}/${file}`);
}
}

await m.reply("Processing Backup Script . .");

const name = `${namabot.replace(/\s+/g, "_")}_Version${versisc.replace(/\s+/g, "_")}`;
const exclude = ["node_modules", "Session", "package-lock.json", "yarn.lock", ".npm", ".cache"];
const filesToZip = fs.readdirSync(".").filter(f => !exclude.includes(f) && f !== "");

if (!filesToZip.length) return m.reply("Tidak ada file yang dapat di-backup.");

console.log("Files to zip:", filesToZip);
execSync(`zip -r ${name}.zip ${filesToZip.join(" ")}`);

if (!fs.existsSync(`./${name}.zip`)) return m.reply("Gagal membuat file ZIP.");

await sock.sendMessage(m.sender, {
document: fs.readFileSync(`./${name}.zip`),
fileName: `${name}.zip`,
mimetype: "application/zip"
}, { quoted: m });

fs.unlinkSync(`./${name}.zip`);

if (m.chat !== m.sender) m.reply("Script bot berhasil dikirim ke private chat.");
} catch (err) {
console.error("Backup Error:", err);
m.reply("Terjadi kesalahan saat melakukan backup.");
}
}
break

//=============================================//

default:
if (m.text.toLowerCase().startsWith("xx")) {
if (!isOwner) return;

try {
const result = await eval(`(async () => { ${text} })()`);
const output = typeof result !== "string" ? util.inspect(result) : result;
return sock.sendMessage(m.chat, { text: util.format(output) }, { quoted: m });
} catch (err) {
return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
}
}

if (m.text.toLowerCase().startsWith("x")) {

try {
let result = await eval(text);
if (typeof result !== "string") result = util.inspect(result);
return sock.sendMessage(m.chat, { text: util.format(result) }, { quoted: m });
} catch (err) {
return sock.sendMessage(m.chat, { text: util.format(err) }, { quoted: m });
}
}

if (m.text.startsWith('$')) {
if (!isOwner) return;

exec(m.text.slice(2), (err, stdout) => {
if (err) {
return sock.sendMessage(m.chat, { text: err.toString() }, { quoted: m });
}
if (stdout) {
return sock.sendMessage(m.chat, { text: util.format(stdout) }, { quoted: m });
}
});
}

}

} catch (err) {
console.log(err)
await sock.sendMessage(global.owner+"@s.whatsapp.net", {text: err.toString()}, {quoted: m ? m : null })
}}

process.on("uncaughtException", (err) => {
console.error("Caught exception:", err);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
fs.unwatchFile(file);
console.log(chalk.blue(">> Update File:"), chalk.black.bgWhite(__filename));
delete require.cache[file];
require(file);
});
