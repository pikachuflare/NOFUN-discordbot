"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const AWS = require("aws-sdk");
const Stream = require("stream");
const ytdl = require("ytdl-core");
const fs = require("fs");
const Quotes_1 = require("./Quotes");
const Links_1 = require("./Links");
const status = [
    { game: { name: "with ze waifu pillow!", type: "PLAYING", url: "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8" } },
    { game: { name: "!nofun help", type: "PLAYING", url: "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8" } },
    { game: { name: "\_RealDeal_.mp4", type: "WATCHING", url: "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8" } }
];
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    throw "Provide AWS credentials!";
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID.toString();
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY.toString();
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'eu-west-1'
});
const discord = new discord_js_1.Client();
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield discord.login(process.env.DISCORD_TOKEN);
        console.log("Discord Connected!");
        setInterval(() => {
            discord.user.setPresence(status[Math.floor(Math.random() * status.length)]).catch(console.error);
        }, 1000 * 10);
    });
}
const voiceMap = {};
const settingsMap = {};
function pollyTTS(msg, speaker, text) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!text)
            text = Quotes_1.textQuotes[Math.floor(Math.random() * Quotes_1.textQuotes.length)].toString();
        Polly.synthesizeSpeech({
            Text: text,
            VoiceId: speaker ? speaker : "Joey",
            OutputFormat: "mp3",
        }, ((err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            if (data.AudioStream instanceof Buffer) {
                const stream = new Stream.PassThrough();
                stream.end(data.AudioStream);
                playStream(msg, stream).catch(console.error);
            }
        }));
    });
}
function playYoutube(msg, url, volume) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!url.match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/)) {
            yield msg.reply("This is not a youtube link - worthless cunt!");
            return;
        }
        else {
            yield playStream(msg, ytdl(url, { filter: 'audioonly' }), volume);
        }
    });
}
function playStream(msg, stream, volume) {
    return __awaiter(this, void 0, void 0, function* () {
        yield joinVoice(msg);
        const dispatcher = voiceMap[msg.guild.id].playStream(stream, {
            passes: 5,
            volume: volume
        });
        dispatcher.once("end", reason => {
            if (reason === undefined)
                return;
            voiceMap[msg.guild.id].disconnect();
            delete voiceMap[msg.guild.id];
        });
    });
}
const help = "It’s your move.\n\n!nofun help - help\n" +
    "!nofun RealDeal.mp4\n" +
    "!nofun exposed\n" +
    "!nofun DTRASh\n" +
    "!nofun earrape\n" +
    "!nofun windowsxp\n" +
    "!nofun wii\n" +
    "!nofun ytmeme\n" +
    "\n!nofun play { url }\n" +
    "!nofun say { text }\n" +
    "!nofun invitelink\n" +
    "\n!nofun toggle\n" +
    "\n!nofun stop\n" +
    "!nofun pause\n" +
    "!nofun resume\n" +
    "\nPlz don not say NO FUN or I get triggered and I ban you from this Discord server - FOREVER :rage: \n";
