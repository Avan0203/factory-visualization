/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-30 00:59:13
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-12-21 11:04:49
 * @FilePath: /factory-visualization/packages/backend/src/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export type SensorItem = {
    query: 'temperature' | 'humidity',
    sensor: 1 | 2,
    code: string,
}

export type QuerySensorParams = {
    startDate: string,
    endDate: string
    items: SensorItem[]
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

// SSE订阅类型
export type SubscribeType = 'warehouse' | 'floor';

// SSE订阅参数 - 楼层查询
export type SubscribeFloorParams = {
    type: 'floor',
    warehouse: string,  // 例如 "01"
    floor: string,     // 例如 "1"
    interval: number   // 推送间隔（毫秒）
}

// SSE订阅参数 - 仓库查询
export type SubscribeWarehouseParams = {
    type: 'warehouse',
    warehouses: string[],  // 例如 ["01", "02", "03", ...]
    interval: number      // 推送间隔（毫秒）
}

// SSE订阅参数（联合类型）
export type SubscribeParams = SubscribeFloorParams | SubscribeWarehouseParams;

// SSE推送数据格式 - 楼层数据
export type SensorPushData = {
    temperature: number,
    humidity: number,
    data: string,      // 记录时间
    remark: 1 | 2      // 传感器类型：1-环境传感器，2-包芯传感器
    temppass: boolean,  // 温度是否正常
    thpass: boolean,    // 湿度是否正常
}

// SSE推送的完整数据格式 - 楼层
export type SensorPushResult = {
    [location: string]: SensorPushData
}

// SSE推送数据格式 - 仓库状态
export type WarehouseStatus = {
    temppass: boolean,  // 温度是否正常
    thpass: boolean,    // 湿度是否正常
    data: string        // 该楼所有货位最新数据的时间（ISO格式）
}

// SSE推送的完整数据格式 - 仓库
export type WarehousePushResult = {
    [warehouse: string]: WarehouseStatus
}

// SSE推送响应格式
export type SSEPushResponse = 
    | { type: 'floor', data: SensorPushResult }
    | { type: 'warehouse', data: WarehousePushResult }