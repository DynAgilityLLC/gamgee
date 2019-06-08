/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

export interface LambdaResource<Name> {
  run(event: any, context: any): Promise<any>;
}

export interface LambdaRuntime<Runtime> {};
export interface LambdaCodeUri<Uri> {};
export interface LambdaMemorySize<Size> {};
export interface LambdaTimeout<Seconds> {};
export interface LambdaRole<RoleARN> {};
export interface LambdaEnvironment<Key, Value> {};
export interface LambdaTag<Key, Value> {};
export interface LambdaTracing<Mode> {};


export interface ScheduleEvent<Schedule> {
  run(event: any, context: any): Promise<any>;
}

export interface S3Event<Bucket, Event> {
  run(event: any, context: any): Promise<any>;
}

export * from './apigateway';
export * from './lex';