/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-30 00:59:13
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-30 15:47:11
 * @FilePath: /factory-visualization/packages/backend/src/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type QuerySensorParams = {
    code: string,
    startDate: string,
    endDate: string
    query: 'temperature' | 'humidity',
    sensor: 1 | 2
}

export type QuerySensorResult = {
    recordTime: string,
    temperature: number,
    humidity: number
}

export type QueryTableParams = {
    code: string,
    startDate: string,
    endDate: string,
    sensor: 1 | 2,
    pageSize: number,
    pageNum: number
}

export type TableRow = {
    date: string,
    time: string,
    temperature: number,
    humidity: number,
    cjqbh: string,    // 采集器编号
    voltage: number,    // 电压
}

export type QueryTableResult = {
    data:TableRow[],
    total: number,  
    totalPage: number,  // 总页数
    pageSize: number,
    pageNum: number
}