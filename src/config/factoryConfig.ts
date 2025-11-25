/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-24
 * @Description: 工厂配置全局存储（非响应式）
 */
import { ConfigurationResponse } from '../api/sensor';

// 全局配置数据存储
let factoryConfig: ConfigurationResponse | null = null;

/**
 * 设置工厂配置
 * @param config 配置数据
 */
export const setFactoryConfig = (config: ConfigurationResponse): void => {
  factoryConfig = config;
};

/**
 * 获取工厂配置
 * @returns 配置数据，如果未加载则返回 null
 */
export const getFactoryConfig = (): ConfigurationResponse | null => {
  return factoryConfig;
};

/**
 * 检查配置是否已加载
 * @returns 是否已加载配置
 */
export const isConfigLoaded = (): boolean => {
  return factoryConfig !== null;
};

/**
 * 获取统计信息
 * @returns 统计信息对象
 */
export const getStatistics = () => {
  return factoryConfig?.statistics || {};
};

/**
 * 根据楼号获取配置信息
 * @param buildingCode 楼号
 * @returns 该楼的配置信息，如果不存在则返回 null
 */
export const getBuildingConfig = (buildingCode: string) => {
  return factoryConfig?.statistics[buildingCode] || null;
};

/**
 * 获取所有楼号列表
 * @returns 楼号数组
 */
export const getBuildingCodes = (): string[] => {
  return Object.keys(factoryConfig?.statistics || {});
};

