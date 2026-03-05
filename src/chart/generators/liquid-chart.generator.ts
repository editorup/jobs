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

// 水波图特定输入接口
export interface LiquidChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  title?: string;
  subtitle?: string;
  colors?: string[];
  symbolUrl?: string;
  iconPerRow?: number;
  showTextLabel?: boolean;
  showNumberLabel?: boolean;
  highContrast?: boolean;
}

// 水波图特定输出接口
export interface LiquidChartOutput extends BaseChartOutput {
  props: {
    type: "liquid";
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
        iconPerRow: number;
      };
    };
    legend: any;
    label: any;
    animation: any;
    tooltip: boolean;
    padding: any;
    numberFormat: any;
  };
}

// Zod验证schema
export const LiquidChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("水波图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  symbolUrl: z
    .string()
    .optional()
    .default(
      "https://cdn.core.editorup.com/resource/vector/icon/basic/circle-fill.svg",
    ),
  iconPerRow: z.number().min(1).optional().default(4),
  showTextLabel: z.boolean().optional().default(true),
  showNumberLabel: z.boolean().optional().default(true),
  highContrast: z.boolean().optional().default(true),
});

export class LiquidChartGenerator extends BaseChartTool {
  constructor() {
    super("liquid");
  }

  protected getElementType(): string {
    return "symbol";
  }

  async generateConfig(input: LiquidChartInput): Promise<LiquidChartOutput> {
    // 验证输入
    const validatedInput = LiquidChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "liquid" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    if (!validatedInput.data || validatedInput.data[0].length === 0) {
      throw new Error("水波图数据不能为空");
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

    // 构建填充配置 - 水波图使用多色
    const fill = {
      symbolType: "single" as const,
      controlType: "multiple" as const,
      props: colors.map((color: string) => ({
        color: { color: color, opacity: 1 },
        texture: { url: "" },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 0,
          blur: 0,
          color: { color: "#5956F4", opacity: 1 },
          radius: 0,
        },
        symbol: {
          url:
            validatedInput.symbolUrl ||
            "https://cdn.core.editorup.com/resource/vector/icon/basic/circle-fill.svg",
        },
      })),
    };

    // 构建显示配置
    const display = {
      symbol: {
        iconPerRow: validatedInput.iconPerRow || 4,
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      overlap: false,
      highlight: false,
      textLabel: {
        show: validatedInput.showTextLabel || true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 17,
        fontFamily: "Misans 常规",
        positionChoice: "outside-bottom" as const,
      },
      numberLabel: {
        show: validatedInput.showNumberLabel || true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 29.5,
        fontFamily: "Misans 中等",
        positionChoice: "inside-center" as const,
      },
      highContrast: validatedInput.highContrast || true,
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("liquid");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    const result: LiquidChartOutput = {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "liquid",
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
        animation,
        tooltip: false,
        padding,
        numberFormat,
      },
    };

    return result;
  }
}
