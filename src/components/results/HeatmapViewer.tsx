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
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const heatValue = getHeatmapValue(x, y, width, height, heatmapData);
        
        if (heatValue > 0.1) {
          // Red overlay with transparency
          data[idx] = Math.min(255, data[idx] + heatValue * 255); // Red
          data[idx + 1] = Math.max(0, data[idx + 1] - heatValue * 100); // Green
          data[idx + 2] = Math.max(0, data[idx + 2] - heatValue * 100); // Blue
          data[idx + 3] = Math.min(255, data[idx + 3] + heatValue * 100); // Alpha
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const getHeatmapValue = (
    x: number, 
    y: number, 
    width: number, 
    height: number,
    heatmap: number[][]
  ): number => {
    const heatmapWidth = heatmap[0].length;
    const heatmapHeight = heatmap.length;
    
    const scaledX = Math.floor((x / width) * heatmapWidth);
    const scaledY = Math.floor((y / height) * heatmapHeight);
    
    return heatmap[scaledY][scaledX];
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