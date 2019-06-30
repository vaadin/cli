const os = require("os");
const fs = require("fs");
const path = require("path");
const replaceInFile = require("replace-in-file");
const dl = require("./download.js");
const urls = {
  Linux:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-linux.tar.gz",
  Darwin:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-osx.tar.gz",
  Windows_NT:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-windows.zip"
};


const patchProject = async () => {
  const options = {
    files: "pom.xml",
    from: /<scanIntervalSeconds>.*<\/scanIntervalSeconds>/g,
    to: "<scanIntervalSeconds>-1</scanIntervalSeconds>"
  };
  const results = await replaceInFile(options);
  const hotswapProperties = "src/main/resources/hotswap-agent.properties";
  if (!fs.existsSync(hotswapProperties)) {
    const fd = fs.openSync(hotswapProperties, "w");
    fs.writeSync(
      fd,
      `
autoHotswap=true`
    );
    fs.closeSync(fd);
  }
};

const enableHotswap = async function() {
  const downloadUrl = urls[os.type()];
  if (!downloadUrl) {
    console.error("Unsupported operating system: " + os.type());
    return;
  }
  const filename = decodeURIComponent(path.basename(downloadUrl));
  const nameAndVersion = decodeURIComponent(path.basename(path.dirname(downloadUrl)));
  const targetFile = nameAndVersion + "/" + filename;
  await dl.downloadIfNeeded(downloadUrl, targetFile);

  const jdkHome = dl.vaadinInHome + "/jdk/" + nameAndVersion;
  await dl.extractIfNeeded(targetFile, jdkHome);
  await patchProject();
  console.log("To use hotswapping, run your project as");
  var javaHome = jdkHome;
  if (os.type == "Darwin") {
    javaHome += "/Contents/Home";
  }
  console.log("JAVA_HOME=" + javaHome + " mvn");
  console.log("or use");
  console.log(javaHome + " as your IDE JDK and launch the app in debug mode");
};

module.exports = enableHotswap;
