import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { z } from 'zod';

// 颜色配置接口
export interface ColorConfig {
  color: string;
  opacity: number;
}

// 位置配置接口
export interface PositionConfig {
  x: string;
  y: string;
}

// 标题配置接口
export interface TitleConfig {
  show: boolean;
  mainTitle?: {
    show: boolean;
    text: string;
    fontFamily?: string;
    fontSize?: number;
    color?: ColorConfig;
    position?: PositionConfig;
  };
  subTitle?: {
    show: boolean;
    text: string;
    fontSize?: number;
    color?: ColorConfig;
    fontFamily?: string;
  };
}

// 背景配置接口
export interface BackgroundConfig {
  show: boolean;
  color?: ColorConfig;
  texture?: string;
  border?: { radius: number };
  blur?: number;
}

// 映射配置接口
export interface MapConfig {
  name: string;
  index: number;
  isLegend: boolean;
  function: string;
  configurable: boolean;
  xAxisIndex?: number;
  yAxisIndex?: number;
  type: string;
}

// 图例配置接口
export interface LegendConfig {
  show: boolean;
  display?: string;
  position?: PositionConfig;
  fontFamily?: string;
  fontSize?: number;
  color?: ColorConfig;
}

// 基础配置接口
export interface ChartSampleConfig {
  data: any[][];
  pipe: string;
  props: {
    type: string;
    title?: TitleConfig;
    background?: BackgroundConfig;
    map?: MapConfig[];
    fill?: any;
    display?: any;
    legend?: LegendConfig;
    label?: any;
    axis?: any;
    [key: string]: any; // 允许其他属性
  };
}

// 样本文件信息接口
export interface SampleFileInfo {
  filename: string;
  fullPath: string;
  chartType: string;
  size: number;
  lastModified: Date;
}

// 加载结果接口
export interface LoadResult<T = ChartSampleConfig> {
  success: boolean;
  data?: T;
  error?: string;
  info?: SampleFileInfo;
}

// 批量加载结果接口
export interface BatchLoadResult {
  totalFiles: number;
  loadedFiles: number;
  failedFiles: number;
  results: Array<{
    filename: string;
    success: boolean;
    data?: ChartSampleConfig;
    error?: string;
  }>;
  byType: Map<string, ChartSampleConfig[]>;
}

// Zod验证schema
const ColorConfigSchema = z.object({
  color: z.string(),
  opacity: z.number(),
});

const PositionConfigSchema = z.object({
  x: z.string(),
  y: z.string(),
});

