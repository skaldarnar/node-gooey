const { join } = require("path");
const fs = require("fs-extra");

const MODULE = "module.txt";

async function readModuleInfo(module) {
    const moduleInfoFile = join(module, MODULE);
    return await fs.readJSON(moduleInfoFile);
}

async function writeModuleInfo(module, moduleInfo, options={}) {
    const moduleInfoFile = join(module, MODULE);

    if (!options.dryRun) {
        await fs.outputJSON(moduleInfoFile, moduleInfo, { spaces: 4 });
        return moduleInfoFile;
    }
    return moduleInfoFile;
}

module.exports = {
    readModuleInfo,
    writeModuleInfo
}