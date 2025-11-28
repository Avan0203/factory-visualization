<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-11-28 15:23:43
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
        <el-form :model="queryForm" inline
            style="padding: 12px 12px 0 12px; background: #f5f5f5; flex-shrink: 0; white-space: nowrap; overflow-x: auto;">
            <el-form-item label="">
                <el-date-picker v-model="queryForm.dataRange" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" style="width: 220px;"/>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.warehouse" placeholder="仓库" style="width: 170px;"
                    @change="handleWarehouseChange">
                    <el-option v-for="option in warehouseOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.floor" placeholder="楼层" style="width: 100px;"
                    @change="handleFloorChange">
                    <el-option v-for="option in floorOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.direction" placeholder="库位" style="width: 80px;"
                    @change="handleDirectionChange">
                    <el-option v-for="option in directionOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.location" placeholder="货位" style="width: 100px;">
                    <el-option v-for="option in locationOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.queryType" placeholder="查询项" style="width: 80px;">
                    <el-option label="温度" value="temperature" />
                    <el-option label="湿度" value="humidity" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.sensorType" placeholder="传感器类型" style="width: 130px;">
                    <el-option label="环境传感器" value="1" />
                    <el-option label="包芯传感器" value="2" />
                </el-select>
            </el-form-item>
            <el-form-item style="margin-right: 0;">
                <el-button type="primary" @click="handleAdd" :icon="Plus">添加</el-button>
                <el-button @click="handleReset" :icon="Refresh">清空</el-button>
            </el-form-item>
        </el-form>

        <!-- 标签区域 -->
        <div
            style="padding: 8px; background: #f9f9f9; border-radius: 4px; flex-shrink: 0; min-height: 30px; display: flex; flex-wrap: wrap; align-items: flex-start;">
            <el-tag v-for="tag in tags" :key="tag.id" closable :type="tag.type" @close="handleTagClose(tag)"
                style="margin-right: 8px; margin-bottom: 5px;">
                {{ tag.name }}
            </el-tag>
        </div>

        <!-- 图表容器 -->
        <div ref="chartRef" style="flex: 1; width: 100%; min-height: 0;"></div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { querySensorData } from '../../api/sensor';
import { warehouseOptions, floorOptions, dir1Options, dir2Options, locationOptions, buildingNameConfig } from '../../config';
const chartRef = ref(null);
let myChart = null;

// 生成日期范围（今天前15天到后15天）
const generateDateRange = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 15);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 15);

    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
};

// TODO 根据日期范围生成日期标签
// 生成日期标签
const generateDateLabels = () => {
    const today = new Date();
    const labels = [];

    for (let i = -15; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        labels.push(`${month}-${day}`);
    }

    return labels;
};

// 查询表单数据
const queryForm = ref({
    dataRange: [],
    warehouse: '', // 楼号（buildingCode）2
    floor: '', // 楼层索引（0, 1, 2...）
    direction: '', // 方向编码（01, 02）
    location: '', // 货位号
    queryType: 'temperature',
    sensorType: '1'
});

// 方向编码转换为可读名称
const getDirectionName = (directionCode: string, buildingCode: string) => {
    if (Number(buildingCode) < 46) {
        return directionCode === '01' ? '东库' : '西库';
    } else {
        return directionCode === '01' ? '南库' : '北库';
    }
};

// 库位（方向）选项
const directionOptions = computed(() => {
    return +queryForm.value.warehouse < 46 ? dir1Options : dir2Options;
})

console.log(locationOptions);

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

// 标签数据
const tags = ref([]);

// 图表数据
const chartData = ref({
    series: []
});

// 日期标签
const dateLabels = ref([]);

