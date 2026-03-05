import {
  BaseChartInput,
  BaseChartOutput,
  ChartType,
} from "../interfaces/chart-tool.interface";
import chroma from "chroma-js";

/**
 * 默认颜色主题
 */
export const DEFAULT_COLORS = {
  light: [
    { color: "#5AAEF3", opacity: 1 },
    { color: "#FF6B9D", opacity: 1 },
    { color: "#4ECDC4", opacity: 1 },
    { color: "#45B7D1", opacity: 1 },
    { color: "#96CEB4", opacity: 1 },
    { color: "#FFEAA7", opacity: 1 },
    { color: "#DDA0DD", opacity: 1 },
    { color: "#98D8C8", opacity: 1 },
  ],
  dark: [
    { color: "#3B82F6", opacity: 1 },
    { color: "#EF4444", opacity: 1 },
    { color: "#10B981", opacity: 1 },
    { color: "#F59E0B", opacity: 1 },
    { color: "#8B5CF6", opacity: 1 },
    { color: "#06B6D4", opacity: 1 },
    { color: "#84CC16", opacity: 1 },
    { color: "#F97316", opacity: 1 },
  ],
};

/**
 * 生成默认标题配置
 */
export function generateDefaultTitle(
  title?: string,
  subtitle?: string,
  theme: "light" | "dark" = "light"
) {
  return {
    show: !!title,
    mainTitle: {
      show: !!title,
      text: title || "图表标题",
      fontFamily: "Misans 中等",
      fontSize: 28,
      color: getMainTitltColorByTheme(theme),
      position: { x: "center", y: "top" },
    },
    subTitle: {
      show: !!subtitle,
      text: subtitle || "",
      fontSize: 18,
      color: getSubTitltColorByTheme(theme),
      fontFamily: "Misans 常规",
    },
  };
}

/**
 * 生成默认背景配置
 */
export function generateDefaultBackground(theme: "light" | "dark" = "light") {
  return {
    show: false,
    color: {
      color: theme === "light" ? "#ffffff" : "#1a1a1a",
      opacity: 1,
    },
    border: { radius: 0 },
    blur: 0,
  };
}

/*
默认显示图例图表类型
*/
export const DEFAULT_SHOW_LEGEND_CHART_TYPES = [
  "stacked-column",
  "stacked-bar",
  "stacked-area",
  "river-area",
  "mixed-line-stacked-column",
  "mixed-line-grouped-column",
  "grouped-column",
  "grouped-bar",
  "difference-arrow-column",
  "difference-arrow-bar",
  "descartes-heatmap",
  "cascaded-area",
  "butterfly",
  "basic-radar",
  "basic-line",
];

/**
 * 生成默认图例配置
 */
export function generateDefaultLegend(
  show: boolean = false,
  theme: "light" | "dark" = "light"
) {
  return {
    show,
    display: "horizontal",
    position: { x: "center", y: "bottom" },
    fontFamily: "Misans 常规",
    fontSize: 12,
    color: getLegendColorByTheme(theme),
  };
}

/**
 * 生成默认数字格式配置
 */
export function generateDefaultNumberFormat() {
  return {
    separatorType: "1000.00",
    decimalPlaces: null,
  };
}

/**
 * 生成默认动画配置
 */
export function generateDefaultAnimation(chartType: ChartType) {
  return {
    show: true,
    transition: true,
    moveStyle: getAnimationOption(chartType)[1].en_name || null,
    duration: 2,
    startDelay: 0,
    endPause: 1,
    loop: false,
  };
}

/**
 * 生成默认内边距配置
 */
export function generateDefaultPadding() {
  return {
    top: 20,
    bottom: 23,
    left: 24,
    right: 24,
  };
}

/**
 * 根据主题获取颜色
 */
export function getThemeColors(
  theme: "light" | "dark" = "light",
  count: number = 1
) {
  const colors = DEFAULT_COLORS[theme];
  const result = [];

  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }

  return result;
}

