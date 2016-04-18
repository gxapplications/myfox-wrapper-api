'use strict';

import MyfoxWrapperApiCommon from './common-api';

class MyfoxWrapperApiHtml extends MyfoxWrapperApiCommon {
    callScenario(scenarioId, callback) {
        console.log('test qui marche quand methode surchargee !' + this.options.apiStrategy);
    }
}

// exports
export default function myfoxWrapperApiHtml(options, fallbackApi) {
    return new MyfoxWrapperApiHtml(options, fallbackApi);
};
