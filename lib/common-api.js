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

    // Construction parts

    constructor(options, fallbackApi) {
        this.options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), options);
        Joi.assert(options, MyfoxWrapperApiCommon.optionsSchema());

        this.fallbackApi = fallbackApi;

        this.authenticatedUntil = 0;
        this.authenticatedData = null;
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

    // MyFox distant caller and auto-authentification system

    callApi(url, method, queryParams, headers, payload) {
        let tryToAuthenticate;
        tryToAuthenticate = (retryCredits, callDistant, resolve, reject) => {
            this.authenticate(this.authenticatedData, (err, authData) => {
                if (err) { // TODO: more specific failure ? http code ?
                    if (retryCredits > 0) { // retry one more time
                        return tryToAuthenticate(retryCredits-1, callDistant, resolve, reject);
                    } else {
                        return reject(err);
                    }
                } else {
                    const validityMinutes = 2; // FIXME: ->settings!
                    this.authenticatedUntil.setTime(new Date().getTime() + (validityMinutes*60*1000));
                    this.authenticatedData = authData;
                    return callDistant(resolve, reject);
                }
            });
        };
        return new Promise((resolve, reject) => {
            if (!this.isMaybeAuthenticated()) {
                let authCredits = 3; // FIXME: ->settings!
                return tryToAuthenticate(authCredits, this.callDistant, resolve, reject);
            }
            this.callDistant(resolve, reject);
        });
    }
    isMaybeAuthenticated() {
        const now = new Date();
        return this.authenticatedUntil > now;
    }


    // Wrapper API methods

    authenticate(authData, callback) {
        throw new Error('Feature not implemented in this wrapper.');
    }
    callDistant(resolve, reject) {
        throw new Error('Feature not implemented in this wrapper.');
    }

    callScenario(scenarioId, callback) {
        _notImplemented.bind(this)('callScenario', scenarioId, callback);
    }
}

export default MyfoxWrapperApiCommon;
