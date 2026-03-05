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
  getAxisLabelColorByTheme,
  getGridColorByTheme,
  getAxisLineColorByTheme,
} from "../utils/chart-helpers";

// 混合线条-堆叠柱状图特定输入接口
export interface MixedLineStackedColumnChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 多列数据，第一列为X轴，后续列为数值
  colors?: string[];
  columnIndices?: number[]; // 指定哪些列作为堆叠柱状图（默认前3列）
  lineIndices?: number[]; // 指定哪些列作为线条图（默认后2列）
  lineType?: "straight" | "curve"; // 线条类型
  lineWidth?: number; // 线条宽度
  columnWidthPercent?: number; // 柱宽百分比
  showEndPoints?: boolean; // 是否显示端点
  endPointRadius?: number; // 端点半径
  leftYAxisConfig?: {
    title?: string;
    unit?: string;
  };
  rightYAxisConfig?: {
    title?: string;
    unit?: string;
  };
}

// 混合线条-堆叠柱状图特定输出接口
export interface MixedLineStackedColumnChartOutput extends BaseChartOutput {
  props: {
    type: "mixed-line-stacked-column";
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
      line: {
        type: string;
        width: number;
        endPoint: any;
      };
      bar: {
        widthPercent: number;
        border: any;
      };
    };
    axis: any;
    legend: any;
    label: any;
  };
}

// Zod验证schema，扩展基础schema
export const MixedLineStackedColumnChartInputSchema =
  BaseChartInputSchema.extend({
    data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
    colors: z.array(z.string()).optional(),
    columnIndices: z.array(z.number()).optional(),
    lineIndices: z.array(z.number()).optional(),
    lineType: z.enum(["straight", "curve"]).optional().default("straight"),
    lineWidth: z.number().min(1).optional().default(2),
    columnWidthPercent: z.number().min(0.1).max(1).optional().default(0.5),
    showEndPoints: z.boolean().optional().default(true),
    endPointRadius: z.number().min(1).optional().default(4),
    leftYAxisConfig: z
      .object({
        title: z.string().optional(),
        unit: z.string().optional(),
      })
      .optional(),
    rightYAxisConfig: z
      .object({
        title: z.string().optional(),
        unit: z.string().optional(),
      })
      .optional(),
  });

export class MixedLineStackedColumnChartGenerator extends BaseChartTool {
  constructor() {
    super("mixed-line-stacked-column");
  }

  protected getElementType(): string {
    return "mixed"; // 混合图表元素类型
  }

  async generateConfig(
    input: MixedLineStackedColumnChartInput
  ): Promise<MixedLineStackedColumnChartOutput> {
    // 验证输入
    const validatedInput = MixedLineStackedColumnChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "mixed-line-stacked-column",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data.length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    if (dataCols < 4) {
      throw new Error(
        "混合线条-堆叠柱状图需要至少4列数据（X轴 + 至少3个数值列）"
      );
    }

    // 确定默认的列索引分配
    // const totalValueCols = dataCols - 1; // 减去X轴列
    // const defaultColumnCount = Math.ceil(totalValueCols * 0.6); // 60%作为柱状图
    // const defaultColumnIndices = Array.from(
    //   { length: defaultColumnCount },
    //   (_, i) => i + 1
    // );
    // const defaultLineIndices = Array.from(
    //   { length: totalValueCols - defaultColumnCount },
    //   (_, i) => i + 1 + defaultColumnCount
    // );

    // 确定默认的列索引分配 - 分组柱状图模式
    const totalValueCols = dataCols - 1; // 减去X轴列

    // 对于分组柱状图，默认策略：第1列数值作为线条，其余作为分组柱状图
    const defaultLineIndices = [1]; // 第一个数值列作为线条
    const defaultColumnIndices = Array.from(
      { length: totalValueCols - 1 },
      (_, i) => i + 2
    );

    const columnIndices = validatedInput.columnIndices || defaultColumnIndices;
    const lineIndices = validatedInput.lineIndices || defaultLineIndices;

    // 验证索引不重复且在有效范围内
    const allIndices = [...columnIndices, ...lineIndices];
    if (new Set(allIndices).size !== allIndices.length) {
      throw new Error("列索引不能重复");
    }
    if (allIndices.some((idx) => idx < 1 || idx >= dataCols)) {
      throw new Error("列索引超出数据范围");
    }

    // 获取总系列数量用于颜色分配
    const totalSeries = columnIndices.length + lineIndices.length;

    // 获取默认配置
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      totalSeries
    );
    const colors =
      getColors(validatedInput.colors, totalSeries) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 混合图表的特定映射
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
      // X轴对象列
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

