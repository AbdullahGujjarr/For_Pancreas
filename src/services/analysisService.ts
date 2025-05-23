import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';

// Types for analysis results
export interface AnalysisResults {
  analysisId: string;
  timestamp: string;
  probabilities: Record<string, number>;
  heatmapData: number[][];
  explanations: Record<string, string>;
  confidence: number;
}

// Load the pre-trained model
let model: tf.LayersModel | null = null;

const loadModel = async () => {
  if (!model) {
    try {
      model = await tf.loadLayersModel('/models/pancreas_model/model.json');
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error('Failed to load analysis model');
    }
  }
  return model;
};

// Process image for model input
const preprocessImage = async (file: File): Promise<tf.Tensor4D> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Convert image to tensor and preprocess
      const tensor = tf.browser.fromPixels(img)
        .resizeNearestNeighbor([224, 224]) // Resize to model input size
        .toFloat()
        .expandDims();
      
      // Normalize pixel values
      const normalized = tensor.div(255.0);
      resolve(normalized as tf.Tensor4D);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Generate heatmap using Grad-CAM
const generateHeatmap = async (
  model: tf.LayersModel,
  processedImage: tf.Tensor4D
): Promise<number[][]> => {
  const lastConvLayer = model.getLayer('conv5_block3_out');
  const classifierLayer = model.getLayer('predictions');
  
  const gradModel = tf.model({
    inputs: model.inputs,
    outputs: [lastConvLayer.output, classifierLayer.output]
  });
  
  const gradientFunction = tf.grad((x) => {
    const [convOutputs, predictions] = gradModel.predict(x) as tf.Tensor[];
    return predictions.max();
  });
  
  const gradients = gradientFunction(processedImage);
  const pooledGradients = tf.mean(gradients, [0, 1, 2]);
  const convOutputs = lastConvLayer.apply(processedImage) as tf.Tensor;
  
  const weightedConvOutputs = tf.mul(convOutputs, pooledGradients);
  const heatmap = tf.mean(weightedConvOutputs, -1);
  
  // Normalize heatmap
  const normalizedHeatmap = heatmap.sub(heatmap.min())
    .div(heatmap.max().sub(heatmap.min()));
  
  // Convert to 2D array
  const heatmapArray = Array.from(await normalizedHeatmap.array());
  return heatmapArray;
};

export const analyzeImage = async (file: File): Promise<AnalysisResults> => {
  try {
    // Load model
    const loadedModel = await loadModel();
    
    // Preprocess image
    const processedImage = await preprocessImage(file);
    
    // Get model predictions
    const predictions = loadedModel.predict(processedImage) as tf.Tensor;
    const probabilities = await predictions.array();
    
    // Generate heatmap
    const heatmap = await generateHeatmap(loadedModel, processedImage);
    
    // Clean up tensors
    tf.dispose([processedImage, predictions]);
    
    // Map probabilities to diseases
    const diseaseClasses = [
      'pancreatic_cancer',
      'chronic_pancreatitis',
      'pancreatic_cysts',
      'acute_pancreatitis'
    ];
    
    const probabilityMap = diseaseClasses.reduce((acc, disease, index) => {
      acc[disease] = probabilities[0][index];
      return acc;
    }, {} as Record<string, number>);
    
    return {
      analysisId: uuidv4().substring(0, 8),
      timestamp: new Date().toISOString(),
      probabilities: probabilityMap,
      heatmapData: heatmap,
      explanations: getDiseaseExplanations(),
      confidence: Math.max(...probabilities[0])
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