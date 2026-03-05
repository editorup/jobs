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

// 符号条形图特定输入接口
export interface SymbolBarChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  colors?: string[];
  symbolUrl?: string;
  symbolType?: "single" | "multiple";
  scaleRatio?: number;
  widthPercent?: number;
}

// 符号条形图特定输出接口
export interface SymbolBarChartOutput extends BaseChartOutput {
  props: {
    type: "symbol-bar";
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
      symbol: {
        standard: string;
        iconValue: string;
        scaleRatio: number;
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
export const SymbolBarChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("符号条形图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(true),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  symbolUrl: z
    .string()
    .optional()
    .default(
      "https://cdn.core.editorup.com/resource/vector/icon/basic/square-fill.svg",
    ),
  symbolType: z.enum(["single", "multiple"]).optional().default("multiple"),
  scaleRatio: z.number().min(0.1).max(1).optional().default(0.82),
  widthPercent: z.number().min(0.1).max(1).optional().default(0.8),
});

export class SymbolBarChartGenerator extends BaseChartTool {
  constructor() {
    super("symbol-bar");
  }

  protected getElementType(): string {
    return "symbol";
  }

  async generateConfig(
    input: SymbolBarChartInput,
  ): Promise<SymbolBarChartOutput> {
    // 验证输入
    const validatedInput = SymbolBarChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "symbol-bar" };
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
        type: "symbol",
      },
    ];

    // 构建填充配置
    const fill = {
      symbolType: validatedInput.symbolType || "multiple",
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
          symbol: {
            url:
              validatedInput.symbolUrl ||
              "https://cdn.core.editorup.com/resource/vector/icon/basic/square-fill.svg",
          },
        },
      ],
    };

    // 构建显示配置
    const display = {
      symbol: {
        standard: "precise" as const,
        iconValue: "auto" as const,
        scaleRatio: validatedInput.scaleRatio || 0.82,
        widthPercent: validatedInput.widthPercent || 0.8,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || true,
      overlap: false,
      barLabel: {
        show: validatedInput.showLabels || true,
        positionChoice: "outside-right" as const,
        fontFamily: "Misans 中等",
        fontSize: 20.10627809303397,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
    };

    // 构建坐标轴配置（条形图：Y轴分类，X轴数值）
    const axis = {
      show: true,
      yAxis: [
        {
          line: {
            show: false,
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
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("symbol-bar");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: SymbolBarChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "symbol-bar",
        title: generateDefaultTitle(
          validatedInput.title,
          validatedInput.subtitle,
          mergedInput.theme || "light",
        ),
        background: generateDefaultBackground(mergedInput.theme || "light"),
        map,
        fill,
        display,
        legend: {
          ...generateDefaultLegend(true, mergedInput.theme || "light"),
          showSingleValue: true,
        },
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
