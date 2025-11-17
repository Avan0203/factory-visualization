<template>
    <div style="width: 100%; height: 100%;" ref="containerRef"></div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Render } from './render';
import BuildingContext from './buildingContext';

const containerRef = ref<HTMLElement | null>(null);
let render: Render | null = null;
let buildingContext: BuildingContext | null = null;

onMounted(() => {
    if (containerRef.value) {
        // 创建 Render 实例
        render = new Render(containerRef.value);

        // 创建 BuildingContext 实例
        buildingContext = new BuildingContext(render.renderer);

        // 切换到 BuildingContext
        render.switchContext(buildingContext);

        console.log('Render initialized:', render);
        console.log('BuildingContext initialized:', buildingContext);
    }
});

onBeforeUnmount(() => {
    // 清理资源
    if (render) {
        render.dispose();
        render = null;
    }
    buildingContext = null;
});
</script>