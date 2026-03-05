import { z } from "zod";

/**
 * 图表配置输入参数的基础接口
 */
export interface BaseChartInput {
  chartType: string;
  data?: (string | number)[][][];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  colors?: string[];
}

/**
 * 图表配置输出的基础接口
 */
export interface BaseChartOutput {
  data: (string | number)[][][];
  pipe: string;
  props: {
    type: string;
    title?: any;
    background?: any;
    map?: any[];
    fill?: any;
    display?: any;
    legend?: any;
    label?: any;
    numberFormat?: any;
    animation?: any;
    tooltip?: boolean;
    padding?: any;
    [key: string]: any;
  };
}

/**
 * 图表工具执行上下文
 */
export interface ChartToolContext {
  chartType: string;
  inputData: BaseChartInput;
  mergedSchema?: any;
}

/**
 * 图表工具配置选项
 */
export interface ChartToolOptions {
  id: string;
  description: string;
  chartType: string;
  inputSchema: z.ZodType<any>;
  outputSchema: z.ZodType<any>;
}

/**
 * 基础 Zod schema 定义
 */
export const BaseChartInputSchema = z.object({
  chartType: z.string().describe("图表类型"),
  data: z
    .array(z.array(z.array(z.union([z.string(), z.number()]))))
    .optional()
    .describe("图表数据数组"),
  title: z.string().optional().describe("图表主标题"),
  subtitle: z.string().optional().describe("图表副标题"),
  width: z.number().optional().describe("图表宽度"),
  height: z.number().optional().describe("图表高度"),
  theme: z.enum(["light", "dark"]).optional().describe("图表主题"),
  colors: z.array(z.string()).optional(),
});

export const BaseChartOutputSchema = z.object({
  data: z
    .array(z.array(z.array(z.union([z.string(), z.number()]))))
    .describe("图表数据"),
  pipe: z.string().describe("数据处理方式"),
  props: z
    .object({
      type: z.string().describe("图表类型"),
      title: z.any().optional().describe("标题配置"),
      background: z.any().optional().describe("背景配置"),
      map: z.array(z.any()).optional().describe("数据映射配置"),
      fill: z.any().optional().describe("填充配置"),
      display: z.any().optional().describe("显示配置"),
      legend: z.any().optional().describe("图例配置"),
      label: z.any().optional().describe("标签配置"),
      numberFormat: z.any().optional().describe("数字格式配置"),
      animation: z.any().optional().describe("动画配置"),
      tooltip: z.boolean().optional().describe("工具提示"),
      padding: z.any().optional().describe("内边距配置"),
    })
    .describe("图表属性配置"),
});

export type ChartType =
  | "grouped-column" //分组柱状图
  | "grouped-bar" //分组条形图
  | "stacked-bar" //堆叠条形图
  | "stacked-column" //堆叠柱状图
  | "basic-line" //折线图
  | "cascaded-area" //级联面积图
  | "stacked-area" //堆叠面积图
  | "river-area" //河流图
  | "mixed-line-grouped-column" // 折线+分组柱状图
  | "mixed-line-stacked-column" // 折线+堆叠柱状图
  | "difference-arrow-column" //差值箭头柱状图
  | "difference-arrow-bar" //差值箭头条形图
  | "basic-pie" //饼图
  | "basic-column" //柱状图
  | "rose-pie" //玫瑰图
  | "descartes-heatmap" //笛卡尔热力图
  | "check-in-bubble" //打卡气泡图
  | "basic-radar" //雷达图
  | "single-layer-treemap" //单层树图
  | "sankey" //桑基图
  | "jade-jue" // 玉玦图
  | "donut-progress" // 环形进度图
  | "funnel" // 漏斗图
  | "bar-progress" // 条形进度图
  | "basic-bar" //基础条形图
  | "compose-waterfall" //组成瀑布图
  | "butterfly" //蝴蝶图
  | "word-cloud" //词云图
  | "voronoi" //维诺图`
  | "symbol-column" //符号柱状图
  | "symbol-bar" //符号条形图
  | "symbol-pie" //符号饼图
  | "liquid" //水波图
  | "percent-bar" //百分比条形图
  | "percent-column" //百分比柱状图
  | "percent-stacked-bar" //百分比堆叠条形图
  | "percent-stacked-column" //百分比堆叠柱状图
  | "dynamic-bar" //动态条形图
  | 'dynamic-ranking' //动态排名图
  | 'chord' //弦图
/**
 * 图表工具的抽象基类
 */
export abstract class BaseChartTool {
  protected chartType: string;
  protected defaultValues: Partial<BaseChartInput>;

  constructor(chartType: string, defaultValues: Partial<BaseChartInput> = {}) {
    this.chartType = chartType;
    this.defaultValues = {
      theme: "light",
      ...defaultValues,
    };
  }

  /**
   * 获取图表类型
   */
  public getChartType(): string {
    return this.chartType;
  }

  /**
   * 合并默认值和用户输入
   */
  protected mergeWithDefaults(input: BaseChartInput): BaseChartInput {
    return {
      ...this.defaultValues,
      ...input,
      chartType: this.chartType,
    };
  }

  /**
   * 验证输入数据
   */
  protected validateInput(input: BaseChartInput): void {
    if (!input.chartType || input.chartType !== this.chartType) {
      throw new Error(
        `Invalid chart type. Expected: ${this.chartType}, got: ${input.chartType}`
      );
    }
  }

  /**
   * 创建默认的数据映射
   */
  protected createDefaultDataMapping(data: any[][]): any[] {
    if (!data || data.length === 0) {
      throw new Error("Data is required for chart generation");
    }

    // 基础映射：第一列为分类，第二列为数值
    return [
      {
        name: "分类",
        index: 0,
        isLegend: true,
        function: "objCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
      {
        name: "数值",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: this.getElementType(),
      },
    ];
  }

  /**
   * 获取图表元素类型（子类需要实现）
   */
  protected abstract getElementType(): string;

  /**
   * 生成图表配置（子类需要实现）
   */
  public abstract generateConfig(
    input: BaseChartInput
  ): Promise<BaseChartOutput>;

  /**
   * 获取输入 schema（子类可以重写）
   */
  public getInputSchema(): z.ZodType<BaseChartInput> {
    return BaseChartInputSchema;
  }

  /**
   * 获取输出 schema（子类可以重写）
   */
  public getOutputSchema(): z.ZodType<BaseChartOutput> {
    return BaseChartOutputSchema;
  }
}
