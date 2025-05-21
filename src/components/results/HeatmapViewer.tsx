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

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalImage;
    originalImageRef.current = img;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      if (showHeatmap) {
        drawHeatmap(ctx, canvas.width, canvas.height);
      }
    };
  }, [originalImage, showHeatmap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || !originalImageRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
    
    if (showHeatmap) {
      drawHeatmap(ctx, canvas.width, canvas.height);
    }
  }, [showHeatmap]);

  const drawHeatmap = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Find the highest value point in the heatmap
    let maxPoint = { x: 0, y: 0, value: 0 };
    for (let y = 0; y < heatmapData.length; y++) {
      for (let x = 0; x < heatmapData[0].length; x++) {
        if (heatmapData[y][x] > maxPoint.value) {
          maxPoint = { x, y, value: heatmapData[y][x] };
        }
      }
    }
    
    // Calculate the center point in image coordinates
    const centerX = Math.floor((maxPoint.x / heatmapData[0].length) * width);
    const centerY = Math.floor((maxPoint.y / heatmapData.length) * height);
    const radius = Math.min(width, height) * 0.15; // Adjust size as needed
    
    // Draw a single circular highlight
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        
        if (distance < radius) {
          const idx = (y * width + x) * 4;
          const intensity = Math.max(0, 1 - (distance / radius));
          
          // Red overlay with transparency
          data[idx] = Math.min(255, data[idx] + intensity * 255); // Red
          data[idx + 1] = Math.max(0, data[idx + 1] - intensity * 100); // Green
          data[idx + 2] = Math.max(0, data[idx + 2] - intensity * 100); // Blue
          data[idx + 3] = Math.min(255, data[idx + 3] + intensity * 100); // Alpha
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto"
      />
      {showHeatmap && (
        <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-red-600 shadow-sm">
          Analysis Overlay Active
        </div>
      )}
    </div>
  );
};

export default HeatmapViewer;