#!/usr/bin/env node
"use strict";

var program = require("commander");

process.title = "vaadin-cli";

program
  .version(require("../package.json").version)
  .command("init <name>", "Create a new project")
  .command("hotswap", "Enable hotswapping in the current project (using Trava JDK)")
  .command("java", "Download and install a supported JDK")
  ;

program.parse(process.argv);
