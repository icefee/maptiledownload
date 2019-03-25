const fs = require('fs');

const readFile = file => {
    if(!exist(file)) return null;
    return fs.readFileSync(file)
}

const writeFile = (path, str) => {
    fs.writeFileSync(path, str)
}

const exist = path => {
    return fs.existsSync(path)
}

const mkDir = dir => {
    if(!exist(dir)) {
        fs.mkdirSync(dir)
    }
}

module.exports = { readFile, writeFile, exist, mkDir }
