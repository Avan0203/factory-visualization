import { getDateRange } from '@/shard';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';


export const useDateRange = ()=>{
    const dateRange = ref<[string, string]>(getDateRange());

    // 范围不能大于30天
    const onChange = (): boolean => {
        if (new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime() > 30 * 24 * 60 * 60 * 1000) {
            ElMessage.error('范围不能大于30天');
            return false;
        }
        return true;
    }

    return { onChange, dateRange };
}