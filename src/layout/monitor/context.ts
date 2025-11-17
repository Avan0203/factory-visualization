import { Scene, PerspectiveCamera, Object3D } from 'three';

interface IContext {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    selection: Object3D[];
    activate(object: Object3D): void;
    deactivate(): void;
    animate(dt: number): void;
}

class Context implements IContext {
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    selection: Object3D[] = [];

    constructor() {
        // 子类需要初始化 scene 和 camera
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, 1, 0.1, 1000);
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