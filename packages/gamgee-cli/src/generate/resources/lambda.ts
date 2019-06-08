/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import { APIGatewayHttpMethod } from 'gamgee';
import { Resource, TypeAnnotation, getListFromTypeAnnotation, getObjectFromTypeAnnotation } from '.';

export abstract class LambdaEventSource extends TypeAnnotation {
  public name: string;
  constructor(projectName, fileName, className, name) {
    super(projectName, fileName, className);
    this.name = name;
  }
  public abstract toSAMTemplate(): { [name: string]: { [key: string]: any }};
}

export abstract class LambdaProperty extends TypeAnnotation {
}

interface IAPIGatewayEvent {
  name: string;
  path: string;
  method: APIGatewayHttpMethod;
}

export class APIGatewayEventSource extends LambdaEventSource implements IAPIGatewayEvent {
  public path: string;
  public method: APIGatewayHttpMethod;
  constructor(projectName: string, fileName: string, className: string, {path, name, method}: IAPIGatewayEvent) {
    super(projectName, fileName, className, name);
    if (!this.name || this.name.length === 0) {
      this.name = `${className}API`;
    }
    this.name = name;
    this.path = path;
    this.method = method;
  }
  public toSAMTemplate() {
    return { 
      [this.name]: {
        Type: 'Api',
        Properties: {
          Path: this.path,
          Method: this.method
        }
      }
    }
  }
}

export class LambdaResource extends Resource {
  public name: string;
  public properties: { [key: string]: any };
  constructor(projectName, fileName, className, {Name}) {
    super(projectName, fileName, className, Name);
    this.properties = {};
  }
  public processTypeAnnotations(annotations: any): void {
    let CodeUri = this.projectName;
    CodeUri = (CodeUri.endsWith('/')?CodeUri.substr(0, CodeUri.length-1):CodeUri);
    CodeUri = CodeUri.substr(CodeUri.lastIndexOf('/')+1, CodeUri.length - CodeUri.lastIndexOf('/'));
    CodeUri += '/';
    const defaultProperties = {
      CodeUri,
      Handler: `handlers/${this.className.slice().toLowerCase()}_function.run`
    }
    this.properties = Object.assign({}, defaultProperties,
      { Environment: getObjectFromTypeAnnotation(LambdaEnvironment, annotations) },
      { Tags: getObjectFromTypeAnnotation(LambdaTag, annotations) },
      { Events: getObjectFromTypeAnnotation(LambdaEventSource, annotations) },
      ...getListFromTypeAnnotation(LambdaProperty, annotations)
    );
    if (this.properties.Runtime === undefined) {
      this.properties.Runtime = 'nodejs10.x';
    }
  }
  public toSAMTemplate() {
    return {
      [this.name]: {
        Type: 'AWS::Serverless::Function',
        Properties: this.properties,
      }
    }
  }
}

export class LambdaRuntime extends LambdaProperty {
  public runtime: string;
  // Add validation for node types here;
  constructor(projectName, fileName, className, {runtime}) {
    super(projectName, fileName, className);
    this.runtime = runtime;
  }
  public toSAMTemplate() {
    return { Runtime: this.runtime }
  }
}

export class LambdaMemorySize extends LambdaProperty {
  public size: number;
  constructor(projectName, fileName, className, {size}) {
    super(projectName, fileName, className);
    this.size = size;
  }
  public toSAMTemplate() {
    return { MemorySize: this.size };
  }
}

export class LambdaTimeout extends LambdaProperty {
  public timeout: number;
  constructor(projectName, fileName, className, {timeout}) {
    super(projectName, fileName, className);
    this.timeout = timeout;
  }
  public toSAMTemplate() {
    return { Timeout: this.timeout };
  }
}

export class LambdaRole extends LambdaProperty {
  public arn: string;
  constructor(projectName, fileName, className, {arn}) {
    super(projectName, fileName, className);
    this.arn = arn;
  }
  public toSAMTemplate() {
    return { Role: this.arn };
  }
}

export class LambdaEnvironment extends TypeAnnotation {
  public key: string;
  public value: string;
  constructor(projectName, fileName, className, {key, value}) {
    super(projectName, fileName, className);
    this.key = key;
    this.value = value;
  }
  public toSAMTemplate() {
    return { [this.key]: this.value };
  }
}

export class LambdaTag extends TypeAnnotation {
  public key: string;
  public value: string;
  constructor(projectName, fileName, className, {key, value}) {
    super(projectName, fileName, className);
    this.key = key;
    this.value = value;
  }
  public toSAMTemplate() {
    return { [this.key]: this.value };
  }
}

export class LambdaTracing extends LambdaProperty {
  public mode: string;
  private validate(mode) {
    if (mode !== 'Active' && mode !== 'PassThrough') {
      throw new TypeError('LambdaTracing Mode must be "Active" or "PassThrough"');
    }
    return mode;
  }
  constructor(projectName, fileName, className, {mode}) {
    super(projectName, fileName, className);
    this.mode = this.validate(mode);
  }
  public toSAMTemplate() {
    return { Tracing: this.mode };
  }
}