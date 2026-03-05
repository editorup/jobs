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

// 符号柱状图特定输入接口
export interface SymbolColumnChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  colors?: string[];
  symbolUrl?: string; // 符号图标URL
  symbolType?: "single" | "multiple"; // 符号类型
  scaleRatio?: number; // 缩放比例
  widthPercent?: number; // 宽度百分比
}

// 符号柱状图特定输出接口
export interface SymbolColumnChartOutput extends BaseChartOutput {
  props: {
    type: "symbol-column";
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
export const SymbolColumnChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("符号柱状图"),
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
  symbolType: z.enum(["single", "multiple"]).optional().default("single"),
  scaleRatio: z.number().min(0.1).max(1).optional().default(0.76),
  widthPercent: z.number().min(0.1).max(1).optional().default(0.9),
});

export class SymbolColumnChartGenerator extends BaseChartTool {
  constructor() {
    super("symbol-column");
  }

  protected getElementType(): string {
    return "symbol";
  }

  async generateConfig(
    input: SymbolColumnChartInput,
  ): Promise<SymbolColumnChartOutput> {
    // 验证输入
    const validatedInput = SymbolColumnChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "symbol-column",
    };
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

    // 构建数据映射
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
        type: "symbol",
      },
    ];

    // 构建填充配置
    const fill = {
      symbolType: validatedInput.symbolType || "single",
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
        scaleRatio: validatedInput.scaleRatio || 0.76,
        widthPercent: validatedInput.widthPercent || 0.9,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || true,
      overlap: false,
      barLabel: {
        show: validatedInput.showLabels || true,
        positionChoice: "outside-top" as const,
        fontFamily: "Misans 中等",
        fontSize: 18.85627809303397,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
    };

    // 构建坐标轴配置
    const axis = {
      show: true,
      xAxis: [
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
            fontSize: 16.76113608269687,
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
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("symbol-column");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: SymbolColumnChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "symbol-column",
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
