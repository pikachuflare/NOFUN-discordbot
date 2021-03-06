import {Client, Message, PresenceData, Snowflake, VoiceConnection} from "discord.js";
import * as AWS from "aws-sdk"
import * as Stream from "stream"
import * as ytdl from "ytdl-core"
import * as fs from "fs";
import {VoiceId} from "aws-sdk/clients/polly";
import {Readable} from "stream";
import {textQuotes, totalQuotes} from "./Quotes";
import {links} from "./Links";
import {message} from "aws-sdk/clients/sns";

const status : PresenceData[] = [
    {game : {name : "with ze waifu pillow!", type : "PLAYING", url : "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8"}},
    {game : {name : "!nofun help", type :  "PLAYING" , url : "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8"}},
    {game : {name : "\_RealDeal_.mp4", type :  "WATCHING" , url : "https://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8"}}
];

if(!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)
    throw "Provide AWS credentials!";

AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID.toString();
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY.toString();

// Create an Polly client
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'eu-west-1'
});

const discord = new Client();

async function start() {
    await discord.login(process.env.DISCORD_TOKEN);
    console.log("Discord Connected!");

    setInterval(() => {
        discord.user.setPresence(status[Math.floor(Math.random()*status.length)]).catch(console.error);
    }, 1000 * 10);
}

interface Settings {
    nofunEnabled : boolean
}

const voiceMap : { [guild : string]: VoiceConnection} = {};
const settingsMap : { [guild : string]: Settings} = {};


async function pollyTTS(msg : Message, speaker? : VoiceId, text? : string){
    if(!text) text = textQuotes[Math.floor(Math.random()*textQuotes.length)].toString();
    Polly.synthesizeSpeech({
        Text : text,
        VoiceId: speaker ? speaker : "Joey",
        OutputFormat : "mp3",
    }, ((err, data) => {
        if(err) {
            console.error(err);
            return;
        }
        if (data.AudioStream instanceof Buffer) {
            const stream = new Stream.PassThrough();
            stream.end(data.AudioStream);
            playStream(msg, stream).catch(console.error)
        }
    }));
}

async function playYoutube(msg : Message, url : string, volume? : number){
    if(!url.match(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/)){
        await msg.reply("This is not a youtube link - worthless cunt!");
        return;
    } else {
        await playStream(msg, ytdl(url, { filter : 'audioonly'}), volume)
    }

}

async function playStream(msg : Message, stream : Readable, volume? : number | 1){
    await joinVoice(msg);
    const dispatcher = voiceMap[msg.guild.id].playStream(stream, {
        passes : 5,
        volume : volume
    });
    dispatcher.once("end", reason => {
        if(reason === undefined) return;
        voiceMap[msg.guild.id].disconnect();
        delete voiceMap[msg.guild.id];
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


async function commands(msg : Message){
    const args = msg.content.split(" ");
    console.log(new Date().toISOString() + " | "+ msg.guild.name +"#" +msg.guild.id + " | " + msg.author.tag + " | " + msg.content);

    if(args.length === 1 || args[1] === "help"){
        await msg.reply(help);
        return;
    } else if (args[1] === "stop"){
        if(voiceMap[msg.guild.id]){
            voiceMap[msg.guild.id].disconnect();
            delete voiceMap[msg.guild.id];
            await msg.reply("Okay - Worthless piece of shit I stop NOFUN! Pathetic cunt!")
        }
    } else if (args[1].toLowerCase() === "_realdeal_.mp4" || args[1].toLowerCase() === "realdeal.mp4" ){
        await playYoutube(msg, "https://youtu.be/MH_t2NIklMg")

    } else if (args[1].toLowerCase() === "exposed"){
        await playYoutube(msg, "https://youtu.be/JysJqkueMoI")

    } else if (args[1].toLowerCase() === "dtrash"){
        await playYoutube(msg, "https://youtu.be/McLbBiK-poE")

    } else if (args[1].toLowerCase() === "wii"){
        await playYoutube(msg, "https://youtu.be/LYN6DRDQcjI", 0.5)

    } else if (args[1].toLowerCase() === "windowsxp"){
        await playYoutube(msg, "https://youtu.be/6Joyj0dmkug", 10)

    } else if (args[1].toLowerCase() === "ytmeme"){
        await playYoutube(msg, links[Math.floor(Math.random()*links.length)].toString(), 1)

    } else if (args[1].toLowerCase() === "play") {
        await playYoutube(msg, args[2])

    } else if (args[1].toLowerCase() === "pause"){
        if(voiceMap[msg.guild.id] && voiceMap[msg.guild.id].dispatcher) voiceMap[msg.guild.id].dispatcher.pause()

    } else if (args[1].toLowerCase() === "resume"){
        if(voiceMap[msg.guild.id] && voiceMap[msg.guild.id].dispatcher) voiceMap[msg.guild.id].dispatcher.resume()

    } else if(args[1].toLowerCase() === "say"){
        if(msg.content.length <= msg.content.indexOf("say") + 4 + 20)
            await msg.reply("I don't care if you do this bullshit to me. But your message is to short!");
         else
            await pollyTTS(msg, "Joey", msg.content.substring(msg.content.indexOf("say") + 4))

    } else if(args[1].toLowerCase() === "invitelink"){
        await msg.reply("Add me PLZZZZZZ \nhttps://discordapp.com/oauth2/authorize?client_id=481915476256096267&scope=bot&permissions=8" )

    } else if(args[1].toLowerCase() === "toggle"){
        if(!msg.member.hasPermission("ADMINISTRATOR"))
            await msg.reply("I just find it pathetic with the way you act. Stop acting like a 7 year old. Show a little bot of respect for yourself. Scum");
        else
            getStetingsMap(msg.guild.id).nofunEnabled = !getStetingsMap(msg.guild.id).nofunEnabled;
    } else {
        await msg.reply(help)
    }
}

function getStetingsMap(guildID : Snowflake){
    if(settingsMap[guildID]) return settingsMap[guildID];

    settingsMap[guildID] = {
        nofunEnabled : true
    };

    return settingsMap[guildID];
}

async function joinVoice(msg : Message){
    if (msg.member.voiceChannel)
        voiceMap[msg.guild.id] = await msg.member.voiceChannel.join();
    else await msg.reply("Wtf do you want you pathetic cunt. Join a voice channel to use the !nofun command. Otherwise stfu wortless treash.")
}

async function noFun(msg : Message){
    if(!getStetingsMap(msg.guild.id).nofunEnabled) return;
    if(msg.author.id === discord.user.id) return;
    console.log(new Date().toISOString() + " | " + msg.guild.name +"#" +msg.guild.id + " | " + msg.author.tag + " triggered RealDeal");

    if(!msg.guild.emojis.find((value) => value.name.toLowerCase() === "nofun")){
        await msg.guild.createEmoji(fs.readFileSync("emote.png"), "nofun") ;
    }

    await msg.react(msg.guild.emojis.find((value) => value.name.toLowerCase() === "nofun"));

    if (msg.member.voiceChannel) await pollyTTS(msg);
    else await msg.reply(totalQuotes[Math.floor(Math.random()*totalQuotes.length)]);
}

discord.on("message", async msg =>{
    try{
        if(msg.content.toUpperCase().match(/^!NOFUN/))
            await commands(msg);
         else if (msg.content.toUpperCase().match(/NO *FUN/))
            await noFun(msg);
    } catch (e){
        console.error(e)
    }
});


start().catch(console.error);