/**
 * 为图表生成颜色
 * 重点关注：区分度、无障碍性、视觉舒适性
 */
function generateChartColors(
  baseColors: string[],
  totalCount: number
): string[] {
  const result = [...baseColors];
  const remainingCount = totalCount - baseColors.length;

  if (remainingCount <= 0) return result;

  // 为图表优化的色相分布：确保最大区分度
  const usedHues = baseColors.map((color) => {
    const [h] = chroma(color).hsl();
    return h || 0;
  });

  // 计算所有色相的"禁区"（避免生成太相近的颜色）
  const minHueDistance = 30; // 最小色相距离

  for (let i = 0; i < remainingCount; i++) {
    const baseIndex = i % baseColors.length;
    const baseColor = chroma(baseColors[baseIndex]);
    const [baseHue, baseSat, baseLit] = baseColor.hsl();

    // 寻找最佳的新色相
    let bestHue = baseHue || 0;
    let maxDistance = 0;

    // 尝试多个色相，选择与现有颜色距离最远的
    for (let testHue = 0; testHue < 360; testHue += 15) {
      const minDistanceToExisting = Math.min(
        ...usedHues.map((existingHue) => {
          const distance = Math.min(
            Math.abs(testHue - existingHue),
            360 - Math.abs(testHue - existingHue)
          );
          return distance;
        })
      );

      if (
        minDistanceToExisting > maxDistance &&
        minDistanceToExisting >= minHueDistance
      ) {
        maxDistance = minDistanceToExisting;
        bestHue = testHue;
      }
    }

    // 如果找不到足够远的色相，使用均匀分布
    if (maxDistance < minHueDistance) {
      bestHue = ((baseHue || 0) + (i + 1) * (360 / remainingCount)) % 360;
    }

    // 调整饱和度和亮度以适合图表显示
    const newSaturation = Math.max(
      0.6,
      Math.min(0.9, (baseSat || 0.7) + (i % 2 === 0 ? 0.1 : -0.1))
    );
    const newLightness = Math.max(
      0.4,
      Math.min(
        0.7,
        (baseLit || 0.5) + (i % 3 === 0 ? 0.1 : i % 3 === 1 ? -0.1 : 0)
      )
    );

    const newColor = chroma.hsl(bestHue, newSaturation, newLightness).hex();
    result.push(newColor);
    usedHues.push(bestHue);
  }

  return result;
}

