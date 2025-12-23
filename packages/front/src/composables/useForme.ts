/*
 * @Author: wuyifan wuyifan@udschina.com
 * @Date: 2025-12-23 10:29:48
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-23 13:14:00
 * @FilePath: \factory-visualization\packages\front\src\composables\useForme.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getDateRange } from '@/shard';
import { dir1Options, dir2Options, totalOption } from '@/config';

export const useDateRange = () => {
    const dateRange = ref<[string, string]>(getDateRange());

    // 范围不能大于30天
    const validateDateRange = (): boolean => {
        if (new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime() > 30 * 24 * 60 * 60 * 1000) {
            ElMessage.error('范围不能大于30天');
            return false;
        }
        return true;
    }

    const resetDateRange = () => {
        dateRange.value = getDateRange();
    }

    return { validateDateRange, dateRange, resetDateRange };
}


const createLocOpt = (length: number) => {
    return Array.from({ length }, (_, index) => ({
        label: `${index + 1}号位`,
        value: (index + 1).toString().padStart(2, '0')
    }));
};

export const useWareHouse = (needTotal: boolean = false) => {
    const warehouseForm = ref({
        warehouse: '01',
        floor: '01',
        direction: '01',
        location: '01',
    });

    const dir1Opt = [...dir1Options];
    const dir2Opt = [...dir2Options];

    const locOpt1 = createLocOpt(10);
    const locOpt2 = createLocOpt(8);
    const locOpt3 = createLocOpt(12);
    const locOpt4 = createLocOpt(11);
    const locOpt5 = createLocOpt(19);
    const locOpt6 = createLocOpt(15);

    console.log(locOpt1, locOpt2, locOpt3, locOpt4, locOpt5, locOpt6);

    if (needTotal) {
        warehouseForm.value.direction = '00';
        warehouseForm.value.location = '00';
        dir1Opt.unshift(totalOption);
        dir2Opt.unshift(totalOption);
        locOpt1.unshift(totalOption);
        locOpt2.unshift(totalOption);
        locOpt3.unshift(totalOption);
        locOpt4.unshift(totalOption);
        locOpt5.unshift(totalOption);
        locOpt6.unshift(totalOption);
    }

    const directionOptions = computed(() => {
        return +warehouseForm.value.warehouse < 46 ? dir1Opt : dir2Opt;
    });

    const locationOptions = computed(() => {
        //苏山头6号库1-5层两边/苏山头1号库2层东边
        if (['02', '03', '04', '05', '06', '07'].includes(warehouseForm.value.warehouse) ||
            (warehouseForm.value.warehouse === '01' && warehouseForm.value.floor === '2' && warehouseForm.value.direction === '01')
        ) {
            return locOpt1;
        } else if (warehouseForm.value.warehouse === '01' && warehouseForm.value.floor === '2' && warehouseForm.value.direction === '02') {
            return locOpt3;
        } else if (warehouseForm.value.warehouse === '01') {
            return locOpt2;
        } else if (warehouseForm.value.warehouse === '08') {
            return locOpt4;
        } else if (['46', '47', '48'].includes(warehouseForm.value.warehouse)) {
            return locOpt5;
        } else if (['49'].includes(warehouseForm.value.warehouse)) {
            return locOpt6;
        }
    });

    const resetWarehouseForm = () => {
        warehouseForm.value = {
            warehouse: '01',
            floor: '01',
            direction: '01',
            location: '01',
        };
        if (needTotal) {
            warehouseForm.value.direction = '00';
            warehouseForm.value.location = '00';
        }
    }

    return { warehouseForm, directionOptions, locationOptions, resetWarehouseForm };
}