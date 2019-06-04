'use strics';

const Telegraf = require('telegraf');
const fetch = require('node-fetch');

require('dotenv').config();

async function getAnimeList(query = '') {
    const animeFeed = await fetch('https://twist.moe/feed/anime?format=json')
        .then((res) => res.json())
        .then((res) => {
            return res.items
                .map((item) => {
                    return {
                        title: item['title'],
                        id: item['animetwist:id'],
                        image: `https://media.kitsu.io/anime/poster_images/${
                            item['kitsu:id']
                        }/small.jpg`,
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
    console.log(anime);
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

bot.launch();