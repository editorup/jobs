import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
} from "../interfaces/chart-tool.interface";
import {
  generateDefaultTitle,
  generateDefaultBackground,
  generateDefaultLegend,
  getThemeColors,
  getColors,
  generateDefaultAnimation,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 百分比条形图特定输入接口
export interface PercentBarChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  colors?: string[];
  barWidth?: number;
}

// 百分比条形图特定输出接口
export interface PercentBarChartOutput extends BaseChartOutput {
  props: {
    type: "percent-bar";
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
        backgroundColor: any;
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
export const PercentBarChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("百分比条形图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(true),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  barWidth: z.number().min(0.1).max(1).optional().default(0.6),
});

export class PercentBarChartGenerator extends BaseChartTool {
  constructor() {
    super("percent-bar");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: PercentBarChartInput,
  ): Promise<PercentBarChartOutput> {
    // 验证输入
    const validatedInput = PercentBarChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "percent-bar" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取默认配置
    const dataLength = validatedInput.data[0]?.length - 1 || 5;
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      dataLength,
    );
    const colors =
      getColors(validatedInput.colors, dataLength) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射（条形图：Y轴分类，X轴数值）
    const map = [
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

    // 构建填充配置
    const fill = {
      controlType: "single" as const,
      props: [
        {
          color: { color: colors[0], opacity: 1 },
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
            color: { color: "#5956F4", opacity: 0.5 },
            radius: 0,
          },
          texture: {
            url: "",
          },
        },
      ],
    };

    // 构建显示配置
    const display = {
      bar: {
        border: {
          type: "solid" as const,
          color: null,
          width: 0,
          radius: [4, 4, 4, 4],
        },
        widthPercent: validatedInput.barWidth || 0.6,
        backgroundColor: null,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      overlap: false,
      barLabel: {
        show: validatedInput.showLabels || true,
        positionChoice: "right" as const,
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
            fontFamily: "Misans 常规",
            fontSize: 15.25,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dotted" as const,
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
            show: false,
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
    const animation = generateDefaultAnimation("percent-bar");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: PercentBarChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "percent-bar",
        title: generateDefaultTitle(
          validatedInput.title,
          validatedInput.subtitle,
          mergedInput.theme || "light",
        ),
        background: generateDefaultBackground(mergedInput.theme || "light"),
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
      },
    };

    return result;
  }
}
