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
        console.log(`Gonna announce for ${urlEncodeBuffer(sha)}`);
        const uri = `${config.KIRYUU_HOST}/announce?info_hash=${urlEncodeBuffer(sha)}&port=4444&left=69`
        console.log(uri);
        const result = await axios.get(uri, {
            responseType: 'arraybuffer'
        });
        strictEqual(result.status, 200, `Fail, expected HTTP 200, received ${result.status}`);
        
        console.log(result.data)
        console.log(decode(result.data));
    }
}