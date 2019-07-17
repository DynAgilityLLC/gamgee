/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import { APIGatewayHttpMethod, APIGatewayResponse, APIGatewayRequestEvent } from 'gamgee';

export abstract class APILambda {
  async get?(params, headers): Promise<any>;
  async post?(body, params, headers): Promise<any>;
  async put?(body, params, headers): Promise<any>;
  async patch?(body, params, headers): Promise<any>;
  async delete?(params, headers): Promise<any>;
  async run(event: APIGatewayRequestEvent, context): Promise<APIGatewayResponse> {
    let response;

    const httpMethod = event.httpMethod.toLowerCase();
    if ((httpMethod === 'post' || httpMethod === 'put' || httpMethod === 'patch') &&  event.headers['Content-Type'] !== 'application/json') {
      return { statusCode: 415 };
    }

    try {
      if (this[event.httpMethod.toLowerCase()] !== undefined) {
        const params = Object.assign({}, event.queryStringParameters, event.pathParameters);
        response = await this[event.httpMethod.toLowerCase()].call(this, params, event.headers, event.body);
      }
    } catch (e) {
      console.log('Caught error handling Lambda: ', e);
      return { statusCode: 500 };
    }

    if (response === undefined) {
      return { statusCode: 406 };
    }

    if (response.statusCode === undefined) {
      return { statusCode: 200, body: JSON.stringify(response) };
    }
    
    return response;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Origin': '*'
}

export abstract class CORSAPILambda extends APILambda {
  async run(event: APIGatewayRequestEvent, context): Promise<APIGatewayResponse> {
    const response = await super.run(event, context);
    response.headers = Object.apply(response.headers || {}, CORS_HEADERS)
    return response;
  }
}