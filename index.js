require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const playdl = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!play') || message.author.bot) return;

    const args = message.content.split(' ').slice(1);
    const query = args.join(' ');
    if (!query) return message.reply('❗ Provide a song name or URL.');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❗ Join a voice channel first.');

    try {
        // Search and stream
        let songInfo = await playdl.search(query, { limit: 1 });
        if (!songInfo.length) return message.reply('❌ No results found.');

        const stream = await playdl.stream(songInfo[0].url);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        message.reply(`🎶 Now playing: **${songInfo[0].title}**`);
    } catch (err) {
        console.error("⚠️ Error:", err);
        message.reply('❌ Error playing that song.');
    }
});

client.login(process.env.DISCORD_TOKEN);
