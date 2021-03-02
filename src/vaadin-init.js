#!/usr/bin/env node

"use strict";

const fs = require("fs");
const decompress = require("decompress");
const program = require("commander");
const fetch = require("node-fetch");

program
  .option("--fusion", "Create a project with TypeScript and LitElement views")
  .option("--empty", "Create a project with no menu and one empty view")
  .option(
    "--latest",
    "Use the latest release. By default uses the latest LTS release"
  )
  .option("--pre", "Use the latest pre release (if available)")
  .option(
    "--git",
    "Initialize a Git repository for the project and commit the initial files"
  )
  .option(
    "--preset <preset>",
    "Use the given preset you happen to know that exists"
  )
  .arguments("<projectName>")
  .action(async function (projectName) {
    const git = !!program.git;
    let preset = "default";

    if (program.preset) {
      preset = program.preset;
    } else if (program.empty) {
      preset = "empty";
    }

    if (program.fusion) {
      preset += "&preset=partial-typescript";
    }

    if (program.pre) {
      preset += "&preset=partial-prerelease";
    } else if (program.latest) {
      preset += "&preset=partial-latest";
    }

    if (fs.existsSync(projectName)) {
      console.error("Directory '" + projectName + "' already exists");
      return;
    }

    console.log(`Creating application '${projectName}'`);

    try {
      const response = await fetch(
        `https://start.vaadin.com/dl?preset=${preset}&projectName=${projectName}`,
        {
          headers: {
            method: "GET",
            "Accept-Encoding": "gzip",
          },
        }
      );
      if (!response.ok) {
        if (response.status == 404) {
          console.error("Preset not found");
        } else {
          console.error("Unable to create project: " + response.status);
        }
        return;
      }

      const body = await response.buffer();
      fs.writeFileSync("temp.zip", body);
      try {
        await decompress("temp.zip", ".", {
          // workaround for https://github.com/kevva/decompress/issues/46
          filter: (file) => !file.path.endsWith("/"),
        });
      } catch (e) {
        console.error(e);
        return;
      }
      fs.unlinkSync("temp.zip");
      console.log("Project '" + projectName + "' created");
      if (git) {
        console.log("Creating Git repository and initial commit");
        process.chdir(projectName);

        require("simple-git")().init().add("./*").commit("Generated project");
      }
    } catch (e) {
      console.error("Unable to create project: " + e);
    }
  });

program.parse(process.argv);
