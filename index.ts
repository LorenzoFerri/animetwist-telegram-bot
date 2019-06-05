import Telegraf from 'telegraf';
import { Extra, Markup, Context } from 'telegraf';
import fetch from 'node-fetch';

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
                .slice(0, 50);
        });

    return animeFeed;
}

async function getLatestEpisodes() {
    const episodesFeed = await fetch(
        'https://twist.moe/feed/episodes?format=json',
        {},
    )
        .then((res) => res.json())
        // .then((res) => res.items.map((item) => item['anime:title']));
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

bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    const anime = await getAnimeList(inlineQuery.query);
    const results = anime.map((item) => ({
        type: 'article',
        id: item.id,
        title: item.title,
        description: item.title,
        thumb_url: item.image,
        photo_url: item.image,
        message_text: `Added ${item.title} to your collection!`,
    }));
    return answerInlineQuery(results);
});

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
    for (let anime of animes) {
        ctx.replyWithHTML(
            `<b>${anime.title}</b>\n` +
                `<a href="${anime.image}">&#8205;</a>` +
                `<i>${anime.description}</i>\n` +
                `<a href="${anime.link}">Watch on Twist.moe</a>\n`,
            // @ts-ignore: Missing type
            Extra.markup(
                Markup.inlineKeyboard([
                    Markup.callbackButton(
                        `Follow ${anime.title}`,
                        `follow ${anime.title}`,
                    ),
                ]),
            ),
        );
    }
});

// @ts-ignore: Missing type
bot.action(/follow (.+)/g, async (ctx) => {
    ctx.editMessageReplyMarkup(
        Markup.inlineKeyboard([
            Markup.callbackButton(
                `Unfollow ${ctx.match[1]}`,
                `unfollow ${ctx.match[1]}`,
            ),
        ]),
    );
});

// @ts-ignore: Missing type
bot.action(/unfollow (.+)/g, async (ctx) => {
    ctx.editMessageReplyMarkup(
        Markup.inlineKeyboard([
            Markup.callbackButton(
                `Follow ${ctx.match[1]}`,
                `follow ${ctx.match[1]}`,
            ),
        ]),
    );
});

bot.launch();
