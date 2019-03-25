const http = require('http');
const https = require('https');
const url = require('url');
const io = require('./io');

const home = `${__dirname}/tiles/`;

module.exports = class DownloadTiles {
	constructor({ theme, types }) {
		this.theme = theme || '';
		this.types = types || [];
		this.downloading = false;
		this.map_types = [
			{
				type: 'normal',
				name: '街道图'
			},
			{
				type: 'sate',
				name: '卫星图'
			}
		]
	}

	tileUri(type, {x, y, z}) {
		const baseUrl = 'https://gss0.bdstatic.com';
		const tileTemplate = {
			normal: `${baseUrl}/8bo_dTSlRcgBo1vgoIiO_jowehsv/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1&udt=20181030`,
			sate: `${baseUrl}/5bwHcj7lABFT8t_jkk_Z1zRvfdw6buu/it/u=x=${x};y=${y};z=${z};v=009;type=sate&fm=46&udt=20181030`
		}
		let theme = this.theme;
		if(theme != '') {
			tileTemplate.normal = `http://api2.map.bdimg.com/customimage/tile?&x=${x}&y=${y}&z=${z}&udt=20190321&scale=1&customid=${theme}`
		}
		return tileTemplate[type]
	}

	getTypeByName(name) {
		let types = this.map_types;
		let type = null;
		for(let i in types) {
			if(types[i].name == name) {
				type = types[i].type
			}
		}
		return type;
	}

	createUrls(points, types) {
		if(!types.length) {
			return;
		}
		let urls = [];
		for(let i = 0; i < types.length; i ++) {
			let type = this.getTypeByName(types[i]);
			for(let j = 0; j < points.length; j ++) {
				let pt = this.clone(points[j]);
				let url = this.tileUri(type, pt);
				urls.push(Object.assign(pt, {type, url}))
			}
		}
		return urls
	}

	clone(obj) {
		return JSON.parse(JSON.stringify(obj)) // 拷贝对象
	}

	fetchData(uri, cbs) {
		let { protocol } = url.parse(uri);
		let target = protocol == 'http:' ? http : https;
		target.get(uri, res => {
			let chunks = [];
			res.on('data', chunk => {
				chunks.push(chunk)
			})
	
			res.on('end', () => {
				cbs.success(chunks)
			})
		}).on('error', err => {
			console.log(err);
			cbs.fail(err);
		})
	}

	downloadTile({x, y, z, type, url}, cb) {
		let callbacks = {}
	
		callbacks.success = res => {
			let buffers = Buffer.concat(res);

			let typeDir = `${home}${type}`;
			if(!io.exist(typeDir)) {
				io.mkDir(typeDir)
			}
	
			let zDir = `${typeDir}/${z}/`;
			io.mkDir(zDir)
	
			let xDir = `${zDir}/${x}/`;
			io.mkDir(xDir)
	
			// let yDir = `${xDir}${y}/`
			// mkDir(yDir)
	
			io.writeFile(`${xDir}${y}.png`, buffers);
			cb(true)
		}
	
		callbacks.fail = err => {
			//
			cb(false)
		}
		
		this.fetchData(url, callbacks)
	}

	getNow() {
		return new Date().getTime()
	}

	download(list, cbs) {

		console.log(`开始下载......`)
	
		let start = this.getNow();
		
		let index = 0;
		let imgCount = list.length;
		let run = () => {
			if(!this.downloading) {
				return;
			}

			this.downloadTile(list[index], res => {
				if(res) {
					cbs.process((index + 1)/imgCount);
	
					console.log(`正在下载${index + 1}/${imgCount}......`)
					if(index < imgCount - 1) {
						index ++;
						run()
					}
					else {
						let cost = this.getNow() - start;
						console.log(`下载完成, 总共耗时${cost/1000}秒.`);
						cbs.success()
					}
				}
			})
		}
	
		run()
	}

	downloadTiles(points, cbs) {

		this.downloading = true;

		let urls = this.createUrls(points, this.types);
	
		io.mkDir(home)
		this.download(urls, cbs)
	}

	stop() {
		this.downloading = false
	}

}
