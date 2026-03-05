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
  processChartData,
  generateDefaultAnimation,
  getLabelColorByTheme,
} from "../utils/chart-helpers";

// 条形进度图特定输入接口
export interface BarProgressChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // Key-value对格式 [名称, 进度值]
  widthPercent?: number;
  backgroundColor?: string | null;
  customColor?: string;
  showLabels?: boolean;
  borderRadius?: number[];
}

// 条形进度图特定输出接口
export interface BarProgressChartOutput extends BaseChartOutput {
  props: {
    type: "bar-progress";
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
      bar: {
        widthPercent: number;
        backgroundColor: string | null;
        border: {
          radius: number[];
          type: string;
          width: number;
          color: any;
        };
      };
    };
    legend: any;
    label: any;
    numberFormat: any;
    animation: any;
    tooltip: boolean;
    padding: any;
  };
}

// Zod验证schema
export const BarProgressChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("条形进度图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  widthPercent: z.number().min(0.01).max(1).optional().default(1),
  backgroundColor: z.string().nullable().optional().default(null),
  customColor: z.string().optional(),
  showLabels: z.boolean().optional().default(true),
  borderRadius: z.array(z.number()).length(4).optional().default([8, 8, 8, 8]),
});

export class BarProgressChartGenerator extends BaseChartTool {
  constructor() {
    super("bar-progress");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: BarProgressChartInput
  ): Promise<BarProgressChartOutput> {
    // 先进行基本的数据验证
    if (!input.data || input.data[0].length === 0) {
      throw new Error("数据格式无效：需要至少包含一个进度数据项");
    }

    // 验证输入
    const validatedInput = BarProgressChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "bar-progress" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 使用导入的默认配置函数
    const title = generateDefaultTitle(
      mergedInput.title,
      mergedInput.subtitle,
      mergedInput.theme || "light"
    );
    const background = generateDefaultBackground(mergedInput.theme || "light");
    const legend = generateDefaultLegend(false, mergedInput.theme || "light");

    // 获取主题颜色
    const themeColors = getThemeColors(mergedInput.theme || "light", 1);
    const color = validatedInput.colors?.[0] || themeColors[0].color;

    // 构建数据映射 - Progress charts 使用固定的两列映射
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

    // 构建填充配置 - Progress charts 只支持单色
    const fill = {
      controlType: "single",
      props: [
        {
          color: { color: color, opacity: 1 },
          texture: { url: "" },
          shadow: {
            show: false,
            type: "outer" as const,
            angle: 45,
            blur: 2,
            color: { color: "#000000", opacity: 0.1 },
            radius: 1,
          },
          border: {
            type: "solid",
            width: 0,
            color: null,
          },
        },
      ],
    };

    // 构建显示配置
    const display = {
      bar: {
        widthPercent: validatedInput.widthPercent || 1,
        backgroundColor: validatedInput.backgroundColor || null,
        border: {
          radius: validatedInput.borderRadius || [8, 8, 8, 8],
          type: "solid",
          width: 0,
          color: null,
        },
      },
    };

    const width = mergedInput.width ?? 700;
    const height = mergedInput.height ?? 400;

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      numberLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "right" as const,
        fontFamily: "Misans 常规",
        fontSize: Math.round(28 * Math.min(width / 700, height / 400)),
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      highlight: false,
      overlap: false,
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("bar-progress");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    // // 处理数据 - 将 key-value 对转换为标准格式
    // const formattedData = [["名称", "进度"], ...validatedInput.data];
    // const processedData = processChartData(formattedData);

    return {
      data: validatedInput.data,
      pipe: "key_value", // Progress charts 使用 key_value 管道
      props: {
        type: "bar-progress",
        title,
        background,
        legend,
        map,
        fill,
        display,
        label,
        numberFormat,
        animation,
        tooltip: true,
        padding,
      },
    } as BarProgressChartOutput;
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("bar-progress");
  // }
}
