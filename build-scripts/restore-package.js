const fs = require('fs');
const path = require('path');

// 恢复原始 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const backupPath = path.join(__dirname, '..', 'package.json.backup');

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, packageJsonPath);
  fs.unlinkSync(backupPath);
  console.log('Original package.json restored');
} else {
  console.log('No backup found, skipping restore');
}