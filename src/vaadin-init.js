#!/usr/bin/env node

"use strict";

const fs = require("fs");
const decompress = require("decompress");
const program = require("commander");
const fetch = require("node-fetch");

program
  .option("--flow", "Add Flow (Java) example views")
  .option("--hilla", "Add Hilla (React + TypeScript) example views")
  .option("--auth", "Add login/logout and access control")
  .option("--db", "Add a database to the project")
  .option("--kubernetes", "Include a Kubernetes configuration")
  .option("--docker", "Include a Dockerfile")
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
    const options = program.opts();
    const git = !!options.git;
    let preset = "base";

    if (options.preset) {
      preset = options.preset;
    }

    if (options.flow) {
      preset += "&preset=partial-flow-example-views";
    }
    if (options.hilla) {
      preset += "&preset=partial-hilla-example-views";
    }

    if (options.auth) {
      preset += "&preset=partial-auth";
    }

    if (options.db) {
      preset += "&preset=partial-db";
    }

    if (options.kubernetes) {
      preset += "&preset=partial-kubernetes";
    } else if (options.docker) {
      preset += "&preset=partial-docker";
    }

    if (options.pre) {
      preset += "&preset=partial-prerelease";
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
            "User-Agent": `Vaadin CLI`,
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
