'use strict';

import { Router } from 'express';
import api, { rest } from '../lib/index';

const router = new Router();

router.get('/test/:vari', function test(request, reply, next) {
    console.log(api().callScenario('123', () => {}));
    console.log(rest().callScenario('123', () => {}));
    reply.send("test: " + request.params.vari);
});

export default router;
