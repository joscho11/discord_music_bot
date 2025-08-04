require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = '!';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("You need to be in a voice channel!");

    const query = args.join(' ');
    if (!query) return message.reply("Please provide a song name or YouTube link!");

    try {
      const stream = await play.stream(query);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      message.reply(`Now playing: ${query}`);
    } catch (error) {
      console.error(error);
      message.reply("Error playing that song.");
    }
  }

  if (command === 'stop') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply('Music stopped and disconnected.');
    } else {
      message.reply("I'm not connected to a voice channel.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
