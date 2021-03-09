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
      name: 'dsTechnicalName',
      message: `Enter a short, technical name for your design system (this will be used for your folder and site title)`,
      default: (answers) => answers.dsName.toLowerCase().replace(/\s/g, '-'),
    },
  ];

  const config = await inquirer.prompt(questions);

  const docsName = `${config.dsTechnicalName}-docs`;
  const docsPath = path.resolve(process.cwd(), docsName);

  console.log(`Cloning documentation project into ${docsPath}...`);
  execSync(`git clone https://github.com/vaadin/docs.git ${docsName}`, {
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

Start up the design system documentation project in development mode with:
- cd ${docsName}
- npm run dspublisher:start`);
}

run();
