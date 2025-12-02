/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-12-02 14:09:14
 * @FilePath: /factory-visualization/src/layout/monitor/warehouseContext.ts
 * @Description: WarehouseContext - 仓库场景上下文
 */

import {
    AmbientLight,
    DirectionalLight,
    WebGLRenderer,
    Mesh,
    Object3D,
    Sprite,
    SpriteMaterial,
    CanvasTexture,
    Box3,
    Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Context } from './context';
import { publicPath, gltfLoader } from '../../../shard';
import { SensorPushResult, SensorPushData } from 'backend';
import { goodsConfig, layerConfig } from '../../../config';

const goodsMap = new WeakMap<Object3D, string[]>();
const locationMap = new Map<string, Object3D>();

class WarehouseContext extends Context {
    private selectedGoods: Object3D | null = null;
    private layer: {
        [key: string]: Object3D;
    };
    constructor(renderer: WebGLRenderer) {
        super(renderer);
        // 使用默认的 Y 轴向上（不需要设置 camera.up）
        // 调整相机位置：Y 轴向上，相机在 Y 轴上方，看向原点
        this.camera.position.set(10, 20, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();

        this.selectedGoods = null;

        // 初始化 selection 数组（先为空）
        this.selection = [];
        this.layer = {}

        // 初始化场景
        this.setup();
    }

    launch(controls: OrbitControls): void {
        // 限制旋转角度
        // 限制缩放范围
        controls.minZoom = 0.3;
        controls.maxZoom = 3;

        controls.target.set(0, 0, 0);
        controls.object.position.set(10, 20, 0);

        super.launch(controls);
    }

    setup(): void {
        this.#setupLights();
        this.#setupModel();
    }

    #setupLights(): void {
        // 增加环境光强度，提供基础照明
        const ambientLight = new AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        // 调整定向光强度和位置，提供主要照明和阴影
        // Y 轴向上，灯光从上方斜射
        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;

        // 优化阴影设置
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 5;
        directionalLight.shadow.camera.far = 70;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;

        directionalLight.shadow.bias = -0.005;
        directionalLight.shadow.normalBias = 0.02;

        this.scene.add(directionalLight);
    }

    switchLayer(layer: string): void {
        Object.values(this.layer).forEach(layer => {
            layer.visible = false;
        });
        this.layer[layer].visible = true;
        this.selection = this.layer[layer].userData['selection'];
    }

    #setupModel(): void {
        gltfLoader.load(`${publicPath}can.glb`, ({ scene: gltfScene }) => {
            console.log('can.glb loaded:', gltfScene);
            gltfScene.traverse((child) => {
                if (child.name.includes('layer')) {
                    this.layer[child.name] = child;
                    this.layer[child.name].visible = false;
                    this.layer[child.name].userData['selection'] = [];
                }
                if (child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if (child.name.includes('goods')) {
                        child.parent.userData['selection'].push(child);
                        goodsMap.set(child, goodsConfig[child.name]);
                        goodsConfig[child.name].forEach(goods => {
                            locationMap.set(goods, child);
                        });
                        const billboard = this.createBillboard(child);
                        child.add(billboard);
                    }
                }
            });

            this.scene.add(gltfScene);
            console.log('can.glb added to scene');
        }, undefined, (error) => {
            console.error('Error loading can.glb:', error);
        });
    }

    // 激活选择（选择对象）
    activate(object: Object3D): void {
        if (!object) {
            this.selectedGoods = null;
            return;
        }
        this.selectedGoods = object;
        console.log('选择对象:', object.name);
    }

    // 取消选择
    deactivate(): void {
        this.selectedGoods = null;
        console.log('取消选择');
    }

    // 动画更新方法（由 Render 调用）
    animate(dt: number): void {
        // 暂时不需要动画
    }

    updateFloorSensorData(data: SensorPushResult): void {
        Object.entries(data).forEach(([location, sensorData]) => {
            const goods = locationMap.get(location);
            if(goods){
                goods.userData['updateBillboard'](sensorData);
            }
        });
    }

    static getLayer(building: string, floor: string) {
        const key = building + '-' + floor;
        for (const layerName in layerConfig) {
            if (layerConfig[layerName].includes(key)) {
                return layerName;
            }
        }
        console.log('layer not found: ', key);
        return '';
    }

    // 创建货位的实时信息标签，一个goodMesh对应一个billboard
    createBillboard(goodMesh: Object3D): Sprite {
        // 计算 goodMesh 的包围盒以确定上方位置
        // 由于 goodMesh 可能还没有添加到场景，setFromObject 会基于本地坐标系计算
        const box = new Box3().setFromObject(goodMesh);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());
        
        // 计算相对于 goodMesh 本地坐标的位置
        // billboard 是 goodMesh 的子对象，所以直接使用本地坐标系
        // 位置：goodMesh 的包围盒中心 + Y 轴高度的一半 + 偏移量
        const localPosition = new Vector3(
            center.x,
            center.y + size.y / 2 + 0.5, // 在 goodMesh 上方 0.5 个单位（相对于 goodMesh 的本地坐标）
            center.z
        );
        
        // 创建初始文字纹理（显示空数据或默认值）
        const initialTexture = this.createTextTexture('--°C --%', '#0088ff');
        
        // 创建 Sprite Material
        const spriteMaterial = new SpriteMaterial({
            map: initialTexture,
            transparent: true,
            alphaTest: 0.1,
        });
        
        // 创建 Sprite
        const sprite = new Sprite(spriteMaterial);
        sprite.position.copy(localPosition);
        
        // 根据纹理的实际尺寸设置精灵大小，保持宽高比
        const textureScale = 0.02; // 缩放比例，可以根据场景大小调整
        sprite.scale.set(
            (initialTexture.image.width * textureScale),
            (initialTexture.image.height * textureScale),
            1
        );
        
        // 在 goodMesh.userData 中添加 updateBillboard 方法，用于更新 billboard 的内容
        goodMesh.userData['updateBillboard'] = (sensorData: SensorPushData) => {
            // 保存旧纹理引用，用于释放资源
            const oldTexture = spriteMaterial.map;
            
            // 根据传感器数据创建新的文字纹理
            const text = `${sensorData.temperature.toFixed(1)}°C ${sensorData.humidity.toFixed(1)}%`;
            const newTexture = this.createTextTexture(text, '#0088ff');
            
            // 更新 Sprite Material 的纹理
            spriteMaterial.map = newTexture;
            spriteMaterial.map.needsUpdate = true;
            
            // 根据新纹理的尺寸更新 sprite 的缩放，保持宽高比
            sprite.scale.set(
                (newTexture.image.width * textureScale),
                (newTexture.image.height * textureScale),
                1
            );
            
            // 释放旧纹理资源，防止内存泄露
            if (oldTexture) {
                oldTexture.dispose();
            }
        };
        
        // 返回 billboard
        return sprite;
    }
    
    // 创建文字纹理
    createTextTexture(text: string, color: string): CanvasTexture {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            throw new Error('Failed to get canvas context');
        }
        
        // 设置字体（用于测量文字尺寸）
        context.font = 'bold 32px Arial';
        
        // 测量文字尺寸
        const textMetrics = context.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 32; // 字体大小
        
        // 设置画布尺寸，加上内边距
        const padding = 10;
        canvas.width = textWidth + padding * 2;
        canvas.height = textHeight + padding * 2;
        
        // 注意：canvas 尺寸改变后，所有上下文属性都会被重置，需要重新设置
        // 重新设置字体（用于绘制）
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制文字
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
}

export default WarehouseContext;

