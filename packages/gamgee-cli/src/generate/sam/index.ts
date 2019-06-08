/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import fs from 'fs';
import yaml from 'js-yaml';

class SubTag {
  public sub: string;
  constructor(sub: string) {
    this.sub = sub;
  }
}

const SubTagYamlType = new yaml.Type('!Sub', {
  kind: 'scalar',
  construct: function (data) {
    return new SubTag(data);
  },
  represent: function (data) {
    return `${data.sub}`;
  },
  instanceOf: SubTag
})

class GetAttTag {
  public getatt: string;
  constructor(getatt: string) {
    this.getatt = getatt;
  }
}

const GetAttYamlType = new yaml.Type('!GetAtt', {
  kind: 'scalar',
  construct: function (data) {
    return new GetAttTag(data);
  },
  represent: function (data) {
    return `${data.getatt}`;
  },
  instanceOf: GetAttTag
})

const AWS_SAM_SCHEMA = yaml.Schema.create([ SubTagYamlType, GetAttYamlType ]);

export function ReadSAMYaml(samTemplatePath: string) {
  const samTemplateYaml = fs.readFileSync(samTemplatePath, 'utf8');
  fs.writeFileSync(`${samTemplatePath}.bak`, samTemplateYaml);
  return yaml.load(samTemplateYaml, { schema: AWS_SAM_SCHEMA });
}

export function WriteSAMYaml(samTemplatePath: string, template: any) {
  fs.writeFileSync(samTemplatePath, yaml.dump(template, { schema: AWS_SAM_SCHEMA }));
}