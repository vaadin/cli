#!/usr/bin/env node

'use strict';

const path = require('path');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

async function run() {
  const questions = [
    {
      type: 'input',
      name: 'dsName',
      message: `Enter the full name of your design system (this will be used in the header of your documentation site)`,
    },
    {
      type: 'input',
      name: 'docsFolderName',
      message: `Provide a short technical name for the documentation web site project folder`,
      default: (answers) => answers.dsName.toLowerCase().replace(/\s/g, '-') + '-docs',
    },
  ];

  const config = await inquirer.prompt(questions);

  const docsPath = path.resolve(process.cwd(), config.docsFolderName);

  console.log(`Cloning documentation project into ${docsPath}...`);
  execSync(`git clone --depth=1 --single-branch --branch dsp https://github.com/vaadin/docs.git ${config.docsFolderName}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  console.log(`Initializing the documentation project...`);

  const docsInitPath = path.resolve(docsPath, 'scripts/dspublisher-init.js');
  try {
    require(docsInitPath)(config);
  } catch (e) {
    console.error(`Failed to initialize the documentation project!`, e);
    process.exit(1);
  }

  console.log(`
Okay, we’re all done!

Start up the design system documentation web site project in development mode with:
- cd ${config.docsFolderName}
- npm run dspublisher:start`);
}

run();
