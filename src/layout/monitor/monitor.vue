<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-17 01:01:46
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-23 18:52:24
 * @FilePath: /factory-visualization/src/layout/monitor/monitor.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; position: relative; overflow: hidden;" ref="containerRef">
        <el-select v-model="path" placeholder="请选择厂区" style="width: 240px;position: absolute;top: 10px;left: 10px;"
            @change="pathChange">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <div v-if="showBuildingInfo" class="building-info">
            <ul class="building-info-content" @click="panelClick">
                <li id="1">第一层</li>
                <li id="2">第二层</li>
                <li id="3">第三层</li>
                <li id="4">第四层</li>
                <li id="5">第五层</li>
            </ul>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { Render } from './render/render';
import BuildingContext from './render/buildingContext';
import WarehouseContext from './render/warehouseContext';
import { Mesh } from 'three';

const containerRef = ref<HTMLElement | null>(null);
let render: Render;
let warehouseContext: WarehouseContext;
let buildingContext: BuildingContext;

const options = [
    {
        label: '苏山头厂区',
        value: 0
    },
    {
        label: '新厂区',
        value: 1
    }
]

const showBuildingInfo = ref(false);

const path = ref<0 | 1>(0);

const pathChange = (value: 0 | 1) => {
    console.log('pathChange: ', value);
    buildingContext.switchLayer(value);
}


onMounted(() => {
    if (containerRef.value) {
        // 创建 Render 实例
        render = new Render(containerRef.value);

        // 创建 WarehouseContext 实例（测试新模型）
        warehouseContext = new WarehouseContext(render.renderer);
        buildingContext = new BuildingContext(render.renderer);
        // 切换到 WarehouseContext
        render.switchContext(buildingContext);

        render.on('select', (object: Mesh) => {
            if (object.name.includes('goods')) {
                console.log('show goods info', object.name);
            } else {
                console.log('show building info', object.name);
                showBuildingInfo.value = true;
            }
        });
        render.on('unselect', () => {
            showBuildingInfo.value = false;
        });

        buildingContext.on('setupContext', () => {
            console.log('setupContext');
            pathChange(path.value);
        });

        (window as any).Context = {
            buildingContext: buildingContext,
            warehouseContext: warehouseContext,
            render: render
        }
    }
});

const panelClick = (e: MouseEvent) => {
    const id = (e.target as HTMLElement).id;
    console.log(id);
    render.switchContext(warehouseContext);
    e.stopPropagation();
    showBuildingInfo.value = false;
}

onBeforeUnmount(() => {
    // 清理资源
    if (render) {
        render.dispose();
        render = null;
    }
    warehouseContext = null;
    buildingContext = null;
});
</script>

<style scoped>
.building-info {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 200px;
    background-color: rgba(159, 159, 159, 0.5);
    border-radius: 4px;
}

.building-info-content {
    display: flex;
    flex-direction: column;
    padding: 0 10px;
}

.building-info-content>li {
    list-style: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 2px 4px;
    margin-bottom: 5px;
}

.building-info-content>li:hover {
    color: cornsilk;
}
</style>