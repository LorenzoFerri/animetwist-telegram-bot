import { Client } from 'pg';
import Telegraf, { ContextMessageUpdate, Extra, Markup } from 'telegraf';

import { getAnimeList, getLatestEpisodes } from './utils';

require('dotenv').config();

const dataBase = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

dataBase.connect().then(() => console.log('db Connected'));

export async function search(ctx: ContextMessageUpdate) {
    const query = ctx.update.message.text
        .split(' ')
        .slice(1)
        .join(' ');
    if (query.length < 3) {
        ctx.reply('Write at least 3 letters');
    } else {
        const animes = (await getAnimeList(query)).slice(0, 10);
        const chatId = ctx.chat.id;
        const alreadyFollowingQuery = `SELECT anime_id FROM follows WHERE chat_id=${chatId}`;
        const alreadyFollowingList: number[] = (await dataBase.query(
            alreadyFollowingQuery,
        )).rows.map((row) => row.anime_id);
        for (const anime of animes) {
            const alreadyFollowing = alreadyFollowingList.includes(anime.id);
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
    }
}

export async function suball(ctx: ContextMessageUpdate) {
    const chatId = ctx.chat.id;
    const instert = `
    INSERT INTO all_followers (chat_id)
    VALUES (${chatId})
    ON CONFLICT DO NOTHING`;
    const select = `SELECT chat_id FROM all_followers WHERE chat_id=${chatId}`;
    const selectResult = await dataBase.query(select);
    if (selectResult.rowCount === 0) {
        dataBase.query(instert).then(() => {
            ctx.reply(
                'You will now receive update on every new anime! To unsub use the command /unsuball',
            );
        });
    }
}

export async function unsuball(ctx: ContextMessageUpdate) {
    const chatId = ctx.chat.id;
    const query = `DELETE FROM all_followers WHERE chat_id=${chatId}`;
    const result = await dataBase.query(query);
    if (result.rowCount > 0) {
        ctx.reply('You will no longer receive update on every new anime.');
    }
}

export async function list(ctx: ContextMessageUpdate) {
    const chatId = ctx.chat.id;
    const query = `
    SELECT title FROM anime
    INNER JOIN follows
    ON anime.id = follows.anime_id
    WHERE follows.chat_id = ${chatId}`;
    const follows = await dataBase.query(query);
    const animeList = follows.rows.map((res) => res.title);
    if (animeList.length > 0) {
        ctx.reply(animeList.join('\n'));
    } else {
        ctx.reply(
            'You are not following any specific anime! Search for some using /search <anime name>',
        );
    }
}

export async function follow(ctx: ContextMessageUpdate & { match: string[] }) {
    const anime = ctx.match[1];
    const queryId = await dataBase.query(
        `SELECT id FROM anime WHERE title = '${anime.replace(/'/g, "''")}'`,
    );
    const animeId = queryId.rows[0].id;
    const chatId = ctx.chat.id;
    const query = `
    INSERT INTO follows (chat_id,anime_id)
    VALUES (${chatId},${animeId})
    ON CONFLICT DO NOTHING;`;
    dataBase.query(query).then(() => {
        ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                Markup.callbackButton(
                    `❌ Unfollow ${anime}`,
                    `unfollow ${anime}`,
                ),
            ]),
        );
    });
}

export async function unfollow(
    ctx: ContextMessageUpdate & { match: string[] },
) {
    const anime = ctx.match[1];
    const queryId = await dataBase.query(
        `SELECT id FROM anime WHERE title = '${anime.replace(/'/g, "''")}'`,
    );
    const animeId = queryId.rows[0].id;
    const chatId = ctx.chat.id;
    const query = `
    DELETE FROM follows WHERE
    chat_id = ${chatId} AND
    anime_id = ${animeId};`;
    dataBase.query(query).then(() => {
        ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([
                Markup.callbackButton(`✅ Follow ${anime}`, `follow ${anime}`),
            ]),
        );
    });
}

async function fetchAnimeAndSeed() {
    const animeList = await getAnimeList();
    const values = animeList.map(
        (anime) => `(${anime.id},'${anime.title.replace(/'/g, "''")}')`,
    );
    const query = `INSERT INTO anime (id,title) VALUES ${values.join(
        ',\n',
    )} ON CONFLICT (id) DO NOTHING;`;
    return dataBase.query(query);
}
export async function update(bot: Telegraf<ContextMessageUpdate>) {
    await fetchAnimeAndSeed();
    console.info('Fetching new episodes');
    const newEpisodes = await getLatestEpisodes();
    const lastEpisodes = (await dataBase.query(
        `SELECT anime_id, episode FROM last_episodes`,
    )).rows;

    const toSend = newEpisodes.filter((episode) => {
        return !lastEpisodes.some(
            (row: { anime_id: number; episode: number }) =>
                row.anime_id === episode.id && row.episode === episode.episode,
        );
    });

    await dataBase.query('TRUNCATE TABLE last_episodes');
    const toWrite = newEpisodes.map(
        (episode) => `(${episode.id},${episode.episode})`,
    );
    const writeQuery = `
    INSERT INTO last_episodes (anime_id,episode)
    VALUES ${toWrite.join(',\n')}`;
    await dataBase.query(writeQuery);

    for (const episode of toSend) {
        const animeFollowers: number[] = (await dataBase.query(
            `SELECT chat_id FROM follows WHERE anime_id=${episode.id}`,
        )).rows.map((row: { chat_id: number }) => row.chat_id);
        const allFollowers: number[] = (await dataBase.query(
            'SELECT * FROM all_followers',
        )).rows.map((row: { chat_id: number }) => row.chat_id);
        const followers = Array.from(
            new Set([...animeFollowers, ...allFollowers]),
        );
        if (followers) {
            for (const user of followers) {
                bot.telegram.sendMessage(
                    user,
                    `<b>${episode.title} - ${episode.episode} </b>\n` +
                        `<a href="${episode.image}">&#8205;</a>` +
                        `<i>${episode.description}</i>\n` +
                        `<a href="${
                            episode.link
                        }">Watch it now on Twist.moe</a>\n`,
                    {
                        parse_mode: 'HTML',
                    },
                );
            }
        }
    }
}