// 初始化图表
const initChart = () => {
    if (chartRef.value && !myChart) {
        myChart = echarts.init(chartRef.value);

        // 生成日期标签
        dateLabels.value = generateDateLabels();

        const option = {
            title: {
                text: '环境监测',
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
                name: '时间',
                data: dateLabels.value
            },
            yAxis: {
                type: 'value',
                name: '数值',
                min: 1,
                max: 36,
                interval: 2.5
            },
            series: chartData.value.series
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

// 将日期转换为 YYYY-MM-DD 格式
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 将数据按日期映射到日期标签数组
const mapDataToDateLabels = (data, queryType) => {
    // 生成日期范围对应的日期字符串数组
    const today = new Date();
    const dateStrings = [];
    for (let i = -15; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dateStrings.push(formatDate(date));
    }

    // 创建日期到数据的映射
    const dataMap = new Map();
    data.forEach(item => {
        const recordDate = new Date(item.recordtime);
        const dateStr = formatDate(recordDate);
        const value = queryType === 'temperature' ? item.temperature : item.humidity;

        if (!dataMap.has(dateStr)) {
            dataMap.set(dateStr, []);
        }
        const values = dataMap.get(dateStr);
        values.push(value);
    });

    // 将数据映射到日期标签数组（如果某天有多条数据，取平均值）
    const mappedData = [];
    dateStrings.forEach(dateStr => {
        const values = dataMap.get(dateStr);
        if (values && values.length > 0) {
            // 计算平均值
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            mappedData.push(Number(avg.toFixed(1)));
        } else {
            // 没有数据时使用 null（echarts 会跳过）
            mappedData.push(null);
        }
    });

    return mappedData;
};

// 添加方法
const handleAdd = async () => {
    // 验证必选字段
    if (!queryForm.value.warehouse || !queryForm.value.floor || !queryForm.value.direction || !queryForm.value.location || !queryForm.value.queryType) {
        ElMessage.warning('请选择必要选项：仓库、楼层、库位、货位、查询项');
        return;
    }

    const buildingData = queryForm.value.warehouse;

    const buildingName = Object.values(buildingNameConfig).find(item => item.code === buildingData)?.name || '';

    const floorIndex = parseInt(queryForm.value.floor);
    const floorName = `第${floorIndex + 1}层`;

    const directionName = getDirectionName(queryForm.value.direction, buildingName);

    // 生成标签名称
    const tagName = `${buildingName}${floorName}${directionName}${+queryForm.value.location}号位`;

    // 检查是否已存在相同的标签
    const existingTag = tags.value.find(tag => tag.name === tagName);
    if (existingTag) {
        ElMessage.warning('该位置已存在，请勿重复添加');
        return;
    }

    try {
        // 调用接口查询数据
        const queryParams = {
            warehouse: queryForm.value.warehouse,
            floor: floorIndex,
            direction: queryForm.value.direction,
            location: queryForm.value.location,
            dataRange: queryForm.value.dataRange,
            queryType: queryForm.value.queryType as 'temperature' | 'humidity'
        };

        const sensorData = await querySensorData(queryParams);

        // 将数据映射到日期标签数组
        const chartDataArray = mapDataToDateLabels(sensorData, queryForm.value.queryType);

        // 检查是否有数据
        const hasData = chartDataArray.some(val => val !== null && val !== undefined);
        if (!hasData) {
            ElMessage.warning('查询时间段内无数据');
            return;
        }

        // 创建新的标签
        const newTag = {
            id: Date.now(),
            name: tagName,
            type: 'primary',
            data: chartDataArray,
            queryType: queryForm.value.queryType
        };

        // 添加到标签列表
        tags.value.push(newTag);

        // 创建图表系列数据
        const symbolTypes = ['circle', 'rect', 'diamond', 'triangle', 'pin', 'arrow', 'roundRect', 'star'];
        const symbolType = symbolTypes[chartData.value.series.length % symbolTypes.length];

        const newSeries = {
            name: tagName,
            type: 'line',
            symbol: symbolType,
            symbolSize: 6,
            smooth: true,
            data: chartDataArray
        };

        // 添加到图表数据
        chartData.value.series.push(newSeries);

        // 更新图表
        updateChartData();

        // 清空表单
        queryForm.value = {
            dataRange: queryForm.value.dataRange,
            warehouse: '',
            floor: '',
            direction: '',
            location: '',
            queryType: 'temperature',
            sensorType: '1'
        };

        ElMessage.success('添加成功');
    } catch (error) {
        // 查询失败时不阻塞页面，只显示错误提示
        console.error('查询数据失败:', error);
        ElMessage.error('查询数据失败，请稍后重试');
    }
};

// 标签删除方法
const handleTagClose = (tag) => {
    // 从标签列表中移除
    const tagIndex = tags.value.findIndex(t => t.id === tag.id);
    if (tagIndex > -1) {
        tags.value.splice(tagIndex, 1);
    }

    // 从图表数据中移除对应的系列
    const seriesIndex = chartData.value.series.findIndex(s => s.name === tag.name);
    if (seriesIndex > -1) {
        chartData.value.series.splice(seriesIndex, 1);
    }
    // 更新图表
    updateChartData();

    ElMessage.success('删除成功');
};

// 清空方法
const handleReset = () => {
    queryForm.value = {
        dataRange: [],
        warehouse: '',
        floor: '',
        direction: '',
        location: '',
        queryType: 'temperature',
        sensorType: '1'
    };
};

// 根据查询条件更新图表数据
const updateChartData = () => {
    if (!myChart) return;

    // 更新图表配置
    const option = {
        title: {
            text: '环境监测',
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
            name: '时间',
            data: dateLabels.value
        },
        yAxis: {
            type: 'value',
            name: '数值',
            min: 1,
            max: 36,
            interval: 2.5
        },
        series: chartData.value.series
    };

    myChart.setOption(option, true); // 使用true强制重新渲染
};


// 组件挂载时初始化图表
onMounted(async () => {
    // 设置默认日期范围
    const dateRange = generateDateRange();
    queryForm.value.dataRange = [dateRange.start, dateRange.end];

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