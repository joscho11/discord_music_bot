import discord
from discord.ext import commands
import yt_dlp
import os
from dotenv import load_dotenv
import asyncio

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')

@bot.command()
async def play(ctx, *, url):
    if ctx.author.voice is None:
        await ctx.send("You must be in a voice channel!")
        return

    channel = ctx.author.voice.channel
    voice = discord.utils.get(bot.voice_clients, guild=ctx.guild)
    if not voice:
        try:
            voice = await asyncio.wait_for(channel.connect(), timeout=15)
        except asyncio.TimeoutError:
            await ctx.send("Failed to connect to the voice channel (timeout).")
            return
        except Exception as e:
            await ctx.send(f"Failed to connect to the voice channel: {e}")
            return

    ydl_opts = {'format': 'bestaudio'}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        audio_url = info['url']

    if voice.is_playing():
        voice.stop()
    voice.play(discord.FFmpegPCMAudio(audio_url))
    await ctx.send(f"Now playing: {info['title']}")

bot.run(TOKEN)