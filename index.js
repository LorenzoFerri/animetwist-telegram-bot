"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var telegraf_1 = require("telegraf");
var telegraf_2 = require("telegraf");
var lowdb = require("lowdb");
var FileSync = require("lowdb/adapters/Filesync");
var utils_1 = require("./utils");
var adapter = new FileSync('db.json');
var db = lowdb(adapter);
db.defaults({ anime: {}, lastEpisodes: [], allFollowers: [] }).write();
require('dotenv').config();
var bot = new telegraf_1["default"](process.env.BOT_TOKEN);
bot.start(function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var reply;
    return __generator(this, function (_a) {
        reply = "Anime Twist Bot\nHi use /search <anime name> and select an anime that you would like to receive notifications on new episodes";
        ctx.reply(reply);
        return [2 /*return*/];
    });
}); });
bot.command('search', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var query, animes, chatId, _i, animes_1, anime, alreadyFollowing, keyboard;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = ctx.update.message.text
                    .split(' ')
                    .slice(1)
                    .join(' ');
                if (!(query.length < 3)) return [3 /*break*/, 1];
                ctx.reply('Write at least 3 letters');
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, utils_1.getAnimeList(query)];
            case 2:
                animes = (_a.sent()).slice(0, 10);
                chatId = ctx.chat.id;
                for (_i = 0, animes_1 = animes; _i < animes_1.length; _i++) {
                    anime = animes_1[_i];
                    alreadyFollowing = db
                        .get('anime.' + anime.title)
                        // @ts-ignore: Missing
                        .includes(chatId)
                        .value();
                    keyboard = !alreadyFollowing
                        ? telegraf_2.Extra.markup(telegraf_2.Markup.inlineKeyboard([
                            telegraf_2.Markup.callbackButton("\u2705 Follow " + anime.title, "follow " + anime.title),
                        ]))
                        : telegraf_2.Extra.markup(telegraf_2.Markup.inlineKeyboard([
                            telegraf_2.Markup.callbackButton("\u274C Unfollow " + anime.title, "unfollow " + anime.title),
                        ]));
                    ctx.replyWithHTML("<b>" + anime.title + "</b>\n" +
                        ("<a href=\"" + anime.image + "\">&#8205;</a>") +
                        ("<i>" + anime.description + "</i>\n") +
                        ("<a href=\"" + anime.link + "\">Watch on Twist.moe</a>\n"), 
                    // @ts-ignore: Missing type
                    keyboard);
                }
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
bot.command('suball', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var chatId, allFollowers;
    return __generator(this, function (_a) {
        chatId = ctx.chat.id;
        allFollowers = db.get('allFollowers').value();
        if (!allFollowers.includes(chatId)) {
            db.get('allFollowers')
                // @ts-ignore: Missing type
                .push(chatId)
                .write();
            ctx.reply('You will now receive update on every new anime! To unsub use the command /unsuball');
        }
        return [2 /*return*/];
    });
}); });
bot.command('unsuball', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var chatId;
    return __generator(this, function (_a) {
        chatId = ctx.chat.id;
        db.get('allFollowers')
            // @ts-ignore: Missing type
            .remove(function (a) { return a == chatId; })
            .write();
        ctx.reply('You will no longer receive update on every new anime.');
        return [2 /*return*/];
    });
}); });
bot.command('list', function (ctx) {
    var chatId = ctx.chat.id;
    var allAnime = db.get('anime').value();
    var list = [];
    for (var anime in allAnime) {
        if (allAnime[anime].includes(chatId)) {
            list.push(anime);
        }
    }
    if (list.length > 0) {
        ctx.reply(list.join('\n'));
    }
    else {
        ctx.reply('You are not following any specific anime! Search for some using /search <anime name>');
    }
});
// @ts-ignore: Missing type
bot.action(/^follow (.+)/g, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var anime, chatId, followers;
    return __generator(this, function (_a) {
        anime = ctx.match[1];
        chatId = ctx.chat.id;
        followers = db.get('anime.' + anime).value();
        if (followers && !followers.includes(chatId)) {
            db.get('anime.' + anime)
                // @ts-ignore: Missing type
                .push(chatId)
                .uniq()
                .write();
        }
        else {
            db.set('anime.' + anime, [chatId]).write();
        }
        ctx.editMessageReplyMarkup(telegraf_2.Markup.inlineKeyboard([
            telegraf_2.Markup.callbackButton("\u274C Unfollow " + anime, "unfollow " + anime),
        ]));
        return [2 /*return*/];
    });
}); });
// @ts-ignore: Missing type
bot.action(/^unfollow (.+)/g, function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var anime, chatId;
    return __generator(this, function (_a) {
        anime = ctx.match[1];
        chatId = ctx.chat.id;
        db.get('anime.' + anime)
            // @ts-ignore: Missing type
            .remove(function (a) { return a == chatId; })
            .write();
        ctx.editMessageReplyMarkup(telegraf_2.Markup.inlineKeyboard([
            telegraf_2.Markup.callbackButton("\u2705 Follow " + anime, "follow " + anime),
        ]));
        return [2 /*return*/];
    });
}); });
bot.launch();
console.info('Bot started');
setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
    var newEpisodes, lastEpisodes, toSend, _i, toSend_1, episode, animeFollowers, allFollowers, followers, _a, followers_1, user;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.info('Fetching new episodes');
                return [4 /*yield*/, utils_1.getLatestEpisodes()];
            case 1:
                newEpisodes = _b.sent();
                lastEpisodes = db.get('lastEpisodes').value();
                if (lastEpisodes && lastEpisodes.length > 0) {
                    toSend = newEpisodes.filter(function (e) { return !lastEpisodes.some(function (old) { return e.id == old.id; }); });
                }
                else {
                    toSend = newEpisodes;
                }
                db.set('lastEpisodes', newEpisodes).write();
                for (_i = 0, toSend_1 = toSend; _i < toSend_1.length; _i++) {
                    episode = toSend_1[_i];
                    animeFollowers = db.get('anime.' + episode.title).value() || [];
                    allFollowers = db.get('allFollowers').value() || [];
                    followers = Array.from(new Set(animeFollowers.concat(allFollowers)));
                    if (followers) {
                        for (_a = 0, followers_1 = followers; _a < followers_1.length; _a++) {
                            user = followers_1[_a];
                            bot.telegram.sendMessage(user, "<b>" + episode.title + " - " + episode.episode + " </b>\n" +
                                ("<a href=\"" + episode.image + "\">&#8205;</a>") +
                                ("<i>" + episode.description + "</i>\n") +
                                ("<a href=\"" + episode.link + "\">Watch it now on Twist.moe</a>\n"), {
                                parse_mode: 'HTML'
                            });
                        }
                    }
                }
                return [2 /*return*/];
        }
    });
}); }, 120 * 1000);
