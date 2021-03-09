#!/usr/bin/env node
"use strict";

var program = require("commander");

process.title = "vaadin-cli";

program
  .version(require("../package.json").version)
  .command("init <name>", "Create a new project")
  .command("ds-init", "Create a new design system");

program.parse(process.argv);
