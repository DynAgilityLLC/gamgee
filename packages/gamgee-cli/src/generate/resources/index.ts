/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

export abstract class TypeAnnotation {
  public projectName: string;
  public fileName: string;
  public className: string;
  constructor(projectName, fileName, className) {
    this.projectName = projectName;
    this.fileName = fileName;
    this.className = className;
  }
  public abstract toSAMTemplate(): any;
}

export abstract class Resource extends TypeAnnotation {
  public name: string;
  constructor(projectName, fileName, className, resourceName) {
    super(projectName, fileName, className);
    this.name = resourceName;
  }
  public abstract processTypeAnnotations(annotations: any): void;
  public abstract toSAMTemplate(): any;
}

export function getResourceForClass(annotations: TypeAnnotation[]): Resource {
  const resource: Resource = annotations.find((a) => a instanceof Resource) as Resource;
  if (resource !== undefined) {
    resource.processTypeAnnotations(annotations);
  }
  return resource;
}

export function getObjectFromTypeAnnotation(propertyType: any, annotations: TypeAnnotation[]) {
  return Object.assign({}, ...annotations.filter((a: TypeAnnotation) => a instanceof propertyType).map((a) => a.toSAMTemplate()));
}

export function getListFromTypeAnnotation(propertyType: any, annotations: TypeAnnotation[]) {
  return annotations.filter((a: TypeAnnotation) => a instanceof propertyType).map((a) => a.toSAMTemplate());
}

export * from './lambda';