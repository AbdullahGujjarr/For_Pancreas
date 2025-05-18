import { v4 as uuidv4 } from 'uuid';

// Types for analysis results
export interface AnalysisResults {
  analysisId: string;
  timestamp: string;
  probabilities: Record<string, number>;
  heatmapData: number[][];
  explanations: Record<string, string>;
  confidence: number;
}

/**
 * Mock function to analyze an uploaded image
 * In a real implementation, this would call a Python backend API
 */
export const analyzeImage = async (file: File): Promise<AnalysisResults> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Generate a unique ID for this analysis
  const analysisId = uuidv4().substring(0, 8);
  
  // Generate mock probabilities for the four conditions
  // In a real implementation, these would come from the AI model
  const probabilities = generateMockProbabilities();
  
  // Generate mock heatmap data
  // In a real implementation, this would come from Grad-CAM or similar
  const heatmapData = generateMockHeatmap();
  
  // Return mock analysis results
  return {
    analysisId,
    timestamp: new Date().toISOString(),
    probabilities,
    heatmapData,
    explanations: getDiseaseExplanations(),
    confidence: 0.85
  };
};

/**
 * Generate mock disease probabilities
 * In a real implementation, these would come from the AI model
 */
const generateMockProbabilities = (): Record<string, number> => {
  // Generate random but realistic probabilities
  // In this mock, one disease will have higher probability
  
  // Start with low probabilities for all
  const probabilities: Record<string, number> = {
    pancreatic_cancer: 0.05 + Math.random() * 0.15,
    chronic_pancreatitis: 0.05 + Math.random() * 0.15,
    pancreatic_cysts: 0.05 + Math.random() * 0.15,
    acute_pancreatitis: 0.05 + Math.random() * 0.15
  };
  
  // Select one disease to have elevated probability
  const diseases = Object.keys(probabilities);
  const primaryDisease = diseases[Math.floor(Math.random() * diseases.length)];
  
  // Set the primary disease to have higher probability
  probabilities[primaryDisease] = 0.6 + Math.random() * 0.35;
  
  return probabilities;
};

/**
 * Generate mock heatmap data for visualization
 * In a real implementation, this would come from techniques like Grad-CAM
 */
const generateMockHeatmap = (): number[][] => {
  const size = 50; // Low resolution for performance
  const heatmap = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Create a primary hotspot
  const centerX = Math.floor(size * (0.3 + Math.random() * 0.4));
  const centerY = Math.floor(size * (0.3 + Math.random() * 0.4));
  const radius = Math.floor(size * (0.1 + Math.random() * 0.1));
  
  // Fill the heatmap with values
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Distance from center of hotspot
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      // Create a heat gradient that decreases with distance
      if (distance < radius) {
        heatmap[y][x] = Math.max(0, 1 - (distance / radius));
      }
    }
  }
  
  // Add a secondary smaller hotspot
  if (Math.random() > 0.5) {
    const centerX2 = Math.floor(size * (0.4 + Math.random() * 0.4));
    const centerY2 = Math.floor(size * (0.4 + Math.random() * 0.4));
    const radius2 = Math.floor(size * 0.08);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const distance = Math.sqrt(
          Math.pow(x - centerX2, 2) + Math.pow(y - centerY2, 2)
        );
        
        if (distance < radius2) {
          const value = Math.max(0, 0.8 - (distance / radius2));
          // Use the maximum value between existing and new hotspot
          heatmap[y][x] = Math.max(heatmap[y][x], value);
        }
      }
    }
  }
  
  return heatmap;
};

/**
 * Get explanations for each disease
 */
const getDiseaseExplanations = (): Record<string, string> => {
  return {
    pancreatic_cancer: 
      "Pancreatic cancer is characterized by the abnormal growth of cells in the pancreas, forming malignant tumors. " +
      "It's often difficult to detect in early stages, making early screening valuable. " +
      "Common symptoms include abdominal pain, jaundice, unexplained weight loss, and digestive problems. " +
      "Risk factors include smoking, family history, chronic pancreatitis, diabetes, and age over 65. " +
      "Early detection significantly improves treatment outcomes.",
    
    chronic_pancreatitis:
      "Chronic pancreatitis is long-term inflammation of the pancreas that alters its normal structure and function. " +
      "It develops gradually, often after multiple episodes of acute pancreatitis. " +
      "The condition can lead to digestive problems, diabetes, and chronic pain. " +
      "Common causes include alcoholism, genetic factors, autoimmune conditions, and blockages in the pancreatic duct. " +
      "Management focuses on pain control, enzyme replacement, and lifestyle modifications.",
    
    pancreatic_cysts:
      "Pancreatic cysts are fluid-filled sacs within the pancreas. While many are benign, some types can be or become cancerous. " +
      "Most pancreatic cysts are found incidentally during imaging for other conditions. " +
      "Different types include serous cystadenomas, mucinous cystic neoplasms, intraductal papillary mucinous neoplasms (IPMNs), and pseudocysts. " +
      "Regular monitoring is important, particularly for mucinous cysts which have higher malignancy potential. " +
      "Treatment depends on the type, size, and characteristics of the cyst.",
    
    acute_pancreatitis:
      "Acute pancreatitis is sudden inflammation of the pancreas that can be mild or life-threatening. " +
      "Common causes include gallstones, alcohol consumption, certain medications, infections, and trauma. " +
      "Symptoms typically include severe abdominal pain, nausea, vomiting, and fever. " +
      "Most cases resolve with supportive care, but severe cases can lead to tissue damage, infection, or organ failure. " +
      "Recurrent episodes may lead to chronic pancreatitis and permanent damage to the pancreas."
  };
};