const os = require("os");
const fs = require("fs");
const path = require("path");
const request = require("request");
const tar = require("tar");

const vaadinInHome = os.homedir() + "/.vaadin";

const download = async function(url, dest) {
  const file = fs.createWriteStream(dest);
  const sendReq = request.get(url);
  var res, rej;
  const ret = new Promise(function(resolve, reject) {
    res = resolve;
    rej = reject;
  });
  sendReq.on("response", response => {
    sendReq.pipe(file);
  });

  file.on("finish", () =>
    file.close(() => {
      res();
    })
  );

  sendReq.on("error", err => {
    fs.unlinkSync(dest);
    rej(err);
  });

  file.on("error", err => {
    fs.unlinkSync(dest);
    rej(err.message);
  });

  return ret;
};

const downloadIfNeeded = async (downloadUrl, targetFile) => {
  const downloadLocation = vaadinInHome + "/downloads/" + targetFile;
  if (!fs.existsSync(downloadLocation)) {
    fs.mkdirSync(path.dirname(downloadLocation), { recursive: true });
    console.log("Downloading " + downloadUrl + " to " + downloadLocation);
    const error = await download(downloadUrl, downloadLocation);
    if (error) {
      throw "Failed to download file: " + error;
    } else {
      console.log("Downloaded " + downloadUrl + " to " + downloadLocation);
    }
  }
};

const extractIfNeeded = async (downloadedFile, targetFolder) => {
  const compressedFile = vaadinInHome + "/downloads/" + downloadedFile;
  if (!fs.existsSync(targetFolder)) {
    console.log(
      `Extracting ${compressedFile} to ${targetFolder}...`
    );
    fs.mkdirSync(targetFolder, { recursive: true });
    tar.x(
      {
        gzip: true,
        file: compressedFile,
        cwd: targetFolder,
        strip: 1
      },
      function(err) {
        if (err) {
          throw `Error extracting ${compressedFile}: ${err}`;
        } else {
          console.log(
            `Extracted ${compressedFile} to ${targetFolder}`
          );
        }
      }
    );
  }
};

module.exports = {
  downloadIfNeeded: downloadIfNeeded,
  extractIfNeeded: extractIfNeeded,
  vaadinInHome: vaadinInHome
};
