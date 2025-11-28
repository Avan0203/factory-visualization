<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:33
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-11-27 10:19:28
 * @FilePath: /factory-visualization/src/layout/table.vue
 * @Description: 报表统计页面
-->
<template>
  <div class="table-container">
    <!-- 查询条件区域 -->
    <div class="query-panel">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="开始日期" :width="150">
          <el-date-picker
            v-model="queryForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="form-item-input"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="queryForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="form-item-input"
          />
        </el-form-item>
        <el-form-item label="时间">
          <el-select
            v-model="queryForm.time"
            placeholder="选择时间"
            class="form-item-input"
            clearable
          >
            <el-option
              v-for="hour in timeOptions"
              :key="hour.value"
              :label="hour.label"
              :value="hour.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select
            v-model="queryForm.warehouse"
            placeholder="仓库"
            class="form-item-input"
            clearable
          >
            <el-option
              v-for="item in warehouseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择储区">
          <el-select
            v-model="queryForm.storageArea"
            placeholder="储区"
            class="form-item-input"
            clearable
          >
            <el-option
              v-for="item in storageAreaOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择储位">
          <el-select
            v-model="queryForm.storageLocation"
            placeholder="储位"
            class="form-item-input"
            clearable
          >
            <el-option
              v-for="item in storageLocationOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            统计
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Download" @click="handleExport">
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="date" label="日期" min-width="120" align="center" />
        <el-table-column prop="time" label="时间" min-width="100" align="center" />
        
        <!-- 天气列组 -->
        <el-table-column label="天气" align="center">
          <el-table-column prop="weatherTemp" label="温度" min-width="80" align="center">
            <template #default="{ row }">
              {{ row.weatherTemp !== null && row.weatherTemp !== undefined ? `${row.weatherTemp}°C` : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="weatherHumidity" label="湿度" min-width="80" align="center">
            <template #default="{ row }">
              {{ row.weatherHumidity !== null && row.weatherHumidity !== undefined ? `${row.weatherHumidity}%` : '-' }}
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 包芯温度列组 -->
        <el-table-column label="包芯温度" align="center">
          <el-table-column prop="coreTempMax" label="最高" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.coreTempMax }}°C
            </template>
          </el-table-column>
          <el-table-column prop="coreTempMin" label="最低" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.coreTempMin }}°C
            </template>
          </el-table-column>
          <el-table-column prop="coreTempAvg" label="平均" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.coreTempAvg }}°C
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 环境温度列组 -->
        <el-table-column label="环境温度" align="center">
          <el-table-column prop="ambientTempMax" label="最高" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientTempMax }}°C
            </template>
          </el-table-column>
          <el-table-column prop="ambientTempMin" label="最低" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientTempMin }}°C
            </template>
          </el-table-column>
          <el-table-column prop="ambientTempAvg" label="平均" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientTempAvg }}°C
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 环境湿度列组 -->
        <el-table-column label="环境湿度" align="center">
          <el-table-column prop="ambientHumidityMax" label="最高" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientHumidityMax }}%
            </template>
          </el-table-column>
          <el-table-column prop="ambientHumidityMin" label="最低" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientHumidityMin }}%
            </template>
          </el-table-column>
          <el-table-column prop="ambientHumidityAvg" label="平均" min-width="100" align="center">
            <template #default="{ row }">
              {{ row.ambientHumidityAvg }}%
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>

      <!-- 分页和统计信息 -->
      <div class="table-footer">
        <div class="total-info">共有记录{{ total }}条</div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 15, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { TableData } from './types'

// 获取今天的日期字符串（YYYY-MM-DD格式）
const getTodayDate = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 查询表单
const todayDate = getTodayDate()
const queryForm = reactive({
  startDate: todayDate,
  endDate: todayDate,
  time: '',
  warehouse: '',
  storageArea: '',
  storageLocation: ''
})

