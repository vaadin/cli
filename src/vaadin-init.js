#!/usr/bin/env node

import fs from "fs";
import decompress from "decompress";
import fetch from "node-fetch";
import prompts from "prompts";

function sanitizePath(path) {
  return path?.trim().replace("/", "");
}
function isEmptyFolder(path) {
  return fs.readdirSync(path).length === 0;
}
async function downloadProject(options) {
  const { projectName } = options;
  const presets = ["base"];
  if (options.exampleViews === "flow") {
    presets.push("partial-flow-example-views");
  } else if (options.exampleViews === "hilla") {
    presets.push("partial-hilla-example-views");
  } else if (options.exampleViews === "hilla-flow") {
    presets.push("partial-flow-example-views");
    presets.push("partial-hilla-example-views");
  }

  for (const feature of options.features) {
    if (feature === "git") {
      continue;
    } else if (feature === "pre") {
      presets.push("partial-prerelease");
      continue;
    }

    presets.push(`partial-${feature}`);
  }

  const git = !!options.features.git;

  if (fs.existsSync(projectName)) {
    console.error("Directory '" + projectName + "' already exists");
    return;
  }

  const preset = presets.map((p) => `preset=${p}`).join("&");

  try {
    const response = await fetch(
      `https://start.vaadin.com/dl?${preset}&projectName=${projectName}`,
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

    const body = await response.arrayBuffer();
    fs.writeFileSync("temp.zip", new Uint8Array(body));
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
    console.log("");
    console.log("Project '" + projectName + "' created");
    console.log("");
    console.log(`To run your project, open the ${projectName} folder in your IDE and launch the Application class`);
    console.log("");
    console.log("You can also run from the terminal using");
    console.log("- cd " + projectName);
    console.log("- mvn");
    console.log("");
    console.log(":");

    if (git) {
      console.log("Creating Git repository and initial commit");
      process.chdir(projectName);

      require("simple-git")().init().add("./*").commit("Generated project");
    }
  } catch (e) {
    console.error("Unable to create project: " + e);
  }
}
let result;
let folder;

try {
  const argProjectName = sanitizePath(process.argv.slice(2)?.[0]);
  result = await prompts(
    [
      {
        type: argProjectName ? null : "text",
        name: "projectName",
        message: "Project name:",
        initial: "my-vaadin-app",
        onState: (state) => {
          folder = sanitizePath(state.value);
          console.log("Folder", folder);
        },
      },
      {
        type: () => null && 
          fs.existsSync(folder) && !isEmptyFolder(folder) ? "select" : null,
        name: "overwrite",
        message: () => `Folder ${folder} already exists.`,
        choices: [
          { title: "Cancel", value: "no" },
          { title: "Remove old project and create new", value: "yes" },
        ],
      },
      {
        type: (_, { overwrite }) => {
          if (overwrite === "no") {
            throw new Error("cancel");
          }
          return null;
        },

        onState: (state) => {
          if (state.value === "no") {
            throw new Error("Cancel");
          }
        },
      },
      {
        type: "select",
        name: "exampleViews",
        message: "Example views:",
        choices: [
          { title: "Flow (Java)", value: "flow" },
          { title: "Hilla (React + TypeScript)", value: "hilla" },
          { title: "Flow and Hilla", value: "hilla-flow" },
          { title: "None", value: "none" },
        ],
      },
      {
        type: "multiselect",
        name: "features",
        message: "Features:",
        choices: [
          { title: "Login/logout and access control", value: "auth" },
          { title: "Include JPA support", value: "db" },
          { title: "Kubernetes configuration", value: "kubernetes" },
          { title: "Dockerfile", value: "docker" },
          {
            title:
              "Initialize a Git repository for the project and commit the initial files",
            value: "git",
          },
          { title: "Use pre release", value: "pre" },
        ],
      },
    ],
    {
      onCancel: () => {
        throw new Error("Cancel");
      },
    }
  );

  downloadProject(result);
} catch (e) {
  if (e?.message == "Cancel") {
    console.log("Aborted");
  }
}
