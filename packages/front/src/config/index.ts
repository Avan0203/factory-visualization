/*
 * @Author: wuyifan wuyifan@udschina.com
 * @Date: 2025-11-26 16:30:26
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-23 10:56:57
 * @FilePath: \factory-visualization\src\config\inedex.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export const warehouseConfig = {
    "01": {
        "name": "徐州苏山头1号库",
    },
    "02": {
        "name": "徐州苏山头2号库",
    },
    "03": {
        "name": "徐州苏山头3号库",
    },
    "04": {
        "name": "徐州苏山头4号库",
    },
    "05": {
        "name": "徐州苏山头5号库",
    },
    "06": {
        "name": "徐州苏山头6号库",
    },
    "07": {
        "name": "徐州苏山头7号库",
    },
    "08": {
        "name": "徐州苏山头8号库",
    },
    "46": {
        "name": "徐州厂区原料1号库",
    },
    "47": {
        "name": "徐州厂区原料2号库",
    },
    "48": {
        "name": "徐州厂区原料3号库",
    },
    "49": {
        "name": "徐州厂区原料4号库",
    },
}

export const buildingNameConfig = {
    'building4': { name: '1号仓库', code: '01' },
    "building2": { name: '2号仓库', code: '02' },
    "building1": { name: '3号仓库', code: '03' },
    "building3": { name: '4号仓库', code: '04' },
    "building5": { name: '5号仓库', code: '05' },
    "building11": { name: '6号仓库', code: '06' },
    "building12": { name: '7号仓库', code: '07' },
    "building6": { name: '8号仓库', code: '08' },
    "building7": { name: '1号仓库', code: '46' },
    "building8": { name: '2号仓库', code: '47' },
    "building9": { name: '3号仓库', code: '48' },
    "building10": { name: '4号仓库', code: '49' },
}

export const dir1Options = [
    {
        label: '东库',
        value: '01'
    },
    {
        label: '西库',
        value: '02'
    }
]
export const dir2Options = [
    {
        label: '南库',
        value: '01'
    },
    {
        label: '北库',
        value: '02'
    }
]

// 楼层选项
export const floorOptions = [
    {
        label: '第1层',
        value: '1'
    },
    {
        label: '第2层',
        value: '2'
    },
    {
        label: '第3层',
        value: '3'
    },
    {
        label: '第4层',
        value: '4'
    },
    {
        label: '第5层',
        value: '5'
    }
]

// 仓库选项（楼号）
export const warehouseOptions = Object.entries(warehouseConfig).map(([key, value]) => ({
    label: value.name,
    value: key
}));


const wrapperFunc = (direction: string, goods: string) => {
    const buildingArray = ['02', '03', '04', '05', '06', '07',];
    const floorArray = ['1', '2', '3', '4', '5'];
    const result = [];
    buildingArray.forEach(building => {
        floorArray.forEach(floor => {
            result.push(`${building}-${floor}-${direction}-${goods}`);
        });
    })
    return result;
}

const wrapperFunc2 = (direction: string, goods: string) => {
    const floorArray = ['1', '3', '4', '5'];
    const result = [];
    floorArray.forEach(floor => {
        result.push(`$01-${floor}-${direction}-${goods}`);
    });
    return result;
}

const wrapperFunc3 = (goods: string) => {
    const floorArray = ['1', '2', '3', '4', '5'];
    const result = [];
    floorArray.forEach(floor => {
        result.push(`$08-${floor}-01-${goods}`);
    });
    return result;
}

const wrapperFunc4 = (direction: string, goods: string) => {
    const buildingArray = ['46', '47', '48'];
    const floorArray = ['1', '2', '3', '4', '5'];
    const result = [];
    buildingArray.forEach(building => {
        floorArray.forEach(floor => {
            result.push(`${building}-${floor}-${direction}-${goods}`);
        });
    })
    return result;
}

const wrapperFunc5 = (direction: string, goods: string) => {
    const floorArray = ['1', '2', '3', '4', '5'];
    const result = [];
    floorArray.forEach(floor => {
        result.push(`48-${floor}-${direction}-${goods}`);
    });
    return result;
}

export const layerConfig = {
    'layer1': (()=>{
        const result = [];
        ['02','03','04','05','06','07'].forEach(building => {
            ['1','2','3','4','5'].forEach(floor => {
                result.push(`${building}-${floor}`);
            });
        });
        return result;
    })(),
    'layer2': ['01-2'],
    'layer3': ['01-1','01-3','01-4','01-5'],
    'layer4': ['08-1','08-2','08-3','08-4','08-5'],
    'layer5': (()=>{
        const result = [];
        ['46','47','48'].forEach(building => {
            ['1','2','3','4','5'].forEach(floor => {
                result.push(`${building}-${floor}`);
            });
        });
        return result;
    })(),
    'layer6': ['49-1','49-2','49-3','49-4','49-5'],
};

export const goodsConfig = {
    // 苏山头 1，2，3，4，5，6，7号楼
    'goods000': wrapperFunc('01', '01'),
    'goods001': wrapperFunc('01', '02'),
    'goods002': wrapperFunc('01', '03'),
    'goods003': wrapperFunc('01', '04'),
    'goods004': wrapperFunc('01', '05'),
    'goods005': wrapperFunc('01', '06'),
    'goods006': wrapperFunc('01', '07'),
    'goods007': wrapperFunc('01', '08'),
    'goods008': wrapperFunc('01', '09'),
    'goods009': wrapperFunc('01', '10'),
    'goods019': wrapperFunc('02', '01'),
    'goods010': wrapperFunc('02', '02'),
    'goods017': wrapperFunc('02', '03'),
    'goods018': wrapperFunc('02', '04'),
    'goods015': wrapperFunc('02', '05'),
    'goods016': wrapperFunc('02', '06'),
    'goods013': wrapperFunc('02', '07'),
    'goods014': wrapperFunc('02', '08'),
    'goods011': wrapperFunc('02', '09'),
    'goods012': wrapperFunc('02', '10'),
    // 苏山头 1号楼2层
    'goods020': ['01-2-01-10'],
    'goods021': ['01-2-01-09'],
    'goods022': ['01-2-01-08'],
    'goods023': ['01-2-01-07'],
    'goods024': ['01-2-01-06'],
    'goods025': ['01-2-01-05'],
    'goods026': ['01-2-01-04'],
    'goods027': ['01-2-01-03'],
    'goods028': ['01-2-01-02'],
    'goods029': ['01-2-01-01'],
    'goods030': ['01-2-02-11'],
    'goods031': ['01-2-02-02'],
    'goods032': ['01-2-02-01'],
    'goods033': ['01-2-02-04'],
    'goods034': ['01-2-02-03'],
    'goods035': ['01-2-02-08'],
    'goods036': ['01-2-02-07'],
    'goods037': ['01-2-02-10'],
    'goods038': ['01-2-02-09'],
    'goods039': ['01-2-02-12'],
    'goods040': ['01-2-02-06'],
    'goods041': ['01-2-02-05'],
    // 苏山头 1号楼 1，3，4，5层
    'goods042': wrapperFunc2('01', '01'),
    'goods043': wrapperFunc2('01', '03'),
    'goods045': wrapperFunc2('01', '04'),
    'goods046': wrapperFunc2('01', '02'),
    'goods047': wrapperFunc2('01', '05'),
    'goods048': wrapperFunc2('01', '06'),
    'goods049': wrapperFunc2('01', '07'),
    'goods050': wrapperFunc2('01', '08'),
    'goods051': wrapperFunc2('02', '02'),
    'goods052': wrapperFunc2('02', '04'),
    'goods053': wrapperFunc2('02', '03'),
    'goods054': wrapperFunc2('02', '01'),
    'goods055': wrapperFunc2('02', '06'),
    'goods056': wrapperFunc2('02', '05'),
    'goods057': wrapperFunc2('02', '08'),
    'goods058': wrapperFunc2('02', '07'),
    // 苏山头 8号楼 1，2，3，4，5层
    'goods060': wrapperFunc3('11'),
    'goods061': wrapperFunc3('10'),
    'goods062': wrapperFunc3('03'),
    'goods063': wrapperFunc3('04'),
    'goods064': wrapperFunc3('09'),
    'goods065': wrapperFunc3('02'),
    'goods066': wrapperFunc3('08'),
    'goods067': wrapperFunc3('01'),
    'goods068': wrapperFunc3('05'),
    'goods069': wrapperFunc3('06'),
    'goods070': wrapperFunc3('07'),
    // 新厂区 1 ,2 ,3 号楼 南库
    'goods071': wrapperFunc4('01','18'),
    'goods072': wrapperFunc4('01','16'),
    'goods073': wrapperFunc4('01','14'),
    'goods074': wrapperFunc4('01','12'),
    'goods075': wrapperFunc4('01','10'),
    'goods076': wrapperFunc4('01','08'),
    'goods077': wrapperFunc4('01','06'),
    'goods078': wrapperFunc4('01','04'),
    'goods079': wrapperFunc4('01','02'),
    'goods080': wrapperFunc4('01','19'),
    'goods081': wrapperFunc4('01','17'),
    'goods082': wrapperFunc4('01','15'),
    'goods083': wrapperFunc4('01','13'),
    'goods084': wrapperFunc4('01','09'),
    'goods085': wrapperFunc4('01','07'),
    'goods086': wrapperFunc4('01','05'),
    'goods087': wrapperFunc4('01','03'),
    'goods088': wrapperFunc4('01','01'),
    'goods089': wrapperFunc4('01','11'),
    // 新厂区 1 ,2 ,3 号楼 北库
    'goods090': wrapperFunc4('02','19'),
    'goods091': wrapperFunc4('02','18'),
    'goods092': wrapperFunc4('02','16'),
    'goods093': wrapperFunc4('02','14'),
    'goods094': wrapperFunc4('02','12'),
    'goods095': wrapperFunc4('02','10'),
    'goods096': wrapperFunc4('02','08'),
    'goods097': wrapperFunc4('02','06'),
    'goods098': wrapperFunc4('02','04'),
    'goods099': wrapperFunc4('02','02'),
    'goods100': wrapperFunc4('02','17'),
    'goods101': wrapperFunc4('02','15'),
    'goods102': wrapperFunc4('02','13'),
    'goods103': wrapperFunc4('02','09'),
    'goods104': wrapperFunc4('02','07'),
    'goods105': wrapperFunc4('02','05'),
    'goods106': wrapperFunc4('02','03'),
    'goods107': wrapperFunc4('02','01'),
    'goods108': wrapperFunc4('02','11'),
    // 新厂区 4 号 南库
    'goods109': wrapperFunc5('01','14'),
    'goods110': wrapperFunc5('01','12'),
    'goods111': wrapperFunc5('01','10'),
    'goods112': wrapperFunc5('01','08'),
    'goods113': wrapperFunc5('01','06'),
    'goods114': wrapperFunc5('01','04'),
    'goods115': wrapperFunc5('01','02'),
    'goods116': wrapperFunc5('01','01'),
    'goods117': wrapperFunc5('01','15'),
    'goods118': wrapperFunc5('01','13'),
    'goods119': wrapperFunc5('01','11'),
    'goods120': wrapperFunc5('01','07'),
    'goods121': wrapperFunc5('01','05'),
    'goods122': wrapperFunc5('01','03'),
    'goods123': wrapperFunc5('01','01'),
    'goods125': wrapperFunc5('01','09'),
    // 新厂区 4 号 北库
    'goods128': wrapperFunc5('02','14'),
    'goods129': wrapperFunc5('02','12'),
    'goods130': wrapperFunc5('02','10'),
    'goods131': wrapperFunc5('02','08'),
    'goods132': wrapperFunc5('02','06'),
    'goods133': wrapperFunc5('02','04'),
    'goods134': wrapperFunc5('02','02'),
    'goods136': wrapperFunc5('02','15'),
    'goods137': wrapperFunc5('02','13'),
    'goods138': wrapperFunc5('02','11'),
    'goods139': wrapperFunc5('02','07'),
    'goods140': wrapperFunc5('02','05'),
    'goods141': wrapperFunc5('02','03'),
    'goods142': wrapperFunc5('02','01'),
    'goods144': wrapperFunc5('02','09'),
}

export const totalOption = { label: '全部', value: '00' };
