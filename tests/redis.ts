import * as crypto from 'crypto';
import { Step, DataStoreFactory } from 'gauge-ts';
import Redis from 'ioredis';
import { config } from './config';

const peerExists = (peer: Buffer, existing: Buffer[]): boolean => {
    return existing.some(existingPeer => peer.compare(existingPeer) === 0);
}

export const genUniquePeers = (count: number, existingPeers: Buffer[]): Buffer[] => {
    const generatedPeers = [];

    for (let i = 0; i < count; i++){
        let peer = crypto.randomBytes(6);
        
        // keep generating if not unique
        while (peerExists(peer, [...existingPeers, ...generatedPeers]) === true){
            peer = crypto.randomBytes(6);
        }

        generatedPeers.push(peer);
    }

    return generatedPeers;
}

export const addPeers = async (infohash: string): Promise<Buffer[]> => {
    const client = new Redis(config.REDIS_HOST);
    const seederKey = `${infohash}_seeders`;
    const peersToAdd = genUniquePeers(50, []);
    
    for (let i = 0; i < peersToAdd.length; i++){
        await client.zadd(seederKey, Date.now(), peersToAdd[i]);
    }

    return peersToAdd;
}

export default class RedisStuffs {
    @Step("Seed redis with seeders")
    public async seedRedis(){
        // Generate fake 20 byte "SHA"
        const sha = crypto.randomBytes(20);
        const peersAdded = await addPeers(sha.toString('hex'));
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }

    @Step("Add self as old seeder")
    public async addOldSeeder(){
        const client = new Redis(config.REDIS_HOST);
        const sha = crypto.randomBytes(20);
        const infohash = sha.toString('hex');
        const seederKey = `${infohash}_seeders`;

        // We will use 127.0.0.1:4444 as the peer we add
        const peer = Buffer.from([0x7F, 0x00, 0x00, 0x01, 0x11, 0x5C]); //127.0.0.1:4444
        
        await client.zadd(seederKey, 0, peer);
        console.log(`Added peer to ${seederKey}`);
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
    }

    @Step("Expect to be in redis with new timestamp")
    public async checkSelf(){
        const client = new Redis(config.REDIS_HOST);
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const infohash = sha.toString('hex');
        const seederKey = `${infohash}_seeders`;
        const result = await client.zrangebyscoreBuffer(seederKey, 0, '+inf', 'WITHSCORES');

        if (result.length !== 2){
            throw new Error(`Expected two entries in response, got ${result.length}. [Result = ${result}]`);
        }

        const score = parseInt(result[1].toString());
        const now = Date.now();

        // 10 seconds is generous
        if (now - score > 10000){
            throw new Error(`Expected diff to be within 10 seconds but was more! Now: ${now} , Score: ${score}`);
        }
    }
}