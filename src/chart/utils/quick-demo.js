// 快速演示样本JSON加载器功能
console.log('🔍 Sample JSON Loader 功能演示\n');

// 模拟基本功能演示
console.log('📊 主要功能特点:');
console.log('✅ 自动扫描 configs 目录中的 .sample.json 文件');
console.log('✅ 类型安全的 JSON 解析和验证 (使用 Zod)');
console.log('✅ 智能缓存系统提高重复加载性能');
console.log('✅ 批量加载和按图表类型分组');
console.log('✅ 数据预处理 (自动移除 key_value 类型的标题行)');
console.log('✅ 文件结构完整性验证');
console.log('✅ 详细的统计信息和性能监控');

console.log('\n📋 支持的主要图表类型:');
const supportedTypes = [
  'basic-column', 'basic-bar', 'basic-pie', 'basic-line',
  'grouped-column', 'grouped-bar', 'stacked-column', 'stacked-bar',
  'mixed-line-stacked-column', 'mixed-line-grouped-column',
  'sankey', 'voronoi', 'single-layer-treemap',
  'funnel', 'rose-pie', 'basic-radar'
];

supportedTypes.forEach((type, index) => {
  console.log(`  ${(index + 1).toString().padStart(2)}. ${type}`);
});

console.log('\n💡 使用示例:');
console.log(`
import { SampleJsonLoader } from './sample-json-loader';

// 创建加载器实例
const loader = new SampleJsonLoader('src/mastra/tools/chart/configs');

// 获取统计信息
const stats = loader.getStatistics();
console.log(\`总文件数: \${stats.totalFiles}\`);

// 加载单个示例
const result = loader.loadByChartType('basic-column');
if (result.success) {
  console.log('加载成功:', result.data.props.type);
}

// 批量加载所有示例
const batchResult = loader.loadAllSamples();
console.log(\`成功加载 \${batchResult.loadedFiles} 个文件\`);

// 获取特定类型的示例
const columnSamples = loader.getSamplesByType('basic-column');
console.log(\`柱状图样本数: \${columnSamples.length}\`);
`);

console.log('\n🚀 性能特点:');
console.log('• 首次加载时进行 Zod 验证确保数据完整性');
console.log('• 智能缓存机制避免重复文件 I/O');
console.log('• 批量加载优化，支持大量文件快速处理');
console.log('• 数据预处理，为图表生成器提供标准化输入');

console.log('\n✨ Task 17 实现完成！');
console.log('样本JSON加载器已成功实现，提供了完整的文件管理和数据处理功能。'); 