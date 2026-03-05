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

// 玉玦图特定输入接口
export interface JadeJueChartInput extends Omit<BaseChartInput, "chartType"> {
  data: Array<Array<Array<string | number>>>; // [名称, 值] 格式
  showLabels?: boolean;
  colors?: string[];
  innerRadius?: number; // 内半径比例 (0-1)
  gapPercentage?: number; // 扇形间隙百分比
  rotateDirection?: "clockwise" | "counterclockwise"; // 旋转方向
  startAngle?: number; // 起始角度
  drawAngle?: number; // 绘制角度，玉玦图的特殊属性
}

// 玉玦图特定输出接口
export interface JadeJueChartOutput extends BaseChartOutput {
  props: {
    type: "jade-jue";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      isLegend: boolean;
      function: string;
      configurable: boolean;
      radiusIndex?: number;
      angleIndex?: number;
      type: string;
    }>;
    fill: any;
    display: {
      pie: {
        gapPercentage: number;
        innerRadiusRatio: number;
        rotateDirection: string;
        startAngle: number;
        drawAngle: number;
        border: any;
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema
export const JadeJueChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("玉玦图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(true),
  colors: z.array(z.string()).optional(),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
  innerRadius: z.number().min(0).max(1).optional().default(0.2),
  gapPercentage: z.number().min(0).max(100).optional().default(70),
  rotateDirection: z
    .enum(["clockwise", "counterclockwise"])
    .optional()
    .default("clockwise"),
  startAngle: z.number().min(0).max(360).optional().default(0),
  drawAngle: z.number().min(0).max(360).optional().default(270),
});

export class JadeJueChartGenerator extends BaseChartTool {
  constructor() {
    super("jade-jue");
  }

  protected getElementType(): string {
    return "pie";
  }

  async generateConfig(input: BaseChartInput): Promise<BaseChartOutput> {
    // 验证输入
    const validatedInput = JadeJueChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "jade-jue" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据长度用于颜色配置
    const dataLength = validatedInput.data[0].length - 1;
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      dataLength,
    );
    const colors =
      getColors(validatedInput.colors, dataLength) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 玉玦图使用极坐标系统
    const map = [
      {
        name: "名称",
        index: 0,
        isLegend: true,
        function: "objCol",
        configurable: true,
        radiusIndex: 0,
        type: "",
      },
      {
        name: "值",
        index: 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        angleIndex: 0,
        type: "pie",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, dataLength).map((color: string) => ({
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

    // 构建显示配置 - 玉玦图的特殊配置
    const display = {
      pie: {
        gapPercentage: validatedInput.gapPercentage || 70,
        innerRadiusRatio: validatedInput.innerRadius || 0.2,
        rotateDirection: validatedInput.rotateDirection || "clockwise",
        startAngle: validatedInput.startAngle || 0,
        drawAngle: validatedInput.drawAngle || 270, // 玉玦图的关键特征
        border: {
          radius: 4,
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      numberLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "outside" as const,
        fontFamily: "Misans 常规",
        fontSize: 12,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        suffix: "",
      },
      highlight: false,
      overlap: false,
    };

    // 构建极坐标轴配置（玉玦图一般不显示轴）
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
            show: false,
            fontFamily: "Misans 常规",
            fontSize: 12,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            direction: "horizontal",
            suffix: "",
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          position: "outside" as const,
          type: "value" as const,
          stepOfLabel: "auto" as const,
          range: [],
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
            show: true,
            fontFamily: "Misans 常规",
            fontSize: 14,
            color: getAxisLabelColorByTheme(mergedInput.theme || "light"),
            angle: 0,
          },
          grid: {
            show: false,
            width: 1,
            color: getGridColorByTheme(mergedInput.theme || "light"),
            type: "solid" as const,
          },
          type: "category" as const,
          position: "inside" as const,
        },
      ],
    };

    // 生成通用配置
    const title = generateDefaultTitle(
      mergedInput.title,
      mergedInput.subtitle,
      mergedInput.theme || "light",
    );
    const background = generateDefaultBackground(mergedInput.theme || "light");
    const legend = generateDefaultLegend(false, mergedInput.theme || "light");

    // 构建最终配置
    const props = {
      type: "jade-jue" as const,
      title,
      background,
      map,
      fill,
      display,
      legend,
      label,
      axis,
      numberFormat: {
        separatorType: "1000.00" as const,
        decimalPlaces: null,
      },
      animation: generateDefaultAnimation("jade-jue"),
      tooltip: true,
      padding: {
        top: 20,
        bottom: 23,
        left: 24,
        right: 24,
      },
    };

    return {
      data: validatedInput.data,
      pipe: "key_value",
      props,
    };
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   return await schemaMerger.getMergedSchema("jade-jue");
  // }

  // 数据验证方法
  validateData(data: any[][]): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    // 检查每一行数据格式：[字符串, 数字]
    for (const row of data) {
      if (!Array.isArray(row) || row.length !== 2) {
        return false;
      }
      if (typeof row[0] !== "string" || typeof row[1] !== "number") {
        return false;
      }
    }

    return true;
  }

  // 获取图表元数据
  getChartMetadata() {
    return {
      type: "jade-jue",
      name: "玉玦图",
      description: "特殊的饼图变体，具有独特的弧形外观，常用于百分比展示",
      category: "pie",
      dataFormat: "key_value",
      minDataColumns: 2,
      maxDataColumns: 2,
      features: ["partial-circle", "jade-shape", "percentage-display"],
    };
  }
}
