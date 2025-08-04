require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
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

  const input = message.content.split(' ').slice(1).join(' ');
  if (!input) return message.reply('❗ Please provide a song name or YouTube URL.');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('❗ You need to join a voice channel first.');

  try {
    let songUrl;

    if (playdl.validate(input)) {
      // Input is a valid URL
      songUrl = input;
    } else {
      // Search for the song on YouTube
      const results = await playdl.search(input, { limit: 1 });
      if (!results.length) return message.reply('❌ No results found for that song.');

      songUrl = results[0].url;
    }

    const stream = await playdl.stream(songUrl);

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    player.play(resource);
    connection.subscribe(player);

    message.reply(`🎶 Now playing: **${songUrl}**`);
  } catch (error) {
    console.error('Error playing song:', error);
    message.reply('❌ Error playing that song.');
  }
});

client.login(process.env.TOKEN);
