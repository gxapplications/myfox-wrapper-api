'use strict';

import Joi from 'joi';

// keep this private. Not exported with the class.
const _notImplemented = function(functionName, ...params) {
    if (this.fallbackApi !== null && this.fallbackApi !== undefined) {
        this.fallbackApi[functionName](params);
    } else {
        throw new Error('Feature not implemented in this wrapper.');
    }
};

class MyfoxWrapperApiCommon {
    constructor(options, fallbackApi) {
        this.options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), options);
        Joi.assert(options, MyfoxWrapperApiCommon.optionsSchema());

        this.fallbackApi = fallbackApi;
    }

    static defaultOptions() {
        return {
            apiStrategy: 'custom'
        };
    }

    static optionsSchema() {
        return Joi.object({
            apiStrategy: Joi.string().valid(['htmlOnly', 'htmlFirst', 'restFirst', 'restOnly', 'custom']),
        });
    }

    // Wrapper API methods

    callScenario(scenarioId, callback) {
        _notImplemented.bind(this)('callScenario', scenarioId, callback);
    }
}

export default MyfoxWrapperApiCommon;
