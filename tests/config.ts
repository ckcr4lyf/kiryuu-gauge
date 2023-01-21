import 'dotenv/config';

export const config = {
    KIRYUU_HOST: process.env.KIRYUU_HOST || 'http://127.0.0.1:6969',
    REDIS_HOST: process.env.REDIS_HOST || 'redis://127.0.0.1:6379',
}