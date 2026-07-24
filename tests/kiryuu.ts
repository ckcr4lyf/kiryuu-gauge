import axios from 'axios';
import { DataStoreFactory, Step } from "gauge-ts";
import { config } from './config';
import { strictEqual } from 'assert';
//@ts-ignore
import { decode }from 'bencode';
import { urlEncodeBuffer } from './utils';

const ANNOUNCE_PORT = 4444;

const assertValidAnnounceMetadata = (decoded: Record<string, unknown>) => {
    strictEqual(decoded.interval, 1800, 'interval should be 1800');
    strictEqual(decoded['min interval'], 1800, 'min interval should be 1800');
    strictEqual(typeof decoded.complete, 'number', 'complete should be a number');
    strictEqual(typeof decoded.incomplete, 'number', 'incomplete should be a number');

    const peers: Buffer = decoded.peers as Buffer;
    if (!(peers instanceof Buffer)) {
        throw new Error('peers should be a byte buffer');
    }
    if (peers.length % 6 !== 0) {
        throw new Error(`peers length ${peers.length} is not a multiple of 6`);
    }
};

const announceUri = (infohash: Buffer, params: { left: number; event?: string }): string => {
    let uri = `${config.KIRYUU_HOST}/announce?info_hash=${urlEncodeBuffer(infohash)}&port=${ANNOUNCE_PORT}&left=${params.left}`;
    if (params.event) {
        uri += `&event=${params.event}`;
    }
    return uri;
};

const getInfohash = (): Buffer => DataStoreFactory.getScenarioDataStore().get('infohash');

export default class Kiryuu {
    
    @Step("Kiryuu should be healthy")
    public async kiryuuHealthy(){
        const result = await axios.get(`${config.KIRYUU_HOST}/healthz`);
        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Announce should have expected seeders")
    public async announceSeeders(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 69 }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
        const decoded = decode(result.data);
        assertValidAnnounceMetadata(decoded);

        const peersWeManuallyAdded: Buffer[] = DataStoreFactory.getScenarioDataStore().get('peersAdded');
        const dPeers: Buffer = decoded.peers;
        const dPeersCount = dPeers.length / 6;

        strictEqual(peersWeManuallyAdded.length, dPeersCount, `Fail, expected to have received ${peersWeManuallyAdded.length} peers, got ${dPeersCount}`);

        for (let i = 0; i < dPeers.length; i+=6){
            const singlePeer = dPeers.subarray(i, i + 6);
            if (peersWeManuallyAdded.some(peer => peer.compare(singlePeer) === 0) === false){
                throw new Error(`Could not find ${singlePeer} in the list of added peers...`);
            }
        }
    }

    @Step("Announce should have expected leechers")
    public async announceLeechers(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 69 }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
        const decoded = decode(result.data);
        assertValidAnnounceMetadata(decoded);

        const peersWeManuallyAdded: Buffer[] = DataStoreFactory.getScenarioDataStore().get('peersAdded');
        const dPeers: Buffer = decoded.peers;
        const dPeersCount = dPeers.length / 6;

        strictEqual(peersWeManuallyAdded.length, dPeersCount, `Fail, expected to have received ${peersWeManuallyAdded.length} peers, got ${dPeersCount}`);

        for (let i = 0; i < dPeers.length; i+=6){
            const singlePeer = dPeers.subarray(i, i + 6);
            if (peersWeManuallyAdded.some(peer => peer.compare(singlePeer) === 0) === false){
                throw new Error(`Could not find ${singlePeer} in the list of added leechers...`);
            }
        }
    }

    @Step("Send announce as seeder")
    public async announceAsSeeder(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 0 }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Send announce as leecher")
    public async announceAsLeecher(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 69 }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Send announce as stopped")
    public async announceStopped(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 0, event: 'stopped' }), {
            responseType: 'arraybuffer',
            validateStatus: () => true,
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Send announce as completed")
    public async announceCompleted(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 0, event: 'completed' }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Announce should report zero seeders and one leecher")
    public async announceFreshTorrentCounts(){
        const sha = getInfohash();
        const result = await axios.get(announceUri(sha, { left: 69 }), {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
        const decoded = decode(result.data);
        assertValidAnnounceMetadata(decoded);
        strictEqual(decoded.complete, 0, 'expected zero seeders on fresh torrent');
        strictEqual(decoded.incomplete, 1, 'expected caller counted as sole leecher');
    }

    @Step("Announce with no-URL blacklisted infohash should return HTTP 451")
    public async blacklist451(){
        const infohash = Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'hex');
        const uri = announceUri(infohash, { left: 69 });
        const result = await axios.get(uri, { validateStatus: () => true });
        strictEqual(result.status, 451, `Fail, expected HTTP 451, received ${result.status}`);
    }

    @Step("Announce with URL blacklisted infohash should return HTTP 307 to correct location")
    public async blacklist307(){
        const infohash = Buffer.from('44cf2381cf24bc9cd3dbe3c1c28dde3375ba6bda', 'hex');
        const expectedUrl = 'https://uwu.mywaifu.best/dmca/44cf2381cf24bc9cd3dbe3c1c28dde3375ba6bda.txt';
        const uri = announceUri(infohash, { left: 69 });
        const result = await axios.get(uri, { maxRedirects: 0, validateStatus: () => true });
        strictEqual(result.status, 307, `Fail, expected HTTP 307, received ${result.status}`);
        strictEqual(result.headers.location, expectedUrl, `Fail, expected Location header ${expectedUrl}, received ${result.headers.location}`);
    }

    @Step("Announce with missing port should return HTTP 400")
    public async announceMissingPort(){
        const infohash = Buffer.alloc(20, 0x41);
        const uri = `${config.KIRYUU_HOST}/announce?info_hash=${urlEncodeBuffer(infohash)}&left=69`;
        const result = await axios.get(uri, { validateStatus: () => true });
        strictEqual(result.status, 400, `Fail, expected HTTP 400, received ${result.status}`);
    }

    @Step("Announce with garbage query should return HTTP 400")
    public async announceGarbageQuery(){
        const uri = `${config.KIRYUU_HOST}/announce?this=is-not-valid`;
        const result = await axios.get(uri, { validateStatus: () => true });
        strictEqual(result.status, 400, `Fail, expected HTTP 400, received ${result.status}`);
    }
}
