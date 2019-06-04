import Telegraf from 'telegraf';
import fetch from 'node-fetch';

require('dotenv').config();

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
                        image: `https://media.kitsu.io/anime/poster_images/${
                            item['kitsu:id']
                        }/tiny.jpg`,
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

const bot = new Telegraf(process.env.BOT_TOKEN);

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
Hi use @animetwist_bot <anime name> and select an anime that you would like to receive notifications on new episodes`;
    ctx.reply(reply);
});

bot.command('search', async (ctx) => {
    const query = ctx.update.message.text
        .split(' ')
        .slice(1)
        .join(' ');
    const animes = await getAnimeList(query);
    for (let anime of animes) {
        ctx.replyWithHTML(`
<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<a href="${anime.image}">&#8205;</a>
        `);
    }
});

bot.launch();
