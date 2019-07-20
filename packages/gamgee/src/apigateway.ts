/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

export type APIGatewayHttpMethod = 'get' | 'head' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export interface APIGatewayRequestEvent {
  resource: string;
  path: string;
  httpMethod: APIGatewayHttpMethod;
  headers: {[name: string]: string};
  multiValueHeaders: {[name: string]: string[]};
  queryStringParameters: {[name: string]: string};
  multiValueQueryStringParameters: {[name: string]: string[]};
  pathParameters: {[name: string]: string};
  stageVariables: {[name: string]: string};
  requestContext: {[name: string]: any};
  body: string;
  isBase64Encoded: boolean;
}

export interface APIGatewayEventSource<path, name='', method='any', auth='NONE', restapiid='', cors=false> {
  run(event: APIGatewayRequestEvent, context: any): Promise<APIGatewayResponse>;
}
export interface APIGatewayResponse {
  statusCode: number;
  isBase64Encoded?: boolean;
  body?: string;
  headers?: { [name: string]: string };
  multiValueHeaders?: { [name: string]: Array<String> };
}