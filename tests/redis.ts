import * as crypto from 'crypto';
import { Step, DataStoreFactory } from 'gauge-ts';
import Redis from 'ioredis';

export const addPeers = async (infohash: string): Promise<Buffer[]> => {
    const peersAdded: Buffer[] = [];
    const client = new Redis(6379, '127.0.0.1');

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
        const peersAdded = await addPeers('4141414141414141414141414141414141414141');
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }
}