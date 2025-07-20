/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-06-05 15:57:11
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-07-21 01:43:40
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
    AxesHelper
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const publicPath = '../../../public/';
const rotateMatrix = new Matrix4().makeRotationX(Math.PI / 2);

class Monitor {
    constructor(domElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, domElement.clientWidth / domElement.clientHeight, 0.1, 1000);
        this.camera.up.set(0, 0, 1);
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, -1000, 500);



        this.renderer = new WebGLRenderer();
        this.renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        this.renderer.shadowMap.enabled = true;
        domElement.appendChild(this.renderer.domElement);


        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 120;
        this.controls.maxPolarAngle = MathUtils.degToRad(85);

        this.modelLoader = new GLTFLoader();

        this.textureLoader = new TextureLoader();

        this.renderer.setAnimationLoop(() => {
            this.render();
        });

        this.setup();
    }

    setup() {
        this.#setupSkyBox();
        this.#setupLights();
        this.#setupGround();
        this.#setupRoad();
        this.#setupBuildings();
        // this.#setupTrees();
        // this.#setupGrills();
    }

    #setupLights() {
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 3);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 350;
        directionalLight.shadow.camera.left = -500;
        directionalLight.shadow.camera.right = 500;
        directionalLight.shadow.camera.top = 500;
        directionalLight.shadow.camera.bottom = -500;
        this.scene.add(directionalLight);
    }

    #setupSkyBox() {
        const loader = new RGBELoader();
        loader.load(`${publicPath}/sky.hdr`, (texture) => {
            console.log('texture: ', texture);
            texture.mapping = EquirectangularReflectionMapping;

            const hdrScene = new Scene();
            const mesh = new Mesh(new SphereGeometry(10, 32, 32), new MeshBasicMaterial({ map: texture, side: 1 }));
            // mesh.applyMatrix4(rotateMatrix);
            hdrScene.add(mesh);

            const pmremGenerator = new PMREMGenerator(this.renderer);
            pmremGenerator.compileCubemapShader();
            const envMap = pmremGenerator.fromScene(hdrScene).texture;

            // 应用到场景
            this.scene.background = envMap;    // 设置背景
        });
    }
    #setupGround() {
        const plant = new Mesh(new PlaneGeometry(1000, 1000), new MeshPhysicalMaterial());
        plant.receiveShadow = true;

        this.scene.add(plant);
        const textures = ['Color.jpg', 'AmbientOcclusion.jpg', 'Normal.png'].map((path) => {
            const texture = this.textureLoader.load(`${publicPath}/grass/${path}`);
            texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
            texture.repeat.set(100, 100);
            return texture;
        });

        plant.material.map = textures[0];
        plant.material.aoMap = textures[1];
        plant.material.normalMap = textures[2];

        this.scene.add(plant);
    }

    #setupRoad() {
        const material = new MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.5,
        });
        this.textureLoader.load(`${publicPath}/road.jpg`, (texture) => {
            material.map = texture;
            texture.wrapS = RepeatWrapping;
            texture.repeat.set(20, 1);
            material.needsUpdate = true;
        });

        this.scene.add(new AxesHelper(100))

        const path = new Path();
        path.moveTo(-70, -80);
        path.lineTo(-60, 80);
        path.absarc(-40, 80, 20, Math.PI / 2, 0);
        // path.lineTo(40, 80);
        // path.lineTo(40, -80);



        // const curve = new CatmullRomCurve3(path.getPoints().map(({ x, y }) => new Vector3(x, y, 0)), true);
        const pathPoints = path.getPoints().map(({ x, y }) => new Vector3(x, y, 1));
        console.log('pathPoints: ', pathPoints);

        const geometry = new BufferGeometry().setFromPoints(pathPoints);
        const line = new Line(geometry, new LineBasicMaterial({ color: 0xffffff }))

        this.scene.add(line);



        // const geometry = createRoadGeometry(pathPoints, 10);

        // const road = new Mesh(geometry, material);
        // road.userData.curve = curve;
        // this.road = road;
        // road.position.z = 0.01;
        // road.receiveShadow = true;
        // road.castShadow = true;
        // this.scene.add(road);
    }

    #setupBuildings() {
        const margin = 45;
        const paddingCenter = 25;
        const paddingBetween = 35;
        this.modelLoader.load(`${publicPath}/building.glb`, (modelGroup) => {
            const model = modelGroup.scene;
            model.rotateX(MathUtils.degToRad(90));

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            [
                [paddingBetween, -margin], [paddingBetween, 0], [paddingBetween, margin],
                [0, -margin], [0, 0], [0, margin],
                [-paddingCenter, -margin], [-paddingCenter, 0], [-paddingCenter, margin],
                [-paddingBetween - paddingCenter, -margin]
            ].forEach(([x, y]) => {
                const building = model.clone();
                building.position.set(x, y, 0);
                this.scene.add(building);
            })

        })
    }

    #setupTrees() {
        const position = [];
        const { leftPoints, rightPoints } = this.road.geometry.userData;
        position.push(...leftPoints, ...rightPoints);
        const length = position.length;

        const dummy = new Object3D();
        this.modelLoader.load(`${publicPath}/tree.glb`, (modelGroup) => {
            const treeMap = {};
            const model = modelGroup.scene;
            model.applyMatrix4(rotateMatrix);
            model.traverse((child) => {
                child.updateMatrixWorld(true);
                if (child.isMesh) {
                    child.geometry.applyMatrix4(child.matrixWorld);
                    treeMap[child.id] = {
                        geometry: child.geometry,
                        material: child.material,
                    }
                }
            })

            Object.values(treeMap).forEach(({ geometry, material }) => {
                const mesh = new InstancedMesh(geometry, material, length);
                position.forEach((p, i) => {
                    dummy.position.copy(p);
                    dummy.updateMatrixWorld();
                    mesh.setMatrixAt(i, dummy.matrixWorld);
                });
                mesh.instanceMatrix.needsUpdate = true;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                this.scene.add(mesh);
            })

        });
    }

    #setupGrills() {
        const texture = ['Color.jpg', 'AmbientOcclusion.jpg', 'Normal.jpg', 'Height.png', 'Roughness.jpg'].map((path) => {
            return this.textureLoader.load(`${publicPath}/wall/${path}`, (texture) => {
                texture.wrapS = RepeatWrapping;
                texture.wrapT = RepeatWrapping;
                texture.repeat.set(30, 1);
            })
        });

        const material = new MeshPhysicalMaterial({
            map: texture[0],
            aoMap: texture[1],
            normalMap: texture[2],
            metalnessMap: texture[3],
            roughnessMap: texture[4],
        });
        const geometry = new BoxGeometry(1, 1, 1);
        material.needsUpdate = true;

        const frontWall = new Mesh(geometry, material);
        frontWall.castShadow = frontWall.receiveShadow = true;
        frontWall.scale.set(170, 0.5, 5);
        frontWall.position.set(-15, 105, 0);
        this.scene.add(frontWall);

        const backWall = new Mesh(geometry, material);
        backWall.castShadow = backWall.receiveShadow = true;
        backWall.scale.set(170, 0.5, 5);
        backWall.position.set(-15, -105, 0);
        this.scene.add(backWall);

        const leftWall = new Mesh(geometry, material);
        leftWall.castShadow = leftWall.receiveShadow = true;
        leftWall.scale.set(0.5, 210, 5);
        leftWall.position.set(-100, 0, 0);
        this.scene.add(leftWall);

        const rightWall = new Mesh(geometry, material);
        rightWall.castShadow = rightWall.receiveShadow = true;
        rightWall.scale.set(0.5, 210, 5);
        rightWall.position.set(70, 0, 0);
        this.scene.add(rightWall);

    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

