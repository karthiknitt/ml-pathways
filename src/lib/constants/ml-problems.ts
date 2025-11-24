export type MLProblemType =
  | "linear_regression_single"
  | "linear_regression_multiple"
  | "logistic_regression"
  | "regularized_regression"
  | "polynomial_regression"
  | "multiclass_classification"
  | "neural_networks"
  | "kmeans_clustering"
  | "pca";

export interface MLProblem {
  id: MLProblemType;
  name: string;
  description: string;
  category: "regression" | "classification" | "clustering" | "dimensionality_reduction";
  icon: string;
  sampleDatasetDescription: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const ML_PROBLEMS: MLProblem[] = [
  {
    id: "linear_regression_single",
    name: "Linear Regression (Single Variable)",
    description: "Predict continuous values using one feature. Perfect for understanding the basics of regression.",
    category: "regression",
    icon: "📈",
    sampleDatasetDescription: "Housing prices by square footage",
    difficulty: "beginner",
  },
  {
    id: "linear_regression_multiple",
    name: "Linear Regression (Multiple Variables)",
    description: "Predict continuous values using multiple features for more complex relationships.",
    category: "regression",
    icon: "📊",
    sampleDatasetDescription: "Housing prices by size, rooms, location, age",
    difficulty: "beginner",
  },
  {
    id: "logistic_regression",
    name: "Logistic Regression",
    description: "Binary classification to predict yes/no outcomes using probability.",
    category: "classification",
    icon: "🎯",
    sampleDatasetDescription: "University admission based on test scores",
    difficulty: "beginner",
  },
  {
    id: "regularized_regression",
    name: "Regularized Regression",
    description: "Prevent overfitting with L1 (Lasso) and L2 (Ridge) regularization techniques.",
    category: "regression",
    icon: "⚖️",
    sampleDatasetDescription: "Price prediction with regularization",
    difficulty: "intermediate",
  },
  {
    id: "polynomial_regression",
    name: "Polynomial Regression",
    description: "Model nonlinear relationships by adding polynomial features.",
    category: "regression",
    icon: "〰️",
    sampleDatasetDescription: "Population growth trends",
    difficulty: "intermediate",
  },
  {
    id: "multiclass_classification",
    name: "Multi-class Classification",
    description: "Classify data into multiple categories using one-vs-all strategy.",
    category: "classification",
    icon: "🔢",
    sampleDatasetDescription: "Handwritten digit recognition (MNIST-style)",
    difficulty: "intermediate",
  },
  {
    id: "neural_networks",
    name: "Neural Networks",
    description: "Basic feedforward networks for complex pattern recognition.",
    category: "classification",
    icon: "🧠",
    sampleDatasetDescription: "Image classification with neural networks",
    difficulty: "advanced",
  },
  {
    id: "kmeans_clustering",
    name: "K-Means Clustering",
    description: "Unsupervised learning to group similar data points together.",
    category: "clustering",
    icon: "🎨",
    sampleDatasetDescription: "Customer segmentation data",
    difficulty: "intermediate",
  },
  {
    id: "pca",
    name: "Principal Component Analysis",
    description: "Reduce dimensionality while preserving important information.",
    category: "dimensionality_reduction",
    icon: "🔍",
    sampleDatasetDescription: "High-dimensional feature reduction",
    difficulty: "advanced",
  },
];

export function getProblemById(id: MLProblemType): MLProblem | undefined {
  return ML_PROBLEMS.find((problem) => problem.id === id);
}

export function getProblemsByCategory(category: MLProblem["category"]): MLProblem[] {
  return ML_PROBLEMS.filter((problem) => problem.category === category);
}

export function getProblemsByDifficulty(difficulty: MLProblem["difficulty"]): MLProblem[] {
  return ML_PROBLEMS.filter((problem) => problem.difficulty === difficulty);
}

// Sample dataset file mapping
export const SAMPLE_DATASET_FILES: Record<MLProblemType, string> = {
  linear_regression_single: "/sample-data/housing-single.csv",
  linear_regression_multiple: "/sample-data/housing-multiple.csv",
  logistic_regression: "/sample-data/admissions.csv",
  regularized_regression: "/sample-data/regularized-pricing.csv",
  polynomial_regression: "/sample-data/population-growth.csv",
  multiclass_classification: "/sample-data/digits.csv",
  neural_networks: "/sample-data/images.csv",
  kmeans_clustering: "/sample-data/customer-segments.csv",
  pca: "/sample-data/high-dimensional.csv",
};
