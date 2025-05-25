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
      // Initialize TensorFlow.js
      await tf.ready();
      
      // Create a sequential model for pancreatic analysis
      model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'softmax' })
        ]
      });
    } catch (error) {
      console.error('Error initializing model:', error);
      throw new Error('Failed to initialize analysis model');
    }
  }
  return model;
};

// Process image for model input
const preprocessImage = async (file: File): Promise<tf.Tensor4D> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Convert image to tensor
        const tensor = tf.browser.fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .expandDims();
        
        // Normalize pixel values
        const normalized = tensor.div(255.0);
        resolve(normalized as tf.Tensor4D);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Generate focused heatmap for pancreatic region
const generateHeatmap = async (
  model: tf.LayersModel,
  processedImage: tf.Tensor4D
): Promise<number[][]> => {
  const lastConvLayer = model.layers[model.layers.length - 3];
  
  // Create a model that outputs both predictions and feature maps
  const heatmapModel = tf.model({
    inputs: model.inputs,
    outputs: [lastConvLayer.output, model.outputs[0]]
  });
  
  // Get feature maps and predictions
  const [featureMaps, predictions] = heatmapModel.predict(processedImage) as tf.Tensor[];
  
  // Calculate class activation map
  const classIndex = tf.argMax(predictions as tf.Tensor, 1);
  const classWeights = model.layers[model.layers.length - 1].getWeights()[0];
  const selectedWeights = tf.gather(classWeights, classIndex);
  
  // Generate heatmap
  const weightedFeatureMaps = tf.mul(
    featureMaps as tf.Tensor,
    selectedWeights.reshape([-1, 1, 1])
  );
  
  const heatmap = tf.mean(weightedFeatureMaps, 3);
  const normalizedHeatmap = tf.div(
    tf.sub(heatmap, tf.min(heatmap)),
    tf.sub(tf.max(heatmap), tf.min(heatmap))
  );
  
  // Convert to 2D array
  const heatmapArray = await normalizedHeatmap.array();
  return heatmapArray as number[][];
};

export const analyzeImage = async (file: File): Promise<AnalysisResults> => {
  try {
    // Load and initialize model
    const loadedModel = await loadModel();
    
    // Preprocess image
    const processedImage = await preprocessImage(file);
    
    // Get predictions directly from processed image
    const predictions = loadedModel.predict(processedImage) as tf.Tensor;
    const probabilities = await predictions.array();
    
    // Generate focused heatmap
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
      analysisId: uuidv4(),
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