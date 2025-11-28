/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-11-28 14:37:11
 * @FilePath: /factory-visualization/src/layout/monitor/buildingContext.ts
 * @Description: BuildingContext - 建筑场景上下文
 */

import {
    Scene,
    AmbientLight,
    DirectionalLight,
    WebGLRenderer,
    Mesh,
    EquirectangularReflectionMapping,
    PMREMGenerator,
    SphereGeometry,
    MeshBasicMaterial,
    Vector3,
    Group,
    Sprite,
    SpriteMaterial,
    Box3,
    CanvasTexture,
    Object3D,
    Texture
} from 'three';
import { Context } from './context';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { publicPath, gltfLoader, textureLoader, rgbeloader } from '../../../shard';
import { buildingNameConfig } from '../../../config';

let animationTime = 0;

class BuildingContext extends Context {
    private building: Object3D[] = [];
    private selectedBuilding: Object3D | null = null;
    private spriteMarkers: Group[] = [];
    private data: {
        layer1: Object3D;
        layer2: Object3D;
        layer1Selection: Object3D[];
        layer2Selection: Object3D[];
    };

    constructor(renderer: WebGLRenderer) {
        super(renderer);
        // 使用默认的 Y 轴向上（不需要设置 camera.up）
        this.camera.updateProjectionMatrix();
        // 调整相机位置：Y 轴向上，相机在 Y 轴上方，看向原点
        this.camera.position.set(0, 400, -100);

        // 初始化 selection 数组（用于存储可选择的建筑）
        this.selection = [];

        // 初始化场景
        this.setup(renderer);
        this.data = {
            layer1: new Object3D(),
            layer2: new Object3D(),
            layer1Selection: [],
            layer2Selection: []
        };
    }

    launch(controls: OrbitControls): void {
        // //限制旋转角度
        // controls.maxPolarAngle = Math.PI / 2;
        // //限制缩放范围
        // controls.minZoom = 0.3;
        // controls.maxZoom = 3;
        // // 限制移动范围
        // controls.minDistance = 100;
        // controls.maxDistance = 1000;
        this.camera.position.set(0, 120, -600);

        super.launch(controls);
    }

    async setup(renderer: WebGLRenderer): Promise<void> {
        this.#setupSkyBox(renderer);
        this.#setupLights();
        await this.#setupModel();
        await this.#createSpriteMarkers();
        this.emit('setupContext');
    }

    #setupLights(): void {
        // 增加环境光强度，提供基础照明
        const ambientLight = new AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        // 调整定向光强度和位置，提供主要照明和阴影
        // Y 轴向上，灯光从上方斜射
        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(210, 800, 240);
        directionalLight.castShadow = true;

        // 优化阴影设置
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 2000;
        directionalLight.shadow.camera.left = -1500;
        directionalLight.shadow.camera.right = 1500;
        directionalLight.shadow.camera.top = 1500;
        directionalLight.shadow.camera.bottom = -1500;

