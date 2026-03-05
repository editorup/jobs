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

// 圆环进度图特定输入接口
export interface DonutProgressChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // Key-value对格式 [名称, 进度值]
  innerRadiusRatio?: number;
  gapPercentage?: number;
  startAngle?: number;
  rotateDirection?: "clockwise" | "counterclockwise";
  customColor?: string;
  showLabels?: boolean;
}

// 圆环进度图特定输出接口
export interface DonutProgressChartOutput extends BaseChartOutput {
  props: {
    type: "donut-progress";
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
      pie: {
        innerRadiusRatio: number;
        gapPercentage: number;
        rotateDirection: "clockwise" | "counterclockwise";
        startAngle: number;
        backgroundColor: string | null;
        border: {
          radius: number;
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
export const DonutProgressChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("圆环进度图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  innerRadiusRatio: z.number().min(0).max(0.99).optional().default(0.75),
  gapPercentage: z.number().min(0).max(100).optional().default(0),
  startAngle: z
    .number()
    .refine((val) => [0, 90, 180, 270].includes(val), {
      message: "起始角度必须是 0, 90, 180, 或 270 度之一",
    })
    .optional()
    .default(0),
  rotateDirection: z
    .enum(["clockwise", "counterclockwise"])
    .optional()
    .default("clockwise"),
  customColor: z.string().optional(),
  showLabels: z.boolean().optional().default(true),
});

export class DonutProgressChartGenerator extends BaseChartTool {
  constructor() {
    super("donut-progress");
  }

  protected getElementType(): string {
    return "pie";
  }

  async generateConfig(
    input: DonutProgressChartInput
  ): Promise<DonutProgressChartOutput> {
    // 先进行基本的数据验证
    if (!input.data || input.data[0].length === 0) {
      throw new Error("数据格式无效：需要至少包含一个进度数据项");
    }

    // 验证输入
    const validatedInput = DonutProgressChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "donut-progress",
    };
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
        type: "pie",
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
            blur: 3,
            color: { color: "#000000", opacity: 0.2 },
            radius: 2,
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
      pie: {
        innerRadiusRatio: validatedInput.innerRadiusRatio || 0.75,
        gapPercentage: validatedInput.gapPercentage || 0,
        rotateDirection: validatedInput.rotateDirection || "clockwise",
        startAngle: validatedInput.startAngle || 0,
        backgroundColor: null,
        border: {
          radius: 0,
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
      textLabel: {
        show: validatedInput.showLabels || false,
        fontFamily: "Misans 常规",
        fontSize: Math.round(21 * Math.min(width / 700, height / 400)),
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      numberLabel: {
        show: validatedInput.showLabels || false,
        fontFamily: "Misans 特粗",
        fontSize: Math.round(46 * Math.min(width / 700, height / 400)),
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
    const animation = generateDefaultAnimation("donut-progress");

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
        type: "donut-progress",
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
    } as DonutProgressChartOutput;
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("donut-progress");
  // }
}
