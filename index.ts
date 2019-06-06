import Telegraf from 'telegraf';
import { Extra, Markup, Context } from 'telegraf';
import fetch from 'node-fetch';
import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/Filesync';

const adapter = new FileSync('db.json');
const db = lowdb(adapter);
db.defaults({}).write();
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

async function getAnimeList(query = '') {
    const animeFeed = await fetch(
        'https://twist.moe/feed/anime?format=json',
        {},
    )
        .then((res) => res.json())
        .then((res) => {
            return res.items
                .map((item) => {
                    return {
                        title: item['title'],
                        id: item['animetwist:id'],
                        link: item['link'],
                        image: `https://media.kitsu.io/anime/poster_images/${
                            item['kitsu:id']
                        }/large.jpg`,
                        description: item['description'],
                    };
                })
                .filter((item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()),
                )
                .slice(0, 10);
        });

    return animeFeed;
}

async function getLatestEpisodes() {
    const episodesFeed = await fetch(
        'https://twist.moe/feed/episodes?format=json',
        {},
    )
        .then((res) => res.json())
        .then((res) => {
            return res.items.map((item) => {
                return {
                    title: item['anime:title'],
                    episode: item['episode:number'],
                };
            });
        });
    return episodesFeed;
}

bot.start(async (ctx) => {
    const reply = `Anime Twist Bot
Hi use /search <anime name> and select an anime that you would like to receive notifications on new episodes`;
    ctx.reply(reply);
});

bot.command('search', async (ctx: any) => {
    const query = ctx.update.message.text
        .split(' ')
        .slice(1)
        .join(' ');
    const animes = await getAnimeList(query);
    const chatId = ctx.chat.id;
    for (let anime of animes) {
        const alreadyFollowing = db
            .get(anime.title)
            // @ts-ignore: Missing
            .includes(chatId)
            .value();
        const keyboard = !alreadyFollowing
            ? Extra.markup(
                  Markup.inlineKeyboard([
                      Markup.callbackButton(
                          `✅ Follow ${anime.title}`,
                          `follow ${anime.title}`,
                      ),
                  ]),
              )
            : Extra.markup(
                  Markup.inlineKeyboard([
                      Markup.callbackButton(
                          `❌ Unfollow ${anime.title}`,
                          `unfollow ${anime.title}`,
                      ),
                  ]),
              );

        ctx.replyWithHTML(
            `<b>${anime.title}</b>\n` +
                `<a href="${anime.image}">&#8205;</a>` +
                `<i>${anime.description}</i>\n` +
                `<a href="${anime.link}">Watch on Twist.moe</a>\n`,
            // @ts-ignore: Missing type
            keyboard,
        );
    }
});

// @ts-ignore: Missing type
bot.action(/^follow (.+)/g, async (ctx) => {
    const anime = ctx.match[1];
    const chatId = ctx.chat.id;
    if (db.has(anime).value()) {
        db.get(anime)
            // @ts-ignore: Missing type
            .push(chatId)
            .write();
    } else {
        db.set(anime, [chatId]).write();
    }
    ctx.editMessageReplyMarkup(
        Markup.inlineKeyboard([
            Markup.callbackButton(`❌ Unfollow ${anime}`, `unfollow ${anime}`),
        ]),
    );
});

// @ts-ignore: Missing type
bot.action(/^unfollow (.+)/g, async (ctx) => {
    const anime = ctx.match[1];
    const chatId = ctx.chat.id;

    db.get(anime)
        // @ts-ignore: Missing type
        .remove((a) => a == chatId)
        .write();

    ctx.editMessageReplyMarkup(
        Markup.inlineKeyboard([
            Markup.callbackButton(`✅ Follow ${anime}`, `follow ${anime}`),
        ]),
    );
});

bot.launch();
setInterval(async () => {
    const newEpisodes = await getLatestEpisodes();
    const lastEpisodes = db.get('lastEpisodes').value();
    let toSend;
    if (lastEpisodes) {
        toSend = newEpisodes.filter((e) => lastEpisodes.includes(e));
    } else {
        toSend = newEpisodes;
    }
    db.set('lastEpisodes', newEpisodes).write();
    for (let episode of toSend) {
        const followers = db.get(episode.title).value();
        if (followers) {
            for (let user of followers) {
                bot.telegram.sendMessage(user, episode.title + episode.episode);
            }
        }
    }
}, 5000);