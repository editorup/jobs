import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
  BaseChartInputSchema,
  BaseChartOutputSchema,
} from "../interfaces/chart-tool.interface";
// import { SchemaMerger } from "../utils/schema-merger";
import {
  generateDefaultTitle,
  generateDefaultBackground,
  generateDefaultLegend,
  getThemeColors,
  createChartOutput,
  getColors,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 堆叠柱状图特定输入接口
export interface StackedColumnChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 交叉表数据格式
  showLabels?: boolean;
  colors?: string[];
  stackSpacing?: number; // 堆叠间距
  columnWidth?: number; // 柱状图宽度百分比 (0-1)
  showDataLabels?: boolean; // 是否显示数据标签
}

// 堆叠柱状图特定输出接口
export interface StackedColumnChartOutput extends BaseChartOutput {
  props: {
    type: "stacked-column";
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
      column: {
        widthPercent: number;
        border: any;
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema，扩展基础schema
export const StackedColumnChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  stackSpacing: z.number().min(0).max(10).optional().default(0),
  columnWidth: z.number().min(0.1).max(1).optional().default(0.6),
  showDataLabels: z.boolean().optional().default(false),
});

export class StackedColumnChartGenerator extends BaseChartTool {
  constructor() {
    super("stacked-column");
  }

  protected getElementType(): string {
    return "column";
  }

  async generateConfig(
    input: StackedColumnChartInput
  ): Promise<StackedColumnChartOutput> {
    // 验证输入
    const validatedInput = StackedColumnChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "stacked-column",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // if (dataCols < 2) {
    //   throw new Error("堆叠柱状图需要至少2列数据（1列分类+至少1列数值）");
    // }

    // 获取默认配置
    const seriesCount = dataCols - 1; // 减去分类列
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      seriesCount
    );
    const colors =
      getColors(validatedInput.colors, seriesCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 使用正确的类型定义
    const map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      yAxisIndex?: number;
      xAxisIndex?: number;
      type: string;
    }> = [
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

    // 添加数值列映射
    for (let i = 1; i < dataCols; i++) {
      map.push({
        name: `数值列${i}`,
        index: i,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "bar",
      });
    }

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, seriesCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 5,
          color: { color: "#000000", opacity: 0.3 },
          radius: 5,
        },
        border: {
          type: "solid" as const,
          width: validatedInput.stackSpacing || 0,
          color: { color: "#ffffff", opacity: 1 },
        },
      })),
    };

    // 构建显示配置
    const display = {
      column: {
        widthPercent: validatedInput.columnWidth || 0.6,
        border: {
          radius: [2, 2, 2, 2],
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      columnLabel: {
        show: validatedInput.showDataLabels || false,
        positionChoice: "center" as const,
        fontFamily: "Misans 常规",
        fontSize: 16,
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
            type: "dashed" as const,
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
            direction: "auto" as const,
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

    // 生成图表配置 - 修正调用参数
    const result = createChartOutput("stacked-column", mergedInput, {
      type: "stacked-column",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light"
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display,
      legend: generateDefaultLegend(true, mergedInput.theme || "light"),
      label,
      axis,
    });

    // 修正管道类型为cross（用于堆叠图表）
    result.pipe = "cross";

    return result as StackedColumnChartOutput;
  }

  getInputSchema() {
    return StackedColumnChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("stacked-column");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load stacked-column schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
