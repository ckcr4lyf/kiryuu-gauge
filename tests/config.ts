import 'dotenv/config';

export const config = {
    KIRYUU_HOST: process.env.KIRYUU_HOST || 'http://127.0.0.1:6969',
    REDIS_HOST: process.env.REDIS_HOST || 'redis://127.0.0.1:6379',
    ANNOUNCE_IP_PORT: process.env.ANNOUNCE_IP_PORT || '7F000001115C', // 6 hex chars - 4 IP octets, 2 for port
}