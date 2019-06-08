/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

import fs from 'fs';
import glob from 'glob';
import * as ts from "typescript";

import { ReadSAMYaml, WriteSAMYaml } from './sam';
import { getInterfacesForFile } from './ast';
import { getResourceForClass, Resource, LambdaResource } from './resources';
import { HandlerTemplate } from './templates';

export const help = 
`gamgee generate [<SAMProjectPath>] [<SourceFileGlob>] [<SAMTemplateFilePath>]

Scans a SAM Project (defaulting to the current working directory) to generate
modifications to the SAM template file based on Gamgee Type Annotations used
in any TypeScript code projects.
`;

export async function GenerateSAMEntries(samTemplatePath: string, projectPath: string, ...sourceFiles: any) {
  const samTemplate = ReadSAMYaml(samTemplatePath);
  if (!fs.existsSync(`${projectPath}/tsconfig.json`)) {
    console.log(`${projectPath} included Gamgee, but doesn't have tsconfig.json. Skipping.`)
    return;
  }
  const tsconfig = require(`${projectPath}/tsconfig.json`);

  let classes = [];
  const tsCompilerOptions = { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS }
  let program = ts.createProgram(sourceFiles, tsCompilerOptions)
  let checker = program.getTypeChecker();
  

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      classes = classes.concat(getInterfacesForFile(projectPath, sourceFile.fileName, checker, sourceFile).map(getResourceForClass));
    }
  }

  // Handle any special output cases for resources (like Lambdas)
  for (let resource of classes) {
    if (resource instanceof LambdaResource) {
      OutputLambdaHandlerJS(resource as any, tsconfig.compilerOptions.rootDir, tsconfig.compilerOptions.outDir);
    }
  }
  const newResources = classes.map((c) => c.toSAMTemplate());
  console.log("  - Merging resources from project to template:")
  Object.values(newResources).forEach((i) => Object.keys(i).forEach((j) => console.log(`      ${j} - ${i[j]['Type']}`)));
  const resources = Object.assign(samTemplate.Resources, ...newResources);
  WriteSAMYaml(samTemplatePath, samTemplate)
}

function OutputLambdaHandlerJS(lambda: LambdaResource, rootDir: string, outDir: string) {
  const handlersDir = `${lambda.projectName.endsWith('/')?lambda.projectName:`${lambda.projectName}/`}handlers`;
  if (!fs.existsSync(handlersDir)) {
    fs.mkdirSync(handlersDir);
  }
  const handlerFilePath = `${handlersDir}/${lambda.className.slice().toLowerCase()}_function.js`;
  const handlerSourceFile = `../${outDir}/${lambda.fileName.substr(lambda.fileName.lastIndexOf(rootDir)+rootDir.length+1).replace('.ts', '.js')}`;
  const handlerTemplate = HandlerTemplate({ modulePath: handlerSourceFile, className: lambda.className, constructorArgs: []});
  console.log(`  - Writing Lambda Handler file to ${handlerFilePath}`);
  fs.writeFileSync(handlerFilePath, handlerTemplate);
}

export async function run(argv) {
  let [undefined, projectPath = '.', templatePath = `${projectPath}/template.yaml`, sourceGlob = 'src/**/*.ts'] = argv._;

  projectPath = fs.realpathSync(projectPath);
  let projects = glob.sync(`${projectPath}/**/package.json`, {
    ignore: [`${projectPath}/**/node_modules/**`]
  });
  let gamgeeProjects = projects.filter((path) => {
    const packagejson = JSON.parse(fs.readFileSync(path).toString());
    return ((packagejson.dependencies && packagejson.dependencies['gamgee']) || (packagejson.devDependencies && packagejson.devDependencies['gamgee']));
  }).map(i => i.replace('/package.json', ''));

  for (let tsprojectPath of gamgeeProjects) {
    console.log(`Generating entries for ${tsprojectPath}, writing to ${templatePath}`);
    let modules = glob.sync(`${tsprojectPath}/${sourceGlob}`);
    if (modules.length === 0) {
      console.log(`Found no source files in ${tsprojectPath}/${sourceGlob}, skipping`);
      continue;
    }
    await GenerateSAMEntries(templatePath, tsprojectPath, ...modules);
  }
}