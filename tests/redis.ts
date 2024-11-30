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

export const addPeers = async (infohash: Buffer): Promise<Buffer[]> => {
    const client = new Redis(config.REDIS_HOST);
    const seederKey = Buffer.concat([infohash, Buffer.from(":s")]); // `${20 RAW BYTES}:s`
    const peersToAdd = genUniquePeers(50, []);
    
    for (let i = 0; i < peersToAdd.length; i++){
        const dataToAdd = new Map<Buffer, Buffer>();
        dataToAdd.set(peersToAdd[i], Buffer.from([0x31]));
        await client.hset(seederKey, dataToAdd);
        await client.call("HEXPIRE", seederKey, 60 * 31, "FIELDS", 1, peersToAdd[i]);
    }

    return peersToAdd;
}

export default class RedisStuffs {
    @Step("Seed redis with seeders")
    public async seedRedis(){
        // Generate fake 20 byte "SHA"
        const sha = crypto.randomBytes(20);
        const peersAdded = await addPeers(sha);
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }

    @Step("Add self as old seeder")
    public async addOldSeeder(){
        const client = new Redis(config.REDIS_HOST);
        const sha = crypto.randomBytes(20);
        const infohash = sha.toString('hex');
        const seederKey = `${infohash}_seeders`;
        const peer = Buffer.from(config.ANNOUNCE_IP_PORT, 'hex'); // e.g. 7F000001115C (0x7F = 127, 0x115C = 4444)
        
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
            throw new Error(`Expected two entries in response, got ${result.length}. [Result = ${result.map(el => el.toString('hex'))}]`);
        }

        const score = parseInt(result[1].toString());
        const now = Date.now();

        // 10 seconds is generous
        if (now - score > 10000){
            throw new Error(`Expected diff to be within 10 seconds but was more! Now: ${now} , Score: ${score}`);
        }
    }
}