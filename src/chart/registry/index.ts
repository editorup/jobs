/**
 * Chart Type Registry Module
 * 
 * 提供完整的图表类型注册表功能：
 * - 类型安全的图表管理
 * - 动态加载支持
 * - 分类管理
 * - 事件监听
 * - 批量操作
 */

// 导出核心类和接口
export {
  ChartTypeRegistry,
  ChartTypeRegistryError,
  chartTypeRegistry,
  ChartCategory,
  registerChartType,
  getChartTool,
  isChartTypeRegistered,
  getRegisteredChartTypes,
  type ChartTypeInfo,
  type RegistryConfig,
  type RegistryEventType,
  type RegistryEventListener,
} from './chart-type-registry';

// 导出加载器相关
export {
  ChartLoader,
  createDefaultChartLoader,
  loadDefaultChartTypes,
  type ChartLoaderConfig,
} from './chart-loader';

// 便捷的全局初始化函数
import { chartTypeRegistry, ChartCategory } from './chart-type-registry';
import { loadDefaultChartTypes } from './chart-loader';

/**
 * 初始化图表注册表
 * 自动加载所有可用的图表类型
 */
export async function initializeChartRegistry(config?: {
  /** 是否启用严格模式 */
  strictMode?: boolean;
  /** 需要排除的图表类型 */
  excludeTypes?: string[];
  /** 只包含指定的图表类型 */
  includeTypes?: string[];
  /** 最大注册数量限制 */
  maxRegistrations?: number;
}): Promise<void> {
  try {
    await loadDefaultChartTypes(chartTypeRegistry, {
      autoRegister: true,
      strictMode: config?.strictMode ?? false,
      excludeTypes: config?.excludeTypes,
      includeTypes: config?.includeTypes,
    });
    
    console.log(`✅ Chart registry initialized with ${chartTypeRegistry.getRegisteredTypes().length} chart types`);
  } catch (error) {
    console.error('❌ Failed to initialize chart registry:', error);
    throw error;
  }
}

/**
 * 获取注册表的完整状态信息
 */
export function getRegistryStatus() {
  const stats = chartTypeRegistry.getStats();
  const registeredTypes = chartTypeRegistry.getRegisteredTypes();
  
  return {
    ...stats,
    registeredTypes,
    isInitialized: registeredTypes.length > 0,
  };
}

/**
 * 重置并重新初始化注册表
 */
export async function resetAndInitializeRegistry(config?: Parameters<typeof initializeChartRegistry>[0]): Promise<void> {
  chartTypeRegistry.clear();
  await initializeChartRegistry(config);
}

/**
 * 创建特定分类的Mastra工具集合
 */
export function createCategoryTools(category: ChartCategory) {
  return chartTypeRegistry.createMastraToolsByCategory(category);
}

/**
 * 创建所有已注册图表的Mastra工具
 */
export function createAllChartTools() {
  return chartTypeRegistry.createAllMastraTools();
} 