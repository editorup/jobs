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

// 堆叠面积图特定输入接口
export interface StackedAreaChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 交叉表数据格式
  showLabels?: boolean;
  colors?: string[];
  lineType?: "straight" | "curve"; // 区域顶线类型
  fillOpacity?: number; // 面积填充透明度
  showPoints?: boolean; // 是否显示数据点
  pointRadius?: number; // 数据点半径
}

// 堆叠面积图特定输出接口
export interface StackedAreaChartOutput extends BaseChartOutput {
  props: {
    type: "stacked-area";
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
      area: {
        type: string;
        width: number;
        fillOpacity: number;
        endPoint: any;
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema，扩展基础schema
export const StackedAreaChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  lineType: z.enum(["straight", "curve"]).optional().default("straight"),
  fillOpacity: z.number().min(0).max(1).optional().default(0.7),
  showPoints: z.boolean().optional().default(false),
  pointRadius: z.number().min(0).max(10).optional().default(0),
});

export class StackedAreaChartGenerator extends BaseChartTool {
  constructor() {
    super("stacked-area");
  }

  protected getElementType(): string {
    return "area";
  }

  async generateConfig(
    input: StackedAreaChartInput
  ): Promise<StackedAreaChartOutput> {
    // 验证输入
    const validatedInput = StackedAreaChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "stacked-area" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // if (dataCols < 2) {
    //   throw new Error('堆叠面积图需要至少2列数据（1列分类+至少1列数值）');
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

    // 构建数据映射
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
        type: "area",
      });
    }

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, seriesCount).map((color: string) => ({
        color: { color: color, opacity: validatedInput.fillOpacity || 0.7 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 5,
          color: { color: "#000000", opacity: 0.1 },
          radius: 3,
        },
      })),
    };

    // 构建显示配置
    const display = {
      area: {
        type: validatedInput.lineType || "straight",
        width: 3,
        fillOpacity: validatedInput.fillOpacity || 0.7,
        endPoint: {
          radius: validatedInput.showPoints
            ? validatedInput.pointRadius || 0
            : 0,
          width: 1,
          color: null, // 自动颜色
          fill: null, // 自动颜色
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      areaLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "top" as const,
        fontFamily: "Misans 常规",
        fontSize: 12,
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

    // 生成图表配置
    const result = createChartOutput("stacked-area", mergedInput, {
      type: "stacked-area",
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

    return result as StackedAreaChartOutput;
  }

  getInputSchema() {
    return StackedAreaChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("stacked-area");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load stacked-area schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
