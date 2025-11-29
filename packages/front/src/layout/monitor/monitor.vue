<!--
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-17 01:01:46
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-11-27 16:20:04
 * @FilePath: /factory-visualization/src/layout/monitor/monitor.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
    <div style="width: 100%; height: 100%; position: relative; overflow: hidden;" ref="containerRef">
        <div style="position: absolute;top: 10px;left: 10px;">
            <el-select v-if="isBuildingContext" v-model="path" placeholder="请选择厂区" style="width: 240px;"
                @change="pathChange">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="backToBuilding" v-else>返回</el-button>
        </div>

        <div v-if="showBuildingInfo" class="building-info">
            <ul class="building-info-content" @click="panelClick">
                <li :class="{ active: selectedFloor === 1 }" id="1">第一层</li>
                <li :class="{ active: selectedFloor === 2 }" id="2">第二层</li>
                <li :class="{ active: selectedFloor === 3 }" id="3">第三层</li>
                <li :class="{ active: selectedFloor === 4 }" id="4">第四层</li>
                <li :class="{ active: selectedFloor === 5 }" id="5">第五层</li>
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
let isBuildingContext = ref<boolean>(true);

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
const selectedFloor = ref<number | null>(null);

const path = ref<0 | 1>(0);

const pathChange = (value: 0 | 1) => {
    console.log('pathChange: ', value);
    buildingContext.switchLayer(value);
}

const backToBuilding = () => {
    render.switchContext(buildingContext);
    showBuildingInfo.value = false;
    isBuildingContext.value = true;
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
        isBuildingContext.value = true;

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
    const target = e.target as HTMLElement;
    if (target.tagName === 'LI') {
        const id = parseInt(target.id);
        selectedFloor.value = id;
        console.log(id);
        render.switchContext(warehouseContext);
        e.stopPropagation();
        showBuildingInfo.value = false;
        isBuildingContext.value = false;
    }
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
    width: 220px;
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.85) 0%, rgba(40, 40, 40, 0.9) 100%);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1) inset;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.building-info-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0;
    margin: 0;
}

.building-info-content>li {
    list-style: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 12px 16px;
    margin: 0;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    user-select: none;
}

.building-info-content>li:hover {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateX(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.building-info-content>li.active {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 152, 0, 0.3) 100%);
    border-color: rgba(255, 193, 7, 0.6);
    color: #ffd54f;
    font-weight: 600;
    box-shadow: 0 0 12px rgba(255, 193, 7, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
}

.building-info-content>li.active:hover {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.35) 0%, rgba(255, 152, 0, 0.4) 100%);
    border-color: rgba(255, 193, 7, 0.8);
    box-shadow: 0 0 16px rgba(255, 193, 7, 0.5), 0 2px 12px rgba(0, 0, 0, 0.3);
}
</style>