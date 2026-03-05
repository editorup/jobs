import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { BaseChartTool, BaseChartInput, BaseChartOutput } from '../interfaces/chart-tool.interface';

/**
 * 创建图表工具的工厂函数
 * 参考 weather-tool.ts 的 createTool 模式
 */
export function createChartTool<T extends BaseChartInput>(
  chartTool: BaseChartTool,
  options?: {
    inputSchema?: z.ZodType<T>;
    outputSchema?: z.ZodType<BaseChartOutput>;
    id?: string;
    description?: string;
  }
) {
  const chartType = chartTool.getChartType();
  
  return createTool({
    id: options?.id || `generate-${chartType}-chart`,
    description: options?.description || `Generate ${chartType} chart configuration`,
    inputSchema: options?.inputSchema || chartTool.getInputSchema(),
    outputSchema: options?.outputSchema || chartTool.getOutputSchema(),
    execute: async ({ context }) => {
      try {
        // 验证输入数据
        const inputData = context as T;
        
        // 生成图表配置
        const result = await chartTool.generateConfig(inputData);
        
        return result;
      } catch (error) {
        throw new Error(
          `Failed to generate ${chartType} chart: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    },
  });
}

/**
 * 批量创建多个图表工具
 */
export function createChartTools(chartTools: BaseChartTool[]) {
  const tools: Record<string, any> = {};
  
  chartTools.forEach(chartTool => {
    const chartType = chartTool.getChartType();
    const toolName = `${chartType}ChartTool`;
    
    tools[toolName] = createChartTool(chartTool, {
      id: `generate-${chartType}`,
      description: `Generate ${chartType} chart configuration with customizable options`,
    });
  });
  
  return tools;
}

/**
 * 图表工具注册表
 */
export class ChartToolRegistry {
  private static instance: ChartToolRegistry;
  private tools: Map<string, BaseChartTool> = new Map();

  private constructor() {}

  public static getInstance(): ChartToolRegistry {
    if (!ChartToolRegistry.instance) {
      ChartToolRegistry.instance = new ChartToolRegistry();
    }
    return ChartToolRegistry.instance;
  }

  /**
   * 注册图表工具
   */
  public register(chartTool: BaseChartTool): void {
    const chartType = chartTool.getChartType();
    this.tools.set(chartType, chartTool);
  }

  /**
   * 获取图表工具
   */
  public get(chartType: string): BaseChartTool | undefined {
    return this.tools.get(chartType);
  }

  /**
   * 获取所有已注册的图表类型
   */
  public getRegisteredChartTypes(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 检查图表类型是否已注册
   */
  public isRegistered(chartType: string): boolean {
    return this.tools.has(chartType);
  }

  /**
   * 获取所有已注册的图表工具
   */
  public getAllTools(): BaseChartTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 创建所有已注册工具的 Mastra tools
   */
  public createAllMastraTools() {
    return createChartTools(this.getAllTools());
  }

  /**
   * 清除所有注册的工具（主要用于测试）
   */
  public clear(): void {
    this.tools.clear();
  }
}

// 导出单例实例
export const chartToolRegistry = ChartToolRegistry.getInstance(); 