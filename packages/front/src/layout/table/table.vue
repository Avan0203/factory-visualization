<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:33
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-12-22 01:11:14
 * @FilePath: /factory-visualization/src/layout/table.vue
 * @Description: 报表统计页面
-->
<template>
  <div class="table-container">
    <!-- 查询条件区域 -->
    <div class="query-panel">
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" style="width: 220px;" :unlink-panels="true" />
        </el-form-item>
        <el-form-item label="">
          <el-select v-model="queryForm.warehouse" placeholder="仓库" class="form-item-input" clearable
            style="width: 170px;">
            <el-option v-for="item in warehouseOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="" style="margin-right: 10px;">
          <el-select v-model="queryForm.floor" placeholder="楼层" style="width: 100px;" @change="handleFloorChange">
            <el-option v-for="option in floorOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="" style="margin-right: 10px;">
          <el-select v-model="queryForm.direction" placeholder="库位" style="width: 80px;"
            @change="handleDirectionChange">
            <el-option v-for="option in directionOptions" :key="option.value" :label="option.label"
              :value="option.value" />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="" style="margin-right: 10px;">
          <el-select v-model="queryForm.location" placeholder="货位" style="width: 100px;">
            <el-option v-for="option in locationOptions" :key="option.value" :label="option.label"
              :value="option.value" />
          </el-select>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            统计
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }">
        <el-table-column prop="date" label="日期" min-width="120" align="center" />
        <el-table-column prop="time" label="时间" min-width="100" align="center" />
        <el-table-column prop="temperature" label="温度(°C)" min-width="100" align="center" />
        <el-table-column prop="humidity" label="湿度(%)" min-width="100" align="center" />
        <el-table-column prop="voltage" label="电压(V)" min-width="100" align="center" />
        <el-table-column prop="cjqbh" label="采集器编号" min-width="120" align="center" />
      </el-table>

      <!-- 分页和统计信息 -->
      <div class="table-footer">
        <div class="total-info">共有记录{{ total }}条</div>
        <div class="pagination-wrapper">
          <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 15, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { TableRow } from 'backend';
import { warehouseOptions, floorOptions, dir1Options, dir2Options } from '@/config';
import { queryTableData } from '@/api';
import { useDateRange } from '@/composables';

const { dateRange } = useDateRange();

// 查询表单
const queryForm = ref({
  time: '',
  warehouse: '',
  floor: '',
  direction: '',
  location: '',
  sensorType: '1'
})

// 仓库变化时，清空楼层、方向、货位
const handleWarehouseChange = () => {
  queryForm.value.floor = '';
  handleFloorChange();
};

// 楼层变化时，清空方向、货位
const handleFloorChange = () => {
  queryForm.value.direction = '';
  handleDirectionChange();
};

// 方向变化时，清空货位
const handleDirectionChange = () => {
  queryForm.value.location = '';
};

// 表格数据
const tableData = ref<TableRow[]>([])

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 15
})

// 总记录数
const total = ref(0)

// 加载状态
const loading = ref(false)

// 库位（方向）选项
const directionOptions = computed(() => {
  return +queryForm.value.warehouse < 46 ? dir1Options : dir2Options;
})

// 加载数据
const loadData = async () => {
  if (loading.value) return

  try {
    loading.value = true

    const params = {
      warehouse: queryForm.value.warehouse,
      floor: queryForm.value.floor,
      direction: queryForm.value.direction,
      location: queryForm.value.location,
      dateRange: dateRange.value,
      pageSize: pagination.pageSize,
      pageNum: pagination.currentPage,
      sensorType: Number(queryForm.value.sensorType) as 1 | 2
    }

    const response = await queryTableData(params)

    tableData.value = response.data
    total.value = response.total

    // 如果当前页超过总页数，重置到第一页
    if (pagination.currentPage > response.totalPage && response.totalPage > 0) {
      pagination.currentPage = 1
      // 重新加载第一页数据
      await loadData()
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 校验表单
const validateForm = (): boolean => {
  if (!dateRange.value[0]) {
    ElMessage.warning('请选择开始日期')
    return false
  }
  if (!dateRange.value[1]) {
    ElMessage.warning('请选择结束日期')
    return false
  }
  if (!queryForm.value.warehouse) {
    ElMessage.warning('请选择仓库')
    return false
  }
  if (!queryForm.value.floor) {
    ElMessage.warning('请选择楼层')
    return false
  }
  if (!queryForm.value.direction) {
    ElMessage.warning('请选择库位')
    return false
  }
  if (!queryForm.value.location) {
    ElMessage.warning('请选择货位')
    return false
  }
  return true
}

// 查询处理
const handleQuery = async () => {
  // 先进行校验
  if (!validateForm()) {
    return
  }

  // 重置到第一页并加载数据
  pagination.currentPage = 1
  await loadData()
}


// 分页大小改变
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  await loadData()
}

// 当前页改变
const handleCurrentChange = async (page: number) => {
  pagination.currentPage = page
  await loadData()
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