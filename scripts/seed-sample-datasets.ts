import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import Papa from "papaparse";
import { sampleDatasets } from "../src/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create a .env.local file with your Neon connection string.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const ML_PROBLEMS = [
  { id: "linear_regression_single",   name: "Linear Regression (Single Variable)",  description: "Housing prices by square footage",              file: "housing-single.csv",       category: "regression",                difficulty: "beginner" },
  { id: "linear_regression_multiple", name: "Linear Regression (Multiple Variables)", description: "Housing prices by size, rooms, location, age", file: "housing-multiple.csv",      category: "regression",                difficulty: "beginner" },
  { id: "logistic_regression",        name: "Logistic Regression",                  description: "University admission based on test scores",     file: "admissions.csv",            category: "classification",            difficulty: "beginner" },
  { id: "regularized_regression",     name: "Regularized Regression",               description: "Price prediction with regularization",          file: "regularized-pricing.csv",   category: "regression",                difficulty: "intermediate" },
  { id: "polynomial_regression",      name: "Polynomial Regression",                description: "Population growth trends",                      file: "population-growth.csv",     category: "regression",                difficulty: "intermediate" },
  { id: "multiclass_classification",  name: "Multi-class Classification",           description: "Handwritten digit recognition (MNIST-style)",   file: "digits.csv",                category: "classification",            difficulty: "intermediate" },
  { id: "neural_networks",            name: "Neural Networks",                      description: "Image pattern recognition with neural nets",     file: "images.csv",                category: "classification",            difficulty: "advanced" },
  { id: "kmeans_clustering",          name: "K-Means Clustering",                   description: "Customer segmentation by behavior",             file: "customer-segments.csv",     category: "clustering",                difficulty: "intermediate" },
  { id: "pca",                        name: "Principal Component Analysis",          description: "High-dimensional feature reduction",            file: "high-dimensional.csv",      category: "dimensionality_reduction",  difficulty: "advanced" },
] as const;

async function seed() {
  console.log("Clearing existing sample datasets...");
  await db.delete(sampleDatasets);

  console.log("Seeding sample datasets...");
  for (const problem of ML_PROBLEMS) {
    const csvPath = path.join(process.cwd(), "public", "sample-data", problem.file);

    if (!fs.existsSync(csvPath)) {
      console.warn(`  ⚠ Missing CSV: ${csvPath} — skipping`);
      continue;
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const parsed = Papa.parse<Record<string, unknown>>(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    const previewData = parsed.data.slice(0, 5);
    const columns = parsed.meta.fields ?? [];
    const rowCount = parsed.data.length;

    await db.insert(sampleDatasets).values({
      problemType: problem.id,
      name: problem.name,
      description: problem.description,
      fileUrl: `/sample-data/${problem.file}`,
      previewData,
      metadata: {
        columns,
        columnCount: columns.length,
        rowCount,
        category: problem.category,
        difficulty: problem.difficulty,
      },
      isActive: true,
    });

    console.log(`  ✓ ${problem.name} (${rowCount} rows, ${columns.length} cols)`);
  }

  console.log("\nDone seeding sample datasets.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
