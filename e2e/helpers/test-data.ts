export const TEST_CSV_CONTENT = `x,y
1,2
2,4
3,6
4,8
5,10`;

export const TEST_MULTI_FEATURE_CSV = `feature1,feature2,target
1,2,3
2,3,5
3,4,7
4,5,9
5,6,11`;

export const TEST_CLASSIFICATION_CSV = `feature1,feature2,label
1.2,2.3,0
2.1,3.4,0
3.5,4.2,1
4.2,5.1,1
5.3,6.2,1`;

export function createCSVFile(content: string, filename: string = 'test.csv'): File {
  const blob = new Blob([content], { type: 'text/csv' });
  return new File([blob], filename, { type: 'text/csv' });
}

export const ML_PROBLEM_IDS = {
  LINEAR_SINGLE: 'linear-regression-single',
  LINEAR_MULTIPLE: 'linear-regression-multiple',
  LOGISTIC: 'logistic-regression',
  REGULARIZED: 'regularized-regression',
  POLYNOMIAL: 'polynomial-regression',
  MULTICLASS: 'multiclass-classification',
  NEURAL_NETWORK: 'neural-networks',
  K_MEANS: 'k-means-clustering',
  PCA: 'pca',
} as const;
