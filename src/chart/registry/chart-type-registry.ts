import { BaseChartTool } from '../interfaces/chart-tool.interface';
import { createChartTool, createChartTools } from '../utils/chart-tool-factory';
import { z } from 'zod';

/**
 * 图表类型信息接口
 */
export interface ChartTypeInfo {
  /** 图表类型标识符 */
  type: string;
  /** 图表显示名称 */
  name: string;
  /** 图表描述 */
  description: string;
  /** 图表分类 */
  category: ChartCategory;
  /** 是否支持多系列数据 */
  supportsMultiSeries: boolean;
  /** 支持的数据管道类型 */
  supportedPipeTypes: string[];
  /** 图表工具实例 */
  tool: BaseChartTool;
  /** 创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 图表分类枚举
 */
export enum ChartCategory {
  BASIC = 'basic',
  PROGRESS = 'progress',
  STACKED = 'stacked',
  GROUPED = 'grouped',
  MIXED = 'mixed',
  COMPLEX = 'complex',
  STATISTICAL = 'statistical',
  GEOGRAPHICAL = 'geographical'
}

/**
 * 注册表配置接口
 */
export interface RegistryConfig {
  /** 是否启用严格模式（不允许重复注册） */
  strictMode: boolean;
  /** 是否启用自动加载 */
  autoLoad: boolean;
  /** 最大注册数量限制 */
  maxRegistrations?: number;
  /** 默认分类 */
  defaultCategory: ChartCategory;
}

/**
 * 注册表事件类型
 */
export type RegistryEventType = 'register' | 'unregister' | 'update' | 'clear';

/**
 * 注册表事件监听器
 */
export type RegistryEventListener = (
  event: RegistryEventType,
  chartType: string,
  info?: ChartTypeInfo
) => void;

/**
 * 图表类型注册表异常
 */
export class ChartTypeRegistryError extends Error {
  constructor(message: string, public readonly chartType?: string) {
    super(message);
    this.name = 'ChartTypeRegistryError';
  }
}

/**
 * 图表类型注册表
 * 
 * 提供类型安全的图表类型管理功能，支持：
 * - 图表类型注册和注销
 * - 动态加载图表工具
 * - 类型分类管理
 * - 事件监听
 * - 批量操作
 */
export class ChartTypeRegistry {
  private static instance: ChartTypeRegistry | null = null;
  private chartTypes: Map<string, ChartTypeInfo> = new Map();
  private categories: Map<ChartCategory, Set<string>> = new Map();
  private eventListeners: Set<RegistryEventListener> = new Set();
  private config: RegistryConfig;

  private constructor(config: Partial<RegistryConfig> = {}) {
    this.config = {
      strictMode: true,
      autoLoad: false,
      defaultCategory: ChartCategory.BASIC,
      ...config
    };

    // 初始化分类映射
    Object.values(ChartCategory).forEach(category => {
      this.categories.set(category, new Set());
    });
  }

  /**
   * 获取注册表单例实例
   */
  public static getInstance(config?: Partial<RegistryConfig>): ChartTypeRegistry {
    if (!ChartTypeRegistry.instance) {
      ChartTypeRegistry.instance = new ChartTypeRegistry(config);
    }
    return ChartTypeRegistry.instance;
  }

  /**
   * 重置单例实例（主要用于测试）
   */
  public static reset(): void {
    ChartTypeRegistry.instance = null;
  }

