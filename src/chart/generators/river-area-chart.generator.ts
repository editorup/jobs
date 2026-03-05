import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
} from "../interfaces/chart-tool.interface";
// import { SchemaMerger } from "../utils/schema-merger";
import {
  generateDefaultTitle,
  generateDefaultBackground,
  generateDefaultLegend,
  getThemeColors,
  getColors,
  generateDefaultAnimation,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 河流面积图特定输入接口
export interface RiverAreaChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 多系列时间序列数据
  title?: string;
  subtitle?: string;
  showLabels?: boolean;
  colors?: string[];
  areaType?: "straight" | "curve"; // 边界线类型
  areaOpacity?: number; // 区域透明度
  centerBaseline?: boolean; // 是否居中基线
  chartType: "river-area";
}

// 河流面积图特定输出接口
export interface RiverAreaChartOutput extends BaseChartOutput {
  props: {
    type: "river-area";
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
        opacity: number;
      };
    };
    legend: any;
    label: any;
    axis: any;
    numberFormat: any;
    animation: any;
    tooltip: boolean;
    padding: any;
  };
}

// Zod验证schema
export const RiverAreaChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("河流面积图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  areaType: z.enum(["straight", "curve"]).optional().default("curve"),
  areaOpacity: z.number().min(0).max(1).optional().default(0.7),
  chartType: z.literal("river-area"),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
});

export class RiverAreaChartGenerator extends BaseChartTool {
  constructor() {
    super("river-area");
  }

  protected getElementType(): string {
    return "area";
  }

  async generateConfig(
    input: RiverAreaChartInput,
  ): Promise<RiverAreaChartOutput> {
    // 验证输入
    const validatedInput = RiverAreaChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "river-area" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const firstRow = validatedInput.data[0][0];
    const seriesCount = firstRow ? firstRow.length - 1 : 0; // 减去第一列（时间轴）

    // 获取默认配置
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      seriesCount,
    );
    const colors =
      getColors(validatedInput.colors, seriesCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射（X轴时间，多个Y轴数值系列）
    const map = [
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

    // 为每个数值系列添加映射
    for (let i = 1; i <= seriesCount; i++) {
      map.push({
        name: "数值列",
        index: i,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "area",
      } as any);
    }

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, seriesCount).map((color: string) => ({
        color: { color: color, opacity: validatedInput.areaOpacity || 0.7 },
        texture: { url: "" },
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
        type: validatedInput.areaType || "curve",
        width: 3,
        opacity: validatedInput.areaOpacity || 0.7,
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      areaLabel: {
        show: validatedInput.showLabels || false,
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
            direction: "auto" as const,
            fontFamily: "Misans 常规",
            fontSize: 16,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: true,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "dotted" as const,
          },
          position: "bottom" as const,
          type: "category" as const,
        },
      ],
    };

    return {
      data: validatedInput.data,
      pipe: "cross",
      props: {
        type: "river-area",
        title: generateDefaultTitle(
          validatedInput.title,
          validatedInput.subtitle,
          mergedInput.theme || "light",
        ),
        background: generateDefaultBackground(mergedInput.theme || "light"),
        map,
        fill,
        display,
        legend: generateDefaultLegend(true, mergedInput.theme || "light"),
        label,
        axis,
        numberFormat: {
          separatorType: "1000.00" as const,
          decimalPlaces: null,
        },
        animation: generateDefaultAnimation("river-area"),
        tooltip: true,
        padding: {
          top: 20,
          bottom: 23,
          left: 24,
          right: 24,
        },
      },
    };
  }

  getInputSchema(): z.ZodType<RiverAreaChartInput> {
    return RiverAreaChartInputSchema;
  }

  getOutputSchema(): z.ZodType<RiverAreaChartOutput> {
    return z.any(); // 可以根据需要进一步细化
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   return schemaMerger.getMergedSchema("river-area");
  // }
}
