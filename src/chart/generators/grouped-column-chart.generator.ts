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
  createChartOutput,
  getColors,
  generateDefaultAnimation,
  getLabelColorByTheme,
  getAxisLineColorByTheme,
  getAxisLabelColorByTheme,
  getGridColorByTheme,
} from "../utils/chart-helpers";

// 分组柱状图特定输入接口
export interface GroupedColumnChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // [省份, 城市1, 城市2, ...] 格式
  showLabels?: boolean;
  colors?: string[];
  columnWidth?: number; // 列宽百分比 (0-1)
  groupSpacing?: number; // 组间距
}

// 分组柱状图特定输出接口
export interface GroupedColumnChartOutput extends BaseChartOutput {
  props: {
    type: "grouped-column";
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
        widthPercent: number;
        border: any;
      };
    };
    legend: any;
    label: any;
    axis: any;
  };
}

// Zod验证schema
export const GroupedColumnChartInputSchema = z.object({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  title: z.string().optional().default("分组柱状图"),
  subtitle: z.string().optional().default("副标题"),
  showLabels: z.boolean().optional().default(false),
  colors: z.array(z.string()).optional(),
  columnWidth: z.number().min(0.1).max(1).optional().default(0.6),
  groupSpacing: z.number().min(0).max(1).optional().default(0.1),
  theme: z.enum(["light", "dark"]).optional().default("light"),
  width: z.number().optional().default(700),
  height: z.number().optional().default(400),
});

export class GroupedColumnChartGenerator extends BaseChartTool {
  constructor() {
    super("grouped-column");
  }

  protected getElementType(): string {
    return "bar";
  }

  async generateConfig(
    input: GroupedColumnChartInput,
  ): Promise<GroupedColumnChartOutput> {
    // 验证输入
    const validatedInput = GroupedColumnChartInputSchema.parse(input);
    const inputWithChartType = {
      ...validatedInput,
      chartType: "grouped-column",
    };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据结构信息
    const headerRow = validatedInput.data[0][0];
    const seriesCount = headerRow.length - 1; // 除去第一列（类别列）的数据系列数量

    // 获取默认配置和颜色
    const themeColors = getThemeColors(
      mergedInput.theme || "light",
      seriesCount,
    );
    const colors =
      getColors(validatedInput.colors, seriesCount) ||
      themeColors.map((c: any) => c.color);

    // 构建数据映射 - 第一列是X轴对象，其余列是数值列
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
      // 为每个数据系列创建映射
      ...Array.from({ length: seriesCount }, (_, i) => ({
        name: "数值列",
        index: i + 1,
        isLegend: false,
        function: "vCol",
        configurable: true,
        yAxisIndex: 0,
        type: "bar",
      })),
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, seriesCount).map((color: string) => ({
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
        widthPercent: validatedInput.columnWidth || 0.6,
        border: {
          radius: [4, 4, 0, 0],
          type: "solid" as const,
          width: 0,
          color: null,
        },
      },
    };

    // 构建标签配置
    const label = {
      show: validatedInput.showLabels || false,
      barLabel: {
        show: validatedInput.showLabels || false,
        positionChoice: "top" as const,
        fontFamily: "Misans 常规",
        fontSize: 16,
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
            fontSize: 14,
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
          stepOfLabel: "auto" as const,
          range: [],
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
    const legend = generateDefaultLegend(true, mergedInput.theme || "light");

    // 构建最终配置
    const props = {
      type: "grouped-column" as const,
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
      animation: generateDefaultAnimation("grouped-column"),
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
      pipe: "cross",
      props,
    };
  }

  // async loadSchema(): Promise<any> {
  //   const schemaMerger = new SchemaMerger();
  //   return await schemaMerger.getMergedSchema("grouped-column");
  // }

  // 数据验证方法
  validateData(data: any[][]): boolean {
    if (!Array.isArray(data) || data.length < 2) {
      return false;
    }

    const headerRow = data[0];
    if (!Array.isArray(headerRow) || headerRow.length < 2) {
      return false;
    }

    // 检查所有数据行是否有相同的列数
    for (let i = 1; i < data.length; i++) {
      if (!Array.isArray(data[i]) || data[i].length !== headerRow.length) {
        return false;
      }
      // 检查第一列是否为字符串（类别），其余列是否为数字
      if (typeof data[i][0] !== "string") {
        return false;
      }
      for (let j = 1; j < data[i].length; j++) {
        if (typeof data[i][j] !== "number") {
          return false;
        }
      }
    }

    return true;
  }

  // 获取图表元数据
  getChartMetadata() {
    return {
      type: "grouped-column",
      name: "分组柱状图",
      description:
        "支持多系列数据的分组柱状图，适用于比较不同类别下多个系列的数值",
      category: "column",
      dataFormat: "cross",
      minDataColumns: 2,
      maxDataColumns: 10,
      features: ["grouping", "multiple-series", "comparison"],
    };
  }
}
