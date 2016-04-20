'use strict';

import Joi from 'joi';
import RestApi from './rest-api';
import HtmlApi from './html-api';
import MyfoxWrapperApiCommon from './common-api';

const myfoxWrapperApi = function(options) {
    options = Object.assign({}, MyfoxWrapperApiCommon.defaultOptions(), {apiStrategy: 'htmlFirst'}, options);
    Joi.assert(options, MyfoxWrapperApiCommon.optionsSchema());

    switch (options.apiStrategy) {
        case 'htmlOnly':
            return HtmlApi(options, null);
        case 'htmlFirst':
            return HtmlApi(options, RestApi(options, null));
        case 'restFirst':
            return RestApi(options, HtmlApi(options, null));
        case 'restOnly':
            return RestApi(options, null);
        default:
            throw new Error('apiStrategy option inconsistent.');
    }
};

// allow indirect access to specific wrappers
myfoxWrapperApi.rest = RestApi;
myfoxWrapperApi.html = HtmlApi;

// exports
export default myfoxWrapperApi;

// allow direct access to specific wrappers
// only default exports from rest & html are re-exported.
export { default as rest } from './rest-api';
export { default as html } from './html-api';
