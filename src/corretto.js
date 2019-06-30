const os = require("os");
const path = require("path");
const dl = require("./download.js");
const urls = {
  Linux:
    "https://d3pxv6yz143wms.cloudfront.net/11.0.3.7.1/amazon-corretto-11.0.3.7.1-linux-x64.tar.gz",
  Darwin:
    "https://d3pxv6yz143wms.cloudfront.net/11.0.3.7.1/amazon-corretto-11.0.3.7.1-macosx-x64.tar.gz",
  Windows_NT:
    "https://d3pxv6yz143wms.cloudfront.net/11.0.3.7.1/amazon-corretto-11.0.3.7.1-windows-x64.zip"
};

const downloadJdkIfNeeded = async function() {
  const downloadUrl = urls[os.type()];
  if (!downloadUrl) {
    console.error("Unsupported operating system: " + os.type());
    return;
  }
  const filename = path.basename(downloadUrl);
  const nameAndVersion = "corretto-" + path.basename(path.dirname(downloadUrl));
  const targetFile = nameAndVersion + "/" + filename;
  await dl.downloadIfNeeded(downloadUrl, targetFile);

  const jdkHome = dl.vaadinInHome + "/jdk/" + nameAndVersion;
  await dl.extractIfNeeded(targetFile, jdkHome);

  var javaHome = jdkHome;
  if (os.type == "Darwin") {
    javaHome += "/Contents/Home";
  }
  console.log("JAVA_HOME=" + javaHome + " mvn");
};

module.exports = downloadJdkIfNeeded;
