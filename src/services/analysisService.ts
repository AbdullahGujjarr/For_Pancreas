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

export const analyzeImage = async (file: File): Promise<AnalysisResults> => {
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const analysisId = uuidv4().substring(0, 8);
  const probabilities = {
    acute_pancreatitis: 0.85,
    pancreatic_cysts: 0.07,
    chronic_pancreatitis: 0.03,
    pancreatic_cancer: 0.01
  };
  
  const heatmapData = generateMockHeatmap();
  
  return {
    analysisId,
    timestamp: new Date().toISOString(),
    probabilities,
    heatmapData,
    explanations: getDiseaseExplanations(),
    confidence: 0.85
  };
};

const generateMockHeatmap = (): number[][] => {
  const size = 50;
  const heatmap = Array(size).fill(0).map(() => Array(size).fill(0));
  
  const centerX = Math.floor(size * (0.3 + Math.random() * 0.4));
  const centerY = Math.floor(size * (0.3 + Math.random() * 0.4));
  const radius = Math.floor(size * (0.1 + Math.random() * 0.1));
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      if (distance < radius) {
        heatmap[y][x] = Math.max(0, 1 - (distance / radius));
      }
    }
  }
  
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
          heatmap[y][x] = Math.max(heatmap[y][x], value);
        }
      }
    }
  }
  
  return heatmap;
};

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