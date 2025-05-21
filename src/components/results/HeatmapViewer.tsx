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
      // Set canvas size to maintain aspect ratio but limit max dimensions
      const maxWidth = 600;
      const maxHeight = 450;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      if (showHeatmap) {
        drawHeatmap(ctx, width, height);
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
    const radius = Math.min(width, height) * 0.12; // Reduced size for more precise highlighting
    
    // Draw a single circular highlight with gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.4)'); // Red with 40% opacity
    gradient.addColorStop(0.6, 'rgba(220, 38, 38, 0.2)'); // Fading red
    gradient.addColorStop(1, 'rgba(220, 38, 38, 0)'); // Transparent

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex justify-center items-center p-4">
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto shadow-md rounded"
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