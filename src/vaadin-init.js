#!/usr/bin/env node

'use strict';

const download = require('download');
const fs = require('fs');
const request = require('request-promise');
const opn = require('opn');
const uuid = require('uuid/v4');
const os = require('os');
const readline = require('readline-sync');

const proKeyFile = os.homedir() + "/.vaadin/proKey";
class ProKey {

  static async getProKey() {
    if (fs.existsSync(proKeyFile)) {
      return fs.readFileSync(proKeyFile);
    } else {
      const proKey = await this.openBrowserAndWaitForKey();
      if (proKey) {
        fs.writeFileSync(proKeyFile, proKey);
      }
      return proKey;
    }
  }

  static async openBrowserAndWaitForKey() {
    const uniqueId = uuid();

    const url = 'https://vaadin.com/pro/validate-license';
    const loginUrl = url + '?connect=' + uniqueId;
    const pollUrl = url + "/connect/" + uniqueId;

    try {
      console.log('The operation requires you to authenticate to vaadin.com.');
      readline.question('Press enter to open your system browser to log in...');
      opn(loginUrl, { wait: false });
    } catch (e) {
      console.error('Error opening system browser to validate license. Please open '
        + loginUrl + " manually", e);
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

const program = require('commander');
program
  .arguments('<name>')
  .action(async function (name) {
    const proKey = await ProKey.getProKey(name);

    const fs = require('fs');
    if (fs.existsSync(name)) {
      console.error("Directory '" + name + "' already exists");
      return;
    }

    console.log("Creating app '" + name + "'");
    const zipName = name + '.zip';
    await download("https://artur.app.fi/start/project-base.zip", name, { extract: true });
  });

program.parse(process.argv);


