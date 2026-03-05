import { z } from "zod";
import {
  BaseChartTool,
  BaseChartInput,
  BaseChartOutput,
  BaseChartInputSchema,
  BaseChartOutputSchema,
} from "../interfaces/chart-tool.interface";
import {
  generateDefaultBackground,
  createChartOutput,
  getColors,
  getThemeColors,
} from "../utils/chart-helpers";

// 词云图特定输入接口
export interface WordCloudChartInput extends BaseChartInput {
  data: Array<Array<Array<string | number>>>; // 两列数据格式: [词语, 权重]
  colors?: string[];
}

// 词云图特定输出接口
export interface WordCloudChartOutput extends BaseChartOutput {
  props: {
    type: "word-cloud";
    title: any;
    background: any;
    map: Array<{
      name: string;
      index: number;
      type: string;
      function: string;
      isLegend: boolean;
      xAxisIndex?: number;
      yAxisIndex?: number;
      configurable: boolean;
    }>;
    fill: any;
    display: {
      cloud: {
        fontSize: [number, number];
        maskType: string;
        fontFamily: string;
        maskOpacity: number;
        textContent: string;
        imageContent: string;
        colorContrast: number;
        symbolContent: string;
        maskFontFamily: string;
        orientationOrder: [number, number];
      };
    };
    padding: any;
    tooltip: boolean;
    animation: any;
  };
}

// Zod验证schema
export const WordCloudChartInputSchema = BaseChartInputSchema.extend({
  data: z.array(z.array(z.array(z.union([z.string(), z.number()])))),
  colors: z.array(z.string()).optional(),
});

export class WordCloudChartGenerator extends BaseChartTool {
  constructor() {
    super("word-cloud");
  }

  protected getElementType(): string {
    return "word-cloud";
  }

  async generateConfig(
    input: WordCloudChartInput,
  ): Promise<WordCloudChartOutput> {
    const validatedInput = WordCloudChartInputSchema.parse(input);
    const inputWithChartType = { ...validatedInput, chartType: "word-cloud" };
    const mergedInput = this.mergeWithDefaults(inputWithChartType);

    const dataCols = validatedInput.data[0]?.[0]?.length || 0;
    if (dataCols < 2) {
      throw new Error("词云图需要2列数据（词语、权重）");
    }

    const themeColors = getThemeColors(mergedInput.theme || "light", 1);
    const colors =
      getColors(validatedInput.colors, 1) ||
      themeColors.map((c: { color: string }) => c.color);
    const fillColor = colors[0] || "#20c481";

    const map = [
      {
        name: "词语",
        type: "",
        index: 0,
        function: "objCol" as const,
        isLegend: true,
        xAxisIndex: 0,
        configurable: true,
      },
      {
        name: "权重",
        type: "word",
        index: 1,
        function: "vCol" as const,
        isLegend: false,
        yAxisIndex: 0,
        configurable: true,
      },
    ];

    const fill = {
      controlType: "single" as const,
      props: [
        {
          color: { color: fillColor, opacity: 1 },
          shadow: {
            blur: 0,
            show: false,
            type: "outer" as const,
            angle: 45,
            color: { color: "#000000", opacity: 0.5 },
            radius: 0,
          },
          texture: { url: "" },
        },
      ],
    };

    const display = {
      cloud: {
        fontSize: [25, 50] as [number, number],
        maskType: "symbol",
        fontFamily: "阿里巴巴普惠体 加粗",
        maskOpacity: 0.02,
        textContent: "AITUBIAO",
        imageContent:
          "https://core-dev.oss-cn-hangzhou.aliyuncs.com/static/images/wps/wps_%E6%85%A7%E6%8A%A5.png",
        colorContrast: 0,
        symbolContent:
          "https://cdn.core.editorup.com/resource/vector/icon/office/chat-dots-fill.svg",
        maskFontFamily: "Misans 常规",
        orientationOrder: [0, 45] as [number, number],
      },
    };

    const animation = {
      loop: false,
      show: false,
      duration: 2,
      endPause: 1,
      moveStyle: null as string | null,
      startDelay: 0,
      transition: true,
    };

    const padding = {
      top: 20,
      left: 24,
      right: 24,
      bottom: 23,
    };

    const result = createChartOutput("word-cloud", mergedInput, {
      type: "word-cloud",
      title: {
        show: false,
        subTitle: {
          show: true,
          text: mergedInput.subtitle || "副标题",
          color: { color: "#333333", opacity: 1 },
          fontSize: 16,
          fontFamily: "Misans",
        },
        mainTitle: {
          show: true,
          text: mergedInput.title || "词云图",
          color: { color: "#333333", opacity: 1 },
          fontSize: 24,
          position: { x: "center" as const, y: "top" as const },
          fontFamily: "Misans",
        },
      },
      background: generateDefaultBackground(mergedInput.theme || "light"),
      map,
      fill,
      display,
      padding,
      tooltip: false,
      animation,
    });

    result.pipe = "key_value";

    return result as WordCloudChartOutput;
  }

  getInputSchema() {
    return WordCloudChartInputSchema;
  }

  getOutputSchema() {
    return BaseChartOutputSchema;
  }
}
