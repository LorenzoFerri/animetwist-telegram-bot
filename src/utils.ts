import fetch from 'node-fetch';
export interface Anime {
    title: string;
    id: number;
    link: string;
    image: string;
    description: string;
}

export interface Episode extends Anime {
    episode: number;
}

interface AnimeTwistAnime {
    title: string;
    description: string;
    link: string;
    guid: {
        ispermalink: boolean;
        text: number;
    };
    pubdate: Date;
    'anime:title': string;
    'animetwist:id': number;
    'kitsu:id': number;
    'mal:id': number;
}
interface EpisodeFetch extends AnimeTwistAnime {
    'episode:number': number;
}

interface AnimeFetch extends AnimeTwistAnime {
    'anime:ongoing': boolean;
    'animetwist:slug': string;
}
export async function getAnimeList(query = '') {
    const animeFeed: Anime[] = await fetch(
        'https://twist.moe/feed/anime?format=json',
    )
        .then((res) => res.json())
        .then((res) => {
            return res.items
                .map((item: AnimeFetch) => {
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
                .filter((item: Anime) =>
                    item.title.toLowerCase().includes(query.toLowerCase()),
                );
        })
        .catch((reason) => {
            console.error("Can't fetch animes: ", reason);
        });

    return animeFeed;
}

export async function getLatestEpisodes() {
    const episodesFeed: Episode[] = await fetch(
        'https://twist.moe/feed/episodes?format=json',
    )
        .then((res) => res.json())
        .then((res) => {
            return res.items.map((item: EpisodeFetch) => {
                return {
                    title: item['anime:title'],
                    episode: item['episode:number'],
                    description: item['description'],
                    link: item['link'],
                    id: item['animetwist:id'],
                    image: `https://media.kitsu.io/anime/poster_images/${
                        item['kitsu:id']
                    }/large.jpg`,
                };
            });
        })
        .catch((reason) => {
            console.error("Can't fetch episodes: ", reason);
        });
    return episodesFeed;
}
