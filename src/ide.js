import { glob } from "glob";

async function findFirst(candidates) {
  const found = await glob(candidates);
  return found.length > 0 ? found[0] : undefined;
}

export async function findIntelliJ() {
  const globalIntelliJ = ["idea"];
  const macIntelliJPaths = ["/Applications/IntelliJ*.app/Contents/MacOS/idea"];
  const linuxIntelliJPaths = [
    "/opt/idea/bin/idea.sh",
    "/opt/idea/bin/idea",
    "/usr/local/bin/idea",
  ];
  const windowsIntelliJPaths = [
    "C:/Program Files/JetBrains/IntelliJ*/bin/idea.bat",
    "C:/Users/*/AppData/Local/JetBrains/IntelliJ*/bin/idea.bat",
  ];

  const candidates = [
    ...globalIntelliJ,
    ...macIntelliJPaths,
    ...linuxIntelliJPaths,
    ...windowsIntelliJPaths,
  ];

  return findFirst(candidates);
}

export async function findCode() {
  const globalCode = ["code"];
  const macCodePaths = [
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  ];
  const linuxCodePaths = ["/usr/local/bin/code"];
  const windowsCodePaths = [
    "C:/Program Files*/Microsoft VS Code/bin/code",
    "C:/Users/*/AppData/Local/Programs/Microsoft VS Code/bin/code",
  ];

  const candidates = [
    ...globalCode,
    ...macCodePaths,
    ...linuxCodePaths,
    ...windowsCodePaths,
  ];
  return findFirst(candidates);
}
