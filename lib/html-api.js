'use strict';

import MyfoxWrapperApiCommon from './common-api';

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {
    // FIXME: to remove after tests
    callScenario(scenarioId, callback) {
        super.callApi('', 'GET', {}, {}, {})
            .then((data) => {
                console.log("then", data);
            })
            .catch((err) => {
                console.log("catch", err);
            });
    }
}

// exports
export default function myfoxWrapperApiHtml(options, fallbackApi) {
    return new MyfoxWrapperApiHtml(options, fallbackApi);
};
