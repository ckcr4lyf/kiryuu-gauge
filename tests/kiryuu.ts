import axios from 'axios';
import { DataStoreFactory, Step } from "gauge-ts";
import { config } from './config';
import { strictEqual } from 'assert';
import { addPeers } from './redis';
//@ts-ignore
import { decode }from 'bencode';
import { urlEncodeBuffer } from './utils';
// import bencode from '@ckcr4lyf/bencode-esm'

export default class Kiryuu {
    
    @Step("Kiryuu should be healthy")
    public async kiryuuHealthy(){
        const result = await axios.get(`${config.KIRYUU_HOST}/healthz`);
        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
    }

    @Step("Announce should have expected seeders")
    public async announceSeeders(){
        const sha: Buffer = DataStoreFactory.getScenarioDataStore().get('infohash');
        const uri = `${config.KIRYUU_HOST}/announce?info_hash=${urlEncodeBuffer(sha)}&port=4444&left=69`
        const result = await axios.get(uri, {
            responseType: 'arraybuffer'
        });

        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
        const decoded = decode(result.data);

        const dPeers: Buffer = decoded.peers;
        const added: Buffer[] = DataStoreFactory.getScenarioDataStore().get('peersAdded');

        for (let i = 0; i < dPeers.length; i+=6){
            const singlePeer = dPeers.subarray(i, i + 6);
            if (added.some(peer => peer.compare(singlePeer) === 0) === false){
                throw new Error(`Could not find ${singlePeer} in the list of added peers...`);
            }
        }
    }
}
