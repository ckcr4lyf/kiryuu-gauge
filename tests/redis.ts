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
}