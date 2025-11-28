/*
 * @Author: wuyifan wuyifan@udschina.com
 * @Date: 2025-11-26 16:30:26
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-11-28 15:27:14
 * @FilePath: \factory-visualization\src\config\inedex.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export const warehouseConfig = {
    "01": {
        "name": "徐州苏山头1号库",
    },
    "02": {
        "name": "徐州苏山头2号库",
    },
    "03": {
        "name": "徐州苏山头3号库",
    },
    "04": {
        "name": "徐州苏山头4号库",
    },
    "05": {
        "name": "徐州苏山头5号库",
    },
    "06": {
        "name": "徐州苏山头6号库",
    },
    "07": {
        "name": "徐州苏山头7号库",
    },
    "08": {
        "name": "徐州苏山头8号库",
    },
    "46": {
        "name": "徐州厂区原料1号库",
    },
    "47": {
        "name": "徐州厂区原料2号库",
    },
    "48": {
        "name": "徐州厂区原料3号库",
    },
    "49": {
        "name": "徐州厂区原料4号库",
    },
}

export const buildingNameConfig = {
    'building4': { name: '1号仓库', code: '01' },
    "building2": { name: '2号仓库', code: '02' },
    "building1": { name: '3号仓库', code: '03' },
    "building3": { name: '4号仓库', code: '04' },
    "building5": { name: '5号仓库', code: '05' },
    "building11": { name: '6号仓库', code: '06' },
    "building12": { name: '7号仓库', code: '07' },
    "building6": { name: '8号仓库', code: '08' },
    "building7": { name: '1号仓库', code: '46' },
    "building8": { name: '2号仓库', code: '47' },
    "building9": { name: '3号仓库', code: '48' },
    "building10": { name: '4号仓库', code: '49' },
}

export const dir1Options = [
    {
        label: '东库',
        value: '01'
    },
    {
        label: '西库',
        value: '02'
    }
]
export const dir2Options = [
    {
        label: '南库',
        value: '01'
    },
    {
        label: '北库',
        value: '02'
    }
]

// 楼层选项
export const floorOptions = [
    {
        label: '第1层',
        value: '01'
    },
    {
        label: '第2层',
        value: '02'
    },
    {
        label: '第3层',
        value: '03'
    },
    {
        label: '第4层',
        value: '04'
    },
    {
        label: '第5层',
        value: '05'
    }
]


// 货位号选项
export const locationOptions = Array.from({ length: 15 }, (_, index) => ({
    label: `${index + 1}号位`,
    value: (index + 1).toString().padStart(2, '0')
}));

// 仓库选项（楼号）
export const warehouseOptions = Object.entries(warehouseConfig).map(([key, value]) => ({
    label: value.name,
    value: key
}));

export const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i}点`
}))