// 时间选项（0-23点）
const timeOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i}点`
}))

// 仓库选项
const warehouseOptions = ref([
  { value: '1', label: '一号仓库' },
  { value: '2', label: '二号仓库' }
])

// 储区选项
const storageAreaOptions = ref([
  { value: '1', label: '储区A' },
  { value: '2', label: '储区B' },
  { value: '3', label: '储区C' }
])

// 储位选项
const storageLocationOptions = ref([
  { value: '1', label: '储位1' },
  { value: '2', label: '储位2' },
  { value: '3', label: '储位3' }
])

// 表格数据
const tableData = ref<TableData[]>([])

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 15
})

// 总记录数
const total = ref(0)

// 生成假数据
const generateMockData = (): TableData[] => {
  const data: TableData[] = []
  // 使用查询表单中的日期
  const baseDate = queryForm.startDate || todayDate
  
  // 生成219条数据
  for (let i = 0; i < 219; i++) {
    const hour = Math.floor(i / 15) % 24
    const minute = (i % 15) * 4
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    
    // 生成随机温度值（20-30度之间）
    const baseTemp = 23 + Math.random() * 2
    const coreTemp = baseTemp + (Math.random() - 0.5) * 0.1
    const ambientTemp = baseTemp + (Math.random() - 0.5) * 0.1
    
    // 生成随机湿度值（30-50%之间）
    const baseHumidity = 40 + Math.random() * 10
    const ambientHumidity = baseHumidity + (Math.random() - 0.5) * 5
    
    // 生成天气数据（部分为空）
    const weatherTemp = i % 3 === 0 ? null : (20 + Math.random() * 10).toFixed(1)
    const weatherHumidity = i % 3 === 0 ? null : (30 + Math.random() * 20).toFixed(1)
    
    data.push({
      date: baseDate,
      time: timeStr,
      weatherTemp: weatherTemp,
      weatherHumidity: weatherHumidity,
      coreTempMax: coreTemp.toFixed(2),
      coreTempMin: coreTemp.toFixed(2),
      coreTempAvg: coreTemp.toFixed(2),
      ambientTempMax: ambientTemp.toFixed(2),
      ambientTempMin: ambientTemp.toFixed(2),
      ambientTempAvg: ambientTemp.toFixed(2),
      ambientHumidityMax: Math.max(ambientHumidity, 30).toFixed(1),
      ambientHumidityMin: Math.min(ambientHumidity, 50).toFixed(1),
      ambientHumidityAvg: ambientHumidity.toFixed(1)
    })
  }
  
  return data
}

// 所有数据
const allData = ref<TableData[]>([])

// 加载数据
const loadData = () => {
  // TODO: 替换为实际接口调用
  // const response = await fetchReportData(queryForm)
  // allData.value = response.data
  // total.value = response.total
  
  // 当前使用假数据
  allData.value = generateMockData()
  total.value = allData.value.length
  updateTableData()
}

// 更新表格数据（根据分页）
const updateTableData = () => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = allData.value.slice(start, end)
}

// 校验表单
const validateForm = (): boolean => {
  if (!queryForm.startDate) {
    ElMessage.warning('请选择开始日期')
    return false
  }
  if (!queryForm.endDate) {
    ElMessage.warning('请选择结束日期')
    return false
  }
  if (queryForm.time === '' || queryForm.time === null || queryForm.time === undefined) {
    ElMessage.warning('请选择时间')
    return false
  }
  if (!queryForm.warehouse) {
    ElMessage.warning('请选择仓库')
    return false
  }
  if (!queryForm.storageArea) {
    ElMessage.warning('请选择储区')
    return false
  }
  if (!queryForm.storageLocation) {
    ElMessage.warning('请选择储位')
    return false
  }
  return true
}

// 查询处理
const handleQuery = () => {
  // 先进行校验
  if (!validateForm()) {
    return
  }
  
  // TODO: 调用查询接口
  // loadData()
  
  // 当前重新加载假数据
  pagination.currentPage = 1
  loadData()
}

// 导出处理
const handleExport = () => {
  // TODO: 实现导出功能
  // await exportReportData(queryForm)
  console.log('导出功能待实现', queryForm)
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  updateTableData()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  updateTableData()
}

// 初始化时不加载数据，需要点击统计按钮才会加载
</script>

<style scoped>
.table-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.query-panel {
  background: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.query-form {
  margin: 0;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
}

.query-form :deep(.el-form-item) {
  margin-right: 15px;
  margin-bottom: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

.query-form :deep(.el-form-item__label) {
  white-space: nowrap;
}

.form-item-input {
  width: 150px;
}

.form-item-input.el-select {
  width: 150px;
}

.table-wrapper {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #303133;
}

.table-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-info {
  color: #606266;
  font-size: 14px;
}

.pagination-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  flex: 1;
  overflow: auto;
}

:deep(.el-table__header-wrapper) {
  overflow-x: auto;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}
</style>