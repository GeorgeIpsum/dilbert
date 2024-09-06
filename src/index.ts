import * as cheerio from "cheerio";
import { Client, Events, GatewayIntentBits, MessagePayload } from "discord.js";
import "dotenv/config";

const heroIcons = [];
const heroList: string[] = [];
const responses: {
  voiceline: string;
  voicelineUrl: string;
  voicelineData?: Buffer;
  hero?: string;
}[] = [];

async function getAllHeroIcons() {
  return;
}

const wikiUrl = "https://dota2.fandom.com";

async function getVoiceLineFromPage(path: string) {
  const responsePage = await fetch(`${wikiUrl}${path}`);
  const $ = cheerio.load(await responsePage.text());
  const header = $("h1").text().split("/")[0].trim();

  // callbacks + event loop is weird
  const isHero = heroList.includes(header);
  console.log(isHero, header);

  $(".mw-parser-output>ul>li").each((_, el) => {
    const voiceline = $(el)
      .text()
      .replace(/\n/g, "")
      .replace("Link▶️", "")
      .trim()
      .replace(/u\s/g, "");

    const voicelineUrl = $(el).find("audio>source").attr("src");
    if (voicelineUrl && voiceline)
      responses.push({
        voiceline,
        voicelineUrl,
        hero: isHero ? header : undefined,
      });
  });
}

async function getAllVoiceLines() {
  const dotaHeroesHtml = await (
    await fetch("https://www.dotafire.com/dota-2/heroes")
  ).text();
  const $2 = cheerio.load(dotaHeroesHtml);

  $2("div.hero-name").each((_, el) => {
    heroList.push($2(el).text());
  });

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
  let fetchingData = true;
  const client = new Client({
    intents: [
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
    failIfNotExists: true,
  });

  client.on(Events.ClientReady, (a) => {
    console.info("Discord client ready.");
    Promise.all([getAllHeroIcons(), getAllVoiceLines()]).then(() => {
      console.info("All voice lines fetched.", {
        totalResponses: responses.length,
      });
      fetchingData = false;
    });

    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot || message.webhookId) return;

      if (message.content === "!ping") {
        message
          .reply("Pong!")
          .then(() => {})
          .finally(() => {});
      }

      if (message.content.startsWith("!line") && !fetchingData) {
        const potentialVoiceLine = message.content
          .split("!line ")[1]
          .toLowerCase();
        const matchedVoiceline = responses.find(({ voiceline }) => {
          return voiceline
            .toLowerCase()
            .includes(potentialVoiceLine.toLowerCase());
        });
        console.log({ potentialVoiceLine, matchedVoiceline });

        if (matchedVoiceline) {
          if (!matchedVoiceline.voicelineData) {
            const buffer = await fetch(matchedVoiceline.voicelineUrl).then(
              (res) => res.arrayBuffer(),
            );
            matchedVoiceline.voicelineData = Buffer.from(buffer);
          }

          message.reply({
            // content: `${matchedVoiceline.hero}: ${matchedVoiceline.voiceline}`,
            files: [
              {
                attachment: matchedVoiceline.voicelineData,
                name: `${matchedVoiceline.voiceline.replace("sg", "_").toUpperCase()}.mp3`,
              },
            ],
          });
        }
      }
    });

    client.on(Events.GuildAvailable, (guild) => {
      console.log("Guild available", guild.name);
    });

    client.on("debug", (message) => {
      console.log(message);
    });
    client.on("error", (e) => {
      console.log(e);
    });
  });

  await client.login(process.env.DISCORD_TOKEN);
}

main()
  .catch(console.error)
  .finally(() => {});
