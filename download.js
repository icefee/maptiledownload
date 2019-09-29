const http = require('http');
const https = require('https');
const url = require('url');
const io = require('./io');

export class DownloadTiles {
	constructor({ theme, types }, dir) {
		this.theme = theme || '';
		this.types = types || [];
		this.downloading = false;
		this.dir = dir + '\\tiles\\';
	}

	tileUri(type, {x, y, z}) {
		const baseUrl = 'https://gss0.bdstatic.com';
		const tileTemplate = {
			normal: `${baseUrl}/8bo_dTSlRcgBo1vgoIiO_jowehsv/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=pl&scaler=1&udt=20181030`,
			sate: `${baseUrl}/5bwHcj7lABFT8t_jkk_Z1zRvfdw6buu/it/u=x=${x};y=${y};z=${z};v=009;type=sate&fm=46&udt=20181030`,
			mix: `${baseUrl}/8bo_dTSlR1gBo1vgoIiO_jowehsv/tile/?qt=vtile&x=${x}&y=${y}&z=${z}&styles=sl&udt=20190726`,
		}
		let theme = this.theme;
		if(theme != '') {
			tileTemplate.normal = `http://api2.map.bdimg.com/customimage/tile?&x=${x}&y=${y}&z=${z}&udt=20190321&scale=1&customid=${theme}`
		}
		return tileTemplate[type]
	}

	createUrls(points, types) {
		let mapTypes = types || this.types;
		if(!mapTypes.length) {
			return;
		}
		let urls = [];
		for(let i = 0; i < mapTypes.length; i ++) {
			let type = mapTypes[i];
			for(let j = 0; j < points.length; j ++) {
				let pt = this.clone(points[j]);
				let url = this.tileUri(type, pt);
				urls.push({ ...pt, ...{ type, url } })
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

	downloadTile({ x, y, z, type, url }) {
		return new Promise(resolve => {
			let callbacks = {}
			
			callbacks.success = res => {
				let buffers = Buffer.concat(res);
				let typeDir = `${this.dir}${type}`;
				if(!io.exist(typeDir)) {
					io.mkDir(typeDir)
				}
				
				let zDir = `${typeDir}\\${z}\\`;
				io.mkDir(zDir)
				
				let xDir = `${zDir}\\${x}\\`;
				io.mkDir(xDir)
				
				io.writeFile(`${xDir}${y}.png`, buffers);
				resolve(1);
			}
			
			callbacks.fail = err => {
				resolve(0)
			}
			
			this.fetchData(url, callbacks)
		})
	}

	async download(list, cbs) {
		let SUCCESS = 0, FAIL = 0;
		if(!this.downloading) {
			return;
		}

		for(let i = 0; i < list.length; i ++) {
			if(!this.downloading) break;
			let res = await this.downloadTile(list[i]);
			res ? SUCCESS ++ : FAIL ++;
			cbs.process((i + 1) / list.length);
		}
		cbs.success({ SUCCESS, FAIL });
		this.downloading = false;
	}

	downloadTiles(points, cbs) {
		this.downloading = true;
		let urls = this.createUrls(points, this.types);
		io.mkDir(this.dir);
		this.download(urls, cbs)
	}

	stop() {
		this.downloading = false
	}

}
