<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-06-07 03:07:48
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <!-- 查询表单 -->
        <el-form :model="queryForm" inline style="margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <el-form-item label="起始日期">
                <el-date-picker
                    v-model="queryForm.startDate"
                    type="date"
                    placeholder="选择起始日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 180px;"
                />
            </el-form-item>
            <el-form-item label="结束日期">
                <el-date-picker
                    v-model="queryForm.endDate"
                    type="date"
                    placeholder="选择结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 180px;"
                />
            </el-form-item>
            <el-form-item label="仓库名称">
                <el-select v-model="queryForm.warehouse" placeholder="选择仓库" style="width: 150px;">
                    <el-option label="全部" value="" />
                    <el-option label="一号仓库" value="一号仓库" />
                    <el-option label="二号仓库" value="二号仓库" />
                    <el-option label="三号仓库" value="三号仓库" />
                    <el-option label="四号仓库" value="四号仓库" />
                    <el-option label="五号仓库" value="五号仓库" />
                    <el-option label="六号仓库" value="六号仓库" />
                </el-select>
            </el-form-item>
            <el-form-item label="楼层">
                <el-select v-model="queryForm.floor" placeholder="选择楼层" style="width: 120px;">
                    <el-option label="全部" value="" />
                    <el-option label="一层" value="一层" />
                    <el-option label="二层" value="二层" />
                    <el-option label="三层" value="三层" />
                    <el-option label="四层" value="四层" />
                    <el-option label="五层" value="五层" />
                </el-select>
            </el-form-item>
            <el-form-item label="查询项">
                <el-select v-model="queryForm.queryType" placeholder="选择查询项" style="width: 120px;">
                    <el-option label="温度" value="temperature" />
                    <el-option label="湿度" value="humidity" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleQuery" :icon="Search">查询</el-button>
                <el-button @click="handleReset" :icon="Refresh">清空</el-button>
            </el-form-item>
        </el-form>
        
        <!-- 图表容器 -->
        <div ref="chartRef" style="flex: 1; width: 100%;"></div>
    </div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Search, Refresh } from '@element-plus/icons-vue';

const chartRef = ref(null);
let myChart = null;

// 查询表单数据
const queryForm = ref({
    startDate: '',
    endDate: '',
    warehouse: '',
    floor: '',
    queryType: 'temperature'
});

