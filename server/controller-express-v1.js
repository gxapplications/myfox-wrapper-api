'use strict';

import { Router } from 'express';

const router = new Router();

router.get('/test/:vari', function test(request, reply, next) {
    reply.send("test: " + request.params.vari);
});

export default router;
