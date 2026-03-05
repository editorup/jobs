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
} from "../utils/chart-helpers";

// Voronoi图特定输入接口
export interface VoronoiChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 三列数据格式: [一级分类, 二级对象, 数值]
  colors?: string[];
  drawShape?:
    | "circle"
    | "triangle"
    | "rectangle"
    | "diamond"
    | "pentagon"
    | "hexagon"
    | "octagon";
  drawStyle?: "auto" | "fixed";
  cornerRadius?: number;
  fillOpacity?: number;
  showBorder?: boolean;
  borderWidth?: number;
  secondaryBorderWidth?: number;
}

// Voronoi图特定输出接口
export interface VoronoiChartOutput extends BaseChartOutput {
  props: {
    type: "voronoi";
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
      voronoi: {
        drawShape: string;
        drawStyle: string;
        cornerRadius: number;
        fillOpacity: number;
        border: any;
        secondaryBorder: any;
      };
    };
    legend: any;
    label: any;
  };
}

// Zod验证schema，扩展基础schema
export const VoronoiChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  drawShape: z
    .enum([
      "circle",
      "triangle",
      "rectangle",
      "diamond",
      "pentagon",
      "hexagon",
      "octagon",
    ])
    .optional()
    .default("circle"),
  drawStyle: z.enum(["auto", "fixed"]).optional().default("fixed"),
  cornerRadius: z.number().min(0).optional().default(4),
  fillOpacity: z.number().min(0).max(1).optional().default(1),
  showBorder: z.boolean().optional().default(false),
  borderWidth: z.number().min(0).optional().default(0),
  secondaryBorderWidth: z.number().min(0).optional().default(2),
});

export class VoronoiChartGenerator extends BaseChartTool {
  constructor() {
    super("voronoi");
  }

  protected getElementType(): string {
    return "voronoi";
  }

  async generateConfig(input: VoronoiChartInput): Promise<VoronoiChartOutput> {
    // 验证输入
    const validatedInput = VoronoiChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "voronoi" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    if (dataCols < 3) {
      throw new Error("Voronoi图需要3列数据（一级分类、二级对象、数值）");
    }

    // 获取第一列的唯一值作为分类数量（用于颜色）
    const categories = new Set();
    for (let i = 1; i < dataRows; i++) {
      // 跳过header行
      if (validatedInput.data[0][i] && validatedInput.data[0][i][0]) {
        categories.add(validatedInput.data[0][i][0]);
      }
    }
    const categoryCount = categories.size;

    // 获取默认配置
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      categoryCount
    );
    const colors =
      getColors(validatedInput.colors, categoryCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - Voronoi图的特定映射
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
        name: "一级分类",
        index: 0,
        isLegend: true,
        function: "typeCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
      {
        name: "二级对象",
        index: 1,
        isLegend: false,
        function: "objCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
      {
        name: "数值",
        index: 2,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "voronoi",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, categoryCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 2,
          color: { color: "#000000", opacity: 0.1 },
          radius: 1,
        },
      })),
    };

    // 构建显示配置
    const display = {
      voronoi: {
        drawShape: validatedInput.drawShape || "circle",
        drawStyle: validatedInput.drawStyle || "fixed",
        cornerRadius: validatedInput.cornerRadius || 4,
        fillOpacity: validatedInput.fillOpacity || 1,
        border: {
          type: "solid" as const,
          width: validatedInput.showBorder
            ? validatedInput.borderWidth || 0
            : 0,
          color: null,
        },
        secondaryBorder: {
          type: "solid" as const,
          width: validatedInput.secondaryBorderWidth || 2,
          color: { color: "#ffffff", opacity: 1 },
        },
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      textLabel: {
        show: true,
        fontFamily: "Misans 中等",
        fontSize: [14, 16],
        color: { color: "#ffffff", opacity: 1 },
      },
      numberLabel: {
        show: false,
        fontFamily: "Misans 常规",
        fontSize: 19,
        color: { color: "#ffffff", opacity: 1 },
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    // 生成图表配置
    const result = createChartOutput("voronoi", mergedInput, {
      type: "voronoi",
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
    });

    // Voronoi图使用key_value管道
    result.pipe = "key_value";

    return result as VoronoiChartOutput;
  }

  getInputSchema() {
    return VoronoiChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("voronoi");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load voronoi schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
