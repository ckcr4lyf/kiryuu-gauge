import * as crypto from 'crypto';
import { Step, DataStoreFactory } from 'gauge-ts';
import Redis from 'ioredis';
import { config } from './config';

export const addPeers = async (infohash: string): Promise<Buffer[]> => {
    const peersAdded: Buffer[] = [];
    const client = new Redis(config.REDIS_HOST);

    const seederKey = `${infohash}_seeders`;
    
    for (let i = 0; i < 50; i++){
        const peerInfo = crypto.randomBytes(6);
        console.log(`adding`, peerInfo)
        await client.zadd(seederKey, Date.now(), peerInfo);
        peersAdded.push(peerInfo);
    }

    // const a = await client.zrangeBuffer(seederKey, 0, 50);

    return peersAdded
}

export default class RedisStuffs {
    @Step("Seed redis with seeders")
    public async seedRedis(){
        // Generate fake 20 byte "SHA"
        const sha = crypto.randomBytes(20);
        const peersAdded = await addPeers(sha.toString('hex'));
        console.log(`Added to ${sha.toString('hex')}`);
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }
}