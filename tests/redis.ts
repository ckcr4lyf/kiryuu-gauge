import * as crypto from 'crypto';
import { Step, DataStoreFactory } from 'gauge-ts';
import Redis from 'ioredis';
import { config } from './config';

type PeerPool = 's' | 'l';

const peerExists = (peer: Buffer, existing: Buffer[]): boolean => {
    return existing.some(existingPeer => peer.compare(existingPeer) === 0);
}

export const genUniquePeers = (count: number, existingPeers: Buffer[]): Buffer[] => {
    const generatedPeers = [];

    for (let i = 0; i < count; i++){
        let peer = crypto.randomBytes(6);
        
        while (peerExists(peer, [...existingPeers, ...generatedPeers]) === true){
            peer = crypto.randomBytes(6);
        }

        generatedPeers.push(peer);
    }

    return generatedPeers;
}

export const addPeers = async (infohash: Buffer, pool: PeerPool = 's'): Promise<Buffer[]> => {
    const client = new Redis(config.REDIS_HOST);
    const peerKey = Buffer.concat([infohash, Buffer.from(`:${pool}`)]);
    const peersToAdd = genUniquePeers(50, []);
    
    for (let i = 0; i < peersToAdd.length; i++){
        const dataToAdd = new Map<Buffer, Buffer>();
        dataToAdd.set(peersToAdd[i], Buffer.from([0x31]));
        await client.hset(peerKey, dataToAdd);
        await client.call("HEXPIRE", peerKey, 60 * 31, "FIELDS", 1, peersToAdd[i]);
    }

    await client.quit();
    return peersToAdd;
}

const callerPeer = (): Buffer => Buffer.from(config.ANNOUNCE_IP_PORT, 'hex');

const peerHashKey = (infohash: Buffer, pool: PeerPool): Buffer =>
    Buffer.concat([infohash, Buffer.from(`:${pool}`)]);

export default class RedisStuffs {
    @Step("Generate fresh infohash")
    public async generateFreshInfohash(){
        const sha = crypto.randomBytes(20);
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
    }

    @Step("Seed redis with seeders")
    public async seedRedis(){
        const sha = crypto.randomBytes(20);
        const peersAdded = await addPeers(sha, 's');
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }

    @Step("Seed redis with leechers")
    public async seedRedisLeechers(){
        const sha = crypto.randomBytes(20);
        const peersAdded = await addPeers(sha, 'l');
        DataStoreFactory.getScenarioDataStore().put('infohash', sha);
        DataStoreFactory.getScenarioDataStore().put('peersAdded', peersAdded);
    }

    @Step("Peer should exist in seeder hash")
    public async peerInSeederHash(){
        const client = new Redis(config.REDIS_HOST);
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const peer = callerPeer();
        const exists = await client.hexists(peerHashKey(sha, 's'), peer);
        await client.quit();

        if (exists !== 1) {
            throw new Error(`Expected peer ${peer.toString('hex')} in seeder hash`);
        }
    }

    @Step("Peer should not exist in seeder hash")
    public async peerNotInSeederHash(){
        const client = new Redis(config.REDIS_HOST);
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const peer = callerPeer();
        const exists = await client.hexists(peerHashKey(sha, 's'), peer);
        await client.quit();

        if (exists !== 0) {
            throw new Error(`Expected peer ${peer.toString('hex')} to be absent from seeder hash`);
        }
    }

    @Step("Peer should exist in leecher hash")
    public async peerInLeecherHash(){
        const client = new Redis(config.REDIS_HOST);
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const peer = callerPeer();
        const exists = await client.hexists(peerHashKey(sha, 'l'), peer);
        await client.quit();

        if (exists !== 1) {
            throw new Error(`Expected peer ${peer.toString('hex')} in leecher hash`);
        }
    }

    @Step("Peer should not exist in leecher hash")
    public async peerNotInLeecherHash(){
        const client = new Redis(config.REDIS_HOST);
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const peer = callerPeer();
        const exists = await client.hexists(peerHashKey(sha, 'l'), peer);
        await client.quit();

        if (exists !== 0) {
            throw new Error(`Expected peer ${peer.toString('hex')} to be absent from leecher hash`);
        }
    }
}
