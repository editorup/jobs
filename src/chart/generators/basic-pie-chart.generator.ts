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

// 饼图特定输入接口
export interface BasicPieChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 键值对数据 [名称, 值]
  innerRadiusRatio?: number; // 内径比例 (0=饼图, >0=甜甜圈图)
  gapPercentage?: number; // 扇区间隙百分比
  showLabels?: boolean;
  labelPosition?: "inside" | "outside-ellipse" | "outside-circle";
  customColors?: string[];
}

// 饼图特定输出接口
export interface BasicPieChartOutput extends BaseChartOutput {
  props: {
    type: "basic-pie";
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
      pie: {
        innerRadiusRatio: number;
        gapPercentage: number;
        border: any;
      };
    };
    legend: any;
    label: any;
  };
}

// Zod验证schema
export const BasicPieChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("基础饼图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  innerRadiusRatio: z.number().min(0).max(0.99).optional().default(0.15),
  gapPercentage: z.number().min(0).max(100).optional().default(15),
  showLabels: z.boolean().optional().default(true),
  labelPosition: z
    .enum(["inside-horizontal", "outside-ellipse", "outside-edge"])
    .optional()
    .default("outside-edge"),
  customColors: z.array(z.string()).optional(),
});

export class BasicPieChartGenerator extends BaseChartTool {
  constructor() {
    super("basic-pie");
  }

  protected getElementType(): string {
    return "pie";
  }

  async generateConfig(
    input: BasicPieChartInput
  ): Promise<BasicPieChartOutput> {
    // 验证输入
    const validatedInput = BasicPieChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "basic-pie" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    if (!validatedInput.data || validatedInput.data[0].length === 0) {
      throw new Error("饼图数据不能为空");
    }

    // 获取默认配置
    const dataLength = validatedInput.data[0].length - 1;
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      dataLength
    );
    const colors =
      getColors(validatedInput.colors, dataLength) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 饼图固定为两列映射
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
        type: "pie",
      },
    ];

    // 构建填充配置 - 饼图通常使用多色
    const fill = {
      controlType: "multiple" as const,
      props: colors.map((color: string) => ({
        color: { color: color, opacity: 1 },
        texture: { url: "" },
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
      pie: {
        innerRadiusRatio: validatedInput.innerRadiusRatio || 0.15,
        gapPercentage: validatedInput.gapPercentage || 15,
        border: {
          radius: 0,
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
        positionChoice: validatedInput.labelPosition || "outside-edge",
        fontFamily: "Misans 常规",
        fontSize: 16,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      numberLabel: {
        show: false,
        positionChoice: validatedInput.labelPosition || "outside-edge",
        fontFamily: "Misans 中等",
        fontSize: [20, 32],
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      percentLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: validatedInput.labelPosition || "outside-edge",
        fontFamily: "Misans 中等",
        fontSize: [20, 32],
        color: getLabelColorByTheme(mergedInput.theme || "light"),
      },
      highlight: false,
      overlap: false,
    };

    // // 重新组装数据为二维数组格式，添加标题行
    // const formattedData = [["名称", "值"], ...validatedInput.data];

    // 更新mergedInput的data字段
    const inputWithFormattedData = {
      ...mergedInput,
      data: validatedInput.data,
    };

    return createChartOutput("basic-pie", inputWithFormattedData, {
      map,
      fill,
      display,
      label,
    }) as BasicPieChartOutput;
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("basic-pie");
  // }
}
