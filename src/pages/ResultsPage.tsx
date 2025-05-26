// Update the HeatmapViewer component usage in ResultsPage.tsx
<HeatmapViewer 
  originalImage={imageUrl} 
  showHeatmap={showHeatmap} 
  heatmapData={results.heatmapData}
  probability={highestProbDisease[1] as number}
/>