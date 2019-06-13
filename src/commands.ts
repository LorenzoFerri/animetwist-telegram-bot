import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync.js';
import Telegraf, { ContextMessageUpdate, Extra, Markup } from 'telegraf';

import { Episode, getAnimeList, getLatestEpisodes } from './utils';
import { Client } from 'pg';

const adapter = new FileSync('db.json');
const db = lowdb(adapter);
db.defaults({ anime: {}, lastEpisodes: [], allFollowers: [] }).write();
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
        for (let anime of animes) {
            // const alreadyFollowing = db
            //     .get('anime.' + anime.title)
            //     // @ts-ignore: Missing
            //     .includes(chatId)
            //     .value();
            const alreadyFollowing = false;
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
    const allFollowers = db.get('allFollowers').value();
    if (!allFollowers.includes(chatId)) {
        db.get('allFollowers')
            // @ts-ignore: Missing type
            .push(chatId)
            .write();
        ctx.reply(
            'You will now receive update on every new anime! To unsub use the command /unsuball',
        );
    }
}

export async function unsuball(ctx: ContextMessageUpdate) {
    const chatId = ctx.chat.id;
    db.get('allFollowers')
        // @ts-ignore: Missing type
        .remove((a) => a == chatId)
        .write();
    ctx.reply('You will no longer receive update on every new anime.');
}

export async function list(ctx: ContextMessageUpdate) {
    const chatId = ctx.chat.id;
    const query = `
    SELECT title FROM anime 
    INNER JOIN follows
    ON anime.id = follows.anime_id
    WHERE follows.chat_id = ${chatId}`;
    const follows = await dataBase.query(query);
    const list = follows.rows.map((res) => res.title);
    if (list.length > 0) {
        ctx.reply(list.join('\n'));
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

export async function update(bot: Telegraf<ContextMessageUpdate>) {
    console.info('Fetching new episodes');
    const newEpisodes = await getLatestEpisodes();
    const lastEpisodes: Episode[] = db.get('lastEpisodes').value();
    let toSend;
    if (lastEpisodes && lastEpisodes.length > 0) {
        toSend = newEpisodes.filter(
            (e) => !lastEpisodes.some((old) => e.id == old.id),
        );
    } else {
        toSend = newEpisodes;
    }
    db.set('lastEpisodes', newEpisodes).write();
    for (let episode of toSend) {
        const animeFollowers: number[] =
            db.get('anime.' + episode.title).value() || [];
        const allFollowers: number[] = db.get('allFollowers').value() || [];
        const followers = Array.from(
            new Set([...animeFollowers, ...allFollowers]),
        );
        if (followers) {
            for (let user of followers) {
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
