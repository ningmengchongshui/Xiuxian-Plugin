import fs from 'node:fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const schedule = require('node-schedule');
const __dirname = `${path.resolve()}${path.sep}plugins${path.sep}Xiuxian-Plugin-Box`;
class XiuxianSchedule {
    constructor() {
    };
    scheduleJobflie = (time) => {
        schedule.scheduleJob(time, () => {
            const myDate = new Date();
            const Y = myDate.getFullYear();
            const M = myDate.getMonth()+1;
            const D = myDate.getDate();
            const h = myDate.getHours();
            const m = myDate.getMinutes();
            const s = myDate.getSeconds();
            //复制所有文件
            const PATH = `${__dirname}${path.sep}resources${path.sep}data${path.sep}birth${path.sep}xiuxian`;
            //复制到哪里？同等级目录下，并命名为
            const NEW_PATH = `${path.resolve()}${path.sep}plugins${path.sep}XiuianData${path.sep}${Y}${M}${D}${h}${m}${s}`;
            fs.cp(PATH, NEW_PATH, { recursive: true }, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        });
    };
};
export default new XiuxianSchedule();