  /**
   * 注册图表类型
   */
  public register(
    tool: BaseChartTool,
    options?: {
      name?: string;
      description?: string;
      category?: ChartCategory;
      supportsMultiSeries?: boolean;
      supportedPipeTypes?: string[];
    }
  ): void {
    const chartType = tool.getChartType();
    
    // 严格模式下检查重复注册
    if (this.config.strictMode && this.chartTypes.has(chartType)) {
      throw new ChartTypeRegistryError(
        `Chart type '${chartType}' is already registered`,
        chartType
      );
    }

    // 检查注册数量限制
    if (this.config.maxRegistrations && this.chartTypes.size >= this.config.maxRegistrations) {
      throw new ChartTypeRegistryError(
        `Maximum registration limit (${this.config.maxRegistrations}) reached`
      );
    }

    const category = options?.category || this.config.defaultCategory;
    const now = new Date();

    const chartInfo: ChartTypeInfo = {
      type: chartType,
      name: options?.name || this.generateDisplayName(chartType),
      description: options?.description || `${chartType} chart configuration generator`,
      category,
      supportsMultiSeries: options?.supportsMultiSeries ?? this.detectMultiSeriesSupport(chartType),
      supportedPipeTypes: options?.supportedPipeTypes || this.detectSupportedPipeTypes(chartType),
      tool,
      createdAt: now,
      updatedAt: now
    };

    // 更新映射
    this.chartTypes.set(chartType, chartInfo);
    this.categories.get(category)?.add(chartType);

    // 触发事件
    this.emitEvent('register', chartType, chartInfo);
  }

  /**
   * 批量注册图表类型
   */
  public registerBatch(
    registrations: Array<{
      tool: BaseChartTool;
      options?: {
        name?: string;
        description?: string;
        category?: ChartCategory;
        supportsMultiSeries?: boolean;
        supportedPipeTypes?: string[];
      };
    }>
  ): void {
    const originalStrictMode = this.config.strictMode;
    
    try {
      // 临时禁用严格模式，允许批量注册
      this.config.strictMode = false;
      
      registrations.forEach(({ tool, options }) => {
        this.register(tool, options);
      });
    } finally {
      this.config.strictMode = originalStrictMode;
    }
  }

  /**
   * 注销图表类型
   */
  public unregister(chartType: string): boolean {
    const chartInfo = this.chartTypes.get(chartType);
    if (!chartInfo) {
      return false;
    }

    // 从映射中移除
    this.chartTypes.delete(chartType);
    this.categories.get(chartInfo.category)?.delete(chartType);

    // 触发事件
    this.emitEvent('unregister', chartType, chartInfo);
    
    return true;
  }

  /**
   * 更新图表类型信息
   */
  public update(
    chartType: string,
    updates: Partial<Pick<ChartTypeInfo, 'name' | 'description' | 'category' | 'supportsMultiSeries' | 'supportedPipeTypes'>>
  ): boolean {
    const chartInfo = this.chartTypes.get(chartType);
    if (!chartInfo) {
      return false;
    }

    // 如果分类发生变化，更新分类映射
    if (updates.category && updates.category !== chartInfo.category) {
      this.categories.get(chartInfo.category)?.delete(chartType);
      this.categories.get(updates.category)?.add(chartType);
    }

    // 更新信息
    const updatedInfo: ChartTypeInfo = {
      ...chartInfo,
      ...updates,
      updatedAt: new Date()
    };

    this.chartTypes.set(chartType, updatedInfo);

    // 触发事件
    this.emitEvent('update', chartType, updatedInfo);
    
    return true;
  }

  /**
   * 获取图表类型信息
   */
  public get(chartType: string): ChartTypeInfo | undefined {
    return this.chartTypes.get(chartType);
  }

  /**
   * 获取图表工具实例
   */
  public getTool(chartType: string): BaseChartTool | undefined {
    return this.chartTypes.get(chartType)?.tool;
  }

  /**
   * 检查图表类型是否已注册
   */
  public has(chartType: string): boolean {
    return this.chartTypes.has(chartType);
  }

  /**
   * 获取所有已注册的图表类型
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this.chartTypes.keys());
  }

  /**
   * 根据分类获取图表类型
   */
  public getTypesByCategory(category: ChartCategory): string[] {
    return Array.from(this.categories.get(category) || []);
  }

  /**
   * 获取所有图表类型信息
   */
  public getAllChartInfo(): ChartTypeInfo[] {
    return Array.from(this.chartTypes.values());
  }

  /**
   * 获取支持多系列的图表类型
   */
  public getMultiSeriesTypes(): string[] {
    return this.getAllChartInfo()
      .filter(info => info.supportsMultiSeries)
      .map(info => info.type);
  }

