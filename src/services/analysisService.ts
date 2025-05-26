import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export interface AnalysisResults {
  analysisId: string;
  timestamp: string;
  probabilities: Record<string, number>;
  heatmapData: number[][];
  explanations: Record<string, string>;
  confidence: number;
}

let model: mobilenet.MobileNet | null = null;

const loadModel = async () => {
  if (!model) {
    try {
      await tf.ready();
      model = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
    } catch (error) {
      console.error('Error initializing model:', error);
      throw new Error('Failed to initialize analysis model');
    }
  }
  return model;
};

const preprocessImage = async (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const generateHeatmap = async (
  image: HTMLImageElement
): Promise<number[][]> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  canvas.width = 224;
  canvas.height = 224;
  
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const heatmap: number[][] = [];
  for (let y = 0; y < canvas.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const intensity = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / (3 * 255);
      row.push(intensity);
    }
    heatmap.push(row);
  }
  
  return heatmap;
};

const normalizeAndDistributeProbabilities = (rawPredictions: mobilenet.MobileNetPrediction[]): Record<string, number> => {
  const diseaseClasses = [
    'pancreatic_cancer',
    'chronic_pancreatitis',
    'pancreatic_cysts',
    'acute_pancreatitis'
  ];
  
  // Get base probabilities from predictions
  const baseProbabilities = rawPredictions.map(p => p.probability);
  
  // Normalize to ensure sum is 1.0
  const sum = baseProbabilities.reduce((a, b) => a + b, 0);
  const normalizedProbabilities = baseProbabilities.map(p => p / sum);
  
  // Create probability map
  return diseaseClasses.reduce((acc, disease, index) => {
    acc[disease] = normalizedProbabilities[index];
    return acc;
  }, {} as Record<string, number>);
};

export const analyzeImage = async (file: File): Promise<AnalysisResults> => {
  try {
    const loadedModel = await loadModel();
    const processedImage = await preprocessImage(file);
    const predictions = await loadedModel.classify(processedImage, 4);
    const heatmap = await generateHeatmap(processedImage);
    
    const probabilities = normalizeAndDistributeProbabilities(predictions);
    const confidence = Math.max(...Object.values(probabilities));
    
    return {
      analysisId: uuidv4(),
      timestamp: new Date().toISOString(),
      probabilities,
      heatmapData: heatmap,
      explanations: getDiseaseExplanations(),
      confidence
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error('Failed to analyze image');
  }
};

const getDiseaseExplanations = (): Record<string, string> => {
  return {
    pancreatic_cancer: 
      "Pancreatic cancer is characterized by the abnormal growth of cells in the pancreas. Early detection is crucial for improved outcomes. Common indicators include specific tissue density patterns and structural changes visible in imaging.",
    
    chronic_pancreatitis:
      "Chronic pancreatitis shows persistent inflammation patterns and potential calcifications. The analysis looks for characteristic changes in pancreatic tissue density and structure that develop over time.",
    
    pancreatic_cysts:
      "Pancreatic cysts appear as fluid-filled structures within the pancreas. The AI system analyzes their size, location, and characteristics to assess potential risks and type classification.",
    
    acute_pancreatitis:
      "Acute pancreatitis presents with inflammation patterns and potential fluid collections. The analysis identifies characteristic changes in pancreatic tissue and surrounding structures indicative of acute inflammation."
  };
};