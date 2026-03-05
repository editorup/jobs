import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
  BaseChartInputSchema,
} from "../interfaces/chart-tool.interface";
// import { SchemaMerger } from "../utils/schema-merger";
import {
  getThemeColors,
  createChartOutput,
  getColors,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 签到气泡图特定输入接口
export interface CheckInBubbleChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 三列数据格式: [X轴分类, Y轴分类, 气泡大小值]
  colors?: string[];
  bubbleSize?: {
    min?: number;
    max?: number;
  };
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  showLabels?: boolean;
}

// 签到气泡图特定输出接口
export interface CheckInBubbleChartOutput extends BaseChartOutput {
  props: {
    type: "check-in-bubble";
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
        sizeMultiplier: number;
        minSize: number;
        maxSize: number;
        opacity: number;
        border: {
          type: string;
          width: number;
          color: any;
        };
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema，扩展基础schema
export const CheckInBubbleChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  bubbleSize: z
    .object({
      min: z.number().positive().optional().default(5),
      max: z.number().positive().optional().default(50),
    })
    .optional(),
  opacity: z.number().min(0).max(1).optional().default(0.7),
  borderWidth: z.number().min(0).optional().default(1),
  borderColor: z.string().optional().default("#ffffff"),
  showLabels: z.boolean().optional().default(true),
});

export class CheckInBubbleChartGenerator extends BaseChartTool {
  constructor() {
    super("check-in-bubble");
  }

  protected getElementType(): string {
    return "bar"; // 气泡图在schema中使用bar类型
  }

  async generateConfig(
    input: CheckInBubbleChartInput
  ): Promise<CheckInBubbleChartOutput> {
    // 验证输入
    const validatedInput = CheckInBubbleChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "check-in-bubble",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // if (dataCols !== 3) {
    //   throw new Error(
    //     "签到气泡图需要恰好3列数据（X轴分类、Y轴分类、气泡大小值）"
    //   );
    // }

    // 获取数据项数量用于颜色分配
    const itemCount = dataCols - 1; // 减去header行

    // 获取默认配置
    const themeColors = getThemeColors(mergedInput.theme || "light", itemCount);
    const colors =
      getColors(validatedInput.colors, itemCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 气泡图的特定映射
    const map = [
      {
        name: "X轴对象",
        index: 0,
        isLegend: false,
        function: "objCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
    ];

    // 为每个数值系列添加映射
    for (let i = 1; i <= itemCount; i++) {
      map.push({
        name: "数值列",
        index: i,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "bubble",
      } as any);
    }

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, itemCount).map((color: string) => ({
        color: { color: color, opacity: validatedInput.opacity || 0.8 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 3,
          color: { color: "#000000", opacity: 0.2 },
          radius: 2,
        },
        border: {
          type: "solid" as const,
          width: 1,
          color: null,
        },
      })),
    };

    // 构建显示配置
    const bubbleConfig = validatedInput.bubbleSize || { min: 5, max: 50 };
    const display = {
      bubble: {
        size: [1, 50],
        shape: "circle",
        border: {
          type: "solid",
          color: null,
          width: 0,
        },
        standard: "area",
        reference: {
          show: false,
          text: "平均值",
          color: {
            color: "#ffffff",
            opacity: 0,
          },
          value: 5,
          border: {
            type: "solid",
            color: {
              color: "#000000",
              opacity: 1,
            },
            width: 1,
          },
        },
        fillOpacity: 0.7,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      numberLabel: {
        show: validatedInput.showLabels || false,
        fontFamily: "Misans 常规",
        fontSize: 14,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
      overlap: false,
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
            direction: "horizontal" as const,
            fontFamily: "Misans 常规",
            fontSize: 12,
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
            fontSize: 14,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
            suffix: "",
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          position: "left" as const,
          type: "category" as const,
        },
      ],
    };

    // 生成图表配置
    const result = createChartOutput("check-in-bubble", mergedInput, {
      map,
      fill,
      display,
      label,
      axis,
    });

    return result as CheckInBubbleChartOutput;
  }

  getInputSchema() {
    return CheckInBubbleChartInputSchema;
  }

  getOutputSchema() {
    return z.object({
      data: z.array(z.any()),
      pipe: z.string(),
      props: z.object({
        type: z.literal("check-in-bubble"),
        title: z.any(),
        background: z.any(),
        map: z.array(z.any()),
        fill: z.any(),
        display: z.any(),
        legend: z.any(),
        label: z.any(),
        axis: z.any(),
      }),
    });
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return await merger.mergeSchemas("check-in-bubble.schema.json");
  // }
}
