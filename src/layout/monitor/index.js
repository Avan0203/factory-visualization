/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-09-29 17:07:44
 * @FilePath: /factory-visualization/src/layout/monitor/index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
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
    DirectionalLightHelper,
    CameraHelper,
    Raycaster,
    Vector2,
    Vector3,
    Group,
    Sprite,
    SpriteMaterial,
    Box3,
    SRGBColorSpace,
    Box3Helper,
    CanvasTexture
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';

// 使用Vite的环境变量来获取正确的资源路径
const publicPath = import.meta.env.BASE_URL;

class Monitor {
    constructor(domElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, domElement.clientWidth / domElement.clientHeight, 0.1, 5000);
        this.camera.up.set(0, 0, 1);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, -100, 400);

        this.renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        this.renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        
        domElement.appendChild(this.renderer.domElement);

        // 设置EffectComposer
        this.composer = new EffectComposer(this.renderer);

        // 添加RenderPass
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        // 添加OutlinePass
        this.outlinePass = new OutlinePass(
            new Vector2(domElement.clientWidth, domElement.clientHeight),
            this.scene,
            this.camera
        );
        this.outlinePass.edgeStrength = 3.0;
        this.outlinePass.edgeGlow = 2.0;  // 增加泛光效果
        this.outlinePass.edgeThickness = 3.0;  // 增加边缘厚度
        this.outlinePass.pulsePeriod = 0;
        this.outlinePass.visibleEdgeColor.set('#0088ff');
        this.outlinePass.hiddenEdgeColor.set('#0088ff');
        this.composer.addPass(this.outlinePass);

        // 添加伽马校正Pass（当使用SRGBColorSpace时推荐）
        this.gammaPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(this.gammaPass);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.25;
        // this.controls.screenSpacePanning = false;
        // this.controls.minDistance = 30;
        // this.controls.maxDistance = 120;
        // this.controls.maxPolarAngle = MathUtils.degToRad(85);

        this.modelLoader = new GLTFLoader();
        this.textureLoader = new TextureLoader();

        // 初始化outline相关属性
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();
        this.building = [];
        this.selectedBuilding = null;

        // 初始化精灵图相关属性
        this.spriteMarkers = [];
        this.animationTime = 0;

        // 添加点击事件监听器
        this.domElement = domElement;
        this.addClickListeners();

        // 添加窗口大小调整监听器
        this.addResizeListener();

        this.renderer.setAnimationLoop(() => {
            this.render();
        });

        this.setup();
    }

    setup() {
        this.#setupSkyBox();
        this.#setupLights();
        this.#setupModel();
    }

    #setupLights() {
        // 增加环境光强度，提供基础照明
        const ambientLight = new AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        // 调整定向光强度和位置，提供主要照明和阴影
        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(210, -240, 800);
        directionalLight.castShadow = true;

        // // 优化阴影设置
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 2000;
        directionalLight.shadow.camera.left = -1500;
        directionalLight.shadow.camera.right = 1500;
        directionalLight.shadow.camera.top = 1500;
        directionalLight.shadow.camera.bottom = -1500;

        this.scene.add(directionalLight);


        // // 调试辅助线（可选）
        // this.scene.add(new CameraHelper(directionalLight.shadow.camera));
        // this.scene.add(new DirectionalLightHelper(directionalLight, 10));
    }

    #setupSkyBox() {
        const loader = new RGBELoader();
        loader.load(`${publicPath}sky.hdr`, (texture) => {
            texture.mapping = EquirectangularReflectionMapping;

            const hdrScene = new Scene();
            const mesh = new Mesh(new SphereGeometry(10, 32, 32), new MeshBasicMaterial({ map: texture, side: 1 }));
            mesh.rotation.set(Math.PI / 2, -Math.PI, 0);
            hdrScene.add(mesh);

            const pmremGenerator = new PMREMGenerator(this.renderer);
            pmremGenerator.compileCubemapShader();
            const envMap = pmremGenerator.fromScene(hdrScene).texture;

            // 应用到场景
            this.scene.background = envMap;    // 设置背景
        });
    }

    #setupModel() {
        const materialMap = new WeakMap();

        this.modelLoader.load(`${publicPath}factory.glb`, ({ scene: gltfScene }) => {
            console.log('gltfScene: ', gltfScene);
            gltfScene.rotateX(Math.PI / 2);
            gltfScene.scale.set(10, 10, 10);
            gltfScene.traverse((child) => {
                if (child.isMesh) {
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

            // 创建精灵图标记（在场景变换之后）
            this.createSpriteMarkers();
        });
    }
    // 添加点击事件监听器
    addClickListeners() {
        this.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
    }

    // 添加窗口大小调整监听器
    addResizeListener() {
        window.addEventListener('resize', () => {
            const width = this.domElement.clientWidth;
            const height = this.domElement.clientHeight;

            // 更新相机宽高比
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();

            // 更新渲染器大小
            this.renderer.setSize(width, height);

            // 更新EffectComposer
            this.composer.setSize(width, height);

            // 更新OutlinePass
            this.outlinePass.setSize(width, height);
        });
    }

    // 鼠标点击事件处理
    onMouseClick(event) {
        // 计算鼠标在屏幕上的坐标
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 更新raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检测与场景中所有对象的碰撞（包括building group中的mesh）
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        console.log('点击检测:', intersects.length, '个交点');

        if (intersects.length > 0) {
            // 找到被点击的对象
            const clickedObject = intersects[0].object;
            console.log('点击了对象:', clickedObject.name);

            // 查找这个对象属于哪个building group
            const buildingGroup = this.findBuildingGroup(clickedObject);

            if (buildingGroup) {
                console.log('找到所属建筑组:', buildingGroup.name);
                this.selectBuilding(buildingGroup);
            } else {
                console.log('点击的不是建筑部分');
                this.deselectBuilding();
            }
        } else {
            // 点击空白区域，取消选择
            console.log('点击空白区域，取消选择');
            this.deselectBuilding();
        }
    }

    // 查找对象所属的building group
    findBuildingGroup(object) {
        let current = object;

        // 向上遍历父级对象，查找building group
        while (current) {
            if (current.name && current.name.includes('buillding')) {
                return current;
            }
            current = current.parent;
        }

        return null;
    }

    // 选择建筑并添加outline效果
    selectBuilding(building) {
        // 取消之前的选择
        this.deselectBuilding();

        // 设置新选择的建筑
        this.selectedBuilding = building;

        // 设置OutlinePass选中的对象
        this.outlinePass.selectedObjects = [building];

        console.log('选择建筑:', building.name);
    }

    // 取消建筑选择
    deselectBuilding() {
        if (this.selectedBuilding) {
            this.selectedBuilding = null;
            // 清空OutlinePass选中的对象
            this.outlinePass.selectedObjects = [];
            console.log('取消选择建筑');
        }
    }

    // 创建精灵图标记
    createSpriteMarkers() {
        // 加载蓝色水滴纹理
        const blueTexture = this.textureLoader.load(`${publicPath}blue.png`);

        this.building.forEach((building, index) => {
            // 确保整个场景的世界矩阵是最新的（包括gltfScene的变换）
            this.scene.updateMatrixWorld(true);
            building.updateMatrixWorld(true);

            // 直接使用setFromObject，它会自动考虑所有父级变换（包括gltfScene的旋转和缩放）
            const worldBox = new Box3().setFromObject(building);
            // 添加包围盒辅助线
            // this.scene.add(new Box3Helper(worldBox, 0x00ff00));

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
            textSprite.position.set(0, 0, 25); // 在蓝色水滴上方

            // 根据纹理的实际尺寸设置精灵大小
            const textureSize = 1.5; // 进一步增大缩放比例
            textSprite.scale.set(
                textTexture.image.width * textureSize / 5,
                textTexture.image.height * textureSize / 5,
                1
            );

            // 将两个精灵添加到组中
            spriteGroup.add(blueSprite);
            spriteGroup.add(textSprite);

            // 设置组的位置（建筑顶部上方）
            spriteGroup.position.set(
                worldCenter.x,
                worldCenter.y,
                worldCenter.z + worldSize.z / 2 + 25
            );

            // 存储动画数据
            spriteGroup.userData = {
                originalZ: spriteGroup.position.z,
                floatRange: 10,  // 浮动范围
                speed: 1 + index * 0.3,  // 每个标记不同的浮动速度
                building: building  // 存储关联的建筑，用于后续更新位置
            };

            // 添加到场景
            this.scene.add(spriteGroup);
            this.spriteMarkers.push(spriteGroup);
        });
    }

    // 创建文字纹理
    createTextTexture(text) {
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
    updateSpriteAnimation() {
        this.animationTime += 0.016; // 约60fps

        this.spriteMarkers.forEach(spriteGroup => {
            const { originalZ, floatRange, speed, building } = spriteGroup.userData;

            // 更新建筑的世界矩阵
            building.updateMatrixWorld(true);

            // 重新计算世界坐标下的包围盒
            const worldBox = new Box3().setFromObject(building);
            const worldCenter = worldBox.getCenter(new Vector3());
            const worldSize = worldBox.getSize(new Vector3());

            // 更新精灵组的基础位置（跟随建筑）
            // 注意：相机up设置为(0,0,1)，所以Z轴向上
            const baseZ = worldCenter.z + worldSize.z / 2 + 25;

            // 添加浮动动画效果
            spriteGroup.position.set(
                worldCenter.x,
                worldCenter.y,
                baseZ + Math.sin(this.animationTime * speed) * floatRange
            );
        });
    }

    render() {
        this.controls.update();
        // this.updateSpriteAnimation(); // 更新精灵图动画
        this.composer.render();
    }
}

export default Monitor;