import { z } from "zod";

// ============================================================================
// Variable Types
// ============================================================================

/**
 * Supported variable types
 * - text: single-line text
 * - number: numeric value
 * - select: pick from predefined options
 * - multiline: multi-line text area
 * - json: JSON object payload
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
// Variable Definition
// ============================================================================

/**
 * Schema for variables used inside templates
 */
export const VariableSchema = z.object({
  /** Variable name, reflected as {{name}} in templates */
  name: z.string().min(1, "Name is required"),
  /** Variable type */
  type: VariableTypeSchema,
  /** Default value */
  defaultValue: z.union([z.string(), z.number()]).optional(),
  /** Description, helpful for UI hints */
  description: z.string().optional(),
  /** Whether this variable is required */
  required: z.boolean().default(true),
  /** Options for select-type variables */
  options: z.array(z.string()).optional(),
});

export type Variable = z.infer<typeof VariableSchema>;

// ============================================================================
// Prompt Templates
// ============================================================================

/**
 * Schema describing a complete prompt template plus its metadata
 */
export const PromptTemplateSchema = z.object({
  /** Unique identifier */
  id: z.string().min(1, "Template ID is required"),
  /** Template name */
  name: z.string().min(1, "Template name is required"),
  /** Template description */
  description: z.string().optional(),
  /** Template body containing {{variable}} placeholders */
  content: z.string().min(1, "Template content is required"),
  /** List of variable definitions */
  variables: z.array(VariableSchema).default([]),
  /** Tags for categorization and search */
  tags: z.array(z.string()).default([]),
  /** Current version number */
  version: z.number().int().positive().default(1),
  /** Created timestamp */
  createdAt: z.string().datetime(),
  /** Updated timestamp */
  updatedAt: z.string().datetime(),
  /** Soft-delete flag */
  deleted: z.boolean().default(false),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Input schema for creating a template (omits auto-generated fields)
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
 * Input schema for updating a template (all fields optional)
 */
export const UpdateTemplateInputSchema = CreateTemplateInputSchema.partial();

export type UpdateTemplateInput = z.infer<typeof UpdateTemplateInputSchema>;

// ============================================================================
// Template Versions
// ============================================================================

/**
 * Schema representing a historical version of a template
 */
export const TemplateVersionSchema = z.object({
  /** Associated template ID */
  templateId: z.string().min(1),
  /** Version number */
  version: z.number().int().positive(),
  /** Template content for this version */
  content: z.string(),
  /** Variable definitions used by this version */
  variables: z.array(VariableSchema).default([]),
  /** Changelog / description of changes */
  changelog: z.string().optional(),
  /** Creation timestamp */
  createdAt: z.string().datetime(),
});

export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

// ============================================================================
// Evaluation Results
// ============================================================================

/**
 * Schema describing the outcome of evaluating a template
 */
export const EvaluationResultSchema = z.object({
  /** Unique identifier */
  id: z.string().min(1),
  /** Associated template ID */
  templateId: z.string().min(1),
  /** Template version used */
  templateVersion: z.number().int().positive(),
  /** Variable inputs that were rendered */
  input: z.record(z.string(), z.unknown()),
  /** Fully rendered prompt */
  renderedPrompt: z.string(),
  /** LLM response */
  output: z.string(),
  /** Score (1-5) */
  score: z.number().int().min(1).max(5),
  /** Written feedback */
  feedback: z.string().optional(),
  /** Evaluation timestamp */
  timestamp: z.string().datetime(),
  /** LLM model identifier */
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
 * Input schema for creating evaluation results
 */
export const CreateEvaluationInputSchema = EvaluationResultSchema.omit({
  id: true,
  timestamp: true,
});

export type CreateEvaluationInput = z.infer<typeof CreateEvaluationInputSchema>;

// ============================================================================
// Template Index
// ============================================================================

/**
 * Schema for lightweight template index entries
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
  /** Last update timestamp */
  updatedAt: z.string(),
  /** Soft-delete flag */
  deleted: z.boolean(),
});

export type TemplateIndexItem = z.infer<typeof TemplateIndexItemSchema>;

/**
 * Schema for the template index file
 */
export const TemplateIndexSchema = z.object({
  /** Index version */
  version: z.number().default(1),
  /** Last updated timestamp */
  lastUpdated: z.string().datetime(),
  /** Templates included in the index */
  templates: z.array(TemplateIndexItemSchema),
});

export type TemplateIndex = z.infer<typeof TemplateIndexSchema>;

// ============================================================================
// Render Context
// ============================================================================

/**
 * Mapping of variable names to concrete values
 */
export type VariableValues = Record<string, string | number | unknown>;

/**
 * Rendering options
 */
export interface RenderOptions {
  /** When true, missing required variables throw an error */
  strict?: boolean;
  /** Default fallback when a variable is missing */
  fallbackValue?: string;
}

/**
 * Result of rendering a template
 */
export interface RenderResult {
  /** Rendered content */
  content: string;
  /** Variables that were supplied */
  usedVariables: string[];
  /** Variables that were missing */
  missingVariables: string[];
  /** Whether rendering succeeded */
  success: boolean;
  /** Error message when unsuccessful */
  error?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response payload returned by a template list call
 */
export const TemplateListResponseSchema = z.object({
  templates: z.array(TemplateIndexItemSchema),
  total: z.number(),
});

export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;

/**
 * Template render request shape
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
 * Template render response shape
 */
export const RenderResponseSchema = z.object({
  content: z.string(),
  usedVariables: z.array(z.string()),
  missingVariables: z.array(z.string()),
  success: z.boolean(),
  error: z.string().optional(),
});

export type RenderResponse = z.infer<typeof RenderResponseSchema>;
