import { Client } from 'pg';
import { getAnimeList } from './utils';

require('dotenv').config();
const dataBase = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});
dataBase.connect();

(async () => {
    const animeList = await getAnimeList();
    const values = animeList.map(
        (anime) => `(${anime.id},'${anime.title.replace(/'/g, "''")}')`,
    );
    const query = `INSERT INTO anime (id,title) VALUES ${values.join(
        ',\n',
    )} ON CONFLICT (id) DO NOTHING;`;
    console.log(query);
    dataBase.query(query).then(() => console.log('Done!'));

    // const query = "SELECT id FROM anime WHERE title = 'Kakegurui'";
    // const res = await dataBase.query(query);
    // console.log(res.rows[0].id);
})();
