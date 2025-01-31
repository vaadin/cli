#!/usr/bin/env node

import fs from "fs";
import path from "path";
import decompress from "decompress";
import fetch from "node-fetch";
import prompts from "prompts";
import { findIntelliJ, findCode } from "./ide.js";
import { spawn } from "child_process";

function deleteFolder(folder) {
  for (const file of fs.readdirSync(folder)) {
    const fullpath = path.resolve(folder, file);
    fs.rmSync(fullpath, { recursive: true, force: true });
  }
}

function sanitizePath(path) {
  return path?.trim().replace(/[^a-zA-Z0-9-_]/g, "");
}

function exists(path) {
  return fs.existsSync(path);
}

function isEmptyFolder(path) {
  return exists(path) && fs.readdirSync(path).length === 0;
}
async function downloadProject(folder, options) {
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
    if (feature === "pre") {
      presets.push("partial-prerelease");
      continue;
    }

    presets.push(`partial-${feature}`);
  }

  if (exists(folder)) {
    if (isEmptyFolder(folder)) {
      fs.rmdirSync(folder);
    } else if (options.overwrite === "yes") {
      deleteFolder(folder);
    } else {
      console.error("Folder " + folder + " already exists");
      return false;
    }
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
      },
    );
    if (!response.ok) {
      if (response.status == 404) {
        console.error("Preset not found");
      } else {
        console.error("Unable to create project: " + response.status);
      }
      return false;
    }

    const body = await response.arrayBuffer();
    fs.writeFileSync("temp.zip", new Uint8Array(body));
    try {
      await decompress("temp.zip", folder, {
        strip: 1,
        // workaround for https://github.com/kevva/decompress/issues/46
        filter: (file) =>
          (file.type !== "directory" &&
            !file.path.endsWith(path.sep) &&
            file.data.length !== 0) ||
          file.path.endsWith("styles.css"),
      });
    } catch (e) {
      console.error(e);
      return false;
    }
    fs.unlinkSync("temp.zip");
    return true;
  } catch (e) {
    console.error("Unable to create project: " + e);
    return false;
  }
}
let result;
let folder;

try {
  const argProjectName = process.argv.slice(2)?.[0];
  const codeBinary = await findCode();
  const intellijBinary = await findIntelliJ();

  const ideChoices = [];
  if (intellijBinary) {
    ideChoices.push({ title: "IntelliJ IDEA", value: "idea" });
  }
  if (codeBinary) {
    ideChoices.push({ title: "Visual Studio Code", value: "code" });
  }
  if (intellijBinary || codeBinary) {
    ideChoices.push({ title: "None", value: "none" });
  }

  if (argProjectName) {
    folder = sanitizePath(argProjectName);
  }

  result = await prompts(
    [
      {
        type: argProjectName ? null : "text",
        name: "projectName",
        message: "Project name:",
        initial: "my-vaadin-app",
        onState: (state) => {
          folder = sanitizePath(state.value);
        },
      },
      {
        type: () =>
          exists(folder) && !isEmptyFolder(folder) ? "select" : null,
        name: "overwrite",
        message: () => `Folder ${folder} already exists.`,
        choices: [
          { title: "Cancel", value: "no" },
          { title: "Remove old project and create a new", value: "yes" },
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
          { title: "Use pre release", value: "pre" },
        ],
      },
      {
        type: ideChoices.length > 0 ? "select" : null,
        name: "open-in-ide",
        message: "Open project in IDE:",
        choices: ideChoices,
      },
    ],
    {
      onCancel: () => {
        throw new Error("Cancel");
      },
    },
  );

  const ideBinary =
    result["open-in-ide"] === "idea"
      ? intellijBinary
      : result["open-in-ide"] === "code"
        ? codeBinary
        : undefined;

  if (argProjectName) {
    result.projectName = argProjectName;
  }

  const downloaded = await downloadProject(folder, result);
  if (downloaded) {
    console.log("");
    console.log("Project '" + result.projectName + "' created");
    console.log("");
    console.log(
      `To run your project, open the ${folder} folder in your IDE and launch the Application class`,
    );
    console.log("");
    console.log("You can also run from the terminal using");
    console.log("- cd " + folder);
    console.log("- mvn");
    console.log("");
    if (ideBinary) {
      spawn(`"${ideBinary}"`, [folder], { shell: true });
    }
  }
} catch (e) {
  if (e?.message == "Cancel") {
    console.log("Aborted");
  }
}
