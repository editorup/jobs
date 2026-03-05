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
} from "../utils/chart-helpers";

// 动态条形图特定输入接口
export interface DynamicBarChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  showLabels?: boolean;
  colors?: string[];
  barWidth?: number;
  showDataLabels?: boolean;
}

// 动态条形图特定输出接口
export interface DynamicBarChartOutput extends BaseChartOutput {
  props: {
    type: "dynamic-bar";
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
        barOrderBy: string;
        countOfBars: number;
        widthPercent: number;
      };
      symbol: {
        show: boolean;
        border: any;
        padding: number;
        maskChoice: string;
        widthPercent: number;
        positionChoice: string;
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
export const DynamicBarChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  barWidth: z.number().min(0.1).max(1).optional().default(0.6),
  showDataLabels: z.boolean().optional().default(false),
});

export class DynamicBarChartGenerator extends BaseChartTool {
  constructor() {
    super("dynamic-bar");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: DynamicBarChartInput,
  ): Promise<DynamicBarChartOutput> {
    // 验证输入
    const validatedInput = DynamicBarChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "dynamic-bar",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // 获取默认配置
    const seriesCount = dataCols - 1; // 减去分类列
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      seriesCount,
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

    // 构建填充配置 - dynamic-bar使用symbol
    const fill = {
      symbolType: "multiple" as const,
      controlType: "multiple" as const,
      props: colors
        .slice(0, seriesCount)
        .map((color: string, index: number) => ({
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
          symbol: {
            url: `https://cdn.aitubiao.com/static/images/dynamic/flag${index + 1}.svg`,
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
        barOrderBy: "desc" as const,
        countOfBars: 10,
        widthPercent: validatedInput.barWidth || 0.88,
      },
      symbol: {
        show: false,
        border: {
          color: null,
          width: 0,
        },
        padding: 4,
        maskChoice: "rect" as const,
        widthPercent: 0.68,
        positionChoice: "inside-right" as const,
      },
    };

    // 构建标签配置
    const label = {
      show:
        validatedInput.showLabels !== undefined
          ? validatedInput.showLabels
          : true,
      overlap: false,
      highlight: false,
      textLabel: {
        show: false,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 14,
        fontFamily: "Misans 常规",
        positionChoice: "inside-right" as const,
        positionOptions: ["inside-left", "inside-right", "outside-right"],
      },
      timeLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 40,
        fontFamily: "Misans 中等",
      },
      valueLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
        fontSize: 20,
        fontFamily: "Misans 常规",
        valueIndex: "all" as const,
      },
      numberLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
        fontSize: 17.75,
        fontFamily: "Misans 中等",
      },
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
            fontFamily: "Misans 常规",
            fontSize: 15.25,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
            suffix: "",
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dashed" as const,
          },
          position: "top" as const,
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
            fontSize: 17.75,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          position: "left" as const,
          type: "category" as const,
        },
      ],
    };

    // 构建数字格式配置
    const numberFormat = {
      style: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = {
      loop: true,
      show: true,
      preview: true,
      duration: 1,
      endPause: 1,
      timeline: true,
      moveStyle: "vertical-sync-stretch" as const,
      xAxisTick: "auto" as const,
      startDelay: 0,
      transition: true,
      moveDuration: 1,
    };

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    // 生成图表配置
    const result = createChartOutput("dynamic-bar", mergedInput, {
      type: "dynamic-bar",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light",
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display,
      legend: generateDefaultLegend(false, mergedInput.theme || "light"),
      label,
      axis,
      numberFormat,
      animation,
      tooltip: false,
      padding,
    });

    // 动态条形图使用cross管道
    result.pipe = "cross";

    return result as DynamicBarChartOutput;
  }
}
