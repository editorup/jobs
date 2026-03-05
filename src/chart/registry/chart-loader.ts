import { ChartTypeRegistry, ChartCategory, registerChartType } from './chart-type-registry';
import { BaseChartTool } from '../interfaces/chart-tool.interface';

// 导入所有现有的图表生成器
import { BasicBarChartGenerator } from '../generators/basic-bar-chart.generator';
import { BasicColumnChartGenerator } from '../generators/basic-column-chart.generator';
import { BasicLineChartGenerator } from '../generators/basic-line-chart.generator';
import { BasicPieChartGenerator } from '../generators/basic-pie-chart.generator';
import { BarProgressChartGenerator } from '../generators/bar-progress-chart.generator';
import { DonutProgressChartGenerator } from '../generators/donut-progress-chart.generator';
import { DifferenceArrowColumnChartGenerator } from '../generators/difference-arrow-column-chart.generator';
import { DifferenceArrowBarChartGenerator } from '../generators/difference-arrow-bar-chart.generator';
import { GroupedBarChartGenerator } from '../generators/grouped-bar-chart.generator';
import { GroupedColumnChartGenerator } from '../generators/grouped-column-chart.generator';
import { StackedBarChartGenerator } from '../generators/stacked-bar-chart.generator';
import { StackedColumnChartGenerator } from '../generators/stacked-column-chart.generator';
import { StackedAreaChartGenerator } from '../generators/stacked-area-chart.generator';
import { MixedLineGroupedColumnChartGenerator } from '../generators/mixed-line-grouped-column-chart.generator';
import { MixedLineStackedColumnChartGenerator } from '../generators/mixed-line-stacked-column-chart.generator';
import { FunnelChartGenerator } from '../generators/funnel-chart.generator';
import { BasicRadarChartGenerator } from '../generators/basic-radar-chart.generator';
import { RosePieChartGenerator } from '../generators/rose-pie-chart.generator';
import { JadeJueChartGenerator } from '../generators/jade-jue-chart.generator';
import { DescartesHeatmapChartGenerator } from '../generators/descartes-heatmap-chart.generator';
import { SankeyChartGenerator } from '../generators/sankey-chart.generator';
import { VoronoiChartGenerator } from '../generators/voronoi-chart.generator';
import { TreemapChartGenerator } from '../generators/single-layer-treemap-chart.generator';
import { RiverAreaChartGenerator } from '../generators/river-area-chart.generator';
import { CascadedAreaChartGenerator } from '../generators/cascaded-area-chart.generator';
import { ButterflyChartGenerator } from '../generators/butterfly-chart.generator';
import { CheckInBubbleChartGenerator } from '../generators/check-in-bubble-chart.generator';
import { ComposeWaterfallChartGenerator } from '../generators/compose-waterfall-chart.generator';
import { SymbolColumnChartGenerator } from '../generators/symbol-column-chart.generator';
import { SymbolBarChartGenerator } from '../generators/symbol-bar-chart.generator';
import { SymbolPieChartGenerator } from '../generators/symbol-pie-chart.generator';
import { LiquidChartGenerator } from '../generators/liquid-chart.generator';
import { PercentColumnChartGenerator } from '../generators/percent-column-chart.generator';
import { PercentBarChartGenerator } from '../generators/percent-bar-chart.generator';
import { PercentStackedColumnChartGenerator } from '../generators/percent-stacked-column-chart.generator';
import { PercentStackedBarChartGenerator } from '../generators/percent-stacked-bar-chart.generator';
import { DynamicBarChartGenerator } from '../generators/dynamic-bar-chart.generator';
import { DynamicRankingChartGenerator } from '../generators/dynamic-ranking-chart.generator';
import { ChordChartGenerator } from '../generators/chord-chart.generator';
import { WordCloudChartGenerator } from '../generators/word-cloud-chart.generator';

/**
 * 图表加载器配置
 */
export interface ChartLoaderConfig {
  /** 是否启用自动注册 */
  autoRegister: boolean;
  /** 严格模式 */
  strictMode: boolean;
  /** 需要排除的图表类型 */
  excludeTypes?: string[];
  /** 只包含指定的图表类型 */
  includeTypes?: string[];
  /** 自定义分类映射 */
  categoryMappings?: Record<string, ChartCategory>;
}

/**
 * 图表动态加载器
 * 
 * 负责发现和注册图表生成器，支持：
 * - 自动发现现有生成器
 * - 批量注册
 * - 选择性加载
 * - 分类自动映射
 */
export class ChartLoader {
  private registry: ChartTypeRegistry;
  private config: ChartLoaderConfig;
  private loadedGenerators: Map<string, BaseChartTool> = new Map();