        this.scene.add(directionalLight);
    }

    #setupSkyBox(renderer: WebGLRenderer): void {
        rgbeloader.load(`${publicPath}sky.hdr`, (texture) => {
            texture.mapping = EquirectangularReflectionMapping;

            const hdrScene = new Scene();
            const mesh = new Mesh(
                new SphereGeometry(10, 32, 32),
                new MeshBasicMaterial({ map: texture, side: 1 })
            );
            // Y 轴向上，调整天空盒旋转
            mesh.rotation.set(0, 0, 0);
            hdrScene.add(mesh);

            const pmremGenerator = new PMREMGenerator(renderer);
            pmremGenerator.compileCubemapShader();
            const envMap = pmremGenerator.fromScene(hdrScene).texture;

            // 应用到场景
            this.scene.background = envMap; // 设置背景
        });
    }

    async #setupModel(): Promise<void> {
        await gltfLoader.loadAsync(`${publicPath}factory.glb`).then((gltf) => {
            const gltfScene = gltf.scene;
            console.log('gltfScene: ', gltfScene);
            gltfScene.scale.set(10, 10, 10);
            gltfScene.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                if (child.name === 'layer1') {
                    this.data.layer1 = child;
                }
                if (child.name === 'layer2') {
                    this.data.layer2 = child;
                }

                if (child.name.includes('building')) {
                    if (this.data.layer1 === child.parent) {
                        this.data.layer1Selection.push(child);
                        child.userData = buildingNameConfig[child.name];
                    }
                    if (this.data.layer2 === child.parent) {
                        this.data.layer2Selection.push(child);
                        child.userData = buildingNameConfig[child.name];
                    }
                }

            });

            this.scene.add(gltfScene);

            // 将 building 数组添加到 selection 中，使其可以被选择
            this.selection = [...this.data.layer1Selection, ...this.data.layer2Selection];
        });
    }

    switchLayer(layer: 0 | 1) {
        if (layer === 0) {
            this.data.layer1.visible = true;
            this.data.layer2.visible = false;
            this.selection = this.data.layer1Selection;
        } else {
            this.data.layer1.visible = false;
            this.data.layer2.visible = true;
            this.selection = this.data.layer2Selection;
        }
    }

    // 激活选择（选择建筑）
    activate(object: Object3D): void {
        if (!object) {
            // 如果传入 null 或 undefined，只是激活但不选择
            return;
        }

        // 取消之前的选择
        this.deactivate();

        // 设置新选择的建筑
        this.selectedBuilding = object;
        console.log('选择建筑:', object.name);
    }

    // 取消选择
    deactivate(): void {
        if (this.selectedBuilding) {
            this.selectedBuilding = null;
            console.log('取消选择建筑');
        }
    }

    // 查找对象所属的building group（供外部使用）
    findBuildingGroup(object: Object3D): Object3D | null {
        let current: Object3D | null = object;

        // 向上遍历父级对象，查找building group
        while (current) {
            if (current.name && current.name.includes('buillding')) {
                return current;
            }
            current = current.parent;
        }

        return null;
    }

    // 创建精灵图标记
    async #createSpriteMarkers(): Promise<void> {

        console.log('开始创建精灵标记，layer1 可见:', this.data.layer1.visible, 'layer2 可见:', this.data.layer2.visible);

        // 等待纹理加载完成
        const blueTexture = await new Promise<Texture>((resolve, reject) => {
            textureLoader.load(
                `${publicPath}blue.png`,
                (texture) => {
                    console.log('蓝色纹理加载完成');
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('蓝色纹理加载失败:', error);
                    reject(error);
                }
            );
        });

        this.scene.updateMatrixWorld(true);


   
        const createMarkerGroup = (building: Object3D, index: number, layer: Object3D) => {
            // 确保整个场景的世界矩阵是最新的（包括gltfScene的变换）
            building.updateMatrixWorld(true);
            layer.updateMatrixWorld(true);

            // 直接使用setFromObject，它会自动考虑所有父级变换（包括gltfScene的旋转和缩放）
            const worldBox = new Box3().setFromObject(building);

            // 获取世界坐标的中心和尺寸
            const worldCenter = worldBox.getCenter(new Vector3());
            const worldSize = worldBox.getSize(new Vector3());

            // 计算精灵在世界坐标中的位置（建筑顶部上方）
            const worldSpritePosition = new Vector3(
                worldCenter.x,
                worldCenter.y + worldSize.y / 2 + 25,
                worldCenter.z
            );

            // 将世界坐标转换为相对于 layer 的本地坐标
            const localPosition = new Vector3();
            layer.worldToLocal(localPosition.copy(worldSpritePosition));

            // 创建精灵组
            const spriteGroup = new Group();

            // 1. 创建蓝色水滴精灵
            const blueSpriteMaterial = new SpriteMaterial({
                map: blueTexture,
                transparent: true,
                alphaTest: 0.1
            });
            const blueSprite = new Sprite(blueSpriteMaterial);
            blueSprite.position.set(0, 0, 0); // 相对于组的原点
            // 减小缩放，场景已经 scale 10 倍，所以精灵缩放相应调整
            blueSprite.scale.set(3, 3, 1);

            // 2. 创建文字标签精灵
            const textTexture = this.createTextTexture(building.userData.name);
            const textSpriteMaterial = new SpriteMaterial({
                map: textTexture,
                transparent: true,
                alphaTest: 0.1
            });
            const textSprite = new Sprite(textSpriteMaterial);
            // 减小文字标签的位置偏移
            textSprite.position.set(0, 2.5, 0); // Y 轴向上，在蓝色水滴上方

            // 根据纹理的实际尺寸设置精灵大小（减小缩放）
            const textureScale = 0.3; // 减小缩放比例
            textSprite.scale.set(
                (textTexture.image.width * textureScale) / 10,
                (textTexture.image.height * textureScale) / 10,
                1
            );

            // 将两个精灵添加到组中
            spriteGroup.add(blueSprite);
            spriteGroup.add(textSprite);

            // 设置组的位置（相对于 layer 的本地坐标）
            spriteGroup.position.copy(localPosition);

            // 存储动画数据
            spriteGroup.userData = {
                originalY: spriteGroup.position.y,
                floatRange: 10, // 浮动范围
                speed: 1 + index * 0.3, // 每个标记不同的浮动速度
                building: building, // 存储关联的建筑，用于后续更新位置
                layer: layer // 存储 layer，用于坐标转换
            };

            // 添加到 layer
            layer.add(spriteGroup);
            this.spriteMarkers.push(spriteGroup);
        }

        this.data.layer1Selection.forEach((building, index) => {
            createMarkerGroup(building, index, this.data.layer1);
        });
        
        this.data.layer2Selection.forEach((building, index) => {
            createMarkerGroup(building, index, this.data.layer2);
        });


        this.building.forEach((building, index) => {
            createMarkerGroup(building, index, this.data.layer1);
        });
    }

    // 创建文字纹理
    createTextTexture(text: string): CanvasTexture {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // 设置更大的字体
        context.font = 'bold 40px Arial';

        // 测量文字尺寸
        const textMetrics = context.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 40; // 字体大小

        // 设置画布尺寸，刚好包裹文字，加上一些内边距
        const padding = 5;
        canvas.width = textWidth + padding * 2;
        canvas.height = textHeight + padding * 2;

        // 设置背景
        context.fillStyle = '#0088ff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 重新设置文字样式（因为canvas尺寸改变了）
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 绘制文字
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // 创建纹理
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }

    // 更新精灵图动画
    updateSpriteAnimation(): void {
        animationTime += 0.016; // 约60fps

        this.spriteMarkers.forEach((spriteGroup) => {
            const { floatRange, speed, building, layer } = spriteGroup.userData;

            // 更新建筑和 layer 的世界矩阵
            building.updateMatrixWorld(true);
            if (layer) {
                layer.updateMatrixWorld(true);
            }

            // 重新计算世界坐标下的包围盒
            const worldBox = new Box3().setFromObject(building);
            const worldCenter = worldBox.getCenter(new Vector3());
            const worldSize = worldBox.getSize(new Vector3());

            // 计算精灵在世界坐标中的位置（建筑顶部上方 + 浮动动画）
            const baseY = worldCenter.y + worldSize.y / 2 + 25;
            const worldSpritePosition = new Vector3(
                worldCenter.x,
                baseY + Math.sin(animationTime * speed) * floatRange,
                worldCenter.z
            );

            // 将世界坐标转换为相对于 layer 的本地坐标
            if (layer) {
                const localPosition = new Vector3();
                layer.worldToLocal(localPosition.copy(worldSpritePosition));
                spriteGroup.position.copy(localPosition);
            } else {
                // 如果没有 layer，直接使用世界坐标（向后兼容）
                spriteGroup.position.copy(worldSpritePosition);
            }
        });
    }

    // 动画更新方法（由 Render 调用）
    animate(dt: number): void {
        // 更新精灵图动画
        this.updateSpriteAnimation();
    }
}

export default BuildingContext;
