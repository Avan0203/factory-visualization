import {
    SRGBColorSpace,
    WebGLRenderer,
    Vector2,
    Raycaster,
    Object3D,
    Scene,
    PerspectiveCamera,
    ACESFilmicToneMapping,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { IContext } from './context';
import EventListener from '../../../shard/event';

interface IRender {
    readonly renderer: WebGLRenderer;
    readonly domElement: HTMLElement;
    readonly currentContext: IContext | null;
    switchContext(context: IContext): void;
    render(): void;
    resize(): void;
    dispose(): void;
}

class Render extends EventListener implements IRender {
    readonly renderer: WebGLRenderer;
    readonly domElement: HTMLElement;
    private _currentContext: IContext | null = null;
    private composer: EffectComposer;
    private renderPass: RenderPass;
    private outlinePass: OutlinePass;
    private gammaPass: ShaderPass;
    private controls: OrbitControls;
    private mouse: Vector2;
    private raycaster: Raycaster;
    private clickHandler: (event: MouseEvent) => void;
    private resizeHandler: () => void;

    constructor(domElement: HTMLElement) {
        super();
        this.domElement = domElement;
        this.mouse = new Vector2();
        this.raycaster = new Raycaster();

        // 创建 canvas 并获取 WebGL1 上下文（兼容老电脑）
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        // 初始化渲染器，强制使用 WebGL1
        this.renderer = new WebGLRenderer({ 
            antialias: true,
            canvas: canvas,
            context: gl as WebGLRenderingContext
        });
        this.renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = SRGBColorSpace;
        // 设置 toneMapping 以正确渲染 PBR 材质（MeshStandardMaterial）
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        domElement.appendChild(this.renderer.domElement);

        // 初始化 EffectComposer（需要先有 context，所以先创建空的）
        this.composer = new EffectComposer(this.renderer);

        // // 初始化 RenderPass（占位，会在 switchContext 时更新）
        const tempCamera = new PerspectiveCamera();
        const tempScene = new Scene();
        this.renderPass = new RenderPass(tempScene, tempCamera);
        this.composer.addPass(this.renderPass);

        // // 初始化 OutlinePass
        this.outlinePass = new OutlinePass(
            new Vector2(domElement.clientWidth, domElement.clientHeight),
            tempScene,
            tempCamera
        );
        this.outlinePass.edgeStrength = 3.0;
        this.outlinePass.edgeGlow = 2.0;
        this.outlinePass.edgeThickness = 3.0;
        this.outlinePass.pulsePeriod = 0;
        this.outlinePass.visibleEdgeColor.set('#0088ff');
        this.outlinePass.hiddenEdgeColor.set('#0088ff');
        this.composer.addPass(this.outlinePass);

        // // 添加伽马校正 Pass
        this.gammaPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(this.gammaPass);

        this.controls = new OrbitControls(tempCamera,this.renderer.domElement);

        // 绑定事件处理器
        this.clickHandler = (event: MouseEvent) => this.onMouseClick(event);
        this.resizeHandler = () => this.resize();

        // 添加事件监听
        this.domElement.addEventListener('click', this.clickHandler);
        window.addEventListener('resize', this.resizeHandler);

        // 启动渲染循环
        this.startRenderLoop();
    }

    get currentContext(): IContext | null {
        return this._currentContext;
    }

    switchContext(context: IContext): void {
        if (this._currentContext === context) return;

        // 失活当前 context
        if (this._currentContext) {
            this._currentContext.deactivate();
        }

        // 切换 context
        this._currentContext = context;

        // 更新 RenderPass 的 scene 和 camera
        this.renderPass.scene = context.scene;
        this.renderPass.camera = context.camera;

        // 更新 OutlinePass 的 scene 和 camera
        this.outlinePass.renderScene = context.scene;
        this.outlinePass.renderCamera = context.camera;

        // 更新 controls 的 camera
        this.controls.object = context.camera;
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        context.launch(this.controls);

        // 清空之前的选择
        this.outlinePass.selectedObjects = [];

        // 切换后立即更新相机宽高比和渲染器大小
        this.resize();
    }

    private onMouseClick(event: MouseEvent): void {
        if (!this._currentContext) return;

        // 计算鼠标在屏幕上的坐标
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 更新 raycaster
        this.raycaster.setFromCamera(this.mouse, this._currentContext.camera);

        // 检测与场景中所有对象的碰撞
        const intersects = this.raycaster.intersectObjects(
            this._currentContext.selection,
            true
        );

        if (intersects.length > 0) {
            // 找到被点击的对象
            const clickedObject = intersects[0].object;

            // 查找这个对象是否在 selection 数组中，或者其父级在 selection 中
            const selectableObject = this.findSelectableObject(clickedObject);
            console.log('selectableObject: ', selectableObject);

            if (selectableObject) {
                // 调用 context 的 activate 方法
                this._currentContext.activate(selectableObject);
                // 更新 OutlinePass
                this.outlinePass.selectedObjects = [selectableObject];
                this.emit('select', selectableObject);
            } else {
                // 点击的不是可选对象，取消选择
                this._currentContext.deactivate();
                this.outlinePass.selectedObjects = [];
                this.emit('unselect');
            }
        } else {
            // 点击空白区域，取消选择
            this._currentContext.deactivate();
            this.outlinePass.selectedObjects = [];
        }
    }

    private findSelectableObject(object: Object3D): Object3D | null {
        if (!this._currentContext) return null;
        console.log('findSelectableObject: ', object);
        console.log('selection: ', this._currentContext.selection);

        let current: Object3D | null = object;

        // 向上遍历父级对象，查找是否在 selection 数组中
        while (current) {
            if (this._currentContext.selection.includes(current)) {
                return current;
            }
            current = current.parent;
        }
        console.log();console.log();

        return null;
    }

    render(): void {
        if (!this._currentContext) return;

        // 更新 controls
        this.controls.update();

        // 调用 context 的 animate 方法
        this._currentContext.animate(0.016); // 约60fps的deltaTime

        this.composer.render();
    }

    resize(): void {
        if (!this._currentContext) return;

        const width = this.domElement.clientWidth;
        const height = this.domElement.clientHeight;

        // 防止容器尺寸为 0
        if (width === 0 || height === 0) return;

        // 更新相机宽高比
        this._currentContext.camera.aspect = width / height;
        this._currentContext.camera.updateProjectionMatrix();

        // 更新渲染器大小
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        this.outlinePass.setSize(width, height);
    }

    private startRenderLoop(): void {
        // 使用 WebGLRenderer 的 setAnimationLoop
        this.renderer.setAnimationLoop(() => {
            this.render();
        });
    }

    dispose(): void {
        // 停止渲染循环
        this.renderer.setAnimationLoop(null);

        // 移除事件监听
        this.domElement.removeEventListener('click', this.clickHandler);
        window.removeEventListener('resize', this.resizeHandler);

        // 清理资源
        this.renderer.dispose();
        this.composer.dispose();
        this.controls.dispose();
    }
}

export { Render };
export type { IRender };