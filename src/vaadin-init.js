#!/usr/bin/env node

"use strict";

const fs = require("fs");
const request = require("request-promise");
const opn = require("opn");
const uuid = require("uuid/v4");
const os = require("os");
const readline = require("readline-sync");
const decompress = require("decompress");
const choices = require("prompt-choices");
const Enquirer = require("enquirer");
const wrap = require("ansi-wrap");

const proKeyFile = os.homedir() + "/.vaadin/proKey";
class ProKey {
  static async getProKey() {
    if (fs.existsSync(proKeyFile)) {
      return JSON.parse(fs.readFileSync(proKeyFile));
    } else {
      const proKey = await this.openBrowserAndWaitForKey();
      if (proKey) {
        fs.writeFileSync(proKeyFile, proKey);
      }
      return JSON.parse(proKey);
    }
  }

  static async openBrowserAndWaitForKey() {
    const uniqueId = uuid();

    const url = "https://vaadin.com/pro/validate-license";
    const loginUrl = url + "?connect=" + uniqueId;
    const pollUrl = url + "/connect/" + uniqueId;

    try {
      console.log("The operation requires you to authenticate to vaadin.com.");
      readline.question("Press enter to open your system browser to log in...");
      opn(loginUrl, { wait: false });
    } catch (e) {
      console.error(
        "Error opening system browser to validate license. Please open " +
          loginUrl +
          " manually",
        e
      );
    }

    try {
      return this.listenForProKey(pollUrl);
    } catch (e) {
      throw e;
    }
  }

  static async listenForProKey(url) {
    const timeout = new Date().getTime() + 1000 * 60;

    var data;
    while (!data && new Date().getTime() < timeout) {
      //            console.debug('Polling ' + url + ' for pro key');

      await request(url, (error, response, body) => {
        if (response && response.statusCode == 200) {
          data = body;
        }
      }).catch(e => {
        // Server returns 404 if the login process has not completed
      });
    }
    return data;
  }
}

const program = require("commander");
program
  .option("--pre", "Use the latest pre release (if available)")
  .option(
    "--tech [tech]",
    "Use the specified tech stack [spring, javaee, osgi, plain-java]",
    "spring"
  )
  .arguments("<projectName>")
  .action(async function(projectName) {
    var enquirer = new Enquirer();
    enquirer.register("radio", require("prompt-radio"));
    var starterType = new choices([
      //      'Customized project using Spring (opens a browser for customization)',
      "Empty project using Spring Boot",
      "Empty project using CDI"
      //      'Bakery example application using Spring'
    ]);
    enquirer.question({
      name: "starter",
      message: "Please select the starter to use",
      type: "radio",
      choices: starterType,
      options: {
        pointer: wrap("38;5;45", 39, "}>")
      },
      default:
        "Customized project using Spring (opens a browser for customization)"
    });
    //    await enquirer.ask('starter');
    const techStack = program.tech;
    const version = program.pre ? "pre-release" : "latest";
    const fs = require("fs");
    if (fs.existsSync(projectName)) {
      console.error("Directory '" + projectName + "' already exists");
      return;
    }

    console.log(
      `Creating application '${projectName}' using ${techStack}${
        program.pre ? " (Vaadin pre-release)" : ""
      }`
    );

    const options = {
      qs: {
        appName: projectName,
        groupId: "com.example.app",
        techStack: techStack
      },
      encoding: null,
      gzip: true
      /*      auth: {
        user: proKey.username,
        pass: proKey.proKey,
        sendImmediately: false
      }*/
    };
    await request.get(
      `https://vaadin.com/vaadincom/start-service/${version}/project-base`,
      options,
      function(error, response, body) {
        if (response && response.statusCode == 200) {
          fs.writeFileSync("temp.zip", body);
          decompress("temp.zip", projectName, { strip: 1 } );
          fs.unlinkSync("temp.zip");
          console.log("Project '" + projectName + "' created");
        }
      }
    );
  });

program.parse(process.argv);
