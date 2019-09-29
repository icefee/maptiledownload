const DownloadTiles = require('./download');
const MapTool = require('./maptool');
const tool = require('./tool');

const config = tool.readConfig('./config.json');

if(!config) {
    console.log(`无效的配置文件`);
    return;
}

const { area, range, types, theme } = config;
const [s_lat, s_lng, e_lat, e_lng] = area;

const mapTool = new MapTool();
const downloader = new DownloadTiles({ types, theme }, __dirname);

const getPoints = () => {
    let points = [];
    for(let z = range[0]; z <= range[1]; z ++) {
        let left_bottom_tile = mapTool.lngLatToTile(s_lng, s_lat, z);
        let right_top_tile = mapTool.lngLatToTile(e_lng, e_lat, z);
        for(let x = left_bottom_tile.x; x <= right_top_tile.x; x ++) {
            for(let y = left_bottom_tile.y; y <= right_top_tile.y; y ++) {
                points.push({
                    x,
                    y,
                    z
                })
            }
        }
    }
    return points;
}

const task = () => {
    let points = getPoints();
    if(!points.length) return;
    downloader.downloadTiles(points, {
        success({ SUCCESS, FAIL }) {
            console.log(`下载完成, 成功：${SUCCESS}, 失败：${FAIL}`)
        },
        process(val) {
            if(!downloader.downloading) return;
            console.log('已下载：' + (val * 100).toFixed(2) + '%')
        }
    })
}

task()