    // 添加线条图列
    lineIndices.forEach((colIdx) => {
      map.push({
        name: "数值列",
        index: colIdx,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 1, // 右Y轴
        type: "line",
      });
    });

    // 添加柱状图列
    columnIndices.forEach((colIdx) => {
      map.push({
        name: "数值列",
        index: colIdx,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0, // 左Y轴
        type: "bar",
      });
    });

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, totalSeries).map((color: string) => ({
        color: { color: color, opacity: 1 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 5,
          color: { color: "#000000", opacity: 0.3 },
          radius: 3,
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
      line: {
        type: validatedInput.lineType || "straight",
        width: validatedInput.lineWidth || 3,
        endPoint: {
          radius: validatedInput.showEndPoints
            ? validatedInput.endPointRadius || 4
            : 0,
          width: 2,
          color: null,
          fill: { color: "#ffffff", opacity: 1 },
        },
      },
      bar: {
        widthPercent: validatedInput.columnWidthPercent || 0.5,
        border: {
          radius: [4, 4, 4, 4],
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建轴配置
    const xAxis = [
      {
        show: true,
        type: "category",
        position: "bottom",
        label: {
          show: true,
          fontFamily: "Misans 常规",
          fontSize: 14,
          color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
          rotation: 0,
        },
        grid: {
          show: false,
          color: getGridColorByTheme(mergedInput.theme || "light"),
          width: 1,
          type: "solid",
        },
        line: {
          show: true,
          color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          width: 1,
        },
      },
    ];

    const yAxis = [
      // 左Y轴（柱状图）
      {
        show: true,
        type: "value",
        position: "left",
        label: {
          show: true,
          fontFamily: "Misans 常规",
          fontSize: 12,
          color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
          suffix: validatedInput.leftYAxisConfig?.unit || "",
        },
        grid: {
          show: true,
          color: getGridColorByTheme(mergedInput.theme || "light"),
          width: 1,
          type: "dotted",
        },
        line: {
          show: true,
          color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          width: 1,
        },
        stepOfLabel: "auto",
        range: [],
      },
      // 右Y轴（线条图）
      {
        show: true,
        type: "value",
        position: "right",
        label: {
          show: true,
          fontFamily: "Misans 常规",
          fontSize: 14,
          color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
          suffix: validatedInput.rightYAxisConfig?.unit || "",
        },
        grid: {
          show: false, // 右轴通常不显示网格线
          color: getGridColorByTheme(mergedInput.theme || "light"),
          width: 1,
          type: "solid",
        },
        line: {
          show: true,
          color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          width: 1,
        },
        stepOfLabel: "auto",
        range: [],
      },
    ];

    // 构建标签配置
    const label = {
      show: false,
      barLabel: {
        show: false,
        positionChoice: "center",
        fontFamily: "Misans 常规",
        fontSize: 14,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      lineLabel: {
        show: false,
        positionChoice: "top",
        fontFamily: "Misans 常规",
        fontSize: 14,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    const axis = {
      show: true,
      xAxis,
      yAxis,
    };

    // 生成图表配置
    const result = createChartOutput("mixed-line-stacked-column", mergedInput, {
      type: "mixed-line-stacked-column",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light"
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display,
      axis,
      legend: generateDefaultLegend(true, mergedInput.theme || "light"),
      label,
    });

    // 混合图表使用cross管道
    result.pipe = "cross";

    return result as MixedLineStackedColumnChartOutput;
  }

  getInputSchema() {
    return MixedLineStackedColumnChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("mixed-line-stacked-column");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load mixed-line-stacked-column schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
