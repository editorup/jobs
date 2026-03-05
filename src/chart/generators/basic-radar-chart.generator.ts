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
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 基础雷达图特定输入接口
export interface BasicRadarChartInput
  extends Omit<BaseChartInput, "chartType"> {
  data: Array<Array<Array<string | number>>>; // [维度, 系列1, 系列2, ...] 格式
  areaType?: "straight" | "curve"; // 区域线条类型
  lineWidth?: number; // 线条宽度
  fillOpacity?: number; // 填充透明度
  showLabels?: boolean;
}

// 基础雷达图特定输出接口
export interface BasicRadarChartOutput extends BaseChartOutput {
  props: {
    type: "basic-radar";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      angleIndex?: number;
      radiusIndex?: number;
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

// Zod验证schema
export const BasicRadarChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("雷达图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  areaType: z.enum(["straight", "curve"]).optional().default("straight"),
  lineWidth: z.number().min(1).optional().default(2),
  fillOpacity: z.number().min(0).max(1).optional().default(0.2),
  showLabels: z.boolean().optional().default(false),
});

export class BasicRadarChartGenerator extends BaseChartTool {
  constructor() {
    super("basic-radar");
  }

  protected getElementType(): string {
    return "area";
  }

  async generateConfig(input: BaseChartInput): Promise<BaseChartOutput> {
    // 验证输入
    const validatedInput = BasicRadarChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "basic-radar" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据结构信息
    const headerRow = validatedInput.data[0][0];
    const seriesCount = headerRow.length - 1; // 除去第一列（维度列）的系列数量

    // 获取主题颜色
    const themeColors =
      getColors(validatedInput.colors, seriesCount) ||
      getThemeColors(mergedInput.theme || "light", seriesCount);

    // 构建数据映射 - 雷达图使用角度轴和径向轴
    const map = [
      {
        name: "周向轴对象",
        index: 0,
        isLegend: false,
        function: "objCol",
        configurable: true,
        angleIndex: 0,
        type: "",
      },
      // 为每个数据系列创建映射
      ...Array.from({ length: seriesCount }, (_, i) => ({
        name: "数值列",
        index: i + 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        radiusIndex: 0,
        type: "area",
      })),
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: themeColors.slice(0, seriesCount).map((color: any) => ({
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
      })),
    };

    // 构建显示配置
    const display = {
      area: {
        type: validatedInput.areaType || "straight",
        width: validatedInput.lineWidth || 2,
        fillOpacity: validatedInput.fillOpacity || 0.2,
        endPoint: {
          radius: 3,
          width: 0,
          color: { color: "#ffffff", opacity: 1 },
          fill: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      areaLabel: {
        show: false,
        fontFamily: "Misans 常规",
        fontSize: 12,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    // 构建坐标轴配置 - 雷达图使用角度轴和径向轴
    const axis = {
      show: true,
      angleAxis: [
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
            fontSize: 13,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dashed" as const,
          },
          type: "category" as const,
        },
      ],
      radiusAxis: [
        {
          line: {
            show: false,
            width: 1,
            color: getAxisLineColorByTheme(mergedInput.theme || "light"),
          },
          label: {
            show: false,
            fontFamily: "Misans 常规",
            fontSize: 14,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            suffix: "",
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
            background: {
              color: [
                {
                  color: "#ffffff",
                  opacity: 0,
                },
                {
                  color: "#ffffff",
                  opacity: 0,
                },
              ],
              style: "polygon",
            },
          },
          type: "value" as const,
          stepOfLabel: "auto" as const,
          position: "inside" as const,
          range: [],
        },
      ],
    };

    return createChartOutput("basic-radar", mergedInput, {
      map,
      fill,
      display,
      label,
      axis,
    });
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("basic-radar");
  // }

  validateData(data: any[][]): boolean {
    if (!Array.isArray(data) || data.length < 2) {
      return false;
    }

    // 检查标题行
    const headerRow = data[0];
    if (!Array.isArray(headerRow) || headerRow.length < 2) {
      return false;
    }

    // 检查数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length !== headerRow.length) {
        return false;
      }

      // 第一列应该是字符串，其余列应该是数字
      if (typeof row[0] !== "string") {
        return false;
      }

      for (let j = 1; j < row.length; j++) {
        if (typeof row[j] !== "number") {
          return false;
        }
      }
    }

    return true;
  }

  getChartMetadata() {
    return {
      type: "basic-radar",
      name: "基础雷达图",
      description: "用于多维数据比较，在多个维度上同时展示不同系列的数据表现",
      category: "雷达图",
      tags: ["多维", "对比", "雷达", "综合评价"],
      dataFormat: "cross",
      minDataPoints: 3,
      maxDataPoints: 20,
      requiredFields: ["维度名称", "系列数据"],
      optionalFields: [
        "标题",
        "副标题",
        "线条类型",
        "线条宽度",
        "填充透明度",
        "标签显示",
      ],
    };
  }
}
