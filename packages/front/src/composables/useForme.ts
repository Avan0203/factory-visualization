/*
 * @Author: wuyifan wuyifan@udschina.com
 * @Date: 2025-12-23 10:29:48
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-24 16:24:43
 * @FilePath: \factory-visualization\packages\front\src\composables\useForme.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getDateRange } from '@/shard';
import { buildingNameConfig, dir1Options, dir2Options, totalOption } from '@/config';

export const useDateRange = () => {
    const dateRange = ref<[string, string]>(getDateRange());

    const validateDateRange = (): boolean => {
        if (!dateRange.value[0].trim() || !dateRange.value[1].trim()) {
            ElMessage.warning('请选择日期范围');
            return false;
        }
        // 起始需要小于结束
        if (new Date(dateRange.value[0]).getTime() > new Date(dateRange.value[1]).getTime()) {
            ElMessage.warning('起始日期不能大于结束日期');
            return false;
        }
        // 范围不能大于30天
        if (new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime() > 30 * 24 * 60 * 60 * 1000) {
            ElMessage.warning('范围不能大于30天');
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
        floor: '1',
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

export type Tag = {
    code: string;
    queryType: string;
    label: string;
}


export const useTag = () => {
    const MAX_TAGS = 40;

    // 标签数据
    const tags = ref([]);
    const tagMap = new Map<string, Tag>();


    const createTag = (buildingCode: string, floorIndex: number, directionCode: string, locationCode: string, queryType: string): Tag => {
        const buildingName = Object.values(buildingNameConfig).find(item => item.code === buildingCode)?.name || '';
        const floorName = `第${floorIndex + 1}层`;
        const directionName = getDirectionName(directionCode, buildingCode);
        const locationName = `${+locationCode}号位`;

        return {
            code: `${buildingCode}-${floorIndex}-${directionCode}-${locationCode}`,
            queryType,
            label: `${buildingName}${floorName}${directionName}${locationName}`,
        }
    }

    const handleTag = (warehouse: string, floor: string, direction: string, location: string, queryType: string): Tag[] => {
        let directions: string[] = [];
        if (direction === '00' && warehouse !== '08') {
            directions = ['01', '02'];
        } else {
            directions = [direction];
        }

        let locations: string[] = [];
        if (location === '00') {
            const count = getLocationCount(warehouse, floor, direction);
            for (let i = 1; i <= count; i++) {
                locations.push(i.toString().padStart(2, '0'));
            }
        } else {
            locations = [location];
        }

        const tags: Tag[] = [];

        directions.forEach(directionCode => {
            locations.forEach(locationCode => {
                const tag = createTag(warehouse, parseInt(floor), directionCode, locationCode, queryType);
                tags.push(tag);
            });
        });

        return tags;
    }

    const addTag = (tag: Tag) => {
        tagMap.set(tag.code, tag);
        tags.value.push(tag);
    }

    const removeTag = (tagCode: string) => {
        tagMap.delete(tagCode);
        tags.value = tags.value.filter(tag => tag.code !== tagCode);
    }

    const isTagExists = (tag: Tag) => (tagMap.has(tag.code));


    const clearTags = () => {
        tagMap.clear();
        tags.value = [];
    }

    return { tags, MAX_TAGS, handleTag, addTag, removeTag, isTagExists, clearTags };
}


const getLocationCount = (warehouse: string, floor: string, direction: string) => {
    if (['02', '03', '04', '05', '06', '07'].includes(warehouse) ||
        (warehouse === '01' && floor === '2' && direction === '01')
    ) {
        return 10;
    } else if (warehouse === '01' && floor === '2' && direction === '02') {
        return 12;
    } else if (warehouse === '01') {
        return 8;
    } else if (warehouse === '08') {
        return 11;
    } else if (['46', '47', '48'].includes(warehouse)) {
        return 19;
    } else if (['49'].includes(warehouse)) {
        return 15;
    }
}

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