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

// BetterAuth tables - these will be created automatically by the adapter
// But we define them here for TypeScript types
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// Datasets table
export const datasets = pgTable("datasets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id).notNull(),
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
  userId: text("user_id").references(() => user.id).notNull(),
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
