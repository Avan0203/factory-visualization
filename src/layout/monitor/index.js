/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-07-29 00:25:59
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
    MathUtils,
    PlaneGeometry,
    TextureLoader,
    MeshPhysicalMaterial,
    MirroredRepeatWrapping,
    EquirectangularReflectionMapping,
    PMREMGenerator,
    SphereGeometry,
    MeshBasicMaterial,
    ACESFilmicToneMapping,
    Path,
    Vector3,
    BufferGeometry,
    BufferAttribute,
    CatmullRomCurve3,
    RepeatWrapping,
    Matrix4,
    Vector2,
    InstancedMesh,
    Object3D,
    BoxGeometry,
    LineSegments,
    LineBasicMaterial,
    Line,
    AxesHelper,
    DirectionalLightHelper,
    CameraHelper
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const publicPath = '../../../public/';
const rotateMatrix = new Matrix4().makeRotationX(Math.PI / 2);

class Monitor {
    constructor(domElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, domElement.clientWidth / domElement.clientHeight, 0.1, 10000);
        this.camera.up.set(0, 0, 1);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, -100, 500);



        this.renderer = new WebGLRenderer();
        this.renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.shadowMap.enabled = true;
        domElement.appendChild(this.renderer.domElement);


        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.25;
        // this.controls.screenSpacePanning = false;
        // this.controls.minDistance = 30;
        // this.controls.maxDistance = 120;
        // this.controls.maxPolarAngle = MathUtils.degToRad(85);

        this.modelLoader = new GLTFLoader();

        this.textureLoader = new TextureLoader();

        this.renderer.setAnimationLoop(() => {
            this.render();
        });

        this.setup();
    }

    setup() {
        // this.#setupSkyBox();
        this.#setupLights();
        this.#setupModel();
    }

    #setupLights() {
        const ambientLight = new AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(100, -400, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 1000;
        directionalLight.shadow.camera.left = -500;
        directionalLight.shadow.camera.right = 500;
        directionalLight.shadow.camera.top = 500;
        directionalLight.shadow.camera.bottom = -500;
        this.scene.add(directionalLight);
    this.scene.add(new CameraHelper(directionalLight.shadow.camera))
        this.scene.add(new DirectionalLightHelper(directionalLight, 10));
    }

    #setupSkyBox() {
        const loader = new RGBELoader();
        loader.load(`${publicPath}/sky.hdr`, (texture) => {
            console.log('texture: ', texture);
            texture.mapping = EquirectangularReflectionMapping;

            const hdrScene = new Scene();
            const mesh = new Mesh(new SphereGeometry(10, 32, 32), new MeshBasicMaterial({ map: texture, side: 1 }));
            mesh.rotation.set(Math.PI / 2, -Math.PI ,0);
            hdrScene.add(mesh);

            const pmremGenerator = new PMREMGenerator(this.renderer);
            pmremGenerator.compileCubemapShader();
            const envMap = pmremGenerator.fromScene(hdrScene).texture;

            // 应用到场景
            this.scene.background = envMap;    // 设置背景
        });
    }

    #setupModel() {
        this.modelLoader.load(`${publicPath}/factory.glb`, ({scene: gltfScene}) => {
            console.log('gltfScene: ', gltfScene);
            gltfScene.rotateX(Math.PI / 2);
            gltfScene.scale.set(10,10, 10);
            gltfScene.traverse((child) => {
                if(child.isMesh){
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })

            this.scene.add(gltfScene);
        });
    }


    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default Monitor;