const rand = (a: number, b: number) => a + (b - a) * Math.random();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function shuffle(arr: string[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function toReadableHex(c: any) {
  let col = c;
  if (chroma.contrast(col, "white") < 4.5)
    col = col.set("hsl.l", clamp(col.get("hsl.l") * 1.1, 0, 1));
  if (chroma.contrast(col, "black") < 4.5)
    col = col.set("hsl.l", clamp(col.get("hsl.l") * 0.9, 0, 1));
  return col.hex().toUpperCase();
}

const HUE_STEP = 10,
  SAT_JIT = 0.04,
  LIT_JIT = 0.15;
const SAT_RANGE = [0.4, 0.6],
  LIT_RANGE = [0.4, 0.9],
  MAX_TRIES = 25;

// 生成后备颜色的函数
function generateFallbackColors(count: number): string[] {
  const fallbackColors: string[] = [];
  const baseHues = [0, 30, 60, 120, 180, 210, 240, 300]; // 基础色相

  for (let i = 0; i < count; i++) {
    const hue =
      baseHues[i % baseHues.length] + Math.floor(i / baseHues.length) * 15;
    const saturation = 0.5 + (i % 3) * 0.1; // 0.5, 0.6, 0.7
    const lightness = 0.5 + (i % 4) * 0.1; // 0.5, 0.6, 0.7, 0.8

    const color = chroma.hsl(hue % 360, saturation, lightness);
    fallbackColors.push(toReadableHex(color));
  }

  return fallbackColors;
}

export function getColors(seeds: string[] | undefined, totalCount: number) {
  if (!seeds || seeds.length === 0) {
    return [];
  }
  if (totalCount <= 0) {
    return [];
  }
  if (seeds.length >= totalCount) {
    return seeds.slice(0, totalCount);
  }

  const used = new Set(seeds.map((h) => h.toUpperCase()));
  const out = [...used];
  const shuffledSeeds = shuffle([...seeds]); // 只shuffle一次
  let seedIndex = 0;
  let totalTries = 0;
  const maxTotalTries = MAX_TRIES * totalCount; // 防止无限循环

  // 简化为单层循环，提高效率
  while (out.length < totalCount && totalTries < maxTotalTries) {
    const seed = shuffledSeeds[seedIndex % shuffledSeeds.length];
    const [h, s, l] = chroma(seed).hsl();

    const hueVariation = HUE_STEP;
    const h1 =
      (h + (Math.random() < 0.5 ? hueVariation : -hueVariation) + 360) % 360;

    const s1 = clamp(s + rand(-SAT_JIT, SAT_JIT), SAT_RANGE[0], SAT_RANGE[1]);
    const l1 = clamp(l + rand(-LIT_JIT, LIT_JIT), LIT_RANGE[0], LIT_RANGE[1]);

    const hex = toReadableHex(chroma.hsl(h1, s1, l1));

    if (!used.has(hex)) {
      used.add(hex);
      out.push(hex);
      seedIndex++; // 成功生成后切换到下一个seed
    } else {
      // 如果连续失败太多次，增加变化幅度或切换seed
      if (totalTries % 10 === 9) {
        seedIndex = (seedIndex + 1) % shuffledSeeds.length;
      }
    }

    totalTries++;
  }

  // 如果仍然不够，使用预定义的后备颜色
  if (out.length < totalCount) {
    const fallbackColors = generateFallbackColors(totalCount - out.length);
    fallbackColors.forEach((color: string) => {
      if (!used.has(color)) {
        out.push(color);
        used.add(color);
      }
    });
  }

  return out.slice(0, totalCount);
}

/**
 * 生成默认填充配置
 */
export function generateDefaultFill(
  chartType: string,
  theme: "light" | "dark" = "light",
  dataLength: number = 1
) {
  const colors = getThemeColors(theme, dataLength);
  const controlType = dataLength > 1 ? "multiple" : "single";

  return {
    controlType,
    props: colors.map((color) => ({
      color,
      shadow: {
        show: false,
        type: "outer",
        angle: 45,
        blur: chartType.includes("progress") ? 2 : 5,
        color: {
          color: "#000000",
          opacity: chartType.includes("progress") ? 0.1 : 0.3,
        },
        radius: chartType.includes("progress") ? 1 : 3,
      },
      border: {
        type: "solid",
        width: 0,
        color: null,
      },
    })),
  };
}

/**
 * 生成默认标签配置
 */
export function generateDefaultLabel(theme: "light" | "dark" = "light") {
  return {
    show: false,
    numberLabel: {
      show: false,
      positionChoice: "right",
      fontFamily: "Misans 常规",
      fontSize: 21,
      color: getLabelColorByTheme(theme),
    },
    highlight: false,
    overlap: false,
  };
}

/**
 * 处理图表数据格式
 */
export function processChartData(data: any[][][]): any[][][] {
  if (!data || data.length === 0) {
    throw new Error("Data is required for chart generation");
  }

  // 确保数据格式为三维数组
  return data;
}

/**
 * 验证数据格式
 */
export function validateChartData(data: any[][][]): void {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array");
  }

  if (data[0].length < 2) {
    throw new Error("Data must have at least 2 rows (header and data)");
  }

  const headerLength = data[0][0]?.length || 0;
  if (headerLength < 2) {
    throw new Error("Data must have at least 2 columns");
  }

  // 验证每行数据长度一致
  for (let i = 1; i < data[0].length; i++) {
    if (data[0][i].length !== headerLength) {
      throw new Error(`Row ${i} has inconsistent column count`);
    }
  }
}

/**
 * 生成图表的默认 props 配置
 */
export function generateDefaultProps(
  chartType: ChartType,
  input: BaseChartInput
): BaseChartOutput["props"] {
  const theme = input.theme || "light";
  const dataLength = input.data ? input.data[0].length - 1 : 1; // 减去header行

  return {
    type: chartType,
    title: generateDefaultTitle(input.title, input.subtitle, theme),
    background: generateDefaultBackground(theme),
    legend: generateDefaultLegend(
      DEFAULT_SHOW_LEGEND_CHART_TYPES.includes(chartType),
      theme
    ),
    numberFormat: generateDefaultNumberFormat(),
    animation: generateDefaultAnimation(chartType),
    tooltip: true,
    padding: generateDefaultPadding(),
    fill: generateDefaultFill(chartType, theme, dataLength),
    label: generateDefaultLabel(theme),
  };
}

/**
 * 创建完整的图表配置输出
 */
export function createChartOutput(
  chartType: ChartType,
  input: BaseChartInput,
  customProps: Partial<BaseChartOutput["props"]> = {}
): BaseChartOutput {
  if (!input.data) {
    throw new Error("Data is required for chart generation");
  }

  validateChartData(input.data);

  const processedData = input.data;
  const defaultProps = generateDefaultProps(chartType, input);

  return {
    data: processedData,
    pipe: "key_value",
    props: {
      ...defaultProps,
      ...customProps,
    },
  };
}

/**
 * 深度合并对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

export function getMainTitltColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#333333", opacity: 1 }
    : { color: "#FFFFFF", opacity: 1 };
}

export function getSubTitltColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#616161", opacity: 1 }
    : { color: "#FFFFFF", opacity: 0.9 };
}

export function getLabelColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#333333", opacity: 1 }
    : { color: "#FFFFFF", opacity: 1 };
}

export function getLegendColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#333333", opacity: 1 }
    : { color: "#FFFFFF", opacity: 1 };
}

export function getGridColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#D9D9D9", opacity: 0.5 }
    : { color: "#FFFFFF", opacity: 0.2 };
}

export function getAxisLineColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#4D4D4D", opacity: 1 }
    : { color: "#FFFFFF", opacity: 0.4 };
}

export function getAxisLabelColorByTheme(theme: "light" | "dark") {
  return theme === "light"
    ? { color: "#000000", opacity: 1 }
    : { color: "#FFFFFF", opacity: 1 };
}

export function getAnimationOption(type: ChartType) {
  const barOption = [
    {
      gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
      cn_name: '无动画',
      en_name: 'no-animation',
      value: null
    },
    {
      gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/vertical_synchronous_stretching.gif',
      cn_name: '纵向同步拉伸',
      en_name: 'vertical-sync-stretch',
      value: 'vertical-sync-stretch'
    },
    {
      gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/horizontal_classified_expansion.gif',
      cn_name: '纵向依次拉伸',
      en_name: 'vertical-staggered-stretch',
      value: 'vertical-staggered-stretch'
    },
    {
      gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/horizontal_synchronous_expansion.gif',
      cn_name: '横向同步展开',
      en_name: 'horizontal-sync-expand',
      value: 'horizontal-sync-expand'
    },
    {
      gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/horizontal_sequential_expansion.gif',
      cn_name: '横向依次展开',
      en_name: 'horizontal-staggered-expand',
      value: 'horizontal-staggered-expand'
    }
  ]

  switch (type) {
    case 'basic-pie':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_pie/wheel.gif',
          cn_name: '轮子',
          en_name: 'wheel',
          value: 'wheel'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_pie/blinds.gif',
          cn_name: '百叶窗',
          en_name: 'louver',
          value: 'louver'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_pie/folding_fan.gif',
          cn_name: '折扇',
          en_name: 'folding-fan',
          value: 'folding-fan'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_pie/radial_expansion.gif',
          cn_name: '径向展开',
          en_name: 'radial-expand',
          value: 'radial-expand'
        }
      ]
    case 'grouped-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/vertical_classified_expansion.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'horizontal-categorical-stretch',
          value: 'horizontal-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_bar/horizontal_classified_expansion.gif',
          cn_name: '横向分类展开',
          en_name: 'vertical-categorical-expand',
          value: 'vertical-categorical-expand'
        }
      ]
    case 'grouped-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/horizontal_classified_expansion.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/grouped_column/vertical_classified_expansion.gif',
          cn_name: '横向分类展开',
          en_name: 'horizontal-categorical-expand',
          value: 'horizontal-categorical-expand'
        }
      ]
    case 'stacked-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_synchronous_stretching.gif',
          cn_name: '横向同步拉伸',
          en_name: 'horizontal-sync-stretch',
          value: 'horizontal-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_sequential_stretching.gif',
          cn_name: '横向依次拉伸',
          en_name: 'horizontal-staggered-stretch',
          value: 'horizontal-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_synchronous_expansion.gif',
          cn_name: '纵向同步展开',
          en_name: 'vertical-sync-expand',
          value: 'vertical-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_sequential_expansion.gif',
          cn_name: '纵向依次展开',
          en_name: 'vertical-staggered-expand',
          value: 'vertical-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_classified_stretching.gif',
          cn_name: '横向分类拉伸',
          en_name: 'horizontal-categorical-stretch',
          value: 'horizontal-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_classified_expansion.gif',
          cn_name: '横向整体拉伸',
          en_name: 'horizontal-unified-expand',
          value: 'horizontal-unified-expand'
        }
      ]
    case 'stacked-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_classified_stretching.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_classified_expansion.gif',
          cn_name: '纵向整体拉伸',
          en_name: 'vertical-unified-stretch',
          value: 'vertical-unified-stretch'
        }
      ]
    case 'basic-line':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_line/sequential_drawing.gif',
          cn_name: '依次绘制',
          en_name: 'sequential-draw',
          value: 'sequential-draw'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_line/simultaneous_drawing.gif',
          cn_name: '同时绘制',
          en_name: 'simultaneous-draw',
          value: 'simultaneous-draw'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_line/thread_a_needle.gif',
          cn_name: '穿针引线',
          en_name: 'threading',
          value: 'threading'
        }
      ]
    case 'cascaded-area':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cascaded_area/horizontal_expansion.gif',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cascaded_area/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-sequential-expand',
          value: 'vertical-sequential-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cascaded_area/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-synchronous-expand',
          value: 'vertical-synchronous-expand'
        }
      ]
    case 'stacked-area':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_area/horizontal_expansion.gif',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_area/synchronized_display.gif',
          cn_name: '同步展示面',
          en_name: 'synchronous-display',
          value: 'synchronous-display'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_area/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-synchronous-expand',
          value: 'vertical-synchronous-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_area/distributed_display.gif',
          cn_name: '分步展示面',
          en_name: 'distributed-display',
          value: 'distributed-display'
        }
      ]
    case 'river-area':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/river/horizontal_expansion.gif',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        }
      ]
    case 'mixed-line-grouped-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/horizontal_classified_expansion.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_grouped_column/vertical_classified_expansion.gif',
          cn_name: '横向分类展开',
          en_name: 'horizontal-categorical-expand',
          value: 'horizontal-categorical-expand'
        }
      ]
    case 'mixed-line-stacked-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/vertical_classified_expansion.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/mixed_line_and_stacked_column/horizontal_classified_expansion.gif',
          cn_name: '纵向整体拉伸',
          en_name: 'vertical-unified-stretch',
          value: 'vertical-unified-stretch'
        }
      ]
    case 'difference-arrow-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/horizontal_classified_expansion.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_column/vertical_classified_expansion.gif',
          cn_name: '横向分类展开',
          en_name: 'horizontal-categorical-expand',
          value: 'horizontal-categorical-expand'
        }
      ]
    case 'difference-arrow-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/horizontal_classified__stretching.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'horizontal-categorical-stretch',
          value: 'horizontal-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/difference_arrow_bar/horizontal_classified_expansion.gif',
          cn_name: '横向分类展开',
          en_name: 'vertical-categorical-expand',
          value: 'vertical-categorical-expand'
        }
      ]
    case 'basic-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        }
      ]
    case 'rose-pie':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/rose/radial_expansion.gif',
          cn_name: '径向展开',
          en_name: 'radial-expand',
          value: 'radial-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/rose/clockwise_expansion.gif',
          cn_name: '顺时针展开',
          en_name: 'clockwise-expand',
          value: 'clockwise-expand'
        }
      ]
    case 'descartes-heatmap':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cartesian_heat_map/fade_in.gif',
          cn_name: '淡入',
          en_name: 'fade-in',
          value: 'fade-in'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cartesian_heat_map/horizontal_appearance.gif',
          cn_name: '横向出现',
          en_name: 'horizontal-appear',
          value: 'horizontal-appear'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/cartesian_heat_map/sequential_appearance.gif',
          cn_name: '依次出现',
          en_name: 'sequential-appear',
          value: 'sequential-appear'
        }
      ]
    case 'check-in-bubble':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/check_in_bubble/fade_in.gif',
          cn_name: '淡入',
          en_name: 'fade-in',
          value: 'fade-in'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/check_in_bubble/slide_in_horizontally.gif',
          cn_name: '横向出现',
          en_name: 'horizontal-appear',
          value: 'horizontal-appear'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/check_in_bubble/sequential_appearance.gif',
          cn_name: '依次出现',
          en_name: 'sequential-appear',
          value: 'sequential-appear'
        }
      ]
    case 'basic-radar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/radar/synchronous_expansion.gif',
          cn_name: '同步展开',
          en_name: 'synchronous-expand',
          value: 'synchronous-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/radar/sequential_expansion.gif',
          cn_name: '依次展开',
          en_name: 'sequential-expand',
          value: 'sequential-expand'
        }
      ]
    case 'single-layer-treemap':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/single_layer_ treemap/diagonal_stretch.gif',
          cn_name: '对角拉伸',
          en_name: 'diagonal-stretch',
          value: 'diagonal-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/single_layer_ treemap/sequential_diagonal_stretch.gif',
          cn_name: '对角逐次拉伸',
          en_name: 'diagonal-sequential-stretch',
          value: 'diagonal-sequential-stretch'
        }
      ]
    case 'sankey':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/sankey/horizontal_expansion.gif',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        }
      ]
    case 'funnel':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/funnel/vertical_expansion.gif',
          cn_name: '纵向展开',
          en_name: 'vertical-expand',
          value: 'vertical-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/funnel/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        }
      ]
    case 'donut-progress':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/donut_progress/wheel.gif',
          cn_name: '轮子',
          en_name: 'wheel',
          value: 'wheel'
        }
      ]
    case 'jade-jue':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/jade_jue/clockwise_expansion.gif',
          cn_name: '顺时针展开',
          en_name: 'clockwise-expand',
          value: 'clockwise-expand'
        }
      ]
    case 'bar-progress':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/image/clzb5c3sn0000j5yc61l9fc97/cm23c9yux0000otruh972f6yi/1728578870279',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        }
      ]
    case 'basic-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        }
      ]
    case 'compose-waterfall':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/compose_waterfall/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        }
      ]
    case 'butterfly':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/butterfly/left_to_right_stretch.gif',
          cn_name: '左右拉伸',
          en_name: 'left-right-stretch',
          value: 'left-right-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/butterfly/top_to_bottom.gif',
          cn_name: '从上至下',
          en_name: 'top-to-bottom',
          value: 'top-to-bottom'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/butterfly/bottom_to_top.gif',
          cn_name: '从下至上',
          en_name: 'bottom-to-top',
          value: 'bottom-to-top'
        }
      ]
    case 'voronoi':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/voronoi/sequential_appearance.gif',
          cn_name: '依次出现',
          en_name: 'sequential-appear',
          value: 'sequential-appear'
        }
      ]
    case 'word-cloud':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/word_cloud/sequential_appearance.gif',
          cn_name: '依次出现',
          en_name: 'sequential-appear',
          value: 'sequential-appear'
        }
      ]
    case 'liquid':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/liquid/simultaneous_rise.gif',
          cn_name: '同时上涨',
          en_name: 'sync-rise',
          value: 'sync-rise'
        }
      ]
    case 'symbol-pie':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/symbol_pie/horizontal_expansion.gif',
          cn_name: '横向展开',
          en_name: 'horizontal-expand',
          value: 'horizontal-expand'
        }
      ]
    case 'symbol-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/symbol_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/symbol_column/horizontal_classified_expansion.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        }
      ]
    case 'symbol-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/symbol_bar/vertical_synchronous_stretching.gif',
          cn_name: '横向同步拉伸',
          en_name: 'horizontal-sync-stretch',
          value: 'horizontal-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/symbol_bar/vertical_sequential_stretching.gif',
          cn_name: '横向依次拉伸',
          en_name: 'horizontal-staggered-stretch',
          value: 'horizontal-staggered-stretch'
        }
      ]
    case 'percent-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/basic_bar/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        }
      ]
    case 'percent-column':
      return barOption
    case 'percent-stacked-bar':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_synchronous_stretching.gif',
          cn_name: '横向同步拉伸',
          en_name: 'horizontal-sync-stretch',
          value: 'horizontal-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_sequential_stretching.gif',
          cn_name: '横向依次拉伸',
          en_name: 'horizontal-staggered-stretch',
          value: 'horizontal-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_synchronous_expansion.gif',
          cn_name: '纵向同步展开',
          en_name: 'vertical-sync-expand',
          value: 'vertical-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_sequential_expansion.gif',
          cn_name: '纵向依次展开',
          en_name: 'vertical-staggered-expand',
          value: 'vertical-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/vertical_classified_stretching.gif',
          cn_name: '横向分类拉伸',
          en_name: 'horizontal-categorical-stretch',
          value: 'horizontal-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_bar/horizontal_classified_expansion.gif',
          cn_name: '横向整体拉伸',
          en_name: 'horizontal-unified-expand',
          value: 'horizontal-unified-expand'
        }
      ]
    case 'percent-stacked-column':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_synchronous_stretching.gif',
          cn_name: '纵向同步拉伸',
          en_name: 'vertical-sync-stretch',
          value: 'vertical-sync-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_sequential_stretching.gif',
          cn_name: '纵向依次拉伸',
          en_name: 'vertical-staggered-stretch',
          value: 'vertical-staggered-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_synchronous_expansion.gif',
          cn_name: '横向同步展开',
          en_name: 'horizontal-sync-expand',
          value: 'horizontal-sync-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_sequential_expansion.gif',
          cn_name: '横向依次展开',
          en_name: 'horizontal-staggered-expand',
          value: 'horizontal-staggered-expand'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/vertical_classified_stretching.gif',
          cn_name: '纵向分类拉伸',
          en_name: 'vertical-categorical-stretch',
          value: 'vertical-categorical-stretch'
        },
        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/stacked_column/horizontal_classified_expansion.gif',
          cn_name: '纵向整体拉伸',
          en_name: 'vertical-unified-stretch',
          value: 'vertical-unified-stretch'
        }
      ]
    case 'chord':
      return [
        {
          gif: 'https://i.postimg.cc/brFqGbS2/20240705140319.png',
          cn_name: '无动画',
          en_name: 'no-animation',
          value: null
        },

        {
          gif: 'https://cdn.aitubiao.com/static/images/gifs/rose/clockwise_expansion.gif',
          cn_name: '顺时针展开',
          en_name: 'clockwise-expand',
          value: 'clockwise-expand'
        }
      ]

    default:
      return barOption
  }
}