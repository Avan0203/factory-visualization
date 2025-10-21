<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-10-21 10:53:49
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
        <!-- 查询表单 -->
        <el-form :model="queryForm" inline
            style="padding: 12px 12px 0 12px; background: #f5f5f5; flex-shrink: 0; white-space: nowrap; overflow-x: auto;">
            <el-form-item label="" style="margin-right: 15px;">
                <el-date-picker v-model="queryForm.startDate" type="date" placeholder="选择起始日期" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" style="width: 160px;" />
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-date-picker v-model="queryForm.endDate" type="date" placeholder="选择结束日期" format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD" style="width: 160px;" />
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-select v-model="queryForm.area" placeholder="选择区域" style="width: 120px;">
                    <el-option label="东区" value="东区" />
                    <el-option label="西区" value="西区" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-select v-model="queryForm.warehouse" placeholder="选择仓库" style="width: 130px;">
                    <el-option label="全部" value="" />
                    <el-option label="一号仓库" value="一号仓库" />
                    <el-option label="二号仓库" value="二号仓库" />
                    <el-option label="三号仓库" value="三号仓库" />
                    <el-option label="四号仓库" value="四号仓库" />
                    <el-option label="五号仓库" value="五号仓库" />
                    <el-option label="六号仓库" value="六号仓库" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-select v-model="queryForm.floor" placeholder="选择楼层" style="width: 100px;">
                    <el-option label="全部" value="" />
                    <el-option label="一层" value="一层" />
                    <el-option label="二层" value="二层" />
                    <el-option label="三层" value="三层" />
                    <el-option label="四层" value="四层" />
                    <el-option label="五层" value="五层" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-select v-model="queryForm.location" placeholder="选择库位" style="width: 100px;">
                    <el-option label="1" value="1" />
                    <el-option label="2" value="2" />
                    <el-option label="3" value="3" />
                    <el-option label="4" value="4" />
                    <el-option label="5" value="5" />
                </el-select>
            </el-form-item>
            <el-form-item label="" style="margin-right: 15px;">
                <el-select v-model="queryForm.queryType" placeholder="选择查询项" style="width: 100px;">
                    <el-option label="温度" value="temperature" />
                    <el-option label="湿度" value="humidity" />
                </el-select>
            </el-form-item>
            <el-form-item style="margin-right: 0;">
                <el-button type="primary" @click="handleAdd" :icon="Plus">添加</el-button>
                <el-button @click="handleReset" :icon="Refresh">清空</el-button>
            </el-form-item>
        </el-form>

        <!-- 标签区域 -->
        <div style="padding: 8px; background: #f9f9f9; border-radius: 4px; flex-shrink: 0; min-height: 30px; display: flex; flex-wrap: wrap; align-items: flex-start;">
            <el-tag 
                v-for="tag in tags" 
                :key="tag.id" 
                closable 
                :type="tag.type"
                @close="handleTagClose(tag)"
                style="margin-right: 8px; margin-bottom: 5px;"
            >
                {{ tag.name }}
            </el-tag>
        </div>

        <!-- 图表容器 -->
        <div ref="chartRef" style="flex: 1; width: 100%; min-height: 0;"></div>
    </div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

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
    startDate: '',
    endDate: '',
    warehouse: '',
    floor: '',
    area: '',
    location: '',
    queryType: 'temperature'
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

// 生成随机数据
const generateRandomData = (count = 31) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        // 生成18-32之间的随机温度数据
        data.push(Number((18 + Math.random() * 14).toFixed(1)));
    }
    return data;
};

// 添加方法
const handleAdd = () => {
    // 验证必选字段
    if (!queryForm.value.area || !queryForm.value.warehouse || !queryForm.value.location || !queryForm.value.queryType) {
        ElMessage.warning('请选择必要选项：地区、库名、库位、查询项');
        return;
    }

    // 生成标签名称
    const tagName = `${queryForm.value.area}${queryForm.value.warehouse}${queryForm.value.floor}${queryForm.value.location}位`;
    
    // 检查是否已存在相同的标签
    const existingTag = tags.value.find(tag => tag.name === tagName);
    if (existingTag) {
        ElMessage.warning('该位置已存在，请勿重复添加');
        return;
    }

    // 生成随机数据
    const randomData = generateRandomData();
    
    // 创建新的标签
    const newTag = {
        id: Date.now(),
        name: tagName,
        type: 'primary',
        data: randomData,
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
        data: randomData
    };

    // 添加到图表数据
    chartData.value.series.push(newSeries);

    // 更新图表
    updateChartData();

    // 清空表单
    queryForm.value = {
        startDate: '',
        endDate: '',
        warehouse: '',
        floor: '',
        area: '',
        location: '',
        queryType: 'temperature'
    };

    ElMessage.success('添加成功');
};

// 标签删除方法
const handleTagClose = (tag) => {
    // 从标签列表中移除
    const tagIndex = tags.value.findIndex(t => t.id === tag.id);
    if (tagIndex > -1) {
        tags.value.splice(tagIndex, 1);
        console.log('标签已从列表中移除');
    }

    // 从图表数据中移除对应的系列
    const seriesIndex = chartData.value.series.findIndex(s => s.name === tag.name);
    if (seriesIndex > -1) {
        chartData.value.series.splice(seriesIndex, 1);
        console.log('系列已从图表数据中移除');
    }
    // 更新图表
    updateChartData();
    
    ElMessage.success('删除成功');
};

// 清空方法
const handleReset = () => {
    queryForm.value = {
        startDate: '',
        endDate: '',
        warehouse: '',
        floor: '',
        area: '',
        location: '',
        queryType: 'temperature'
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

    console.log('设置图表选项，系列数量:', option.series.length);
    myChart.setOption(option, true); // 使用true强制重新渲染
};

// 组件挂载时初始化图表
onMounted(async () => {
    // 设置默认日期范围
    const dateRange = generateDateRange();
    queryForm.value.startDate = dateRange.start;
    queryForm.value.endDate = dateRange.end;
    
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