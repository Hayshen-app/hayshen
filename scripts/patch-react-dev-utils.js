const fs = require('fs');
const path = require('path');

const target = path.resolve(
  __dirname,
  '../node_modules/react-dev-utils/checkRequiredFiles.js'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const legacyCall = 'fs.accessSync(filePath, fs.F_OK);';
const modernCall = 'fs.accessSync(filePath, fs.constants.F_OK);';
const source = fs.readFileSync(target, 'utf8');

if (source.includes(modernCall)) {
  process.exit(0);
}

if (!source.includes(legacyCall)) {
  throw new Error(
    'Unable to patch react-dev-utils: expected fs.F_OK call was not found.'
  );
}

fs.writeFileSync(target, source.replace(legacyCall, modernCall));
console.log('Patched react-dev-utils for Node.js 24 compatibility.');
