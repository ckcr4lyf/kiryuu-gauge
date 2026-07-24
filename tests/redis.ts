import * as crypto from 'crypto';
import { Step, DataStoreFactory } from 'gauge-ts';
import axios from 'axios';
import { strictEqual } from 'assert';
import { config } from './config';
import { urlEncodeBuffer } from './utils';

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

export const addPeers = async (infohash: Buffer, pool: 's' | 'l' = 's'): Promise<Buffer[]> => {
    const peersToAdd = genUniquePeers(50, []);
    const body = Buffer.concat(peersToAdd);

    const result = await axios.post(
        `${config.KIRYUU_HOST}/test/seed?info_hash=${urlEncodeBuffer(infohash)}&pool=${pool}`,
        body,
        {
            headers: { 'Content-Type': 'application/octet-stream' },
            validateStatus: () => true,
        },
    );

    strictEqual(result.status, 200, `Fail, expected HTTP 200 seeding peers, received ${result.status}`);

    return peersToAdd;
}

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
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const result = await axios.get(
            `${config.KIRYUU_HOST}/test/peer-exists?info_hash=${urlEncodeBuffer(sha)}&pool=s&port=4444`,
            { validateStatus: () => true },
        );
        strictEqual(result.status, 200, `Fail, expected peer in seeder hash, received HTTP ${result.status}`);
    }

    @Step("Peer should not exist in seeder hash")
    public async peerNotInSeederHash(){
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const result = await axios.get(
            `${config.KIRYUU_HOST}/test/peer-exists?info_hash=${urlEncodeBuffer(sha)}&pool=s&port=4444`,
            { validateStatus: () => true },
        );
        strictEqual(result.status, 404, `Fail, expected peer absent from seeder hash, received HTTP ${result.status}`);
    }

    @Step("Peer should exist in leecher hash")
    public async peerInLeecherHash(){
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const result = await axios.get(
            `${config.KIRYUU_HOST}/test/peer-exists?info_hash=${urlEncodeBuffer(sha)}&pool=l&port=4444`,
            { validateStatus: () => true },
        );
        strictEqual(result.status, 200, `Fail, expected peer in leecher hash, received HTTP ${result.status}`);
    }

    @Step("Peer should not exist in leecher hash")
    public async peerNotInLeecherHash(){
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const result = await axios.get(
            `${config.KIRYUU_HOST}/test/peer-exists?info_hash=${urlEncodeBuffer(sha)}&pool=l&port=4444`,
            { validateStatus: () => true },
        );
        strictEqual(result.status, 404, `Fail, expected peer absent from leecher hash, received HTTP ${result.status}`);
    }
}
