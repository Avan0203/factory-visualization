<template>
    <div style="width: 100%; height: 100%;" ref="containerRef"></div>
</template>
<script setup>
import { onMounted ,ref} from 'vue';
import Monitor from './index';
const containerRef = ref(null);

onMounted(()=>{
    console.log(containerRef);
    if(containerRef.value){
        const monitor  = new Monitor(containerRef.value)
        console.log('monitor: ', monitor);
    }
})
</script>