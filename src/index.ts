import Telegraf from 'telegraf';
import {
    follow,
    list,
    search,
    suball,
    unfollow,
    unsuball,
    update,
} from './commands';
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    const reply = `Anime Twist Bot
Hi use /search <anime name> and select an anime that you would like to receive notifications on new episodes`;
    ctx.reply(reply);
});

bot.command('search', search);
bot.command('suball', suball);
bot.command('unsuball', unsuball);
bot.command('list', list);
// @ts-ignore: Missing type
bot.action(/^follow (.+)/g, follow);
// @ts-ignore: Missing type
bot.action(/^unfollow (.+)/g, unfollow);
bot.launch();

console.info('Bot started');

setInterval(() => update(bot), 120 * 1000);
