import got from 'got';
import { Step } from "gauge-ts";
import { config } from './config';
import { strictEqual } from 'assert';

export default class Healthz {
    
    @Step("Kiryuu should be healthy")
    public async kiryuuHealthy(){
        const result = await got.get(`${config.KIRYUU_HOST}/healthz`);
        strictEqual(result.statusCode, 200, `Fail, expected HTTP 200, received ${result.statusCode}`);
    }
}