function commands(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = msg.content.split(" ");
        console.log(new Date().toISOString() + " | " + msg.guild.name + "#" + msg.guild.id + " | " + msg.author.tag + " | " + msg.content);
        if (args.length === 1 || args[1] === "help") {
            yield msg.reply(help);
            return;
        }
        else if (args[1] === "stop") {
            if (voiceMap[msg.guild.id]) {
                voiceMap[msg.guild.id].disconnect();
                delete voiceMap[msg.guild.id];
                yield msg.reply("Okay - Worthless piece of shit I stop NOFUN! Pathetic cunt!");
            }
        }
        else if (args[1].toLowerCase() === "_realdeal_.mp4" || args[1].toLowerCase() === "realdeal.mp4") {
            yield playYoutube(msg, "https://youtu.be/MH_t2NIklMg");
        }
        else if (args[1].toLowerCase() === "exposed") {
            yield playYoutube(msg, "https://youtu.be/JysJqkueMoI");
        }
        else if (args[1].toLowerCase() === "dtrash") {
            yield playYoutube(msg, "https://youtu.be/McLbBiK-poE");
        }
        else if (args[1].toLowerCase() === "wii") {
            yield playYoutube(msg, "https://youtu.be/LYN6DRDQcjI", 0.5);
        }
        else if (args[1].toLowerCase() === "windowsxp") {
            yield playYoutube(msg, "https://youtu.be/6Joyj0dmkug", 10);
        }
        else if (args[1].toLowerCase() === "ytmeme") {
            yield playYoutube(msg, Links_1.links[Math.floor(Math.random() * Links_1.links.length)].toString(), 1);
        }
        else if (args[1].toLowerCase() === "play") {
            yield playYoutube(msg, args[2]);
        }
        else if (args[1].toLowerCase() === "pause") {
            if (voiceMap[msg.guild.id] && voiceMap[msg.guild.id].dispatcher)
                voiceMap[msg.guild.id].dispatcher.pause();
        }
        else if (args[1].toLowerCase() === "resume") {
            if (voiceMap[msg.guild.id] && voiceMap[msg.guild.id].dispatcher)
                voiceMap[msg.guild.id].dispatcher.resume();
        }
        else if (args[1].toLowerCase() === "say") {
            if (msg.content.length <= msg.content.indexOf("say") + 4 + 20)
                yield msg.reply("I don't care if you do this bullshit to me. But your message is to short!");
            else
                yield pollyTTS(msg, "Joey", msg.content.substring(msg.content.indexOf("say") + 4));
        }
        else if (args[1].toLowerCase() === "invitelink") {
            yield msg.reply("Add me PLZZZZZZ \nhttps://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8");
        }
        else if (args[1].toLowerCase() === "toggle") {
            if (!msg.member.hasPermission("ADMINISTRATOR"))
                yield msg.reply("I just find it pathetic with the way you act. Stop acting like a 7 year old. Show a little bot of respect for yourself. Scum");
            else
                getStetingsMap(msg.guild.id).nofunEnabled = !getStetingsMap(msg.guild.id).nofunEnabled;
        }
        else {
            yield msg.reply(help);
        }
    });
}
function getStetingsMap(guildID) {
    if (settingsMap[guildID])
        return settingsMap[guildID];
    settingsMap[guildID] = {
        nofunEnabled: true
    };
    return settingsMap[guildID];
}
function joinVoice(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.member.voiceChannel)
            voiceMap[msg.guild.id] = yield msg.member.voiceChannel.join();
        else
            yield msg.reply("Wtf do you want you pathetic cunt. Join a voice channel to use the !nofun command. Otherwise stfu wortless treash.");
    });
}
function noFun(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!getStetingsMap(msg.guild.id).nofunEnabled)
            return;
        if (msg.author.id === discord.user.id)
            return;
        console.log(new Date().toISOString() + " | " + msg.guild.name + "#" + msg.guild.id + " | " + msg.author.tag + " triggered RealDeal");
        if (!msg.guild.emojis.find((value) => value.name.toLowerCase() === "nofun")) {
            yield msg.guild.createEmoji(fs.readFileSync("emote.png"), "nofun");
        }
        yield msg.react(msg.guild.emojis.find((value) => value.name.toLowerCase() === "nofun"));
        if (msg.member.voiceChannel)
            yield pollyTTS(msg);
        else
            yield msg.reply(Quotes_1.totalQuotes[Math.floor(Math.random() * Quotes_1.totalQuotes.length)]);
    });
}
discord.on("message", (msg) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (msg.content.toUpperCase().match(/^!NOFUN/))
            yield commands(msg);
        else if (msg.content.toUpperCase().match(/NO *FUN/))
            yield noFun(msg);
    }
    catch (e) {
        console.error(e);
    }
}));
start().catch(console.error);
