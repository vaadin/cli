#!/usr/bin/env node

"use strict";

const enableHotswap = require("./hotswap");

const program = require("commander");
program.action(enableHotswap);

program.parse(process.argv);
