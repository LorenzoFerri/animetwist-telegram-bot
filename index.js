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
var node_fetch_1 = require("node-fetch");
require('dotenv').config();
function getAnimeList(query) {
    if (query === void 0) { query = ''; }
    return __awaiter(this, void 0, void 0, function () {
        var animeFeed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fetch_1["default"]('https://twist.moe/feed/anime?format=json', {})
                        .then(function (res) { return res.json(); })
                        .then(function (res) {
                        return res.items
                            .map(function (item) {
                            return {
                                title: item['title'],
                                id: item['animetwist:id'],
                                image: "https://media.kitsu.io/anime/poster_images/" + item['kitsu:id'] + "/tiny.jpg"
                            };
                        })
                            .filter(function (item) {
                            return item.title.toLowerCase().includes(query.toLowerCase());
                        })
                            .slice(0, 50);
                    })];
                case 1:
                    animeFeed = _a.sent();
                    return [2 /*return*/, animeFeed];
            }
        });
    });
}
function getLatestEpisodes() {
    return __awaiter(this, void 0, void 0, function () {
        var episodesFeed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fetch_1["default"]('https://twist.moe/feed/episodes?format=json', {})
                        .then(function (res) { return res.json(); })
                        // .then((res) => res.items.map((item) => item['anime:title']));
                        .then(function (res) {
                        return res.items.map(function (item) {
                            return {
                                title: item['anime:title'],
                                episode: item['episode:number']
                            };
                        });
                    })];
                case 1:
                    episodesFeed = _a.sent();
                    return [2 /*return*/, episodesFeed];
            }
        });
    });
}
var bot = new telegraf_1["default"](process.env.BOT_TOKEN);
bot.on('inline_query', function (_a) {
    var inlineQuery = _a.inlineQuery, answerInlineQuery = _a.answerInlineQuery;
    return __awaiter(_this, void 0, void 0, function () {
        var anime, results;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getAnimeList(inlineQuery.query)];
                case 1:
                    anime = _b.sent();
                    results = anime.map(function (item) { return ({
                        type: 'article',
                        id: item.id,
                        title: item.title,
                        description: item.title,
                        thumb_url: item.image,
                        photo_url: item.image,
                        message_text: "Added " + item.title + " to your collection!"
                    }); });
                    return [2 /*return*/, answerInlineQuery(results)];
            }
        });
    });
});
bot.start(function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var reply;
    return __generator(this, function (_a) {
        reply = "Anime Twist Bot\nHi use @animetwist_bot <anime name> and select an anime that you would like to receive notifications on new episodes";
        ctx.reply(reply);
        return [2 /*return*/];
    });
}); });
bot.command('search', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
    var query, animes, _i, animes_1, anime;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                query = ctx.update.message.text
                    .split(' ')
                    .slice(1)
                    .join(' ');
                return [4 /*yield*/, getAnimeList(query)];
            case 1:
                animes = _a.sent();
                for (_i = 0, animes_1 = animes; _i < animes_1.length; _i++) {
                    anime = animes_1[_i];
                    ctx.replyWithHTML("\n<b>bold</b>, <strong>bold</strong>\n<i>italic</i>, <em>italic</em>\n<a href=\"http://www.example.com/\">inline URL</a>\n<a href=\"tg://user?id=123456789\">inline mention of a user</a>\n<code>inline fixed-width code</code>\n<pre>pre-formatted fixed-width code block</pre>\n<a href=\"" + anime.image + "\">&#8205;</a>\n        ");
                }
                return [2 /*return*/];
        }
    });
}); });
bot.launch();
