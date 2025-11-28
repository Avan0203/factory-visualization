/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-20 13:26:22
 * @FilePath: /factory-visualization/src/layout/monitor/warehouseContext.ts
 * @Description: WarehouseContext - 仓库场景上下文
 */

import {
    AmbientLight,
    DirectionalLight,
    WebGLRenderer,
    Mesh,
    Object3D,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Context } from './context';
import { publicPath, gltfLoader } from '../../../shard';

class WarehouseContext extends Context {
    private selectedGoods: Object3D | null = null;
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

    #setupModel(): void {
        gltfLoader.load(`${publicPath}can.glb`, ({ scene: gltfScene }) => {
            console.log('can.glb loaded:', gltfScene);
            gltfScene.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    if(child.name.includes('goods')){
                        this.selection.push(child);
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
}

export default WarehouseContext;

