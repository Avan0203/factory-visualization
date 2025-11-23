import { Scene, PerspectiveCamera, Object3D, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import EventListener from '../../../shard/event';

interface IContext {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    selection: Object3D[];
    launch(controls:OrbitControls): void;
    activate(object: Object3D): void;
    deactivate(): void;
    animate(dt: number): void;
}

class Context extends EventListener implements IContext {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    selection: Object3D[] = [];

    constructor(private renderer: WebGLRenderer) {
        super();
        // 子类需要初始化 scene 和 camera
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    }

    launch(controls:OrbitControls){
        // 在switchContext时调用
        // 设置相机，设控制器的一些自定义配置
        controls.object = this.camera;
        controls.update();
    }

    activate(object: Object3D): void {
        // 子类实现
    }

    deactivate(): void {
        // 子类实现
    }

    animate(dt: number): void {
        // 子类实现
    }
}

export { Context };
export type { IContext };