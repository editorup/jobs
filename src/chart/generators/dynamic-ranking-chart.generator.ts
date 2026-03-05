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

// 动态排名图特定输入接口
export interface DynamicRankingChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  showLabels?: boolean;
  colors?: string[];
  barWidth?: number;
  showDataLabels?: boolean;
  symbolUrl?: string;
}

// 动态排名图特定输出接口
export interface DynamicRankingChartOutput extends BaseChartOutput {
  props: {
    type: "dynamic-ranking";
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
export const DynamicRankingChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  barWidth: z.number().min(0.1).max(1).optional().default(0.6),
  showDataLabels: z.boolean().optional().default(false),
  symbolUrl: z.string().optional(),
});

export class DynamicRankingChartGenerator extends BaseChartTool {
  constructor() {
    super("dynamic-ranking");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: DynamicRankingChartInput,
  ): Promise<DynamicRankingChartOutput> {
    // 验证输入
    const validatedInput = DynamicRankingChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "dynamic-ranking",
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
        name: "名称",
        index: 0,
        isLegend: true,
        function: "objCol",
        configurable: true,
        yAxisIndex: 0,
        type: "",
      },
      {
        name: "值",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        xAxisIndex: 0,
        type: "bar",
      },
    ];

    // 构建填充配置 - 动态排名图使用symbol
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
            angle: index === 0 ? 45 : 0,
            blur: 0,
            color: { color: color, opacity: index === 0 ? 0.5 : 1 },
            radius: 0,
          },
          symbol: {
            url:
              validatedInput.symbolUrl ||
              `https://cdn.core.editorup.com/image/clzb5ewqk0003j5yc55w8zbuk/1762843729945.png?x-oss-process=image/interlace,1/resize,m_pad,w_96,h_96/quality,Q_60`,
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
        countOfBars: 6,
        widthPercent: validatedInput.barWidth || 0.7,
      },
      symbol: {
        show: false,
        border: {
          color: null,
          width: 1,
        },
        padding: 0,
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
      rankLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 24,
        fontFamily: "Misans 中等",
      },
      textLabel: {
        show: false,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 14,
        fontFamily: "Misans 常规",
        positionChoice: "inside-right" as const,
        positionOptions: ["inside-left", "inside-right", "outside-right"],
      },
      numberLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
        fontSize: 16,
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
            fontSize: 14,
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
            fontFamily: "Misans 中等",
            fontSize: 14,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dotted" as const,
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
    const animation = {
      loop: true,
      show: true,
      preview: true,
      duration: 1,
      endPause: 1,
      timeline: false,
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
    const result = createChartOutput("dynamic-ranking", mergedInput, {
      type: "dynamic-ranking",
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

    // 动态排名图使用key_value管道
    result.pipe = "key_value";

    return result as DynamicRankingChartOutput;
  }
}
