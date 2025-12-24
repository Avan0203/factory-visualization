<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-24 16:31:29
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
        <el-form :model="queryForm" inline
            style="padding: 12px 12px 0 12px; background: #f5f5f5; flex-shrink: 0; white-space: nowrap; overflow-x: auto;">
            <el-form-item label="">
                <el-date-picker v-model="dateRange[0]" type="date" placeholder="开始日期" style="width: 140px;"
                    @change="handleDateChange" />
                <span style="margin: 0 10px;">至</span>
                <el-date-picker v-model="dateRange[1]" type="date" placeholder="结束日期" style="width: 140px;"
                    @change="handleDateChange" />
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="warehouseForm.warehouse" placeholder="仓库" style="width: 170px;"
                    @change="handleWarehouseChange">
                    <el-option v-for="option in warehouseOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="warehouseForm.floor" placeholder="楼层" style="width: 100px;"
                    @change="handleFloorChange">
                    <el-option v-for="option in floorOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="warehouseForm.direction" placeholder="库位" style="width: 80px;"
                    @change="handleDirectionChange">
                    <el-option v-for="option in directionOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="warehouseForm.location" placeholder="货位" style="width: 100px;">
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
                {{ tag.label }}
            </el-tag>
        </div>

        <!-- 图表容器 -->
        <div ref="chartRef" style="flex: 1; width: 100%; min-height: 0;"></div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { querySensorData } from '@/api';
import { warehouseOptions, floorOptions, buildingNameConfig } from '@/config';
import { getDateRange } from '@/shard';
import { useDateRange, useTag, useWareHouse } from '@/composables';
const chartRef = ref(null);
let myChart = null;

const { dateRange, resetDateRange, validateDateRange } = useDateRange();

const { warehouseForm, directionOptions, locationOptions, resetWarehouseForm } = useWareHouse(true);


const backupDateRange = ref<[string, string]>([dateRange.value[0], dateRange.value[1]]);

// 更新日期标签和图表
const handleDateChange = async () => {
    if (backupDateRange.value[0] === dateRange.value[0] && backupDateRange.value[1] === dateRange.value[1]) return;
    if (validateDateRange()) {
        backupDateRange.value = [dateRange.value[0], dateRange.value[1]];
        const startDate = formatDate(dateRange.value[0]);
        const endDate = formatDate(dateRange.value[1]);
        dateLabels.value = generateDateLabels(startDate, endDate);
        // 更新图表x轴
        if (myChart) {
            await getTagData();
        }
    }
}

// 生成日期标签（根据日期范围）
const generateDateLabels = (startDate: string, endDate: string) => {
    const labels = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        labels.push(`${month}-${day}`);
        current.setDate(current.getDate() + 1);
    }

    return labels;
};

// 查询表单数据
const queryForm = ref({
    queryType: 'temperature',
    sensorType: '1'
});

// 仓库变化时，清空楼层、方向、货位
const handleWarehouseChange = () => {
    warehouseForm.value.floor = '';
    handleFloorChange();
};

// 楼层变化时，清空方向、货位
const handleFloorChange = () => {
    warehouseForm.value.direction = '';
    handleDirectionChange();
};

