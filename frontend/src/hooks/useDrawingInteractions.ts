import type { DrawingTool } from "@/types/drawing";

import { useState, useCallback, useEffect } from "react";

interface Point {
  lat: number;
  lng: number;
}

interface DrawingState {
  isDrawing: boolean;
  points: Point[];
  tempPoint: Point | null;
  isDragging: boolean;
}

interface UseDrawingInteractionsProps {
  selectedTool: DrawingTool | null;
  onShapeComplete: (points: Point[]) => void;
  isDrawingMode: boolean;
}

export function useDrawingInteractions({
  selectedTool,
  onShapeComplete,
  isDrawingMode,
}: UseDrawingInteractionsProps) {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    tempPoint: null,
    isDragging: false,
  });

  const [feedback, setFeedback] = useState<{
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  useEffect(() => {
    setState({
      isDrawing: false,
      points: [],
      tempPoint: null,
      isDragging: false,
    });
    setFeedback(null);
  }, [selectedTool]);

  const handleMouseMove = useCallback(
    (point: Point) => {
      if (!selectedTool || !isDrawingMode) return;

      setState((prev) => {
        if (selectedTool.id === "polygon" && prev.points.length > 0) {
          setFeedback({
            message: "Click to add point, double-click to complete",
            type: "info",
          });
        } else if (selectedTool.id === "rectangle" && prev.isDragging) {
          setFeedback({
            message: "Release to complete rectangle",
            type: "info",
          });
        } else if (selectedTool.id === "circle" && prev.points.length === 1) {
          setFeedback({
            message: "Move to set radius, click to complete",
            type: "info",
          });
        }

        return {
          ...prev,
          tempPoint: point,
        };
      });
    },
    [selectedTool, isDrawingMode],
  );

  const handleClick = useCallback(
    (point: Point) => {
      if (!selectedTool || !isDrawingMode) return;

      setState((prev) => {
        if (selectedTool.id === "polygon") {
          return {
            ...prev,
            points: [...prev.points, point],
            isDrawing: true,
          };
        } else if (selectedTool.id === "circle") {
          if (prev.points.length === 0) {
            setFeedback({
              message: "Center set, move to adjust radius",
              type: "info",
            });

            return {
              ...prev,
              points: [point],
              isDrawing: true,
            };
          } else {
            const shape = [...prev.points, point];

            onShapeComplete(shape);
            setFeedback({
              message: "Circle area created successfully",
              type: "success",
            });

            return {
              isDrawing: false,
              points: [],
              tempPoint: null,
              isDragging: false,
            };
          }
        }

        return prev;
      });
    },
    [selectedTool, isDrawingMode, onShapeComplete],
  );

  const handleDoubleClick = useCallback(() => {
    if (!selectedTool || !isDrawingMode || selectedTool.id !== "polygon")
      return;

    setState((prev) => {
      if (prev.points.length >= 3) {
        onShapeComplete(prev.points);
        setFeedback({
          message: "Polygon area created successfully",
          type: "success",
        });

        return {
          isDrawing: false,
          points: [],
          tempPoint: null,
          isDragging: false,
        };
      }

      return prev;
    });
  }, [selectedTool, isDrawingMode, onShapeComplete]);

  const handleDragStart = useCallback(
    (point: Point) => {
      if (!selectedTool || !isDrawingMode || selectedTool.id !== "rectangle")
        return;

      setState((prev) => ({
        ...prev,
        points: [point],
        isDrawing: true,
        isDragging: true,
      }));

      setFeedback({
        message: "Drag to set rectangle size",
        type: "info",
      });
    },
    [selectedTool, isDrawingMode],
  );

  const handleDragEnd = useCallback(
    (point: Point) => {
      if (!selectedTool || !isDrawingMode || selectedTool.id !== "rectangle")
        return;

      setState((prev) => {
        if (prev.isDragging) {
          const shape = [prev.points[0], point];

          onShapeComplete(shape);
          setFeedback({
            message: "Rectangle area created successfully",
            type: "success",
          });

          return {
            isDrawing: false,
            points: [],
            tempPoint: null,
            isDragging: false,
          };
        }

        return prev;
      });
    },
    [selectedTool, isDrawingMode, onShapeComplete],
  );

  const handleCancel = useCallback(() => {
    setState({
      isDrawing: false,
      points: [],
      tempPoint: null,
      isDragging: false,
    });
    setFeedback({
      message: "Drawing cancelled",
      type: "warning",
    });
  }, []);

  return {
    isDrawing: state.isDrawing,
    points: state.points,
    tempPoint: state.tempPoint,
    isDragging: state.isDragging,
    feedback,
    handleMouseMove,
    handleClick,
    handleDoubleClick,
    handleDragStart,
    handleDragEnd,
    handleCancel,
  };
}
