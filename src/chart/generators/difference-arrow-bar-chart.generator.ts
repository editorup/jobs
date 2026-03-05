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

// 差异箭头条形图特定输入接口
export interface DifferenceArrowBarChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 兼容表格格式数据
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  showArrowLabels?: boolean;
  colors?: string[];
  barHeight?: number; // 条形高度百分比 (0-1)
  arrowColors?: {
    growth?: string; // 增长箭头颜色
    decrease?: string; // 下降箭头颜色
  };
  chartType: "difference-arrow-bar";
}

// 差异箭头条形图特定输出接口
export interface DifferenceArrowBarChartOutput extends BaseChartOutput {
  props: {
    type: "difference-arrow-bar";
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
      arrow: {
        growthArrowColor: any;
        decreaseArrowColor: any;
        width: number;
        endLine: any;
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
export const DifferenceArrowBarChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("差异箭头条形图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(false),
  showArrowLabels: z.boolean().optional().default(true),
  colors: z.array(z.string()).optional(),
  barHeight: z.number().min(0.1).max(1).optional().default(0.6),
  arrowColors: z
    .object({
      growth: z.string().optional().default("#62D9AD"),
      decrease: z.string().optional().default("#E65A56"),
    })
    .optional()
    .default({}),
  chartType: z.literal("difference-arrow-bar"),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
});

export class DifferenceArrowBarChartGenerator extends BaseChartTool {
  constructor() {
    super("difference-arrow-bar");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: DifferenceArrowBarChartInput,
  ): Promise<DifferenceArrowBarChartOutput> {
    // 验证输入
    const validatedInput = DifferenceArrowBarChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "difference-arrow-bar",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取默认配置
    const themeColors = getThemeColors(mergedInput.theme || "light", 2);
    const colors = getColors(validatedInput.colors, 2) || [
      themeColors[0].color,
      themeColors[1].color,
    ];
    const arrowColors = {
      growth: validatedInput.arrowColors?.growth || "#62D9AD",
      decrease: validatedInput.arrowColors?.decrease || "#E65A56",
    };

    // 构建数据映射（条形图：Y轴分类，X轴数值）
    const map = [
      {
        name: "Y轴对象",
        index: 0,
        isLegend: false,
        function: "objCol",
        configurable: true,
        yAxisIndex: 0,
        type: "",
      },
      {
        name: "基数",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        xAxisIndex: 0,
        type: "bar",
      },
      {
        name: "对比数",
        index: 2,
        isLegend: false,
        function: "vCol",
        configurable: true,
        xAxisIndex: 0,
        type: "bar",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.map((color: string) => ({
        color: { color: color, opacity: 1 },
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
      })),
    };

    // 构建显示配置（包含箭头配置）
    const display = {
      bar: {
        widthPercent: validatedInput.barHeight || 0.6,
        border: {
          radius: [2, 2, 2, 2],
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
      arrow: {
        growthArrowColor: { color: arrowColors.growth, opacity: 1 },
        decreaseArrowColor: { color: arrowColors.decrease, opacity: 1 },
        width: 2,
        endLine: {
          type: "solid" as const,
          width: 2,
          color: { color: "#333333", opacity: 1 },
        },
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      barLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "right" as const,
        fontFamily: "Misans 常规",
        fontSize: 16,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      arrowLabel: {
        show: validatedInput.showArrowLabels || false,
        fontFamily: "Misans 常规",
        fontSize: 16,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      highlight: false,
      overlap: false,
    };

    // 构建坐标轴配置（条形图：X轴数值，Y轴分类）
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
            fontFamily: "Misans 常规",
            fontSize: 12,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
            direction: "auto",
            suffix: "",
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          position: "bottom" as const,
          type: "value" as const,
          max: "auto" as const,
          min: "auto" as const,
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
            direction: "auto" as const,
            fontFamily: "Misans 常规",
            fontSize: 15,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dotted" as const,
          },
          position: "left" as const,
          type: "category" as const,
        },
      ],
    };

    return {
      data: validatedInput.data,
      pipe: "key_value",
      props: {
        type: "difference-arrow-bar",
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
        label,
        axis,
        numberFormat: {
          separatorType: "1000.00" as const,
          decimalPlaces: null,
        },
        animation: generateDefaultAnimation("difference-arrow-bar"),
        tooltip: true,
        padding: {
          top: 20,
          bottom: 23,
          left: 24,
          right: 24,
        },
      },
    };
  }

  getInputSchema(): z.ZodType<DifferenceArrowBarChartInput> {
    return DifferenceArrowBarChartInputSchema;
  }

  getOutputSchema(): z.ZodType<DifferenceArrowBarChartOutput> {
    return z.any(); // 可以根据需要进一步细化
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   return schemaMerger.getMergedSchema("difference-arrow-bar");
  // }
}
