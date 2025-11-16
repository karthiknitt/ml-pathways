export const SYSTEM_PROMPTS = {
  general: `You are an expert ML teacher and assistant for ML Pathways, an interactive machine learning learning platform. Your role is to:

1. Help users understand their data through exploratory data analysis
2. Answer questions about ML concepts, algorithms, and best practices
3. Generate clean, well-documented Python code for ML tasks
4. Explain complex concepts in simple terms
5. Guide users through the ML workflow step-by-step

Always be encouraging, patient, and educational. Focus on helping users learn, not just giving answers.`,

  eda: `You are an expert data analyst. Analyze the provided dataset and generate insights including:
- Summary statistics
- Data types and missing values
- Distribution analysis
- Correlation patterns
- Potential data quality issues
- Recommendations for preprocessing

Provide clear, actionable insights in a structured format.`,

  codeGeneration: `You are an expert Python programmer specializing in machine learning. Generate clean, well-documented code that:
- Follows best practices
- Includes helpful comments
- Handles edge cases
- Uses appropriate libraries (scikit-learn, pandas, numpy, matplotlib)
- Is educational and easy to understand

Always explain what the code does and why certain approaches are used.`,

  resultInterpretation: `You are an ML expert helping users understand their model results. Provide:
- Clear interpretation of metrics
- Insights about model performance
- Suggestions for improvement
- Explanations of what the results mean in practical terms
- Next steps for optimization

Make complex concepts accessible to learners.`,
};

export function getMLProblemContext(problemType: string): string {
  const contexts: Record<string, string> = {
    linear_regression_single: `Working with Linear Regression (Single Variable):
- Goal: Predict continuous values using one feature
- Key concepts: slope, intercept, cost function, gradient descent
- Metrics: MSE, RMSE, R² score
- Common applications: Simple price prediction, trend analysis`,

    linear_regression_multiple: `Working with Linear Regression (Multiple Variables):
- Goal: Predict continuous values using multiple features
- Key concepts: feature scaling, multicollinearity, feature importance
- Metrics: MSE, RMSE, R² score, adjusted R²
- Common applications: Complex price prediction, multi-factor analysis`,

    logistic_regression: `Working with Logistic Regression:
- Goal: Binary classification (yes/no, 0/1)
- Key concepts: sigmoid function, decision boundary, probability
- Metrics: accuracy, precision, recall, F1-score, ROC-AUC
- Common applications: spam detection, medical diagnosis, churn prediction`,

    regularized_regression: `Working with Regularized Regression:
- Goal: Prevent overfitting with L1/L2 regularization
- Key concepts: Ridge (L2), Lasso (L1), ElasticNet, lambda parameter
- Metrics: MSE, RMSE, R² score, cross-validation score
- Common applications: High-dimensional data, feature selection`,

    polynomial_regression: `Working with Polynomial Regression:
- Goal: Model nonlinear relationships
- Key concepts: polynomial features, degree selection, overfitting
- Metrics: MSE, RMSE, R² score, train vs test performance
- Common applications: Growth curves, nonlinear trends`,

    multiclass_classification: `Working with Multi-class Classification:
- Goal: Classify into 3+ categories
- Key concepts: one-vs-all, softmax, confusion matrix
- Metrics: accuracy, per-class precision/recall, macro/micro averages
- Common applications: digit recognition, multi-category classification`,

    neural_networks: `Working with Neural Networks:
- Goal: Complex pattern recognition with deep learning
- Key concepts: layers, activation functions, backpropagation, epochs
- Metrics: loss, accuracy, validation performance
- Common applications: image classification, complex pattern recognition`,

    kmeans_clustering: `Working with K-Means Clustering:
- Goal: Group similar data points (unsupervised)
- Key concepts: centroids, inertia, elbow method, number of clusters
- Metrics: silhouette score, inertia, Davies-Bouldin index
- Common applications: customer segmentation, data exploration`,

    pca: `Working with Principal Component Analysis:
- Goal: Reduce dimensionality while preserving information
- Key concepts: eigenvectors, variance explained, components
- Metrics: explained variance ratio, cumulative variance
- Common applications: feature reduction, visualization, noise reduction`,
  };

  return contexts[problemType] || "";
}
