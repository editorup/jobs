#!/usr/bin/env tsx

import { SampleJsonLoader } from './sample-json-loader';

/**
 * 样本JSON加载器演示脚本
 */
async function runDemo() {
  console.log('🔍 Sample JSON Loader Demo\n');
  
  try {
    // 创建加载器实例
    const loader = new SampleJsonLoader('src/mastra/tools/chart/configs');
    
    // 1. 显示统计信息
    console.log('📊 配置文件统计信息:');
    const stats = loader.getStatistics();
    console.log(`  总文件数: ${stats.totalFiles}`);
    console.log(`  总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`  图表类型数: ${stats.chartTypes}`);
    console.log(`  平均文件大小: ${(stats.averageSize / 1024).toFixed(2)} KB`);
    console.log(`  最后修改: ${stats.lastModified?.toLocaleString('zh-CN')}\n`);
    
    // 2. 显示支持的图表类型
    console.log('📋 支持的图表类型:');
    const chartTypes = loader.getSupportedChartTypes();
    chartTypes.forEach((type, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}.${type}`);
    });
    console.log('');
    
    // 3. 加载单个示例文件
    console.log('🔧 加载单个示例文件 (basic-column):');
    const singleResult = loader.loadByChartType('basic-column');
    if (singleResult.success && singleResult.data) {
      console.log(`  ✅ 成功加载: ${singleResult.info?.filename}`);
      console.log(`  管道类型: ${singleResult.data.pipe}`);
      console.log(`  图表类型: ${singleResult.data.props.type}`);
      console.log(`  数据行数: ${singleResult.data.data[0]?.length || 0}`);
      console.log(`  标题: ${singleResult.data.props.title?.mainTitle?.text || 'N/A'}`);
      
      // 提取输入数据
      const inputData = loader.extractInputData(singleResult.data);
      console.log(`  处理后数据行数: ${inputData.data[0]?.length || 0}`);
    } else {
      console.log(`  ❌ 加载失败: ${singleResult.error}`);
    }
    console.log('');
    
    // 4. 批量加载示例
    console.log('🚀 批量加载所有示例文件:');
    const startTime = Date.now();
    const batchResult = loader.loadAllSamples();
    const endTime = Date.now();
    
    console.log(`  总文件数: ${batchResult.totalFiles}`);
    console.log(`  成功加载: ${batchResult.loadedFiles} ✅`);
    console.log(`  加载失败: ${batchResult.failedFiles} ❌`);
    console.log(`  成功率: ${((batchResult.loadedFiles / batchResult.totalFiles) * 100).toFixed(1)}%`);
    console.log(`  加载耗时: ${endTime - startTime}ms`);
    console.log('');
    
    // 5. 显示失败的文件
    if (batchResult.failedFiles > 0) {
      console.log('❌ 加载失败的文件:');
      batchResult.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  • ${r.filename}: ${r.error}`);
        });
      console.log('');
    }
    
    // 6. 按类型分组显示
    console.log('📁 按图表类型分组:');
    for (const [chartType, samples] of batchResult.byType.entries()) {
      console.log(`  ${chartType}: ${samples.length} 个样本`);
    }
    console.log('');
    
    // 7. 验证示例文件
    console.log('🔍 验证示例文件结构:');
    const successfulFiles = batchResult.results
      .filter(r => r.success)
      .map(r => r.filename);
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const filename of successfulFiles.slice(0, 5)) { // 只验证前5个文件作为示例
      const validationResult = loader.validateSample(filename);
      if (validationResult.success) {
        validCount++;
        console.log(`  ✅ ${filename}: 结构有效`);
      } else {
        invalidCount++;
        console.log(`  ❌ ${filename}: ${validationResult.error}`);
      }
    }
    
    if (successfulFiles.length > 5) {
      console.log(`  ... 还有 ${successfulFiles.length - 5} 个文件未显示`);
    }
    console.log('');
    
    // 8. 缓存性能测试
    console.log('⚡ 缓存性能测试:');
    const testFile = 'basic-column.sample.json';
    
    // 清空缓存，测试首次加载
    loader.clearCache();
    const start1 = Date.now();
    const result1 = loader.loadSample(testFile, true);
    const end1 = Date.now();
    
    // 测试缓存加载
    const start2 = Date.now();
    const result2 = loader.loadSample(testFile, true);
    const end2 = Date.now();
    
    if (result1.success && result2.success) {
      console.log(`  首次加载: ${end1 - start1}ms`);
      console.log(`  缓存加载: ${end2 - start2}ms`);
      console.log(`  性能提升: ${((end1 - start1) / (end2 - start2)).toFixed(1)}x`);
    }
    
    // 显示缓存状态
    const cacheStatus = loader.getCacheStatus();
    console.log(`  缓存文件数: ${cacheStatus.cachedFiles}`);
    console.log('');
    
    // 9. 特定类型示例展示
    console.log('🎯 特定类型示例展示:');
    const exampleTypes = ['basic-column', 'sankey', 'mixed-line-stacked-column'];
    
    for (const type of exampleTypes) {
      const samples = loader.getSamplesByType(type);
      if (samples.length > 0) {
        const sample = samples[0];
        const inputData = loader.extractInputData(sample);
        console.log(`  ${type}:`);
        console.log(`    数据类型: ${sample.pipe}`);
        console.log(`    数据维度: ${sample.data.length} x ${sample.data[0]?.length || 0}`);
        console.log(`    处理后数据: ${inputData.data.length} x ${inputData.data[0]?.length || 0}`);
      }
    }
    console.log('');
    
    console.log('🎉 演示完成！');
    console.log('\n💡 主要功能:');
    console.log('  ✅ 自动扫描和索引示例文件');
    console.log('  ✅ 类型安全的JSON解析和验证');
    console.log('  ✅ 智能缓存提高性能');
    console.log('  ✅ 批量加载和按类型分组');
    console.log('  ✅ 数据预处理（移除标题行）');
    console.log('  ✅ 文件结构验证');
    console.log('  ✅ 统计信息和性能监控');
    
  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { runDemo }; 