/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-10-20 14:49:12
 * @FilePath: /factory-visualization/src/layout/monitor/buildingContext.ts
 * @Description: BuildingContext - 建筑场景上下文
 */

import {
    Scene,
    PerspectiveCamera,
    AmbientLight,
    DirectionalLight,
    WebGLRenderer,
    Mesh,
    TextureLoader,
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
    Object3D
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Context } from './context';

// 使用Vite的环境变量来获取正确的资源路径
const publicPath = import.meta.env.BASE_URL;

const modelLoader = new GLTFLoader();
const textureLoader = new TextureLoader();

let animationTime = 0;

class BuildingContext extends Context {
    private building: Object3D[] = [];
    private selectedBuilding: Object3D | null = null;
    private spriteMarkers: Group[] = [];

    constructor(private renderer: WebGLRenderer) {
        super();
        // 使用默认的 Y 轴向上（不需要设置 camera.up）
        this.camera.updateProjectionMatrix();
        // 调整相机位置：Y 轴向上，相机在 Y 轴上方，看向原点
        this.camera.position.set(0, 400, 100);

        // 初始化 selection 数组（用于存储可选择的建筑）
        this.selection = [];

        // 初始化场景
        this.setup(renderer);
    }

    setup(renderer: WebGLRenderer): void {
        this.#setupSkyBox(renderer);
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
        const loader = new RGBELoader();
        loader.load(`${publicPath}sky.hdr`, (texture) => {
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

    #setupModel(): void {
        modelLoader.load(`${publicPath}factory.glb`, ({ scene: gltfScene }) => {
            console.log('gltfScene: ', gltfScene);
            // Y 轴向上，如果模型是 Z 轴向上，需要旋转
            // 如果模型已经是 Y 轴向上，则不需要旋转
            // 这里先移除旋转，如果模型方向不对，再调整
            // gltfScene.rotateX(Math.PI / 2);
            gltfScene.scale.set(10, 10, 10);
            gltfScene.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

                if (child.name.includes('buillding')) {
                    // 将building group添加到数组中
                    this.building.push(child);
                    // 为每个建筑添加用户数据，用于标识
                    child.userData = { type: 'building', original: child };
                }
            });

            this.scene.add(gltfScene);
            console.log('building groups: ', this.building);

            // 将 building 数组添加到 selection 中，使其可以被选择
            this.selection = [...this.building];

            // 创建精灵图标记（在场景变换之后）
            this.createSpriteMarkers();
        });
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
    createSpriteMarkers(): void {
        // 加载蓝色水滴纹理
        const blueTexture = textureLoader.load(`${publicPath}blue.png`);

        this.building.forEach((building, index) => {
            // 确保整个场景的世界矩阵是最新的（包括gltfScene的变换）
            this.scene.updateMatrixWorld(true);
            building.updateMatrixWorld(true);

            // 直接使用setFromObject，它会自动考虑所有父级变换（包括gltfScene的旋转和缩放）
            const worldBox = new Box3().setFromObject(building);

            // 获取世界坐标的中心和尺寸
            const worldCenter = worldBox.getCenter(new Vector3());
            const worldSize = worldBox.getSize(new Vector3());

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
            blueSprite.scale.set(30, 30, 1);

            // 2. 创建文字标签精灵
            const textTexture = this.createTextTexture(`${index + 1}号仓库`);
            const textSpriteMaterial = new SpriteMaterial({
                map: textTexture,
                transparent: true,
                alphaTest: 0.1
            });
            const textSprite = new Sprite(textSpriteMaterial);
            textSprite.position.set(0, 25, 0); // Y 轴向上，在蓝色水滴上方

            // 根据纹理的实际尺寸设置精灵大小
            const textureSize = 1.5; // 进一步增大缩放比例
            textSprite.scale.set(
                (textTexture.image.width * textureSize) / 5,
                (textTexture.image.height * textureSize) / 5,
                1
            );

            // 将两个精灵添加到组中
            spriteGroup.add(blueSprite);
            spriteGroup.add(textSprite);

            // 设置组的位置（建筑顶部上方）- Y 轴向上
            spriteGroup.position.set(
                worldCenter.x,
                worldCenter.y + worldSize.y / 2 + 25,
                worldCenter.z
            );

            // 存储动画数据
            spriteGroup.userData = {
                originalY: spriteGroup.position.y,
                floatRange: 10, // 浮动范围
                speed: 1 + index * 0.3, // 每个标记不同的浮动速度
                building: building // 存储关联的建筑，用于后续更新位置
            };

            // 添加到场景
            this.scene.add(spriteGroup);
            this.spriteMarkers.push(spriteGroup);
        });
    }

    // 创建文字纹理
    createTextTexture(text: string): CanvasTexture {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('无法获取 canvas 2d context');
        }

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
            const { originalY, floatRange, speed, building } = spriteGroup.userData;

            // 更新建筑的世界矩阵
            building.updateMatrixWorld(true);

            // 重新计算世界坐标下的包围盒
            const worldBox = new Box3().setFromObject(building);
            const worldCenter = worldBox.getCenter(new Vector3());
            const worldSize = worldBox.getSize(new Vector3());

            // 更新精灵组的基础位置（跟随建筑）
            // Y 轴向上，使用 Y 轴作为高度
            const baseY = worldCenter.y + worldSize.y / 2 + 25;

            // 添加浮动动画效果
            spriteGroup.position.set(
                worldCenter.x,
                baseY + Math.sin(animationTime * speed) * floatRange,
                worldCenter.z
            );
        });
    }

    // 动画更新方法（由 Render 调用）
    animate(dt: number): void {
        // 更新精灵图动画
        this.updateSpriteAnimation();
    }
}

export default BuildingContext;
