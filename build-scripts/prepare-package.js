const fs = require('fs');
const path = require('path');

// 打包时需要保留的依赖
const requiredDependencies = {
  "@openim/electron-client-sdk": "^1.0.7",
  "@openim/wasm-client-sdk": "^3.8.0",
  "electron-log": "^5.0.0",
  "electron-capturer": "^0.8.0",
  "electron-store": "^8.1.0",
  "adm-zip": "^0.5.10",
  "i18next": "^22.5.0",
  "sudo-prompt": "^9.2.1",
  "node-fetch": "^3.3.2"
};

// 获取环境参数
const env = process.argv[2] || 'dev';
const customVersion = process.argv[3]; // 可选的版本参数
const isProduction = env === 'prod';

// 读取原始 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 获取版本号 - 优先级：命令行参数 > 环境变量 > package.json
const getVersion = () => {
  if (customVersion) {
    return customVersion;
  }
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }
  // 读取版本配置文件（如果存在）
  const versionFilePath = path.join(__dirname, '..', 'version.json');
  if (fs.existsSync(versionFilePath)) {
    const versionConfig = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    return versionConfig[env] || packageJson.version;
  }
  return packageJson.version;
};

const finalVersion = getVersion();

// 创建临时 package.json 用于打包
const tempPackageJson = {
  name: !isProduction ? packageJson.name : 'OpenCorp-ER',
  version: finalVersion,
  main: packageJson.main,
  description: packageJson.description,
  author: packageJson.author,
  private: packageJson.private,
  dependencies: requiredDependencies,
  hommepage: packageJson.homepage,
  // 保留必要的 scripts，包括 restore:package
  scripts: {
    postinstall: packageJson.scripts.postinstall || "",
    "restore:package": "node build-scripts/restore-package.js"
  }
};

// 备份原始 package.json
const backupPath = path.join(__dirname, '..', 'package.json.backup');
fs.copyFileSync(packageJsonPath, backupPath);

// 写入临时 package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(tempPackageJson, null, 2));

console.log(`Prepared package.json for ${isProduction ? 'production' : 'development'} build`);
console.log(`Application name: ${tempPackageJson.name}`);
console.log(`Application version: ${finalVersion}`);
console.log(`Dependencies optimized to ${Object.keys(requiredDependencies).length} required packages`);