import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
} from "../interfaces/chart-tool.interface";
// import { SchemaMerger } from "../utils/schema-merger";
import {
  getThemeColors,
  createChartOutput,
  getColors,
  getLabelColorByTheme,
} from "../utils/chart-helpers";

// 漏斗图特定输入接口
export interface FunnelChartInput extends Omit<BaseChartInput, "chartType"> {
  data: Array<Array<Array<string | number>>>; // [阶段名称, 值] 格式
  gapDistance?: number; // 段间距离
  fillOpacity?: number; // 填充不透明度
  showLabels?: boolean;
}

// 漏斗图特定输出接口
export interface FunnelChartOutput extends BaseChartOutput {
  props: {
    type: "funnel";
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
        gapDistance: number;
        fillOpacity: number;
        border: any;
      };
    };
    legend: any;
    label: any;
  };
}

// Zod验证schema
export const FunnelChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("漏斗图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  gapDistance: z.number().min(0).optional().default(3),
  fillOpacity: z.number().min(0).max(1).optional().default(1),
  showLabels: z.boolean().optional().default(true),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
});

export class FunnelChartGenerator extends BaseChartTool {
  constructor() {
    super("funnel");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(input: BaseChartInput): Promise<BaseChartOutput> {
    // 验证输入
    const validatedInput = FunnelChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "funnel" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据行数（除去标题行）
    const dataLength = validatedInput.data[0].length - 1;

    // 获取主题颜色
    const themeColors =
      getColors(validatedInput.colors, dataLength) ||
      getThemeColors(mergedInput.theme || "light", dataLength);

    // 构建数据映射
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
        type: "bar",
      },
    ];

    // 构建填充配置 - 漏斗图通常每个阶段不同颜色
    const fill = {
      controlType: "multiple" as const,
      props: themeColors.map((color: any) => ({
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

    // 构建显示配置
    const display = {
      bar: {
        gapDistance: validatedInput.gapDistance || 3,
        fillOpacity: validatedInput.fillOpacity || 1,
        border: {
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      textLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "outside-follow" as const,
        fontFamily: "Misans 常规",
        fontSize: 14,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      numberLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "inside-horizontal" as const,
        fontFamily: "Misans 常规",
        fontSize: 18,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      percentLabel: {
        show: false,
        positionChoice: "outside-follow",
        fontFamily: "Misans 常规" as const,
        fontSize: 12,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      highlight: false,
      overlap: false,
    };

    return createChartOutput("funnel", mergedInput, {
      map,
      fill,
      display,
      label,
    });
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("funnel");
  // }

  validateData(data: any[][]): boolean {
    if (!Array.isArray(data) || data.length < 2) {
      return false;
    }

    // 检查标题行
    const headerRow = data[0];
    if (!Array.isArray(headerRow) || headerRow.length !== 2) {
      return false;
    }

    // 检查数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length !== 2) {
        return false;
      }

      // 第一列应该是字符串，第二列应该是数字
      if (typeof row[0] !== "string" || typeof row[1] !== "number") {
        return false;
      }
    }

    return true;
  }

  getChartMetadata() {
    return {
      type: "funnel",
      name: "漏斗图",
      description: "用于显示业务流程中各阶段的转化情况，适合分析用户转化漏斗",
      category: "特殊图表",
      tags: ["转化", "流程", "阶段", "漏斗"],
      dataFormat: "key_value",
      minDataPoints: 2,
      maxDataPoints: 20,
      requiredFields: ["阶段名称", "数值"],
      optionalFields: ["标题", "副标题", "段间距", "填充透明度", "标签显示"],
    };
  }
}
