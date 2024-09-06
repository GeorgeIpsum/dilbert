import * as cheerio from "cheerio";
import { Client, Events, GatewayIntentBits } from "discord.js";
import "dotenv/config";

const heroIcons = [];
const responses = [];

async function getAllHeroIcons() {
  return;
}

const wikiUrl = "https://dota2.fandom.com";

async function getVoiceLineFromPage(path: string) {
  const responsePage = await fetch(`${wikiUrl}${path}`);
  const $ = cheerio.load(await responsePage.text());

  $(".mw-parser-output>ul>li").each((_, el) => {
    const voiceline = $(el)
      .text()
      .replace(/\n/g, "")
      .replace("Link▶️", "")
      .trim()
      .replace(/u\s/g, "");

    const voicelineUrl = $(el).find("audio>source").attr("src");

    responses.push({ voiceline, voicelineUrl });
  });
}

async function getAllVoiceLines() {
  const responsesPage = await fetch(`${wikiUrl}/wiki/Category:Responses`);

  const responsesPageText = await responsesPage.text();
  const $ = cheerio.load(responsesPageText);

  const responseLinks: string[] = [];
  $("div.mw-category>div>ul>li>a")
    .each((_, el) => {
      const link = $(el).attr("href");
      if (link) {
        responseLinks.push(link);
      }
    })
    .filter(Boolean);

  await Promise.all(responseLinks.map(getVoiceLineFromPage));
}

async function main() {
  const fetchingData = true;
  const client = new Client({
    intents: [
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.MessageContent,
    ],
    failIfNotExists: true,
  });

  client.once(Events.ClientReady, (a) => {
    console.info("Discord client ready.");
    // Promise.all([getAllHeroIcons(), getAllVoiceLines()]).then(() => {
    //   console.info("All voice lines fetched.", {
    //     totalResponses: responses.length,
    //   });
    //   fetchingData = false;
    // });

    client.on(Events.MessageCreate, (message) => {
      console.log("message received");
      if (message.author.bot || message.webhookId) return;

      if (message.content === "!ping") {
        message
          .reply("Pong!")
          .then(() => {})
          .finally(() => {});
      }

      if (message.content.startsWith("!line") && !fetchingData) {
        const potentialVoiceLine = message.content.split("!line ")[1];
      }
    });

    client.on(Events.GuildAvailable, (guild) => {
      console.log("Guild available", guild.name);
    });

    client.guilds.client.on(Events.MessageCreate, (message) => {
      console.log("????");
    });
  });

  await client.login(process.env.DISCORD_TOKEN);
}

main()
  .catch(console.error)
  .finally(() => {});
