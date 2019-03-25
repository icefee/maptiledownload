const io = require('./io');

const readConfig = path => {
	if(!path) {
        console.log(`无法读取配置文件`);
        return;
    }
	let buffer = io.readFile(path);
	if(buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
		buffer = buffer.slice(3);
    }
    let json = buffer.toString();
    try {
        let result = JSON.parse(json);
        return result;
    } catch (error) {
        return null;
    }
}

module.exports = { readConfig }
