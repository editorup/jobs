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

// 单层树状图特定输入接口
export interface TreemapChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 两列数据格式: [名称, 值]
  colors?: string[];
  gapDistance?: number; // 矩形间隙
  fillOpacity?: number; // 填充透明度
  borderRadius?: number | number[]; // 边框圆角
  borderWidth?: number; // 边框宽度
  borderColor?: string; // 边框颜色
}

// 单层树状图特定输出接口
export interface TreemapChartOutput extends BaseChartOutput {
  props: {
    type: "single-layer-treemap";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      type: string;
    }>;
    fill: any;
    display: {
      bar: {
        gapDistance: number;
        fillOpacity: number;
        border: {
          radius: number | number[];
          type: string;
          width: number;
          color: any;
        };
      };
    };
    legend: any;
    label: any;
  };
}

// Zod验证schema，扩展基础schema
export const TreemapChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  gapDistance: z.number().min(0).optional().default(0),
  fillOpacity: z.number().min(0).max(1).optional().default(1),
  borderRadius: z
    .union([z.number(), z.array(z.number())])
    .optional()
    .default(0),
  borderWidth: z.number().min(0).optional().default(0),
  borderColor: z.string().optional().default("#ffffff"),
});

export class TreemapChartGenerator extends BaseChartTool {
  constructor() {
    super("single-layer-treemap");
  }

  protected getElementType(): string {
    return "bar"; // 树状图在schema中使用bar类型
  }

  async generateConfig(input: TreemapChartInput): Promise<TreemapChartOutput> {
    // 验证输入
    const validatedInput = TreemapChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "single-layer-treemap",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length - 1;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    // if (dataCols !== 2) {
    //   throw new Error('单层树状图需要恰好2列数据（名称、值）');
    // }

    // 获取数据项数量用于颜色分配
    const itemCount = dataRows - 1; // 减去header行

    // 获取默认配置
    const themeColors = getThemeColors(mergedInput.theme || "light", itemCount);
    const colors =
      getColors(validatedInput.colors, itemCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 树状图的特定映射
    const map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      type: string;
    }> = [
      {
        name: "名称",
        index: 0,
        isLegend: false,
        function: "objCol",
        configurable: true,
        type: "",
      },
      {
        name: "值",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
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
          width: validatedInput.borderWidth || 1,
          color: validatedInput.borderColor
            ? { color: validatedInput.borderColor, opacity: 1 }
            : null,
        },
      })),
    };

    // 处理边框圆角配置
    let borderRadius: number | number[] = validatedInput.borderRadius || 0;
    if (Array.isArray(borderRadius)) {
      // 确保数组有4个值
      if (borderRadius.length === 1) {
        borderRadius = [
          borderRadius[0],
          borderRadius[0],
          borderRadius[0],
          borderRadius[0],
        ];
      } else if (borderRadius.length === 2) {
        borderRadius = [
          borderRadius[0],
          borderRadius[1],
          borderRadius[0],
          borderRadius[1],
        ];
      } else if (borderRadius.length === 3) {
        borderRadius = [
          borderRadius[0],
          borderRadius[1],
          borderRadius[2],
          borderRadius[1],
        ];
      } else if (borderRadius.length > 4) {
        borderRadius = borderRadius.slice(0, 4);
      }
    }

    // 构建显示配置
    const display = {
      bar: {
        gapDistance: validatedInput.gapDistance || 0,
        fillOpacity: validatedInput.fillOpacity || 1,
        border: {
          radius: borderRadius,
          type: "solid" as const,
          width: validatedInput.borderWidth || 0,
          color: validatedInput.borderColor
            ? { color: validatedInput.borderColor, opacity: 1 }
            : null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      textLabel: {
        show: true,
        positionChoice: "inside-center",
        fontFamily: "Misans 常规",
        fontSize: 15,
        color: { color: "#ffffff", opacity: 1 },
      },
      numberLabel: {
        show: false,
        positionChoice: "inside-center",
        fontFamily: "Misans 常规",
        fontSize: [14, 32],
        color: { color: "#ffffff", opacity: 1 },
        suffix: "",
      },
      percentLabel: {
        show: true,
        color: {
          color: "#ffffff",
          opacity: 1,
        },
        fontSize: [18, 32],
        fontFamily: "Misans 常规",
        positionChoice: "inside-center",
      },
      highlight: false,
      overlap: false,
    };

    // 生成图表配置
    const result = createChartOutput("single-layer-treemap", mergedInput, {
      type: "single-layer-treemap",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light"
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display,
      legend: generateDefaultLegend(false, mergedInput.theme || "light"),
      label,
    });

    // 树状图使用key_value管道
    result.pipe = "key_value";

    return result as TreemapChartOutput;
  }

  getInputSchema() {
    return TreemapChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("single-layer-treemap");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load single-layer-treemap schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
