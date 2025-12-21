<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-12-22 01:04:43
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
        <el-form :model="queryForm" inline
            style="padding: 12px 12px 0 12px; background: #f5f5f5; flex-shrink: 0; white-space: nowrap; overflow-x: auto;">
            <el-form-item label="">
                <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
                    start-placeholder="开始日期" end-placeholder="结束日期" style="width: 220px;"
                    @visible-change="handleDatePickerVisibleChange" />
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.warehouse" placeholder="仓库" style="width: 170px;"
                    @change="handleWarehouseChange">
                    <el-option v-for="option in warehouseOptions" :key="option.value" :label="option.label"
                        :value="option.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 10px;">
                <el-select v-model="queryForm.floor" placeholder="楼层" style="width: 100px;" @change="handleFloorChange">
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
import { querySensorData } from '@/api';
import { warehouseOptions, floorOptions, dir1Options, dir2Options, locationConfig1, locationConfig2, locationConfig3, locationConfig4, locationConfig5, locationConfig6, buildingNameConfig } from '@/config';
import { getDateRange } from '@/shard';
import { useDateRange } from '@/composables';
const chartRef = ref(null);
let myChart = null;

const { dateRange } = useDateRange();
// 记录上一次的日期范围，用于判断是否真的变化了
const lastDataRange = ref<[string, string] | null>(null);

// 日期选择器显示/隐藏变化处理
const handleDatePickerVisibleChange = (visible: boolean) => {
    // 只在日期选择器关闭时（visible 为 false）且值确实变化时才更新
    if (!visible && dateRange.value[0] && dateRange.value[1]) {
        const currentRange: [string, string] = [
            formatDate(dateRange.value[0]),
            formatDate(dateRange.value[1])
        ];

        // 检查日期范围是否真的变化了
        if (!lastDataRange.value ||
            lastDataRange.value[0] !== currentRange[0] ||
            lastDataRange.value[1] !== currentRange[1]) {
            lastDataRange.value = currentRange;
            dataChange();
        }
    }
}

// 更新日期标签和图表
const dataChange = () => {
    if (dateRange.value[0] && dateRange.value[1]) {
        const startDate = formatDate(dateRange.value[0]);
        const endDate = formatDate(dateRange.value[1]);
        dateLabels.value = generateDateLabels(startDate, endDate);
        // 更新图表x轴
        if (myChart) {
            updateChartData();
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
    warehouse: '01', // 楼号（buildingCode）2
    floor: '1', // 楼层索引（0, 1, 2...）
    direction: '00', // 方向编码（01, 02）
    location: '00', // 货位号
    queryType: 'temperature',
    sensorType: '1'
});

// 方向编码转换为可读名称
const getDirectionName = (directionCode: string, buildingCode: string) => {
    if (Number(buildingCode) < 46) {
        if (buildingCode === '08') {
            return '全部';
        } else {
            return directionCode === '01' ? '东库' : '西库';
        }
    } else {
        return directionCode === '01' ? '南库' : '北库';
    }
};

const dirOptions = [[...dir1Options, { label: '全部', value: '00' }], [...dir2Options, { label: '全部', value: '00' }]];


// 库位（方向）选项
const directionOptions = computed(() => {
    return +queryForm.value.warehouse < 46 ? dirOptions[0] : dirOptions[1];
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

const locationOptions = computed(() => {
    //苏山头6号库1-5层两边/苏山头1号库2层东边
    if (['02', '03', '04', '05', '06', '07'].includes(queryForm.value.warehouse) || (queryForm.value.warehouse === '01' && queryForm.value.floor === '2' && queryForm.value.direction === '01')) {
        return locationConfig1;
    } else if (queryForm.value.warehouse === '01' && queryForm.value.floor === '2' && queryForm.value.direction === '02') {
        return locationConfig3;
    } else if (queryForm.value.warehouse === '01') {
        return locationConfig2;
    } else if (queryForm.value.warehouse === '08') {
        return locationConfig4;
    } else if (['46', '47', '48'].includes(queryForm.value.warehouse)) {
        return locationConfig5;
    } else if (['49'].includes(queryForm.value.warehouse)) {
        return locationConfig6;
    }
});

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

    const directionName = getDirectionName(queryForm.value.direction, buildingData);

    // 生成标签名称，包含查询类型
    const queryTypeName = queryForm.value.queryType === 'temperature' ? '温度' : '湿度';
    const tagName = `${buildingName}${floorName}${directionName}${+queryForm.value.location}号位-${queryTypeName}`;

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
            queryType: queryForm.value.queryType as 'temperature' | 'humidity',
            sensorType: queryForm.value.sensorType
        };

        const sensorDataArray = await querySensorData(queryParams);
        console.log('sensorDataArray: ', sensorDataArray);

        // 从返回的数组的数组中取第一个元素（因为当前只查询一个item）
        const sensorData = sensorDataArray && sensorDataArray.length > 0 ? sensorDataArray[0] : [];

        // 获取日期范围
        const startDate = formatDate(queryForm.value.dataRange[0]);
        const endDate = formatDate(queryForm.value.dataRange[1]);

        // 更新日期标签（如果日期范围变化了）
        const newDateLabels = generateDateLabels(startDate, endDate);
        if (JSON.stringify(dateLabels.value) !== JSON.stringify(newDateLabels)) {
            dateLabels.value = newDateLabels;
        }

        // 将数据映射到日期标签数组
        const chartDataArray = mapDataToDateLabels(sensorData, queryForm.value.queryType, startDate, endDate);

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

        // 根据查询类型确定使用哪个Y轴：温度用左轴(0)，湿度用右轴(1)
        const yAxisIndex = queryForm.value.queryType === 'temperature' ? 0 : 1;

        const newSeries = {
            name: tagName,
            type: 'line',
            symbol: symbolType,
            symbolSize: 6,
            smooth: true,
            yAxisIndex: yAxisIndex,
            data: chartDataArray
        };

        // 添加到图表数据
        chartData.value.series.push(newSeries);

        // 更新图表
        updateChartData();


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
    // 清空表单
    queryForm.value = {
        dataRange: queryForm.value.dataRange || [],
        warehouse: '',
        floor: '',
        direction: '',
        location: '',
        queryType: 'temperature',
        sensorType: '1'
    };

    // 清空标签
    tags.value = [];

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
    // 设置默认日期范围
    const dateRange = getDateRange();
    queryForm.value.dataRange = [dateRange[0], dateRange[1]];
    // 初始化时记录日期范围
    lastDataRange.value = [dateRange[0], dateRange[1]];

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