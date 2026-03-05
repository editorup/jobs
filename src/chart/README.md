# 图表配置系统 (Chart Configuration System)

一个基于JSON Schema的图表配置生成器系统，为Mastra工具平台提供14种图表类型的自动化配置生成能力。

## 🌟 特性

- **14种图表类型**：涵盖基础、进度、堆叠、复杂和混合图表
- **JSON Schema驱动**：严格的类型验证和智能提示
- **自动化工具生成**：集成Mastra工具平台
- **可扩展架构**：支持自定义图表类型
- **全面测试覆盖**：自动化测试框架和覆盖率分析
- **TypeScript支持**：完整的类型安全

## 📋 目录

- [快速开始](#快速开始)
- [系统架构](#系统架构)
- [支持的图表类型](#支持的图表类型)
- [使用指南](#使用指南)
- [API参考](#api参考)
- [扩展开发](#扩展开发)
- [测试框架](#测试框架)
- [故障排除](#故障排除)

## 🚀 快速开始

### 安装依赖

```bash
npm install @mastra/core zod
```

### 基本用法

```typescript
import { BasicColumnChartGenerator } from './generators/basic-column-chart.generator';

// 创建柱状图生成器
const generator = new BasicColumnChartGenerator();

// 生成图表配置
const chartConfig = await generator.generateConfig({
  chartType: 'basic-column',
  data: [[
    ['产品A', 120],
    ['产品B', 180],
    ['产品C', 90]
  ]],
  title: '销售数据',
  subtitle: '2024年第一季度',
  theme: 'light'
});

console.log(chartConfig);
```

### 使用工厂函数

```typescript
import { createChartTool } from './utils/chart-tool-factory';
import { BasicColumnChartGenerator } from './generators/basic-column-chart.generator';

// 创建Mastra工具
const chartTool = createChartTool({
  chartTool: new BasicColumnChartGenerator()
});

// 在Mastra中使用
const result = await chartTool.execute({
  chartType: 'basic-column',
  data: [/* 数据 */],
  title: '图表标题'
});
```

## 🏗️ 系统架构

```
src/mastra/tools/chart/
├── schemas/                    # JSON Schema定义
│   ├── common.schema.json     # 公共配置定义
│   ├── basic-*.schema.json    # 基础图表Schema
│   ├── progress-*.schema.json # 进度图表Schema
│   ├── stacked-*.schema.json  # 堆叠图表Schema
│   ├── complex-*.schema.json  # 复杂图表Schema
│   └── mixed-*.schema.json    # 混合图表Schema
├── generators/                 # 图表生成器
│   ├── basic-*.generator.ts   # 基础图表生成器
│   ├── progress-*.generator.ts# 进度图表生成器
│   ├── stacked-*.generator.ts # 堆叠图表生成器
│   ├── complex-*.generator.ts # 复杂图表生成器
│   └── mixed-*.generator.ts   # 混合图表生成器
├── interfaces/                 # 接口和类型定义
│   └── chart-tool.interface.ts
├── utils/                      # 工具函数
│   ├── schema-merger.ts       # Schema合并器
│   ├── chart-tool-factory.ts  # 工具工厂
│   └── sample-json-loader.ts  # 示例加载器
├── registry/                   # 图表类型注册表
│   └── chart-type-registry.ts
├── test-framework/            # 测试框架
│   ├── chart-test-framework.ts
│   ├── test-runner.ts
│   └── test-coverage-reporter.ts
├── configs/                   # 示例配置文件
│   └── *.sample.json
└── __tests__/                # 测试文件
```

### 核心组件

#### 1. BaseChartTool 抽象基类
```typescript
export abstract class BaseChartTool {
  protected chartType: string;
  protected defaultValues: Partial<BaseChartInput>;
  
  public abstract generateConfig(input: BaseChartInput): Promise<BaseChartOutput>;
  protected abstract getElementType(): string;
}
```

#### 2. SchemaMerger 工具
负责合并公共Schema与特定图表Schema，提供缓存机制提高性能。

#### 3. ChartTestFramework 测试框架  
自动化测试系统，支持批量测试和覆盖率分析。

#### 4. ChartTypeRegistry 注册表
图表类型管理系统，支持动态加载和分类管理。

## 📊 支持的图表类型

### 基础图表 (Basic Charts)
- **basic-column**: 基础柱状图
- **basic-bar**: 基础条形图  
- **basic-pie**: 基础饼图
- **basic-line**: 基础折线图

### 进度图表 (Progress Charts)
- **bar-progress**: 条形进度图
- **donut-progress**: 环形进度图

### 堆叠图表 (Stacked Charts)
- **stacked-column**: 堆叠柱状图
- **stacked-bar**: 堆叠条形图
- **stacked-area**: 堆叠面积图

### 复杂图表 (Complex Charts)
- **voronoi**: 泰森多边形图
- **sankey**: 桑基图
- **single-layer-treemap**: 单层树图

### 混合图表 (Mixed Charts)
- **mixed-line-stacked-column**: 线条-堆叠柱状混合图
- **mixed-line-grouped-column**: 线条-分组柱状混合图

## 📖 使用指南

### 数据格式规范

#### 基础图表数据格式 (key_value管道)
```typescript
data: [[
  ['类别名称', 数值],
  ['类别A', 100],
  ['类别B', 200]
]]
```

#### 堆叠/混合图表数据格式 (cross管道)
```typescript
data: [[
  ['类别', '系列1', '系列2', '系列3'],
  ['1月', 100, 150, 80],
  ['2月', 120, 180, 90]
]]
```

#### 复杂图表数据格式
**Voronoi图**:
```typescript
data: [[
  ['一级分类', '二级对象', '数值'],
  ['类别A', '对象X', 100],
  ['类别A', '对象Y', 150]
]]
```

**Sankey图**:
```typescript
data: [[
  ['源节点', '目标节点', '流量值'],
  ['源A', '目标X', 100],
  ['源B', '目标X', 50]
]]
```

### 主题和样式配置

```typescript
const config = {
  chartType: 'basic-column',
  data: [/* 数据 */],
  title: '图表标题',
  subtitle: '副标题',
  theme: 'light', // 'light' | 'dark'
  customColors: ['#FF6B6B', '#4ECDC4', '#45B7D1'], // 可选自定义颜色
  width: 800,
  height: 600
};
```

### 高级配置选项

所有图表都支持以下高级配置（通过Schema定义）：

- **标题配置**: 字体、颜色、位置
- **图例配置**: 显示/隐藏、位置、样式
- **轴配置**: 标签、刻度、范围
- **动画配置**: 持续时间、缓动函数
- **交互配置**: 工具提示、缩放、选择
- **主题配置**: 颜色方案、字体、间距

## 🔧 API参考

### BaseChartTool API

```typescript
class YourChartGenerator extends BaseChartTool {
  constructor() {
    super('your-chart-type', {
      theme: 'light',
      // 其他默认值
    });
  }

  protected getElementType(): string {
    return 'column'; // 或其他元素类型
  }

  public async generateConfig(input: BaseChartInput): Promise<BaseChartOutput> {
    // 实现图表配置生成逻辑
  }
}
```

### 工厂函数 API

```typescript
// 创建单个工具
const tool = createChartTool({
  chartTool: new YourChartGenerator(),
  inputSchema?: customInputSchema,
  outputSchema?: customOutputSchema
});

// 批量创建工具
const tools = createChartTools([
  new BasicColumnChartGenerator(),
  new BasicBarChartGenerator()
]);
```

### 注册表 API

```typescript
import { ChartTypeRegistry } from './registry/chart-type-registry';

const registry = ChartTypeRegistry.getInstance();

// 注册图表类型
registry.register(new YourChartGenerator(), {
  name: '自定义图表',
  description: '图表描述',
  category: ChartCategory.BASIC
});

// 获取已注册类型
const types = registry.getRegisteredTypes();
const tool = registry.getTool('your-chart-type');
```

## 🧪 测试框架

### 自动化测试

```typescript
import { ChartTestFramework } from './test-framework/chart-test-framework';

const framework = new ChartTestFramework();

// 运行所有测试
const report = await framework.runAllTests();

// 运行特定类型测试
const results = await framework.runTestsForType('basic-column');
```

### 覆盖率分析

```typescript
import { TestCoverageReporter } from './test-framework/test-coverage-reporter';

const reporter = new TestCoverageReporter();
const coverage = await reporter.generateCoverageReport();

// 生成HTML报告
const html = reporter.generateHTMLReport(coverage);

// 控制台输出
reporter.printConsoleReport(coverage);
```

### 示例数据加载

```typescript
import { SampleJsonLoader } from './utils/sample-json-loader';

const loader = new SampleJsonLoader();

// 加载特定图表类型示例
const sample = loader.loadByChartType('basic-column');

// 批量加载所有示例
const allSamples = loader.loadAllSamples();
```

## 🔨 扩展开发

### 创建新图表类型

1. **定义Schema**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "allOf": [
    { "$ref": "./common.schema.json" },
    {
      "properties": {
        "data": { "$ref": "#/definitions/chartDataArray" },
        "pipe": { "const": "key_value" },
        "props": {
          "properties": {
            "type": { "const": "your-chart-type" },
            "display": {
              "properties": {
                "yourSpecificConfig": {
                  "type": "object"
                }
              }
            }
          }
        }
      }
    }
  ]
}
```

2. **实现生成器**
```typescript
export class YourChartGenerator extends BaseChartTool {
  constructor() {
    super('your-chart-type');
  }

  protected getElementType(): string {
    return 'your-element';
  }

  public async generateConfig(input: BaseChartInput): Promise<BaseChartOutput> {
    this.validateInput(input);
    const mergedInput = this.mergeWithDefaults(input);
    
    return {
      data: mergedInput.data || [],
      pipe: 'key_value',
      props: {
        type: this.chartType,
        // 其他配置
      }
    };
  }
}
```

3. **添加测试**
```typescript
describe('YourChartGenerator', () => {
  it('should generate valid config', async () => {
    const generator = new YourChartGenerator();
    const result = await generator.generateConfig({
      chartType: 'your-chart-type',
      data: [/* 测试数据 */]
    });
    expect(result.props.type).toBe('your-chart-type');
  });
});
```

4. **创建示例配置**
```json
{
  "data": [/* 示例数据 */],
  "pipe": "key_value",
  "props": {
    "type": "your-chart-type",
    /* 其他配置 */
  }
}
```

### 最佳实践

1. **遵循命名约定**
   - Schema文件: `your-chart-type.schema.json`
   - 生成器: `YourChartTypeGenerator`
   - 示例文件: `your-chart-type.sample.json`

2. **数据验证**
   - 实现输入验证逻辑
   - 提供有意义的错误消息
   - 支持数据类型转换

3. **性能优化**
   - 使用Schema缓存
   - 实现懒加载
   - 避免重复计算

4. **测试覆盖**
   - 单元测试覆盖所有功能
   - 集成测试验证组件协作
   - 性能测试监控执行时间

## 🐛 故障排除

### 常见问题

**Q: Schema验证失败**
```
错误: Schema validation failed
解决: 检查数据格式是否符合Schema定义，确保必需字段存在
```

**Q: 生成器未注册**
```
错误: Chart type 'xxx' not found
解决: 确保调用了registry.register()或使用了正确的图表类型名称
```

**Q: 数据格式错误**
```
错误: Invalid data format
解决: 检查数据是否为三维数组格式，第一维为数据集，第二维为行，第三维为列
```

### 调试技巧

1. **启用详细日志**
```typescript
const generator = new YourChartGenerator();
// 设置调试模式（如果支持）
```

2. **验证Schema**
```typescript
import { SchemaMerger } from './utils/schema-merger';
const merger = new SchemaMerger();
const schema = merger.mergeSchemas('your-chart-type');
```

3. **测试数据格式**
```typescript
const loader = new SampleJsonLoader();
const sample = loader.loadByChartType('your-chart-type');
console.log('Sample data format:', sample.data);
```

## 📚 更多资源

- [Mastra核心文档](https://mastra.ai/docs)
- [JSON Schema规范](https://json-schema.org/)
- [TypeScript文档](https://www.typescriptlang.org/)

## 📄 许可证

此项目遵循项目根目录的许可证条款。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/new-chart-type`)
3. 提交更改 (`git commit -am 'Add new chart type'`)
4. 推送到分支 (`git push origin feature/new-chart-type`)
5. 创建 Pull Request

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 参与社区讨论
- 查看文档和示例

---

*该文档由图表配置系统自动生成和维护。* 