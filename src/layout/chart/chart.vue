<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:51:09
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-06-07 03:07:48
 * @FilePath: /factory-visualization/src/layout/chart/chart.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div ref="chartRef" style="width: 100%;height: 100%;"></div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import * as echarts from 'echarts';

const chartRef = ref(null);
let myChart = null;

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