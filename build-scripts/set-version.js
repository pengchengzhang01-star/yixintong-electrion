const fs = require('fs');
const path = require('path');

// 获取参数
const env = process.argv[2]; // prod 或 dev
const newVersion = process.argv[3]; // 新版本号

if (!env || !newVersion) {
  console.error('Usage: node set-version.js <env> <version>');
  console.error('Example: node set-version.js prod 1.2.3');
  console.error('Example: node set-version.js dev 1.2.3-beta.1');
  process.exit(1);
}

if (!['prod', 'dev'].includes(env)) {
  console.error('Environment must be either "prod" or "dev"');
  process.exit(1);
}

// 更新 version.json
const versionFilePath = path.join(__dirname, '..', 'version.json');
let versionConfig = {};

if (fs.existsSync(versionFilePath)) {
  versionConfig = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
}

versionConfig[env] = newVersion;

fs.writeFileSync(versionFilePath, JSON.stringify(versionConfig, null, 2));

console.log(`✅ Set ${env} version to: ${newVersion}`);
console.log(`Version config saved to: ${versionFilePath}`);