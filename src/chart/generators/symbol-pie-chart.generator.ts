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
} from "../utils/chart-helpers";

// 符号饼图特定输入接口
export interface SymbolPieChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  title?: string;
  subtitle?: string;
  colors?: string[];
  symbolUrl?: string;
  symbolType?: "single" | "multiple";
  standard?: "default" | "precise";
  countOfRow?: number;
  iconPerRow?: number;
  scaleRatio?: number;
}

// 符号饼图特定输出接口
export interface SymbolPieChartOutput extends BaseChartOutput {
  props: {
    type: "symbol-pie";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      xAxisIndex?: number;
      yAxisIndex?: number;
      type: string;
    }>;
    fill: any;
    display: {
      symbol: {
        standard: string;
        countOfRow: number;
        iconPerRow: number;
        scaleRatio: number;
      };
    };
    legend: any;
    animation: any;
    tooltip: boolean;
    padding: any;
  };
}

// Zod验证schema
export const SymbolPieChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("符号饼图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  symbolUrl: z
    .string()
    .optional()
    .default(
      "https://cdn.core.editorup.com/resource/vector/icon/basic/hexagon-fill.svg",
    ),
  symbolType: z.enum(["single", "multiple"]).optional().default("single"),
  standard: z.enum(["default", "precise"]).optional().default("default"),
  countOfRow: z.number().min(1).optional().default(4),
  iconPerRow: z.number().min(1).optional().default(10),
  scaleRatio: z.number().min(0.1).max(1).optional().default(0.8),
});

export class SymbolPieChartGenerator extends BaseChartTool {
  constructor() {
    super("symbol-pie");
  }

  protected getElementType(): string {
    return "symbol";
  }

  async generateConfig(
    input: SymbolPieChartInput,
  ): Promise<SymbolPieChartOutput> {
    // 验证输入
    const validatedInput = SymbolPieChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "symbol-pie" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    if (!validatedInput.data || validatedInput.data[0].length === 0) {
      throw new Error("符号饼图数据不能为空");
    }

    // 获取默认配置
    const dataLength = validatedInput.data[0].length - 1;
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

    // 构建填充配置 - 符号饼图使用多色
    const fill = {
      symbolType: validatedInput.symbolType || "single",
      controlType: "multiple" as const,
      props: colors.map((color: string) => ({
        color: { color: color, opacity: 1 },
        texture: { url: "" },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 0,
          blur: 0,
          color: { color: "#0075FF", opacity: 1 },
          radius: 0,
        },
        symbol: {
          url:
            validatedInput.symbolUrl ||
            "https://cdn.core.editorup.com/resource/vector/icon/basic/hexagon-fill.svg",
        },
      })),
    };

    // 构建显示配置
    const display = {
      symbol: {
        standard: validatedInput.standard || "default",
        countOfRow: validatedInput.countOfRow || 4,
        iconPerRow: validatedInput.iconPerRow || 10,
        scaleRatio: validatedInput.scaleRatio || 0.8,
      },
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("symbol-pie");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: SymbolPieChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "symbol-pie",
        title: generateDefaultTitle(
          validatedInput.title,
          validatedInput.subtitle,
          mergedInput.theme || "light",
        ),
        background: generateDefaultBackground(mergedInput.theme || "light"),
        map,
        fill,
        display,
        legend: generateDefaultLegend(true, mergedInput.theme || "light"),
        animation,
        tooltip: false,
        padding,
      },
    };

    return result;
  }
}