// 初始化图表
const initChart = () => {
    if (chartRef.value && !myChart) {
        myChart = echarts.init(chartRef.value);
        
        const option = {
            title: {
                text: '环境温度',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 20,
                bottom: 20,
            },
            toolbox: {
                feature: {
                    saveAsImage: {},
                    dataZoom: {},
                    restore: {}
                }
            },
            dataZoom: [
                {
                    type: 'slider',
                    xAxisIndex: 0
                },
                {
                    type: 'inside',
                    xAxisIndex: 0
                }
            ],
            xAxis: {
                type: 'category',
                name: '趋势',
                data: [
                    '05-01', '05-03', '05-05', '05-07', '05-09', '05-11', '05-13', '05-15',
                    '05-17', '05-19', '05-21', '05-23', '05-25', '05-27', '05-29', '05-31',
                    '06-02', '06-04', '06-06', '06-08', '06-10', '06-12', '06-14', '06-16',
                    '06-18', '06-20'
                ]
            },
            yAxis: {
                type: 'value',
                name: '环境温度℃',
                min: 1,
                max: 36,
                interval: 2.5
            },
            series: [
                {
                    name: '一号仓库五层东区1号',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.0, 22.2, 22.5, 22.8, 23.0, 24.0, 25.2, 26.5, 27.8, 28.2, 27.6, 26.1, 23.5, 21.0, 19.8, 18.5, 18.0, 20.2, 23.5, 25.5, 28.0, 31.0, 29.2, 27.5, 26.0, 24.5]
                },
                {
                    name: '一号仓库五层东区2号',
                    type: 'line',
                    symbol: 'rect',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.1, 22.4, 22.7, 23.0, 23.3, 24.2, 25.5, 26.8, 28.0, 28.3, 27.7, 26.2, 23.8, 21.3, 20.0, 18.8, 18.2, 20.4, 23.7, 25.8, 28.3, 31.3, 29.5, 27.8, 26.3, 24.8]
                },
                {
                    name: '一号仓库五层东区3号',
                    type: 'line',
                    symbol: 'diamond',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.3, 22.5, 22.8, 23.1, 23.5, 24.5, 25.8, 27.0, 28.2, 28.5, 28.0, 26.6, 24.0, 21.5, 20.2, 19.0, 18.5, 20.6, 24.0, 26.0, 28.5, 31.5, 29.8, 28.0, 26.5, 25.0]
                },
                {
                    name: '二号仓库五层西区1号',
                    type: 'line',
                    symbol: 'triangle',
                    symbolSize: 6,
                    smooth: true,
                    data: [21.8, 22.0, 22.2, 22.5, 22.7, 23.5, 24.7, 25.8, 27.0, 27.5, 26.9, 25.3, 22.7, 20.2, 19.0, 17.8, 17.5, 19.5, 22.5, 24.5, 27.0, 30.0, 28.3, 26.5, 25.0, 23.5]
                },
                {
                    name: '二号仓库五层西区2号',
                    type: 'line',
                    symbol: 'pin',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.0, 22.2, 22.5, 22.8, 23.0, 24.0, 25.2, 26.5, 27.8, 28.0, 27.4, 26.0, 23.4, 20.9, 19.7, 18.2, 17.9, 19.8, 23.0, 25.0, 27.5, 30.5, 28.7, 26.8, 25.3, 24.0]
                },
                {
                    name: '三号仓库五层东区1号',
                    type: 'line',
                    symbol: 'arrow',
                    symbolSize: 6,
                    smooth: true,
                    data: [21.5, 21.8, 22.1, 22.4, 22.6, 23.6, 24.8, 26.0, 27.2, 27.6, 27.0, 25.5, 23.0, 20.5, 19.3, 18.0, 17.6, 19.6, 22.8, 24.8, 27.2, 30.2, 28.4, 26.7, 25.2, 23.8]
                },
                {
                    name: '三号仓库五层东区2号',
                    type: 'line',
                    symbol: 'none',
                    symbolSize: 6,
                    smooth: true,
                    data: [21.7, 22.0, 22.3, 22.6, 22.9, 23.9, 25.1, 26.2, 27.4, 27.8, 27.2, 25.7, 23.2, 20.7, 19.5, 18.3, 17.8, 19.9, 23.2, 25.2, 27.6, 30.6, 28.9, 27.0, 25.5, 24.2]
                },
                {
                    name: '四号仓库五层西区1号',
                    type: 'line',
                    symbol: 'roundRect',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.2, 22.4, 22.6, 22.9, 23.1, 24.1, 25.3, 26.6, 27.9, 28.3, 27.7, 26.1, 23.6, 21.1, 19.9, 18.6, 18.2, 20.3, 23.6, 25.6, 28.1, 31.1, 29.4, 27.6, 26.1, 24.6]
                },
                {
                    name: '四号仓库五层西区2号',
                    type: 'line',
                    symbol: 'star',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.3, 22.5, 22.8, 23.0, 23.3, 24.3, 25.5, 26.7, 28.0, 28.4, 27.8, 26.3, 23.7, 21.2, 20.0, 18.7, 18.3, 20.4, 23.7, 25.7, 28.2, 31.2, 29.5, 27.7, 26.2, 24.7]
                },
                {
                    name: '五号仓库五层东区1号',
                    type: 'line',
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: true,
                    data: [22.0, 22.3, 22.6, 22.9, 23.1, 24.1, 25.3, 26.4, 27.7, 28.1, 27.5, 26.0, 23.5, 21.0, 19.8, 18.5, 18.1, 20.2, 23.5, 25.5, 28.0, 31.0, 29.2, 27.4, 25.9, 24.4]
                },
                {
                    name: '六号仓库五层西区1号',
                    type: 'line',
                    symbol: 'rect',
                    symbolSize: 6,
                    smooth: true,
                    data: [21.9, 22.1, 22.4, 22.7, 23.0, 24.0, 25.2, 26.3, 27.6, 28.0, 27.4, 25.9, 23.4, 20.9, 19.7, 18.4, 18.0, 20.1, 23.4, 25.4, 27.9, 30.9, 29.1, 27.3, 25.8, 24.3]
                }
            ]
        };
        
        myChart.setOption(option);
        
        // 添加窗口大小变化监听
        window.addEventListener('resize', handleResize);
    }
};

// 处理窗口大小变化
const handleResize = () => {
    if (myChart) {
        myChart.resize();
    }
};

// 查询方法
const handleQuery = () => {
    console.log('查询条件:', queryForm.value);
    // 这里可以根据查询条件重新加载图表数据
    // 目前只是打印查询条件，实际项目中应该调用API获取数据
    if (myChart) {
        // 根据查询条件更新图表
        updateChartData();
    }
};

// 清空方法
const handleReset = () => {
    queryForm.value = {
        startDate: '',
        endDate: '',
        warehouse: '',
        floor: '',
        queryType: 'temperature'
    };
    // 重置后重新加载默认数据
    if (myChart) {
        updateChartData();
    }
};

// 根据查询条件更新图表数据
const updateChartData = () => {
    if (!myChart) return;
    
    // 这里可以根据查询条件过滤数据
    // 目前保持原有数据，实际项目中应该根据查询条件获取新数据
    const option = myChart.getOption();
    myChart.setOption(option);
};

// 组件挂载时初始化图表
onMounted(async () => {
    // 等待DOM更新完成
    await nextTick();
    // 延迟一点时间确保容器尺寸正确
    setTimeout(() => {
        initChart();
    }, 100);
});

// 组件卸载时清理
onUnmounted(() => {
    if (myChart) {
        window.removeEventListener('resize', handleResize);
        myChart.dispose();
        myChart = null;
    }
});
</script>