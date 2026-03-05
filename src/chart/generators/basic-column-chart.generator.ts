import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
} from "../interfaces/chart-tool.interface";
// import { SchemaMerger } from "../utils/schema-merger";
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

// 柱状图特定输入接口
export interface BasicColumnChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 二维数组数据 [标题, 数值]
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  colors?: string[];
  barWidth?: number; // 柱体宽度百分比 (0-1)
}

// 柱状图特定输出接口
export interface BasicColumnChartOutput extends BaseChartOutput {
  props: {
    type: "basic-column";
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
        widthPercent: number;
        border: any;
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
export const BasicColumnChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("基础柱状图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  barWidth: z.number().min(0.1).max(1).optional().default(0.6),
});

export class BasicColumnChartGenerator extends BaseChartTool {
  constructor() {
    super("basic-column");
  }

  protected getElementType(): string {
    return "bar"; // 柱状图也是用bar元素
  }

  async generateConfig(
    input: BasicColumnChartInput,
  ): Promise<BasicColumnChartOutput> {
    // 验证输入
    const validatedInput = BasicColumnChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "basic-column" };
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

    // 构建数据映射（与条形图相反：X轴分类，Y轴数值）
    const map = [
      {
        name: "名称",
        index: 0,
        isLegend: true,
        function: "objCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
      {
        name: "值",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "bar",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "single" as const,
      props: [
        {
          color: { color: colors[0], opacity: 1 },
          texture: { url: "" },
          shadow: {
            show: false,
            type: "outer" as const,
            angle: 45,
            blur: 0,
            color: { color: "#000000", opacity: 0.5 },
            radius: 0,
          },
          border: {
            type: "solid" as const,
            width: 0,
            color: null,
          },
        },
      ],
    };

    // 构建显示配置
    const display = {
      bar: {
        widthPercent: validatedInput.barWidth || 0.6,
        border: {
          radius: [4, 4, 0, 0],
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      barLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "top" as const, // 柱状图标签在顶部
        fontFamily: "Misans 常规",
        fontSize: 12,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    // 构建坐标轴配置（与条形图相反）
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
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          position: "bottom" as const,
          type: "category" as const,
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
            fontSize: 12,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
            suffix: "",
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dotted" as const,
          },
          position: "left" as const,
          type: "value" as const,
        },
      ],
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("basic-column");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: BasicColumnChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "basic-column",
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
        tooltip: true,
        padding,
      },
    };

    return result;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   return schemaMerger.getMergedSchema("basic-column");
  // }
}
