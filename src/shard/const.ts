import { TextureLoader } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 使用Vite的环境变量来获取正确的资源路径
export const publicPath = import.meta.env.BASE_URL;

export const dracoPath = `${publicPath}draco/`;

export const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(dracoPath);

export const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export const textureLoader = new TextureLoader();

export const rgbeloader = new RGBELoader();