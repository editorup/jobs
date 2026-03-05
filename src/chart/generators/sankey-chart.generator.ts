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
} from "../utils/chart-helpers";

// Sankey图特定输入接口
export interface SankeyChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 三列数据格式: [source, target, value]
  colors?: string[];
  nodeWidth?: number; // 节点宽度
  gapDistance?: number; // 节点间隙
  fillOpacity?: number; // 连线透明度
  linkColor?: "auto" | "gradient" | string; // 连线颜色模式
}

// Sankey图特定输出接口
export interface SankeyChartOutput extends BaseChartOutput {
  props: {
    type: "sankey";
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
      sankey: {
        gapDistance: number;
        nodeWidth: number;
        fillOpacity: number;
        color?: any;
      };
    };
    legend: any;
    label: any;
  };
}

// Zod验证schema，扩展基础schema
export const SankeyChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  nodeWidth: z.number().min(1).optional().default(10),
  gapDistance: z.number().min(0).optional().default(5),
  fillOpacity: z.number().min(0).max(1).optional().default(0.3),
  linkColor: z
    .union([z.literal("auto"), z.literal("gradient"), z.string()])
    .optional()
    .default("gradient"),
});

export class SankeyChartGenerator extends BaseChartTool {
  constructor() {
    super("sankey");
  }

  protected getElementType(): string {
    return "sankey";
  }

  async generateConfig(input: SankeyChartInput): Promise<SankeyChartOutput> {
    // 验证输入
    const validatedInput = SankeyChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "sankey" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    if (dataCols < 3) {
      throw new Error("Sankey图需要3列数据（source、target、value）");
    }

    // 获取所有唯一的节点（source和target）用于颜色分配
    const nodes = new Set<string>();
    for (let i = 1; i < dataRows; i++) {
      // 跳过header行
      if (validatedInput.data[0][i]) {
        const source = validatedInput.data[0][i][0];
        const target = validatedInput.data[0][i][1];
        if (source) nodes.add(String(source));
        if (target) nodes.add(String(target));
      }
    }
    const nodeCount = nodes.size;

    // 获取默认配置
    const themeColors = getThemeColors(mergedInput.theme || "light", nodeCount);
    const colors =
      getColors(validatedInput.colors, nodeCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - Sankey图的特定映射
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
        name: "起始项",
        index: 0,
        isLegend: true,
        function: "sourceCol",
        configurable: true,
        xAxisIndex: 0,
        type: "",
      },
      {
        name: "目标项",
        index: 1,
        isLegend: true,
        function: "targetCol",
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
        type: "sankey",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, nodeCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
        shadow: {
          show: false,
          type: "outer" as const,
          angle: 45,
          blur: 3,
          color: { color: "#000000", opacity: 0.2 },
          radius: 2,
        },
      })),
    };

    // 构建显示配置
    const displayConfig: any = {
      sankey: {
        gapDistance: validatedInput.gapDistance || 5,
        nodeWidth: validatedInput.nodeWidth || 10,
        fillOpacity: validatedInput.fillOpacity || 0.3,
      },
    };

    // 处理连线颜色配置
    if (validatedInput.linkColor === "gradient") {
      displayConfig.sankey.color = "gradient";
    } else if (
      validatedInput.linkColor === "auto" ||
      !validatedInput.linkColor
    ) {
      displayConfig.sankey.color = null; // 自动颜色
    } else {
      // 自定义颜色
      displayConfig.sankey.color = {
        color: validatedInput.linkColor,
        opacity: 1,
      };
    }

    // 构建标签配置
    const label = {
      show: true,
      textLabel: {
        show: true,
        fontFamily: "Misans 常规",
        fontSize: 14,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        positionChoice: "inside",
      },
      numberLabel: {
        show: false,
        fontFamily: "Misans 常规",
        fontSize: 12,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        positionChoice: "inside",
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    // 生成图表配置
    const result = createChartOutput("sankey", mergedInput, {
      type: "sankey",
      title: generateDefaultTitle(
        mergedInput.title,
        mergedInput.subtitle,
        mergedInput.theme || "light"
      ),
      background: generateDefaultBackground(mergedInput.theme),
      map,
      fill,
      display: displayConfig,
      legend: generateDefaultLegend(false, mergedInput.theme || "light"),
      label,
    });

    // Sankey图使用key_value管道
    result.pipe = "key_value";

    return result as SankeyChartOutput;
  }

  getInputSchema() {
    return SankeyChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   try {
  //     return schemaMerger.getMergedSchema("sankey");
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to load sankey schema: ${error instanceof Error ? error.message : "Unknown error"}`
  //     );
  //   }
  // }
}
