#!/usr/bin/env node

"use strict";

const downloadJdkIfNeeded = require("./corretto");

const program = require("commander");
program.action(downloadJdkIfNeeded);

program.parse(process.argv);
