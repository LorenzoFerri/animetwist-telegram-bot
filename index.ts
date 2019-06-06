import Telegraf from 'telegraf';
import { Extra, Markup, Context } from 'telegraf';
import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/Filesync';
import { getAnimeList, getLatestEpisodes } from './utils';
const adapter = new FileSync('db.json');
const db = lowdb(adapter);
db.defaults({ anime: {}, lastEpisodes: [], allFollowers: [] }).write();
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

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
    if (query.length < 3) {
        ctx.reply('Write at least 3 letters');
    } else {
        const animes = (await getAnimeList(query)).slice(0, 10);
        const chatId = ctx.chat.id;
        for (let anime of animes) {
            const alreadyFollowing = db
                .get('anime.' + anime.title)
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
    }
});

bot.command('suball', async (ctx: any) => {
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
});

bot.command('unsuball', async (ctx: any) => {
    const chatId = ctx.chat.id;
    db.get('allFollowers')
        // @ts-ignore: Missing type
        .remove((a) => a == chatId)
        .write();
    ctx.reply('You will no longer receive update on every new anime.');
});

bot.command('list', (ctx) => {
    const chatId = ctx.chat.id;
    const allAnime = db.get('anime').value();
    let list = [];
    for (let anime in allAnime) {
        if (allAnime[anime].includes(chatId)) {
            list.push(anime);
        }
    }

    if (list.length > 0) {
        ctx.reply(list.join('\n'));
    } else {
        ctx.reply(
            'You are not following any specific anime! Search for some using /search <anime name>',
        );
    }
});

// @ts-ignore: Missing type
bot.action(/^follow (.+)/g, async (ctx) => {
    const anime = ctx.match[1];
    const chatId = ctx.chat.id;
    const followers = db.get('anime.' + anime).value();
    if (followers && !followers.includes(chatId)) {
        db.get('anime.' + anime)
            // @ts-ignore: Missing type
            .push(chatId)
            .uniq()
            .write();
    } else {
        db.set('anime.' + anime, [chatId]).write();
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

    db.get('anime.' + anime)
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
}, 120 * 1000);