  constructor(
    registry: ChartTypeRegistry,
    config: Partial<ChartLoaderConfig> = {}
  ) {
    this.registry = registry;
    this.config = {
      autoRegister: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * 加载所有可用的图表生成器
   */
  public async loadAll(): Promise<void> {
    const generators = this.discoverGenerators();
    
    if (this.config.autoRegister) {
      await this.registerAll(generators);
    } else {
      // 只缓存生成器，不注册
      generators.forEach(generator => {
        this.loadedGenerators.set(generator.getChartType(), generator);
      });
    }
  }

  /**
   * 发现所有可用的图表生成器
   */
  private discoverGenerators(): BaseChartTool[] {
    const generators: BaseChartTool[] = [
      // 基础图表
      new BasicBarChartGenerator(),
      new BasicColumnChartGenerator(),
      new BasicLineChartGenerator(),
      new BasicPieChartGenerator(),
      
      // 进度图表
      new BarProgressChartGenerator(),
      new DonutProgressChartGenerator(),
      
      // 分组图表
      new GroupedBarChartGenerator(),
      new GroupedColumnChartGenerator(),
      
      // 堆叠图表
      new StackedBarChartGenerator(),
      new StackedColumnChartGenerator(),
      new StackedAreaChartGenerator(),
      
      // 混合图表
      new MixedLineGroupedColumnChartGenerator(),
      new MixedLineStackedColumnChartGenerator(),
      
      // 差异箭头图表
      new DifferenceArrowColumnChartGenerator(),
      new DifferenceArrowBarChartGenerator(),
      
      // 专业图表
      new FunnelChartGenerator(),
      new BasicRadarChartGenerator(),
      new RosePieChartGenerator(),
      new JadeJueChartGenerator(),
      new DescartesHeatmapChartGenerator(),
      new SankeyChartGenerator(),
      new VoronoiChartGenerator(),
      new TreemapChartGenerator(),
      
      // 复杂区域图表
      new RiverAreaChartGenerator(),
      new CascadedAreaChartGenerator(),
      new ButterflyChartGenerator(),
      
      // 新增图表
      new CheckInBubbleChartGenerator(),
      new ComposeWaterfallChartGenerator(),
      
      // 符号图表
      new SymbolColumnChartGenerator(),
      new SymbolBarChartGenerator(),
      new SymbolPieChartGenerator(),
      
      // 水波图
      new LiquidChartGenerator(),
      
      // 百分比图表
      new PercentColumnChartGenerator(),
      new PercentBarChartGenerator(),
      new PercentStackedColumnChartGenerator(),
      new PercentStackedBarChartGenerator(),
      
      // 动态图表
      new DynamicBarChartGenerator(),
      new DynamicRankingChartGenerator(),
      
      // 弦图
      new ChordChartGenerator(),
      
      // 词云图
      new WordCloudChartGenerator(),
    ];

    // 应用包含/排除过滤
    return generators.filter(generator => {
      const chartType = generator.getChartType();
      
      // 检查排除列表
      if (this.config.excludeTypes?.includes(chartType)) {
        return false;
      }
      
      // 检查包含列表
      if (this.config.includeTypes && !this.config.includeTypes.includes(chartType)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * 注册所有生成器
   */
  private async registerAll(generators: BaseChartTool[]): Promise<void> {
    const registrations = generators.map(generator => ({
      tool: generator,
      options: this.getRegistrationOptions(generator)
    }));

    try {
      this.registry.registerBatch(registrations);
    } catch (error) {
      if (this.config.strictMode) {
        throw error;
      } else {
        console.warn('Some generators failed to register:', error);
        // 尝试逐个注册
        await this.registerIndividually(generators);
      }
    }
  }

  /**
   * 逐个注册生成器（用于处理部分失败的情况）
   */
  private async registerIndividually(generators: BaseChartTool[]): Promise<void> {
    const results = await Promise.allSettled(
      generators.map(async generator => {
        try {
          const options = this.getRegistrationOptions(generator);
          this.registry.register(generator, options);
          return { success: true, chartType: generator.getChartType() };
        } catch (error) {
          return { 
            success: false, 
            chartType: generator.getChartType(), 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const failed = results
      .map((result, index) => ({ result, generator: generators[index] }))
      .filter(({ result }) => result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success))
      .map(({ generator, result }) => ({
        chartType: generator.getChartType(),
        error: result.status === 'rejected' ? result.reason : 
          (result.value as any).error
      }));

    if (failed.length > 0) {
      console.warn('Failed to register some chart generators:', failed);
    }
  }

  /**
   * 获取生成器的注册选项
   */
  private getRegistrationOptions(generator: BaseChartTool) {
    const chartType = generator.getChartType();
    const category = this.determineCategory(chartType);
    
    return {
      category,
      name: this.generateDisplayName(chartType),
      description: `${this.generateDisplayName(chartType)} configuration generator`,
      supportsMultiSeries: this.detectMultiSeriesSupport(chartType),
      supportedPipeTypes: this.detectSupportedPipeTypes(chartType)
    };
  }

  /**
   * 确定图表分类
   */
  private determineCategory(chartType: string): ChartCategory {
    // 检查自定义映射
    if (this.config.categoryMappings?.[chartType]) {
      return this.config.categoryMappings[chartType];
    }

    // 基于图表类型自动确定分类
    if (chartType.includes('progress')) {
      return ChartCategory.PROGRESS;
    }
    if (chartType.includes('stacked')) {
      return ChartCategory.STACKED;
    }
    if (chartType.includes('grouped')) {
      return ChartCategory.GROUPED;
    }
    if (chartType.includes('mixed')) {
      return ChartCategory.MIXED;
    }
    if (chartType.includes('difference-arrow')) {
      return ChartCategory.STATISTICAL;
    }
    if (chartType.includes('basic')) {
      return ChartCategory.BASIC;
    }
    if (['voronoi', 'sankey', 'treemap', 'chord', 'word-cloud'].some(type => chartType.includes(type))) {
      return ChartCategory.COMPLEX;
    }
    if (chartType.includes('symbol') || chartType.includes('liquid')) {
      return ChartCategory.COMPLEX;
    }
    if (chartType.includes('percent')) {
      return ChartCategory.STATISTICAL;
    }
    if (chartType.includes('dynamic')) {
      return ChartCategory.STATISTICAL;
    }

    // 默认分类
    return ChartCategory.BASIC;
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
    if (chartType.includes('progress')) {
      return ['key_value'];
    }
    if (chartType.includes('mixed') || chartType.includes('stacked') || chartType.includes('grouped')) {
      return ['cross'];
    }
    if (chartType.includes('pie') || chartType.includes('donut')) {
      return ['key_value'];
    }
    if (chartType.includes('difference-arrow')) {
      return ['key_value'];
    }
    if (chartType.includes('dynamic-bar')) {
      return ['cross'];
    }
    if (chartType.includes('percent-stacked') || chartType.includes('percent-bar') || chartType.includes('percent-column')) {
      return ['key_value'];
    }
    if (chartType.includes('chord') || chartType.includes('sankey') || chartType.includes('word-cloud')) {
      return ['key_value'];
    }
    
    return ['cross', 'key_value'];
  }

  /**
   * 按需加载特定图表类型
   */
  public async loadChartType(chartType: string): Promise<boolean> {
    // 检查是否已经加载
    if (this.registry.has(chartType) || this.loadedGenerators.has(chartType)) {
      return true;
    }

    const allGenerators = this.discoverGenerators();
    const generator = allGenerators.find(g => g.getChartType() === chartType);
    
    if (!generator) {
      return false;
    }

    try {
      const options = this.getRegistrationOptions(generator);
      this.registry.register(generator, options);
      return true;
    } catch (error) {
      console.warn(`Failed to load chart type '${chartType}':`, error);
      return false;
    }
  }

  /**
   * 按分类加载图表类型
   */
  public async loadByCategory(category: ChartCategory): Promise<string[]> {
    const allGenerators = this.discoverGenerators();
    const categoryGenerators = allGenerators.filter(generator => 
      this.determineCategory(generator.getChartType()) === category
    );

    const loaded: string[] = [];
    
    for (const generator of categoryGenerators) {
      try {
        const options = this.getRegistrationOptions(generator);
        this.registry.register(generator, options);
        loaded.push(generator.getChartType());
      } catch (error) {
        console.warn(`Failed to load chart type '${generator.getChartType()}':`, error);
      }
    }

    return loaded;
  }

  /**
   * 获取可用但未注册的图表类型
   */
  public getAvailableTypes(): string[] {
    const allGenerators = this.discoverGenerators();
    return allGenerators
      .map(g => g.getChartType())
      .filter(type => !this.registry.has(type));
  }

  /**
   * 获取已加载但未注册的图表类型
   */
  public getLoadedTypes(): string[] {
    return Array.from(this.loadedGenerators.keys());
  }

  /**
   * 重新加载所有图表类型
   */
  public async reload(): Promise<void> {
    this.loadedGenerators.clear();
    await this.loadAll();
  }

  /**
   * 获取加载统计信息
   */
  public getStats() {
    const available = this.getAvailableTypes();
    const registered = this.registry.getRegisteredTypes();
    const loaded = this.getLoadedTypes();

    return {
      available: available.length,
      registered: registered.length,
      loaded: loaded.length,
      availableTypes: available,
      registeredTypes: registered,
      loadedTypes: loaded
    };
  }
}

/**
 * 创建默认的图表加载器
 */
export function createDefaultChartLoader(
  registry: ChartTypeRegistry,
  config?: Partial<ChartLoaderConfig>
): ChartLoader {
  return new ChartLoader(registry, {
    autoRegister: true,
    strictMode: false,
    ...config
  });
}

/**
 * 便捷函数：加载所有默认图表类型
 */
export async function loadDefaultChartTypes(
  registry: ChartTypeRegistry,
  config?: Partial<ChartLoaderConfig>
): Promise<void> {
  const loader = createDefaultChartLoader(registry, config);
  await loader.loadAll();
} 