import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
  BaseChartInputSchema,
} from "../interfaces/chart-tool.interface";
import {
  generateDefaultTitle,
  generateDefaultBackground,
  generateDefaultLegend,
  getThemeColors,
  createChartOutput,
  getColors,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
  generateDefaultAnimation,
} from "../utils/chart-helpers";

// 百分比堆叠条形图特定输入接口
export interface PercentStackedBarChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  showLabels?: boolean;
  colors?: string[];
  barWidth?: number;
  showDataLabels?: boolean;
}

// 百分比堆叠条形图特定输出接口
export interface PercentStackedBarChartOutput extends BaseChartOutput {
  props: {
    type: "percent-stacked-bar";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      yAxisIndex?: number;
      xAxisIndex?: number;
      type: string;
    }>;
    fill: any;
    display: {
      bar: {
        border: any;
        widthPercent: number;
      };
    };
    legend: any;
    label: any;
    axis: any;
    numberFormat: any;
    animation: any;
    tooltip: boolean;
    padding: any;
  };
}

// Zod验证schema
export const PercentStackedBarChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  barWidth: z.number().min(0.1).max(1).optional().default(0.7),
  showDataLabels: z.boolean().optional().default(true),
});

export class PercentStackedBarChartGenerator extends BaseChartTool {
  constructor() {
    super("percent-stacked-bar");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: PercentStackedBarChartInput
  ): Promise<PercentStackedBarChartOutput> {
    // 验证输入
    const validatedInput = PercentStackedBarChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "percent-stacked-bar",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // 获取默认配置
    const seriesCount = dataCols - 1; // 减去分类列
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      seriesCount
    );
    const colors =
      getColors(validatedInput.colors, seriesCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射（条形图：Y轴分类，X轴数值）
    const map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      yAxisIndex?: number;
      xAxisIndex?: number;
      type: string;
    }> = [
      {
        name: "Y轴对象",
        index: 0,
        isLegend: false,
        function: "objCol",
        configurable: true,
        yAxisIndex: 0,
        type: "",
      },
    ];

    // 添加数值列映射
    for (let i = 1; i < dataCols; i++) {
      map.push({
        name: `数值列${i}`,
        index: i,
        isLegend: false,
        function: "vCol",
        configurable: true,
        xAxisIndex: 0,
        type: "bar",
      });
    }

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, seriesCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
        border: {
          type: "solid" as const,
          color: null,
          width: 0,
        },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 0,
          color: { color: color, opacity: 0.5 },
          radius: 0,
        },
        texture: {
          url: "",
        },
      })),
    };

    // 构建显示配置
    const display = {
      bar: {
        border: {
          type: "solid" as const,
          color: null,
          width: 0,
          radius: [0, 0, 0, 0],
        },
        widthPercent: validatedInput.barWidth || 0.7,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      overlap: false,
      barLabel: {
        show: validatedInput.showDataLabels || true,
        positionChoice: "center" as const,
        fontFamily: "Misans 中等",
        fontSize: 14.5,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
    };

    // 构建坐标轴配置（条形图：Y轴分类，X轴数值）
    const axis = {
      show: true,
      xAxis: [
        {
          line: {
            show: true,
            width: 1,
            color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          },
          label: {
            show: true,
            direction: "auto" as const,
            fontFamily: "Misans 中等",
            fontSize: 15.25,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dashed" as const,
          },
          position: "bottom" as const,
          type: "value" as const,
          range: [],
          stepOfLabel: "auto" as const,
        },
      ],
      yAxis: [
        {
          line: {
            show: true,
            width: 1,
            color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          },
          label: {
            show: true,
            fontFamily: "Misans 常规",
            fontSize: 15.25,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dashed" as const,
          },
          position: "left" as const,
          type: "category" as const,
        },
      ],
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("percent-stacked-bar");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    // 生成图表配置
    const result = createChartOutput("percent-stacked-bar", mergedInput, {
      type: "percent-stacked-bar",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light"
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display,
      legend: generateDefaultLegend(true, mergedInput.theme || "light"),
      label,
      axis,
      numberFormat,
      animation,
      tooltip: false,
      padding,
    });

    // 修正管道类型为key_value（百分比堆叠图表）
    result.pipe = "key_value";

    return result as PercentStackedBarChartOutput;
  }
}
