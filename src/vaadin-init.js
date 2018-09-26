#!/usr/bin/env node
'use strict';
const download = require('download');


const program = require('commander');
program
    .arguments('<name>')
    .action(async function (name) {
        const fs = require('fs');
        if (fs.existsSync(name)) {
            console.error("Directory '" + name + "' already exists");
            return;
        }

        console.log("Creating app '" + name + "'");
        const zipName = name + '.zip';
        await download("https://artur.app.fi/start/project-base.zip", name, { extract: true });
    });

program.parse(process.argv);


