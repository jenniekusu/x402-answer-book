import { z } from "zod";

// ============================================================================
// Variable Types - 变量类型定义
// ============================================================================

/**
 * 支持的变量类型
 * - text: 单行文本
 * - number: 数字
 * - select: 单选（从预定义选项中选择）
 * - multiline: 多行文本
 * - json: JSON 对象
 */
export const VariableTypeSchema = z.enum([
  "text",
  "number",
  "select",
  "multiline",
  "json",
]);

export type VariableType = z.infer<typeof VariableTypeSchema>;

// ============================================================================
// Variable - 变量定义
// ============================================================================

/**
 * 变量定义 Schema
 * 用于定义模板中的占位符变量
 */
export const VariableSchema = z.object({
  /** 变量名称，用于模板中的占位符 {{name}} */
  name: z.string().min(1, "变量名不能为空"),
  /** 变量类型 */
  type: VariableTypeSchema,
  /** 默认值 */
  defaultValue: z.union([z.string(), z.number()]).optional(),
  /** 变量描述，用于 UI 提示 */
  description: z.string().optional(),
  /** 是否必填 */
  required: z.boolean().default(true),
  /** select 类型的选项列表 */
  options: z.array(z.string()).optional(),
});

export type Variable = z.infer<typeof VariableSchema>;

// ============================================================================
// PromptTemplate - 提示词模板
// ============================================================================

/**
 * 提示词模板 Schema
 * 模板的完整定义，包含内容和变量
 */
export const PromptTemplateSchema = z.object({
  /** 唯一标识符 */
  id: z.string().min(1, "模板 ID 不能为空"),
  /** 模板名称 */
  name: z.string().min(1, "模板名称不能为空"),
  /** 模板描述 */
  description: z.string().optional(),
  /** 模板内容，包含 {{variable}} 占位符 */
  content: z.string().min(1, "模板内容不能为空"),
  /** 变量定义列表 */
  variables: z.array(VariableSchema).default([]),
  /** 标签，用于分类和搜索 */
  tags: z.array(z.string()).default([]),
  /** 当前版本号 */
  version: z.number().int().positive().default(1),
  /** 创建时间 */
  createdAt: z.string().datetime(),
  /** 更新时间 */
  updatedAt: z.string().datetime(),
  /** 是否已删除（软删除） */
  deleted: z.boolean().default(false),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * 创建模板时的输入 Schema（不需要 id、时间戳等自动生成的字段）
 */
export const CreateTemplateInputSchema = PromptTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deleted: true,
  version: true,
});

export type CreateTemplateInput = z.infer<typeof CreateTemplateInputSchema>;

/**
 * 更新模板时的输入 Schema（所有字段可选）
 */
export const UpdateTemplateInputSchema = CreateTemplateInputSchema.partial();

export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;

// ============================================================================
// TemplateVersion - 版本记录
// ============================================================================

/**
 * 模板版本记录 Schema
 * 用于追踪模板的历史版本
 */
export const TemplateVersionSchema = z.object({
  /** 关联的模板 ID */
  templateId: z.string().min(1),
  /** 版本号 */
  version: z.number().int().positive(),
  /** 该版本的模板内容 */
  content: z.string(),
  /** 该版本的变量定义 */
  variables: z.array(VariableSchema).default([]),
  /** 变更说明 */
  changelog: z.string().optional(),
  /** 创建时间 */
  createdAt: z.string().datetime(),
});

export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

// ============================================================================
// EvaluationResult - 评估结果
// ============================================================================

/**
 * 评估结果 Schema
 * 记录模板使用后的效果评估
 */
export const EvaluationResultSchema = z.object({
  /** 唯一标识符 */
  id: z.string().min(1),
  /** 关联的模板 ID */
  templateId: z.string().min(1),
  /** 使用的模板版本 */
  templateVersion: z.number().int().positive(),
  /** 输入的变量值 */
  input: z.record(z.string(), z.unknown()),
  /** 渲染后的完整提示词 */
  renderedPrompt: z.string(),
  /** LLM 输出结果 */
  output: z.string(),
  /** 评分 (1-5) */
  score: z.number().int().min(1).max(5),
  /** 文字反馈 */
  feedback: z.string().optional(),
  /** 评估时间 */
  timestamp: z.string().datetime(),
  /** 使用的 LLM 模型 */
  model: z.string().optional(),
  /** Token 使用量 */
  tokenUsage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

/**
 * 创建评估结果的输入 Schema
 */
export const CreateEvaluationInputSchema = EvaluationResultSchema.omit({
  id: true,
  timestamp: true,
});

export type CreateEvaluationInput = z.infer<typeof CreateEvaluationInputSchema>;

// ============================================================================
// TemplateIndex - 模板索引
// ============================================================================

/**
 * 模板索引项 Schema
 * 用于快速检索模板，不包含完整内容
 */
export const TemplateIndexItemSchema = z.object({
  /** 模板 ID */
  id: z.string(),
  /** 模板名称 */
  name: z.string(),
  /** 模板描述 */
  description: z.string().optional(),
  /** 标签 */
  tags: z.array(z.string()),
  /** 当前版本 */
  version: z.number(),
  /** 更新时间 */
  updatedAt: z.string(),
  /** 是否已删除 */
  deleted: z.boolean(),
});

export type TemplateIndexItem = z.infer<typeof TemplateIndexItemSchema>;

/**
 * 模板索引文件 Schema
 */
export const TemplateIndexSchema = z.object({
  /** 索引版本 */
  version: z.number().default(1),
  /** 最后更新时间 */
  lastUpdated: z.string().datetime(),
  /** 模板列表 */
  templates: z.array(TemplateIndexItemSchema),
});

export type TemplateIndex = z.infer<typeof TemplateIndexSchema>;

// ============================================================================
// Render Context - 渲染上下文
// ============================================================================

/**
 * 变量值映射
 */
export type VariableValues = Record<string, string | number | unknown>;

/**
 * 渲染选项
 */
export interface RenderOptions {
  /** 是否严格模式（未提供必填变量时抛出错误） */
  strict?: boolean;
  /** 未找到变量时的默认值 */
  fallbackValue?: string;
}

/**
 * 渲染结果
 */
export interface RenderResult {
  /** 渲染后的内容 */
  content: string;
  /** 使用的变量 */
  usedVariables: string[];
  /** 缺失的变量 */
  missingVariables: string[];
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

// ============================================================================
// API Response Types - API 响应类型
// ============================================================================

/**
 * 模板列表响应
 */
export const TemplateListResponseSchema = z.object({
  templates: z.array(TemplateIndexItemSchema),
  total: z.number(),
});

export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;

/**
 * 模板渲染请求
 */
export const RenderRequestSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string(), z.unknown()),
  options: z
    .object({
      strict: z.boolean().optional(),
      fallbackValue: z.string().optional(),
    })
    .optional(),
});

export type RenderRequest = z.infer<typeof RenderRequestSchema>;

/**
 * 模板渲染响应
 */
export const RenderResponseSchema = z.object({
  content: z.string(),
  usedVariables: z.array(z.string()),
  missingVariables: z.array(z.string()),
  success: z.boolean(),
  error: z.string().optional(),
});

export type RenderResponse = z.infer<typeof RenderResponseSchema>;
