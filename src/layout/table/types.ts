/**
 * 报表数据项类型定义
 */
export interface TableData {
  date: string // 日期
  time: string // 时间
  weatherTemp: string | null // 天气温度
  weatherHumidity: string | null // 天气湿度
  coreTempMax: string // 包芯温度最高
  coreTempMin: string // 包芯温度最低
  coreTempAvg: string // 包芯温度平均
  ambientTempMax: string // 环境温度最高
  ambientTempMin: string // 环境温度最低
  ambientTempAvg: string // 环境温度平均
  ambientHumidityMax: string // 环境湿度最高
  ambientHumidityMin: string // 环境湿度最低
  ambientHumidityAvg: string // 环境湿度平均
}

/**
 * 查询表单类型定义
 */
export interface QueryForm {
  startDate: string
  endDate: string
  time: number | string
  warehouse: string
  storageArea: string
  storageLocation: string
}

/**
 * API 响应类型定义（预留）
 */
export interface ReportDataResponse {
  data: TableData[]
  total: number
}
