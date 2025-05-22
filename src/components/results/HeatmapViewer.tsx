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
      const maxWidth = 500;
      const maxHeight = 400;
      let width = img.width;
      let height = img.height;
      
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
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
    // Find the region with highest activity in the heatmap
    let maxRegion = { x: 0, y: 0, value: 0 };
    const dataHeight = heatmapData.length;
    const dataWidth = heatmapData[0].length;
    
    // Scan the central 60% of the image for the highest value
    const startX = Math.floor(dataWidth * 0.2);
    const endX = Math.floor(dataWidth * 0.8);
    const startY = Math.floor(dataHeight * 0.2);
    const endY = Math.floor(dataHeight * 0.8);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (heatmapData[y][x] > maxRegion.value) {
          maxRegion = { x, y, value: heatmapData[y][x] };
        }
      }
    }
    
    // Convert heatmap coordinates to image coordinates
    const imageX = Math.floor((maxRegion.x / dataWidth) * width);
    const imageY = Math.floor((maxRegion.y / dataHeight) * height);
    
    // Calculate radius based on image size (smaller for more precise highlighting)
    const radius = Math.min(width, height) * 0.1;
    
    // Create gradient for smooth highlight effect
    const gradient = ctx.createRadialGradient(
      imageX, imageY, 0,
      imageX, imageY, radius
    );
    
    // Use a more intense gradient with higher opacity
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0.8)');    // Core: stronger red
    gradient.addColorStop(0.4, 'rgba(220, 38, 38, 0.6)');  // Mid: medium opacity
    gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.4)');  // Outer: subtle
    gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');      // Edge: transparent

    // Draw the highlight
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(imageX, imageY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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