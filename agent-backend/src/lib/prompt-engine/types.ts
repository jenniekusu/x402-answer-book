import { z } from "zod";

// ============================================================================
// Variable Types - Variable Type Definitions
// ============================================================================

/**
 * Supported variable types
 * - text: Single-line text
 * - number: Number
 * - select: Single selection (choose from predefined options)
 * - multiline: Multi-line text
 * - json: JSON object
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
// Variable - Variable Definition
// ============================================================================

/**
 * Variable definition Schema
 * Used to define placeholder variables in templates
 */
export const VariableSchema = z.object({
  /** Variable name, used for placeholders {{name}} in templates */
  name: z.string().min(1, "Variable name cannot be empty"),
  /** Variable type */
  type: VariableTypeSchema,
  /** Default value */
  defaultValue: z.union([z.string(), z.number()]).optional(),
  /** Variable description, used for UI hints */
  description: z.string().optional(),
  /** Whether required */
  required: z.boolean().default(true),
  /** Options list for select type */
  options: z.array(z.string()).optional(),
});

export type Variable = z.infer<typeof VariableSchema>;

// ============================================================================
// PromptTemplate - Prompt Template
// ============================================================================

/**
 * Prompt template Schema
 * Complete template definition, including content and variables
 */
export const PromptTemplateSchema = z.object({
  /** Unique identifier */
  id: z.string().min(1, "Template ID cannot be empty"),
  /** Template name */
  name: z.string().min(1, "Template name cannot be empty"),
  /** Template description */
  description: z.string().optional(),
  /** Template content, containing {{variable}} placeholders */
  content: z.string().min(1, "Template content cannot be empty"),
  /** Variable definition list */
  variables: z.array(VariableSchema).default([]),
  /** Tags for categorization and search */
  tags: z.array(z.string()).default([]),
  /** Current version number */
  version: z.number().int().positive().default(1),
  /** Creation time */
  createdAt: z.string().datetime(),
  /** Update time */
  updatedAt: z.string().datetime(),
  /** Whether deleted (soft delete) */
  deleted: z.boolean().default(false),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Input Schema for creating templates (excludes auto-generated fields like id, timestamps, etc.)
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
 * Input Schema for updating templates (all fields optional)
 */
export const UpdateTemplateInputSchema = CreateTemplateInputSchema.partial();

export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;

// ============================================================================
// TemplateVersion - Version History
// ============================================================================

/**
 * Template version record Schema
 * Used to track template version history
 */
export const TemplateVersionSchema = z.object({
  /** Associated template ID */
  templateId: z.string().min(1),
  /** Version number */
  version: z.number().int().positive(),
  /** Template content for this version */
  content: z.string(),
  /** Variable definitions for this version */
  variables: z.array(VariableSchema).default([]),
  /** Changelog description */
  changelog: z.string().optional(),
  /** Creation time */
  createdAt: z.string().datetime(),
});

export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

// ============================================================================
// EvaluationResult - Evaluation Result
// ============================================================================

/**
 * Evaluation result Schema
 * Records effectiveness evaluation after template usage
 */
export const EvaluationResultSchema = z.object({
  /** Unique identifier */
  id: z.string().min(1),
  /** Associated template ID */
  templateId: z.string().min(1),
  /** Template version used */
  templateVersion: z.number().int().positive(),
  /** Input variable values */
  input: z.record(z.string(), z.unknown()),
  /** Rendered complete prompt */
  renderedPrompt: z.string(),
  /** LLM output result */
  output: z.string(),
  /** Score (1-5) */
  score: z.number().int().min(1).max(5),
  /** Text feedback */
  feedback: z.string().optional(),
  /** Evaluation timestamp */
  timestamp: z.string().datetime(),
  /** LLM model used */
  model: z.string().optional(),
  /** Token usage */
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
 * Input Schema for creating evaluation results
 */
export const CreateEvaluationInputSchema = EvaluationResultSchema.omit({
  id: true,
  timestamp: true,
});

export type CreateEvaluationInput = z.infer<typeof CreateEvaluationInputSchema>;

// ============================================================================
// TemplateIndex - Template Index
// ============================================================================

/**
 * Template index item Schema
 * Used for quick template retrieval, does not include full content
 */
export const TemplateIndexItemSchema = z.object({
  /** Template ID */
  id: z.string(),
  /** Template name */
  name: z.string(),
  /** Template description */
  description: z.string().optional(),
  /** Tags */
  tags: z.array(z.string()),
  /** Current version */
  version: z.number(),
  /** Update time */
  updatedAt: z.string(),
  /** Whether deleted */
  deleted: z.boolean(),
});

export type TemplateIndexItem = z.infer<typeof TemplateIndexItemSchema>;

/**
 * Template index file Schema
 */
export const TemplateIndexSchema = z.object({
  /** Index version */
  version: z.number().default(1),
  /** Last update time */
  lastUpdated: z.string().datetime(),
  /** Template list */
  templates: z.array(TemplateIndexItemSchema),
});

export type TemplateIndex = z.infer<typeof TemplateIndexSchema>;

// ============================================================================
// Render Context - Rendering Context
// ============================================================================

/**
 * Variable value mapping
 */
export type VariableValues = Record<string, string | number | unknown>;

/**
 * Rendering options
 */
export interface RenderOptions {
  /** Whether strict mode (throws error when required variables are not provided) */
  strict?: boolean;
  /** Default value when variable is not found */
  fallbackValue?: string;
}

/**
 * Rendering result
 */
export interface RenderResult {
  /** Rendered content */
  content: string;
  /** Variables used */
  usedVariables: string[];
  /** Missing variables */
  missingVariables: string[];
  /** Whether successful */
  success: boolean;
  /** Error message */
  error?: string;
}

// ============================================================================
// API Response Types - API Response Types
// ============================================================================

/**
 * Template list response
 */
export const TemplateListResponseSchema = z.object({
  templates: z.array(TemplateIndexItemSchema),
  total: z.number(),
});

export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;

/**
 * Template render request
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
 * Template render response
 */
export const RenderResponseSchema = z.object({
  content: z.string(),
  usedVariables: z.array(z.string()),
  missingVariables: z.array(z.string()),
  success: z.boolean(),
  error: z.string().optional(),
});

export type RenderResponse = z.infer<typeof RenderResponseSchema>;
