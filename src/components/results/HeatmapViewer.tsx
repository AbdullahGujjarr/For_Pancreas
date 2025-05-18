import React, { useEffect, useRef } from 'react';

interface HeatmapViewerProps {
  originalImage: string;
  showHeatmap: boolean;
  heatmapData: number[][];
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ 
  originalImage, 
  showHeatmap,
  heatmapData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create an image element to load the original image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    originalImageRef.current = img;

    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Apply heatmap overlay if enabled
      if (showHeatmap) {
        drawHeatmap(ctx, canvas.width, canvas.height);
      }
    };
  }, [originalImage, showHeatmap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If image already loaded
    if (originalImageRef.current && originalImageRef.current.complete) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw original image
      ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
      
      // Apply heatmap overlay if enabled
      if (showHeatmap) {
        drawHeatmap(ctx, canvas.width, canvas.height);
      }
    }
  }, [showHeatmap]);

  const drawHeatmap = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    // If no heatmap data, generate synthetic data for demo
    const heatmap = heatmapData || generateSyntheticHeatmap(width, height);
    
    // Create an ImageData object
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply heatmap with transparency
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get the heatmap value for this pixel (0-1)
        const heatValue = getHeatmapValue(x, y, width, height, heatmap);
        
        if (heatValue > 0.1) { // Only show meaningful heat values
          // Red channel (increase for hotter areas)
          data[idx] = Math.min(255, data[idx] + heatValue * 200);
          
          // Green channel (decrease for hotter areas)
          data[idx + 1] = Math.max(0, data[idx + 1] - heatValue * 100);
          
          // Blue channel (decrease for hotter areas)
          data[idx + 2] = Math.max(0, data[idx + 2] - heatValue * 150);
          
          // Alpha channel - partial transparency for overlay effect
          // No change to alpha
        }
      }
    }
    
    // Put the modified image data back on the canvas
    ctx.putImageData(imageData, 0, 0);
  };

  // Helper function to get heatmap value for a pixel
  const getHeatmapValue = (
    x: number, 
    y: number, 
    width: number, 
    height: number,
    heatmap: number[][]
  ): number => {
    // If using actual heatmap data
    if (heatmap) {
      // Scale coordinates to match heatmap dimensions
      const heatmapWidth = heatmap[0].length;
      const heatmapHeight = heatmap.length;
      
      const scaledX = Math.floor((x / width) * heatmapWidth);
      const scaledY = Math.floor((y / height) * heatmapHeight);
      
      return heatmap[scaledY][scaledX];
    }
    
    // Fallback (should never reach here if heatmap is provided)
    return 0;
  };

  // Generate synthetic heatmap for demo purposes
  const generateSyntheticHeatmap = (width: number, height: number): number[][] => {
    // Create a low-resolution heatmap (for performance)
    const heatmapWidth = 50;
    const heatmapHeight = 50;
    
    const heatmap = Array(heatmapHeight).fill(0).map(() => 
      Array(heatmapWidth).fill(0)
    );
    
    // Create a hot spot in the middle right area of the image
    const centerX = Math.floor(heatmapWidth * 0.7);
    const centerY = Math.floor(heatmapHeight * 0.4);
    const radius = Math.floor(heatmapWidth * 0.15);
    
    // Fill the heatmap with values
    for (let y = 0; y < heatmapHeight; y++) {
      for (let x = 0; x < heatmapWidth; x++) {
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
    
    // Create a secondary smaller hot spot
    const centerX2 = Math.floor(heatmapWidth * 0.3);
    const centerY2 = Math.floor(heatmapHeight * 0.6);
    const radius2 = Math.floor(heatmapWidth * 0.1);
    
    for (let y = 0; y < heatmapHeight; y++) {
      for (let x = 0; x < heatmapWidth; x++) {
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
    
    return heatmap;
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto"
      />
    </div>
  );
};

export default HeatmapViewer;