const TitleConfigSchema = z.object({
  show: z.boolean(),
  mainTitle: z.object({
    show: z.boolean(),
    text: z.string(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    color: ColorConfigSchema.optional(),
    position: PositionConfigSchema.optional(),
  }).optional(),
  subTitle: z.object({
    show: z.boolean(),
    text: z.string(),
    fontSize: z.number().optional(),
    color: ColorConfigSchema.optional(),
    fontFamily: z.string().optional(),
  }).optional(),
}).optional();

const MapConfigSchema = z.object({
  name: z.string(),
  index: z.number(),
  isLegend: z.boolean(),
  function: z.string(),
  configurable: z.boolean(),
  xAxisIndex: z.number().optional(),
  yAxisIndex: z.number().optional(),
  type: z.string(),
}).array().optional();

const ChartSampleConfigSchema = z.object({
  data: z.array(z.array(z.any())),
  pipe: z.string(),
  props: z.object({
    type: z.string(),
    title: TitleConfigSchema,
    background: z.any().optional(),
    map: MapConfigSchema,
    fill: z.any().optional(),
    display: z.any().optional(),
    legend: z.any().optional(),
    label: z.any().optional(),
    axis: z.any().optional(),
  }).passthrough(), // 允许额外属性
});

/**
 * 样本JSON加载器类
 */
export class SampleJsonLoader {
  private configsPath: string;
  private cache: Map<string, ChartSampleConfig>;
  private fileInfoCache: Map<string, SampleFileInfo>;

  constructor(configsPath: string = 'src/mastra/tools/chart/configs') {
    this.configsPath = configsPath;
    this.cache = new Map();
    this.fileInfoCache = new Map();
  }

  /**
   * 扫描配置目录，获取所有示例文件信息
   */
  public scanDirectory(): SampleFileInfo[] {
    try {
      if (!existsSync(this.configsPath)) {
        throw new Error(`配置目录不存在: ${this.configsPath}`);
      }

      const files = readdirSync(this.configsPath);
      const sampleFiles: SampleFileInfo[] = [];

      for (const file of files) {
        if (this.isSampleFile(file)) {
          const fullPath = join(this.configsPath, file);
          const stats = statSync(fullPath);
          const chartType = this.extractChartType(file);

          const info: SampleFileInfo = {
            filename: file,
            fullPath,
            chartType,
            size: stats.size,
            lastModified: stats.mtime,
          };

          sampleFiles.push(info);
          this.fileInfoCache.set(file, info);
        }
      }

      return sampleFiles.sort((a, b) => a.chartType.localeCompare(b.chartType));
    } catch (error) {
      throw new Error(`扫描目录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 加载单个示例JSON文件
   */
  public loadSample(filename: string, useCache: boolean = true): LoadResult<ChartSampleConfig> {
    try {
      // 检查缓存
      if (useCache && this.cache.has(filename)) {
        const data = this.cache.get(filename)!;
        const info = this.fileInfoCache.get(filename);
        return { success: true, data, info };
      }

      const fullPath = join(this.configsPath, filename);
      
      if (!existsSync(fullPath)) {
        return {
          success: false,
          error: `文件不存在: ${fullPath}`,
        };
      }

      // 读取文件内容
      const content = readFileSync(fullPath, 'utf-8');
      const rawData = JSON.parse(content);

      // 验证数据结构
      const validatedData = ChartSampleConfigSchema.parse(rawData);

      // 存入缓存
      if (useCache) {
        this.cache.set(filename, validatedData);
      }

      // 获取文件信息
      const info = this.getFileInfo(filename);

      return {
        success: true,
        data: validatedData,
        info,
      };
    } catch (error) {
      return {
        success: false,
        error: `加载文件失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  /**
   * 根据图表类型加载示例
   */
  public loadByChartType(chartType: string, useCache: boolean = true): LoadResult<ChartSampleConfig> {
    const filename = `${chartType}.sample.json`;
    return this.loadSample(filename, useCache);
  }

  /**
   * 批量加载所有示例文件
   */
  public loadAllSamples(useCache: boolean = true): BatchLoadResult {
    const files = this.scanDirectory();
    const results: BatchLoadResult['results'] = [];
    const byType = new Map<string, ChartSampleConfig[]>();
    
    let loadedFiles = 0;
    let failedFiles = 0;

    for (const fileInfo of files) {
      const result = this.loadSample(fileInfo.filename, useCache);
      
      if (result.success && result.data) {
        loadedFiles++;
        
        // 按类型分组
        const chartType = fileInfo.chartType;
        if (!byType.has(chartType)) {
          byType.set(chartType, []);
        }
        byType.get(chartType)!.push(result.data);
        
        results.push({
          filename: fileInfo.filename,
          success: true,
          data: result.data,
        });
      } else {
        failedFiles++;
        results.push({
          filename: fileInfo.filename,
          success: false,
          error: result.error,
        });
      }
    }

    return {
      totalFiles: files.length,
      loadedFiles,
      failedFiles,
      results,
      byType,
    };
  }

  /**
   * 获取特定类型的所有示例
   */
  public getSamplesByType(chartType: string): ChartSampleConfig[] {
    const batchResult = this.loadAllSamples();
    return batchResult.byType.get(chartType) || [];
  }

  /**
   * 获取所有支持的图表类型
   */
  public getSupportedChartTypes(): string[] {
    const files = this.scanDirectory();
    const types = new Set(files.map(f => f.chartType));
    return Array.from(types).sort();
  }

  /**
   * 验证示例文件的结构完整性
   */
  public validateSample(filename: string): LoadResult<boolean> {
    const loadResult = this.loadSample(filename, false);
    
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error,
      };
    }

    const config = loadResult.data;
    const errors: string[] = [];

    // 基本结构验证
    if (!config.data || !Array.isArray(config.data)) {
      errors.push('缺少或无效的数据字段');
    }

    if (!config.pipe || typeof config.pipe !== 'string') {
      errors.push('缺少或无效的管道字段');
    }

    if (!config.props || !config.props.type) {
      errors.push('缺少或无效的属性类型字段');
    }

    // 数据完整性验证
    if (config.data && config.data.length > 0) {
      if (!Array.isArray(config.data[0])) {
        errors.push('数据格式错误：期望嵌套数组');
      } else if (config.data[0].length === 0) {
        errors.push('数据为空');
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; '),
      };
    }

    return {
      success: true,
      data: true,
      info: loadResult.info,
    };
  }

  /**
   * 提取示例的输入数据（用于生成器）
   */
  public extractInputData(config: ChartSampleConfig): any {
    // 处理数据：移除标题行
    let processedData = config.data || [];
    
    if (processedData.length > 0 && Array.isArray(processedData[0])) {
      if (config.pipe === 'key_value') {
        processedData = processedData.map((dataSet: any[]) => {
          if (dataSet.length > 0) {
            // 移除第一行标题
            return dataSet.slice(1);
          }
          return dataSet;
        });
      }
    }

    return {
      chartType: config.props.type,
      data: processedData,
      title: config.props.title?.mainTitle?.text || '',
      subtitle: config.props.title?.subTitle?.text || '',
      theme: 'light', // 默认主题
    };
  }

  /**
   * 获取文件统计信息
   */
  public getStatistics(): {
    totalFiles: number;
    totalSize: number;
    chartTypes: number;
    averageSize: number;
    lastModified: Date | null;
  } {
    const files = this.scanDirectory();
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const chartTypes = new Set(files.map(f => f.chartType)).size;
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;
    const lastModified = files.length > 0 
      ? new Date(Math.max(...files.map(f => f.lastModified.getTime())))
      : null;

    return {
      totalFiles,
      totalSize,
      chartTypes,
      averageSize,
      lastModified,
    };
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.fileInfoCache.clear();
  }

  /**
   * 获取缓存状态
   */
  public getCacheStatus(): {
    cachedFiles: number;
    cacheSize: number;
    fileInfoCacheSize: number;
  } {
    return {
      cachedFiles: this.cache.size,
      cacheSize: this.cache.size,
      fileInfoCacheSize: this.fileInfoCache.size,
    };
  }

  // 私有方法

  /**
   * 检查是否为示例文件
   */
  private isSampleFile(filename: string): boolean {
    return filename.endsWith('.sample.json') && extname(filename) === '.json';
  }

  /**
   * 从文件名提取图表类型
   */
  private extractChartType(filename: string): string {
    return basename(filename, '.sample.json');
  }

  /**
   * 获取文件信息
   */
  private getFileInfo(filename: string): SampleFileInfo | undefined {
    if (this.fileInfoCache.has(filename)) {
      return this.fileInfoCache.get(filename);
    }

    try {
      const fullPath = join(this.configsPath, filename);
      const stats = statSync(fullPath);
      const chartType = this.extractChartType(filename);

      const info: SampleFileInfo = {
        filename,
        fullPath,
        chartType,
        size: stats.size,
        lastModified: stats.mtime,
      };

      this.fileInfoCache.set(filename, info);
      return info;
    } catch {
      return undefined;
    }
  }
} 