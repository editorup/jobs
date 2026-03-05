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
  processChartData,
  getColors,
  generateDefaultAnimation,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 折线图特定输入接口
export interface BasicLineChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>;
  lineType?: "straight" | "curve";
  lineWidth?: number;
  showPoints?: boolean;
  pointRadius?: number;
  customColors?: string[];
  showLabels?: boolean;
}

// 折线图特定输出接口
export interface BasicLineChartOutput extends BaseChartOutput {
  props: {
    type: "basic-line";
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
      line: {
        type: "straight" | "curve";
        width: number;
        endPoint: any;
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
export const BasicLineChartInputSchema = z.object({
  data: z.array(
    z
      .array(z.array(z.union([z.string(), z.number()])))
      .min(2, "数据至少需要包含标题行和一行数据")
  ),
  title: z.string().optional().default("基础折线图"),
  subtitle: z.string().optional().default("副标题"),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  lineType: z.enum(["straight", "curve"]).optional().default("curve"),
  lineWidth: z.number().min(1).max(100).optional().default(5),
  showPoints: z.boolean().optional().default(false),
  pointRadius: z.number().min(0).max(100).optional().default(0),
  customColors: z.array(z.string()).optional(),
  showLabels: z.boolean().optional().default(false),
});

export class BasicLineChartGenerator extends BaseChartTool {
  constructor() {
    super("basic-line");
  }

  protected getElementType(): string {
    return "line";
  }

  async generateConfig(
    input: BasicLineChartInput
  ): Promise<BasicLineChartOutput> {
    // 先进行基本的数据验证
    if (!input.data || input.data[0].length === 0) {
      throw new Error("数据格式无效：需要至少包含标题行和一行数据");
    }

    if (input.data[0].length < 2) {
      throw new Error("数据格式无效：需要至少包含标题行和一行数据");
    }

    // 验证输入
    const validatedInput = BasicLineChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "basic-line" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    const [headers, ...dataRows] = validatedInput.data[0];

    if (!headers || !dataRows.length) {
      throw new Error("数据格式无效：需要至少包含标题行和一行数据");
    }

    // 验证数据格式
    const categoryColumn = headers[0];
    const valueColumns = headers.slice(1);

    if (valueColumns.length === 0) {
      throw new Error("至少需要一个数值列用于绘制折线");
    }

    // 获取默认配置
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      valueColumns.length
    );
    const colors =
      getColors(validatedInput.colors, valueColumns.length) ||
      themeColors.map((c: any) => c.color);

    // 使用导入的默认配置函数
    const title = generateDefaultTitle(
      mergedInput.title,
      mergedInput.subtitle,
      mergedInput.theme || "light"
    );
    const background = generateDefaultBackground(mergedInput.theme || "light");
    const legend = generateDefaultLegend(true, mergedInput.theme || "light");

    // 构建数据映射
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
      ...valueColumns.map((_, index) => ({
        name: "数值列",
        index: index + 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "line",
      })),
    ];

    // 构建填充配置
    const fill = {
      controlType: valueColumns.length > 1 ? "multiple" : "single",
      props: colors.map((color: string) => ({
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
      line: {
        type: validatedInput.lineType || "curve",
        width: validatedInput.lineWidth || 5,
        endPoint: {
          radius: validatedInput.showPoints
            ? validatedInput.pointRadius || 0
            : 0,
          width: 0,
          color: null,
          fill: { color: "#ffffff", opacity: 1 },
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      lineLabel: {
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
            type: "solid" as const,
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
            type: "solid" as const,
          },
          position: "left" as const,
          type: "value" as const,
          stepOfLabel: "auto",
          range: [],
        },
      ],
    };

    // 构建数字格式配置
    const numberFormat = {
      separatorType: "1000.00",
      decimalPlaces: null,
    };

    // 构建动画配置
    const animation = generateDefaultAnimation("basic-line");

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    // 处理数据并创建输出
    // const processedData = processChartData(validatedInput.data);

    return {
      data: validatedInput.data,
      pipe: "cross", // 折线图使用cross管道
      props: {
        type: "basic-line",
        title,
        background,
        legend,
        map,
        fill,
        display,
        label,
        axis,
        numberFormat,
        animation,
        tooltip: true,
        padding,
      },
    } as BasicLineChartOutput;
  }

  // async loadSchema(): Promise<any> {
  //   const merger = new SchemaMerger();
  //   return merger.getMergedSchema("basic-line");
  // }
}
