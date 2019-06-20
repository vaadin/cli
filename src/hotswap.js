const os = require("os");
const fs = require("fs");
const path = require("path");
const request = require("request");
const targz = require("targz");
const replaceInFile = require("replace-in-file");

const urls = {
  Linux:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-linux.tar.gz",
  Darwin:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-osx.tar.gz",
  Windows_NT:
    "https://github.com/TravaOpenJDK/trava-jdk-11-dcevm/releases/download/dcevm-11.0.1%2B8/java11-openjdk-dcevm-windows.zip"
};

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
  const version = decodeURIComponent(path.basename(path.dirname(downloadUrl)));
  const vaadinInHome = os.homedir() + "/.vaadin";
  const jdkHome = vaadinInHome + "/trava-jdk/" + version;
  const downloadLocation =
    vaadinInHome + "/downloads/" + version + "/" + filename;
  if (!fs.existsSync(downloadLocation)) {
    fs.mkdirSync(path.dirname(downloadLocation), { recursive: true });
    console.log("Downloading " + downloadUrl + " to " + downloadLocation);
    const error = await download(downloadUrl, downloadLocation);
    if (error) {
      console.error("Failed to download file: " + error);
      return;
    } else {
      console.log("Downloaded " + downloadUrl + " to " + downloadLocation);
    }
  }

  if (!fs.existsSync(jdkHome)) {
    console.log("Unpacking Trava JDK to " + path.dirname(jdkHome) + "...");
    fs.mkdirSync(path.dirname(jdkHome), { recursive: true });
    targz.decompress(
      {
        src: downloadLocation,
        dest: path.dirname(jdkHome)
      },
      function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Unpacked Trava JDK");
        }
      }
    );
  }
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