// 方向变化时，清空货位
const handleDirectionChange = () => {
    warehouseForm.value.location = '';
};



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

        // 生成日期标签（使用默认日期范围）
        const dateRange = getDateRange();
        dateLabels.value = generateDateLabels(dateRange[0], dateRange[1]);

        const option = {
            title: {
                text: '环境监测',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            grid: {
                left: '3%',
                right: '18%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: '3%',
                top: '10%',
                itemWidth: 14,
                itemHeight: 14,
                textStyle: {
                    fontSize: 12
                },
                itemGap: 8
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
                    xAxisIndex: 0,
                    bottom: '5%'
                },
                {
                    type: 'inside',
                    xAxisIndex: 0
                }
            ],
            xAxis: {
                type: 'category',
                name: '时间',
                data: dateLabels.value,
                axisLabel: {
                    rotate: 45,
                    interval: 0,
                    formatter: function (value: string) {
                        return value;
                    }
                },
                nameLocation: 'middle',
                nameGap: 30
            },
            yAxis: [
                {
                    type: 'value',
                    name: '温度(℃)',
                    position: 'left',
                    min: 0,
                    max: 40,
                    interval: 5,
                    axisLabel: {
                        formatter: '{value} °C'
                    }
                },
                {
                    type: 'value',
                    name: '湿度(%)',
                    position: 'right',
                    min: 0,
                    max: 100,
                    interval: 10,
                    axisLabel: {
                        formatter: '{value} %'
                    }
                }
            ],
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
const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 将数据按日期映射到日期标签数组
const mapDataToDateLabels = (data: any[], queryType: string, startDate: string, endDate: string) => {
    // 生成日期范围对应的日期字符串数组
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateStrings = [];
    const current = new Date(start);

    while (current <= end) {
        dateStrings.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    // 创建日期到数据的映射（后端已经按日期分组并计算平均值）
    const dataMap = new Map();
    data.forEach(item => {
        // 后端返回的recordTime格式为 YYYY-MM-DD
        const dateStr = item.recordTime;
        const value = queryType === 'temperature' ? item.temperature : item.humidity;
        dataMap.set(dateStr, value);
    });

    // 将数据映射到日期标签数组
    const mappedData = [];
    dateStrings.forEach(dateStr => {
        const value = dataMap.get(dateStr);
        // 如果值存在（包括0，因为0度是有效的温度值），则显示该值
        // 只有当值为undefined或null时才使用null（表示没有数据）
        if (value !== undefined && value !== null) {
            // 0度是有效数据，应该显示
            mappedData.push(Number(value.toFixed(1)));
        } else {
            // 没有数据时使用 null（echarts 会跳过，不显示该点）
            mappedData.push(null);
        }
    });

    return mappedData;
};

const {
    tags,
    handleTag,
    addTag,
    removeTag,
    isTagExists,
    clearTags,
    MAX_TAGS
} = useTag();

const getTagData = async () => {
    try {
        // 调用接口查询数据
        const queryParams = {
            dataRange: dateRange.value,
            items: tags.value.map(tag => ({
                code: tag.code,
                query: queryForm.value.queryType,
                sensor: queryForm.value.sensorType
            }))
        };

        const sensorDataArray = await querySensorData(queryParams);

        // 获取日期范围用于数据映射
        const startDate = formatDate(dateRange.value[0]);
        const endDate = formatDate(dateRange.value[1]);

        // 创建图表系列数据
        const symbolTypes = ['circle', 'rect', 'diamond', 'triangle', 'pin', 'arrow', 'roundRect', 'star'];

        // 根据查询类型确定使用哪个Y轴：温度用左轴(0)，湿度用右轴(1)
        const yAxisIndex = queryForm.value.queryType === 'temperature' ? 0 : 1;

        // 遍历接口返回的数据，为每个tag创建或更新series
        // sensorDataArray的顺序与tags.value的顺序一致
        sensorDataArray.forEach((dataArray, index) => {
            const tag = tags.value[index];
            if (!tag) return;

            // 将数据映射到日期标签
            const mappedData = mapDataToDateLabels(dataArray, queryForm.value.queryType, startDate, endDate);

            // 检查series是否已存在
            const existingSeriesIndex = chartData.value.series.findIndex(s => s.name === tag.label);

            if (existingSeriesIndex > -1) {
                // 如果已存在，更新数据
                chartData.value.series[existingSeriesIndex].data = mappedData;
                chartData.value.series[existingSeriesIndex].yAxisIndex = yAxisIndex;
            } else {
                // 如果不存在，创建新的series
                const symbolType = symbolTypes[chartData.value.series.length % symbolTypes.length];

                const seriesItem = {
                    name: tag.label,
                    type: 'line',
                    data: mappedData,
                    yAxisIndex: yAxisIndex,
                    symbol: symbolType,
                    symbolSize: 6,
                    smooth: true,
                    lineStyle: {
                        width: 2
                    }
                };

                // 添加到图表数据中
                chartData.value.series.push(seriesItem);
            }
        });

        // 更新图表
        updateChartData();

        ElMessage.success('添加成功');
    } catch (error) {
        // 查询失败时不阻塞页面，只显示错误提示
        console.error('查询数据失败:', error);
        ElMessage.error('查询数据失败，请稍后重试');
    }
};


// 添加方法
const handleAdd = async () => {
    // 验证必选字段
    if (!warehouseForm.value.warehouse || !warehouseForm.value.floor || !warehouseForm.value.direction || !warehouseForm.value.location || !queryForm.value.queryType) {
        ElMessage.warning('请选择必要选项：仓库、楼层、库位、货位、查询项');
        return;
    }

    const prevTags = handleTag(warehouseForm.value.warehouse, warehouseForm.value.floor, warehouseForm.value.direction, warehouseForm.value.location, queryForm.value.queryType);

    // 检查添加后是否会超过限制
    const newTagsCount = prevTags.filter(tag => !isTagExists(tag)).length;
    if (tags.value.length + newTagsCount > MAX_TAGS) {
        ElMessage.warning(`最多只能查看${MAX_TAGS}条数据，当前已有${tags.value.length}条，无法继续添加`);
        return;
    }

    for (const prevTag of prevTags) {
        if (isTagExists(prevTag)) {
            ElMessage.warning(`code:${prevTag.code}已存在，请勿重复添加`);
            continue;
        }
        addTag(prevTag);
    }

    // 接口调用前再次检查（双重保险）
    if (tags.value.length > MAX_TAGS) {
        ElMessage.warning(`最多只能查看${MAX_TAGS}条数据`);
        return;
    }

    await getTagData();
};


// 标签删除方法
const handleTagClose = (tag) => {
    // 从标签列表中移除
    removeTag(tag.code);

    // 从图表数据中移除对应的系列
    const seriesIndex = chartData.value.series.findIndex(s => s.name === tag.label);
    if (seriesIndex > -1) {
        chartData.value.series.splice(seriesIndex, 1);
    }
    // 更新图表
    updateChartData();

    ElMessage.success('删除成功');
};

// 清空方法
const handleReset = () => {
    // 清空表单
    resetDateRange();
    resetWarehouseForm();

    queryForm.value = {
        queryType: 'temperature',
        sensorType: '1'
    };

    // 清空标签
    clearTags();

    // 清空图表数据
    chartData.value.series = [];

    // 更新图表
    updateChartData();

    ElMessage.success('已清空');
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
        grid: {
            left: '3%',
            right: '18%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            right: '3%',
            top: '10%',
            itemWidth: 14,
            itemHeight: 14,
            textStyle: {
                fontSize: 12
            },
            itemGap: 8
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
                xAxisIndex: 0,
                bottom: '5%'
            },
            {
                type: 'inside',
                xAxisIndex: 0
            }
        ],
        xAxis: {
            type: 'category',
            name: '时间',
            data: dateLabels.value,
            axisLabel: {
                rotate: 45,
                interval: 0,
                formatter: function (value: string) {
                    return value;
                }
            },
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: [
            {
                type: 'value',
                name: '温度(℃)',
                position: 'left',
                min: 0,
                max: 40,
                interval: 5,
                axisLabel: {
                    formatter: '{value} °C'
                }
            },
            {
                type: 'value',
                name: '湿度(%)',
                position: 'right',
                min: 0,
                max: 100,
                interval: 10,
                axisLabel: {
                    formatter: '{value} %'
                }
            }
        ],
        series: chartData.value.series
    };

    myChart.setOption(option, true); // 使用true强制重新渲染
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