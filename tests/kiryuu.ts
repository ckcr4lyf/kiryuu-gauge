import got from 'got';
import { Step } from "gauge-ts";
import { config } from './config';
import { strictEqual } from 'assert';
import { addPeers } from './redis';

export default class Kiryuu {
    
    @Step("Kiryuu should be healthy")
    public async kiryuuHealthy(){
        const result = await got.get(`${config.KIRYUU_HOST}/healthz`);
        strictEqual(result.statusCode, 200, `Fail, expected HTTP 200, received ${result.statusCode}`);
    }

    @Step("Announce should have expected seeders")
    public async announceSeeders(){

        const result = await got.get(`${config.KIRYUU_HOST}/announce?info_hash=AAAAAAAAAAAAAAAAAAAA&port=4444&left=69`);
        strictEqual(result.statusCode, 200, `Fail, expected HTTP 200, received ${result.statusCode}`);
        
        console.log(result.rawBody)
        console.log(result.body)


    }
}