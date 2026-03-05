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

// 复合瀑布图特定输入接口
export interface ComposeWaterfallChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 两列数据格式: [阶段/分类, 数值]
  colors?: string[];
  waterfallType?: "standard" | "cumulative"; // 瀑布图类型
  showConnectors?: boolean; // 是否显示连接线
  connectorColor?: string;
  connectorWidth?: number;
  barWidth?: number;
  showLabels?: boolean;
  labelPosition?: "top" | "inside" | "bottom";
}

// 复合瀑布图特定输出接口
export interface ComposeWaterfallChartOutput extends BaseChartOutput {
  props: {
    type: "compose-waterfall";
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
        width: number;
        showConnectors: boolean;
        connectorStyle: {
          width: number;
          color: any;
          type: string;
        };
        labelPosition: string;
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema，扩展基础schema
export const ComposeWaterfallChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  waterfallType: z
    .enum(["standard", "cumulative"])
    .optional()
    .default("standard"),
  showConnectors: z.boolean().optional().default(true),
  connectorColor: z.string().optional().default("#cccccc"),
  connectorWidth: z.number().positive().optional().default(1),
  barWidth: z.number().min(0.1).max(1).optional().default(0.6),
  showLabels: z.boolean().optional().default(false),
  labelPosition: z.enum(["top", "inside", "bottom"]).optional().default("top"),
});

export class ComposeWaterfallChartGenerator extends BaseChartTool {
  constructor() {
    super("compose-waterfall");
  }

  protected getElementType(): string {
    return "bar"; // 瀑布图使用bar类型
  }

  async generateConfig(
    input: ComposeWaterfallChartInput
  ): Promise<ComposeWaterfallChartOutput> {
    // 验证输入
    const validatedInput = ComposeWaterfallChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "compose-waterfall",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0][0].length;
    const dataCols = validatedInput.data[0]?.length || 0;

    // if (dataCols !== 2) {
    //   throw new Error("复合瀑布图需要恰好2列数据（阶段/分类、数值）");
    // }

    // 获取数据项数量用于颜色分配
    const itemCount = dataRows - 1; // 减去header行

    // 获取默认配置
    const themeColors = getThemeColors(mergedInput.theme || "light", itemCount);

    // 瀑布图通常使用特定的颜色方案：增长（绿色）、减少（红色）、总计（蓝色）
    const defaultWaterfallColors = ["#52c41a", "#ff4d4f", "#1890ff"]; // 绿、红、蓝
    const colors =
      getColors(validatedInput.colors, itemCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 瀑布图的特定映射
    const map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      xAxisIndex?: number;
      yAxisIndex?: number;
      type: string;
    }> = [
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
      controlType: "multiple" as const,
      props: colors.slice(0, itemCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
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
          width: 0,
          color: null,
        },
      })),
    };

    // 构建显示配置
    const display = {
      bar: {
        order: "whole-part",
        border: {
          type: "solid",
          color: null,
          width: 0,
          radius: [4, 4, 4, 4],
        },
        widthPercent: 0.6,
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      barLabel: {
        show: false,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
        fontSize: 18,
        fontFamily: "Misans 中等",
        positionChoice: "outside",
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
            type: "dashed" as const,
          },
          position: "left" as const,
          type: "value" as const,
        },
      ],
    };

    // 生成图表配置
    const result = createChartOutput("compose-waterfall", mergedInput, {
      map,
      fill,
      display,
      label,
      axis,
    });

    return result as ComposeWaterfallChartOutput;
  }

  getInputSchema() {
    return ComposeWaterfallChartInputSchema;
  }

  getOutputSchema() {
    return z.object({
      data: z.array(z.any()),
      pipe: z.string(),
      props: z.object({
        type: z.literal("compose-waterfall"),
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
  //   return await merger.mergeSchemas("compose-waterfall.schema.json");
  // }
}
