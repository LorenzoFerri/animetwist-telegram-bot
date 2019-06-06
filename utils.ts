import fetch from 'node-fetch';
export async function getAnimeList(query = '') {
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
                );
        });

    return animeFeed;
}

export async function getLatestEpisodes() {
    const episodesFeed = await fetch(
        'https://twist.moe/feed/episodes?format=json',
        {},
    )
        .then((res) => res.json())
        .then((res) => {
            return res.items.map((item) => {
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
        });
    return episodesFeed;
}