  /**
   * 根据管道类型筛选图表
   */
  public getTypesByPipeType(pipeType: string): string[] {
    return this.getAllChartInfo()
      .filter(info => info.supportedPipeTypes.includes(pipeType))
      .map(info => info.type);
  }

  /**
   * 创建单个Mastra工具
   */
  public createMastraTool(chartType: string) {
    const tool = this.getTool(chartType);
    if (!tool) {
      throw new ChartTypeRegistryError(`Chart type '${chartType}' not found`, chartType);
    }

    return createChartTool(tool, {
      id: `generate-${chartType}`,
      description: `Generate ${chartType} chart configuration`
    });
  }

  /**
   * 创建所有已注册工具的Mastra tools
   */
  public createAllMastraTools() {
    const tools = Array.from(this.chartTypes.values()).map(info => info.tool);
    return createChartTools(tools);
  }

  /**
   * 根据分类创建Mastra tools
   */
  public createMastraToolsByCategory(category: ChartCategory) {
    const chartTypes = this.getTypesByCategory(category);
    const tools = chartTypes
      .map(type => this.getTool(type))
      .filter((tool): tool is BaseChartTool => tool !== undefined);
    
    return createChartTools(tools);
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(listener: RegistryEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(listener: RegistryEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * 获取注册表统计信息
   */
  public getStats() {
    const categoryStats = Object.values(ChartCategory).reduce((acc, category) => {
      acc[category] = this.categories.get(category)?.size || 0;
      return acc;
    }, {} as Record<ChartCategory, number>);

    return {
      totalRegistered: this.chartTypes.size,
      categoryCounts: categoryStats,
      multiSeriesCount: this.getMultiSeriesTypes().length,
      supportedPipeTypes: [...new Set(
        this.getAllChartInfo().flatMap(info => info.supportedPipeTypes)
      )]
    };
  }

  /**
   * 清空所有注册
   */
  public clear(): void {
    this.chartTypes.clear();
    this.categories.forEach(set => set.clear());
    this.emitEvent('clear', '');
  }

  /**
   * 导出注册表数据
   */
  public export(): Array<Omit<ChartTypeInfo, 'tool'>> {
    return this.getAllChartInfo().map(({ tool, ...info }) => info);
  }

  /**
   * 生成显示名称
   */
  private generateDisplayName(chartType: string): string {
    return chartType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * 检测多系列支持
   */
  private detectMultiSeriesSupport(chartType: string): boolean {
    const multiSeriesPatterns = ['stacked', 'grouped', 'mixed', 'multi'];
    return multiSeriesPatterns.some(pattern => chartType.includes(pattern));
  }

  /**
   * 检测支持的管道类型
   */
  private detectSupportedPipeTypes(chartType: string): string[] {
    // 基于图表类型推断支持的管道类型
    if (chartType.includes('progress')) {
      return ['key_value'];
    }
    if (chartType.includes('mixed') || chartType.includes('stacked') || chartType.includes('grouped')) {
      return ['cross'];
    }
    if (chartType.includes('pie') || chartType.includes('donut')) {
      return ['key_value'];
    }
    
    // 默认支持两种类型
    return ['cross', 'key_value'];
  }

  /**
   * 触发事件
   */
  private emitEvent(event: RegistryEventType, chartType: string, info?: ChartTypeInfo): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event, chartType, info);
      } catch (error) {
        console.warn(`Error in registry event listener:`, error);
      }
    });
  }
}

// 导出默认实例
export const chartTypeRegistry = ChartTypeRegistry.getInstance();

// 导出便捷函数
export function registerChartType(
  tool: BaseChartTool,
  options?: Parameters<ChartTypeRegistry['register']>[1]
): void {
  chartTypeRegistry.register(tool, options);
}

export function getChartTool(chartType: string): BaseChartTool | undefined {
  return chartTypeRegistry.getTool(chartType);
}

export function isChartTypeRegistered(chartType: string): boolean {
  return chartTypeRegistry.has(chartType);
}

export function getRegisteredChartTypes(): string[] {
  return chartTypeRegistry.getRegisteredTypes();
} 