function createRoadGeometry(points, width) {
    const halfWidth = width / 2;
    const up = new Vector3(0, 0, 1);

    const leftPoints = [];
    const rightPoints = [];

    const direction = new Vector3();
    const leftDirection = new Vector3();
    const rightDirection = new Vector3();

    const length = points.length;

    for (let j = 0; j < length; j++) {
        const current = points[j];
        const next = points[(j + 1) % length];

        direction.subVectors(next, current).normalize();

        leftDirection.copy(up).cross(direction);
        leftDirection.z = 0;
        leftDirection.normalize();

        rightDirection.copy(direction).cross(up);
        rightDirection.z = 0;
        rightDirection.normalize();

        const left = new Vector3().copy(leftDirection).multiplyScalar(halfWidth).add(current);
        const right = new Vector3().copy(rightDirection).multiplyScalar(halfWidth).add(current);

        leftPoints.push(left);
        rightPoints.push(right);
    }

    leftPoints.at(-1).copy(leftPoints[0]);
    rightPoints.at(-1).copy(rightPoints[0]);

    const position = [];
    const index = [];
    const uv = [];

    const _a = new Vector3();
    const _b = new Vector3();
    const _c = new Vector3();
    const _d = new Vector3();

    //   A------B
    //   |    / |
    //   |   /  |
    //   | /    |
    //   D------C
    //   L      R

    const pice = 1 / length;

    for (let j = 0, offset = 0; j < length; j++) {
        const [c, n] = [j, (j + 1) % length];
        _a.copy(leftPoints[n]);
        _b.copy(rightPoints[n]);
        _c.copy(rightPoints[c]);
        _d.copy(leftPoints[c]);

        position.push(
            _a.x, _a.y, _a.z,
            _b.x, _b.y, _b.z,
            _c.x, _c.y, _c.z,
            _d.x, _d.y, _d.z,
        );

        index.push(
            offset + 1, offset, offset + 3, // BAD
            offset + 3, offset + 2, offset + 1, // DCB
        );
        offset += 4;

        const [cp, np] = [c * pice, n * pice];
        uv.push(
            np, 0,//a
            np, 1,//b
            cp, 1,//c
            cp, 0,//d
        );
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(index);
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(position), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    geometry.computeVertexNormals();

    geometry.userData = {
        leftPoints,
        rightPoints,
    }
    return geometry
}

export default Monitor;