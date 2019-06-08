/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

export interface HandlerTemplateContext {
  modulePath: string;
  className: string;
  constructorArgs: string[];
}

export const HandlerTemplate = ({ modulePath, className, constructorArgs }: HandlerTemplateContext) => `
const ${className} = require('${modulePath}').default;

exports.run = async (event, context) => {
    const handler = new ${className}(${constructorArgs.length>0?constructorArgs.join(','):''});
    return handler.run(event, context);
};
`