#!/usr/bin/env node
/*!
  Copyright (c) 2019 DynAgility LLC. All rights reserved.
  Licensed under the MIT License.
*/

const minimist = require('minimist');

const generate = require('../dist/generate');

const commands = {
  'generate': generate,
};

const { version } = require('../package.json');

(async () => {
  const argv = minimist(process.argv.slice(2));
  console.log(`Gamgee ${version} `);

  if (argv._.length > 0 && commands[argv._[0]] === undefined) {
    console.log(`Unknown command: ${argv._[0]}`);
    console.log("Commands: ");
    console.log("  " + Object.keys(commands).join(", "));
    process.exit(1);
  }
  if (argv._.length === 0 || argv.h || argv.help) {
    console.log('Usage:');
    if (argv._.length === 0) {
      console.log('gamgee <command>')
      console.log("Commands: ");
      console.log(Object.keys(commands).join(", "));
    } else {
        const help = commands[argv._[0]].help || 'Help for that command is not defined yet.';
        console.log(help);
    }
    process.exit(1);
  }
  commands[argv._[0]].run(argv);
})();