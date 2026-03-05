// import { readFileSync } from 'fs';
// import { join, dirname } from 'path';

// // 获取当前文件所在目录
// const __filename =new URL(import.meta.url).pathname;
// const __dirname = dirname(__filename);

// export interface ChartSchema {
//   $schema?: string;
//   $id?: string;
//   title?: string;
//   description?: string;
//   type?: string;
//   properties?: Record<string, any>;
//   definitions?: Record<string, any>;
//   required?: string[];
// }

// export interface CommonSchemaDefinitions {
//   definitions: Record<string, any>;
// }

// /**
//  * Schema Merger Utility
//  * 用于合并通用 schema 和图表特定 schema
//  */
// export class SchemaMerger {
//   private commonSchema: CommonSchemaDefinitions | null = null;
//   private schemaBasePath: string;

//   constructor() {
//     // schemas 目录的绝对路径
//     this.schemaBasePath = join(__dirname, '../schemas');
//   }

//   /**
//    * 加载通用 schema 定义
//    */
//   private loadCommonSchema(): CommonSchemaDefinitions {
//     if (this.commonSchema) {
//       return this.commonSchema;
//     }

//     try {
//       const commonSchemaPath = join(this.schemaBasePath, 'common.schema.json');
//       const commonSchemaContent = readFileSync(commonSchemaPath, 'utf-8');
//       this.commonSchema = JSON.parse(commonSchemaContent);
//       return this.commonSchema!;
//     } catch (error) {
//       throw new Error(`Failed to load common schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * 加载特定图表类型的 schema
//    */
//   private loadChartSchema(chartType: string): ChartSchema {
//     try {
//       const chartSchemaPath = join(this.schemaBasePath, `${chartType}.schema.json`);
//       const chartSchemaContent = readFileSync(chartSchemaPath, 'utf-8');
//       return JSON.parse(chartSchemaContent);
//     } catch (error) {
//       throw new Error(`Failed to load chart schema for ${chartType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * 解析 $ref 引用，将通用定义内联到图表 schema 中
//    */
//   private resolveReferences(obj: any, commonDefinitions: Record<string, any>): any {
//     if (Array.isArray(obj)) {
//       return obj.map(item => this.resolveReferences(item, commonDefinitions));
//     }
    
//     if (obj && typeof obj === 'object') {
//       // 处理 $ref 引用
//       if (obj.$ref && typeof obj.$ref === 'string') {
//         const refPath = obj.$ref;
        
//         // 解析 commonChartDefinitions.json#/definitions/xxx 格式的引用
//         if (refPath.startsWith('commonChartDefinitions.json#/definitions/')) {
//           const definitionName = refPath.replace('commonChartDefinitions.json#/definitions/', '');
//           if (commonDefinitions[definitionName]) {
//             // 递归解析引用的定义本身
//             return this.resolveReferences(commonDefinitions[definitionName], commonDefinitions);
//           } else {
//             throw new Error(`Referenced definition '${definitionName}' not found in common schema`);
//           }
//         }
        
//         // 处理其他类型的引用
//         return obj;
//       }

//       // 递归处理对象的所有属性
//       const result: any = {};
//       for (const [key, value] of Object.entries(obj)) {
//         result[key] = this.resolveReferences(value, commonDefinitions);
//       }
//       return result;
//     }

//     return obj;
//   }

//   /**
//    * 合并通用 schema 和图表特定 schema
//    */
//   public mergeSchemas(chartType: string): ChartSchema {
//     try {
//       // 加载通用 schema 和图表特定 schema
//       const commonSchema = this.loadCommonSchema();
//       const chartSchema = this.loadChartSchema(chartType);

//       // 解析所有的 $ref 引用
//       const resolvedSchema = this.resolveReferences(chartSchema, commonSchema.definitions);

//       // 合并定义（如果图表 schema 有自己的定义）
//       if (chartSchema.definitions) {
//         resolvedSchema.definitions = {
//           ...commonSchema.definitions,
//           ...chartSchema.definitions,
//         };
//       } else {
//         resolvedSchema.definitions = commonSchema.definitions;
//       }

//       return resolvedSchema;
//     } catch (error) {
//       throw new Error(`Failed to merge schemas for ${chartType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * 获取图表类型的合并后 schema，用于 Zod 验证
//    */
//   public getMergedSchema(chartType: string): ChartSchema {
//     return this.mergeSchemas(chartType);
//   }

//   /**
//    * 清除缓存的通用 schema（用于测试或重新加载）
//    */
//   public clearCache(): void {
//     this.commonSchema = null;
//   }

//   /**
//    * 获取所有可用的图表类型
//    */
//   public getAvailableChartTypes(): string[] {
//     try {
//       const fs = require('fs');
//       const files = fs.readdirSync(this.schemaBasePath);
      
//       return files
//         .filter((file: string) => file.endsWith('.schema.json') && file !== 'common.schema.json')
//         .map((file: string) => file.replace('.schema.json', ''));
//     } catch (error) {
//       throw new Error(`Failed to read chart types: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }

//   /**
//    * 验证合并后的 schema 是否有效
//    */
//   public validateMergedSchema(chartType: string): boolean {
//     try {
//       const mergedSchema = this.mergeSchemas(chartType);
      
//       // 基本验证：检查必需的字段
//       return !!(
//         mergedSchema.type &&
//         mergedSchema.properties &&
//         mergedSchema.properties.data &&
//         mergedSchema.properties.props
//       );
//     } catch (error) {
//       console.error(`Schema validation failed for ${chartType}:`, error);
//       return false;
//     }
//   }
// }

// // 创建单例实例
// export const schemaMerger = new SchemaMerger(); 