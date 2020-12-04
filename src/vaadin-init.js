#!/usr/bin/env node

"use strict";

const fs = require("fs");
const request = require("request-promise");
const decompress = require("decompress");
const program = require("commander");

program
  .option(
    "--latest",
    "Use the latest release. By default uses the latest LTS release"
  )
  .option(
    "--fusion",
    "Create a Fusion based project with TypeScript and LitElement"
  )
  .option("--pre", "Use the latest pre release (if available)")
  .option(
    "--git",
    "Initialize a Git repository for the project and commit the initial files"
  )
  .arguments("<projectName>")
  .action(async function (projectName) {
    const git = !!program.git;
    const preset = program.pre
      ? "prerelease"
      : program.latest
      ? "latest"
      : program.fusion
      ? "fusion"
      : "lts";
    if (fs.existsSync(projectName)) {
      console.error("Directory '" + projectName + "' already exists");
      return;
    }

    console.log(`Creating application '${projectName}' (${version})`);

    const options = {
      encoding: null,
      gzip: true,
    };
    await request.get(
      `https://start.vaadin.com/dl?preset=${preset}`,
      options,
      async function (_error, response, body) {
        if (response && response.statusCode == 200) {
          fs.writeFileSync("temp.zip", body);
          await decompress("temp.zip", projectName, { strip: 1 });
          fs.unlinkSync("temp.zip");
          console.log("Project '" + projectName + "' created");
          if (git) {
            console.log("Creating Git repository and initial commit");
            process.chdir(projectName);

            require("simple-git")()
              .init()
              .add("./*")
              .commit("Generated project");
          }
        }
      }
    );
  });

program.parse(process.argv);
