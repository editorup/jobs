import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
  BaseChartInputSchema,
} from "../interfaces/chart-tool.interface";
import {
  generateDefaultTitle,
  generateDefaultBackground,
  generateDefaultLegend,
  getThemeColors,
  createChartOutput,
  getColors,
  getLabelColorByTheme,
} from "../utils/chart-helpers";

// 弦图特定输入接口
export interface ChordChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 三列数据格式: [source, target, value]
  colors?: string[];
  fillOpacity?: number; // 填充透明度
  lineColor?: "gradient" | string; // 连线颜色
  nodeAngle?: number; // 节点角度
  trunkAngle?: number; // 主干角度
  trunkIndex?: number; // 主干索引
  arrowHeight?: number; // 箭头高度
  branchAngle?: number; // 分支角度
  ribbonAngle?: number; // 弦带角度
  cornerRadius?: number; // 圆角半径
  nodeThickness?: number; // 节点厚度
}

// 弦图特定输出接口
export interface ChordChartOutput extends BaseChartOutput {
  props: {
    type: "chord";
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
      chord: {
        border: any;
        lineColor: string;
        nodeAngle: number;
        trunkAngle: number;
        trunkIndex: number;
        arrowHeight: number;
        branchAngle: number;
        fillOpacity: number;
        ribbonAngle: number;
        cornerRadius: number;
        nodeThickness: number;
      };
    };
    legend: any;
    label: any;
    axis: any;
    animation: any;
    tooltip: boolean;
    padding: any;
    numberFormat: any;
  };
}

// Zod验证schema
export const ChordChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
  fillOpacity: z.number().min(0).max(1).optional().default(0.3),
  lineColor: z.union([z.literal("gradient"), z.string()]).optional().default("gradient"),
  nodeAngle: z.number().optional().default(0),
  trunkAngle: z.number().optional().default(0.005),
  trunkIndex: z.number().optional().default(0),
  arrowHeight: z.number().optional().default(0),
  branchAngle: z.number().optional().default(0.005),
  ribbonAngle: z.number().optional().default(0),
  cornerRadius: z.number().optional().default(0),
  nodeThickness: z.number().optional().default(0.14),
});

export class ChordChartGenerator extends BaseChartTool {
  constructor() {
    super("chord");
  }

  protected getElementType(): string {
    return "chord";
  }

  async generateConfig(input: ChordChartInput): Promise<ChordChartOutput> {
    // 验证输入
    const validatedInput = ChordChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "chord" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    // 获取数据维度
    const dataRows = validatedInput.data[0].length;
    const dataCols = validatedInput.data[0][0]?.length || 0;

    if (dataCols < 3) {
      throw new Error("弦图需要3列数据（source、target、value）");
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

    // 构建数据映射 - 弦图的特定映射
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
        type: "chord",
      },
    ];

    // 构建填充配置
    const fill = {
      controlType: "multiple" as const,
      props: colors.slice(0, nodeCount).map((color: string) => ({
        color: { color: color, opacity: 1 },
        shadow: {
          show: false,
          type: "inner" as const,
          angle: 11,
          blur: 17,
          color: { color: color, opacity: 0.5 },
          radius: 0,
        },
        texture: {
          url: "",
        },
      })),
    };

    // 构建显示配置
    const display = {
      chord: {
        border: {
          type: "solid" as const,
          color: null,
          width: 0,
        },
        lineColor: validatedInput.lineColor || "gradient",
        nodeAngle: validatedInput.nodeAngle || 0,
        trunkAngle: validatedInput.trunkAngle || 0.005,
        trunkIndex: validatedInput.trunkIndex || 0,
        arrowHeight: validatedInput.arrowHeight || 0,
        branchAngle: validatedInput.branchAngle || 0.005,
        fillOpacity: validatedInput.fillOpacity || 0.3,
        ribbonAngle: validatedInput.ribbonAngle || 0,
        cornerRadius: validatedInput.cornerRadius || 0,
        nodeThickness: validatedInput.nodeThickness || 0.14,
      },
    };

    // 构建标签配置
    const label = {
      show: true,
      overlap: false,
      highlight: false,
      textLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 12.0,
        fontFamily: "Misans 常规",
        positionChoice: "outside-circumference" as const,
      },
      numberLabel: {
        show: true,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 14.5,
        fontFamily: "Misans 中等",
        positionChoice: "outside-circumference" as const,
        suffix: "",
      },
      ribbonLabel: {
        show: false,
        color: getLabelColorByTheme(mergedInput.theme || "light"),
        fontSize: 12,
        fontFamily: "Misans 常规",
        suffix: "",
      },
    };

    // 构建坐标轴配置 - 弦图使用angleAxis
    const axis = {
      show: false,
      angleAxis: [
        {
          line: {
            show: true,
            width: 1,
            color: { color: "#616161", opacity: 1 },
          },
          type: "value" as const,
          label: {
            show: true,
            color: { color: "#616161", opacity: 1 },
            fontSize: 5.25,
            fontFamily: "Misans 常规",
            suffix: "",
          },
          stepOfLabel: "auto" as const,
        },
      ],
    };

    // 构建动画配置
    const animation = {
      loop: false,
      show: false,
      preview: true,
      duration: 2,
      endPause: 1,
      moveStyle: "clockwise-expand" as const,
      startDelay: 0,
      transition: false,
    };

    // 构建内边距配置
    const padding = {
      top: 20,
      bottom: 23,
      left: 24,
      right: 24,
    };

    // 生成图表配置
    const result = createChartOutput("chord", mergedInput, {
      type: "chord",
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
      axis,
      animation,
      tooltip: true,
      padding,
      numberFormat: {
        separatorType: "1000.00",
        decimalPlaces: null,
      },
    });

    // 弦图使用key_value管道
    result.pipe = "key_value";

    return result as ChordChartOutput;
  }
}
