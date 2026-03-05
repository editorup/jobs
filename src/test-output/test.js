import { chartTypeRegistry, initializeChartRegistry } from '@editorup/jobs-chart'


await initializeChartRegistry()

// 获取对应的图表工具
const chartTool = chartTypeRegistry.getTool("bar-progress")

// 准备图表工具的输入数据
const chartInput = {
  chartType: "bar-progress",
  data: [
    [
      ["产品A", 120, 1],
      ["产品B", 180, 1],
      ["产品C", 90, 1],
    ],
  ],
  title: "销售数据",
  subtitle: "2024年第一季度",
  theme: "dark",
  width: 180,
  height: 180
}

// 使用图表工具生成配置
const config = (await chartTool.generateConfig(chartInput))
console.log(config.props.label)