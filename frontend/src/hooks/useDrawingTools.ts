import type { DrawingTool } from "@/types/drawing";

import { useMemo } from "react";

export function useDrawingTools() {
  const drawingTools = useMemo<DrawingTool[]>(
    () => [
      {
        id: "polygon",
        name: "Custom Area",
        icon: "tabler:polygon",
        color: "success",
        description:
          "Define a custom-shaped monitoring area by clicking points on the map",
        dbType: "POLYGON",
      },
      {
        id: "rectangle",
        name: "Rectangle",
        icon: "tabler:square",
        color: "warning",
        description:
          "Create a rectangular monitoring zone by clicking and dragging",
        dbType: "RECTANGLE",
      },
      {
        id: "circle",
        name: "Radius",
        icon: "tabler:circle",
        color: "primary",
        description:
          "Set a circular monitoring zone by selecting center and radius",
        dbType: "CIRCLE",
      },
    ],
    [],
  );

  const getActiveTool = (toolId: string | null) => {
    return drawingTools.find((tool) => tool.id === toolId);
  };

  return {
    drawingTools,
    getActiveTool,
  };
}
