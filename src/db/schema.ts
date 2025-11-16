import { pgTable, text, timestamp, uuid, jsonb, pgEnum, integer, boolean } from "drizzle-orm/pg-core";

// Enums
export const mlProblemTypeEnum = pgEnum("ml_problem_type", [
  "linear_regression_single",
  "linear_regression_multiple",
  "logistic_regression",
  "regularized_regression",
  "polynomial_regression",
  "multiclass_classification",
  "neural_networks",
  "kmeans_clustering",
  "pca",
]);

export const executionStatusEnum = pgEnum("execution_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const datasetSourceEnum = pgEnum("dataset_source", [
  "sample",
  "uploaded",
]);

// Users table (BetterAuth will handle auth, but we need user references)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Datasets table
export const datasets = pgTable("datasets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  source: datasetSourceEnum("source").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  columnInfo: jsonb("column_info"), // Store column names, types, etc.
  rowCount: integer("row_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Experiments table
export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  datasetId: uuid("dataset_id").references(() => datasets.id),
  problemType: mlProblemTypeEnum("problem_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  configuration: jsonb("configuration"), // Store algorithm parameters, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Code Executions table
export const executions = pgTable("executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id").references(() => experiments.id).notNull(),
  code: text("code").notNull(),
  status: executionStatusEnum("status").default("pending").notNull(),
  output: text("output"),
  error: text("error"),
  executionTime: integer("execution_time"), // in milliseconds
  results: jsonb("results"), // Store model results, metrics, etc.
  visualizations: jsonb("visualizations"), // Store chart data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id").references(() => experiments.id).notNull(),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Store additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// EDA (Exploratory Data Analysis) Results table
export const edaResults = pgTable("eda_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  datasetId: uuid("dataset_id").references(() => datasets.id).notNull(),
  statistics: jsonb("statistics").notNull(), // Summary statistics
  correlations: jsonb("correlations"), // Correlation matrix
  distributions: jsonb("distributions"), // Distribution data for visualizations
  missingValues: jsonb("missing_values"), // Missing value analysis
  outliers: jsonb("outliers"), // Outlier detection results
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sample Datasets Catalog
export const sampleDatasets = pgTable("sample_datasets", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemType: mlProblemTypeEnum("problem_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url").notNull(),
  previewData: jsonb("preview_data"), // First few rows for preview
  metadata: jsonb("metadata"), // Additional info about the dataset
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
