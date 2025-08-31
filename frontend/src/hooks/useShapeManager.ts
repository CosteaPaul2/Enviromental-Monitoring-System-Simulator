import { useState, useCallback } from "react";

import { ClientZone } from "@/types";
import {
  useSuccessNotification,
  useErrorNotification,
  useWarningNotification,
} from "@/contexts/NotificationContext";
import {
  spatialAnalysisApi,
  generateAnalysisSummary,
  isHighPriorityArea,
  getPriorityAlertMessage,
} from "@/lib/spatialAnalysisApi";

interface UseShapeManagerProps {
  readonly onShapeSave?: (shapeData: any, name: string) => Promise<void>;
}

interface ShapeManagerState {
  readonly saving: boolean;
  readonly pendingShape: any | null;
  readonly shapeName: string;
  readonly isModalOpen: boolean;
}

interface ShapeManagerActions {
  readonly handleShapeCreated: (shapeData: any) => void;
  readonly handleSaveShape: () => Promise<void>;
  readonly handleCancelShape: () => void;
  readonly setShapeName: (name: string) => void;
  readonly handleClientZoneCreated: (zone: ClientZone) => Promise<void>;
}

export const useShapeManager = ({
  onShapeSave,
}: UseShapeManagerProps = {}): ShapeManagerState & ShapeManagerActions => {
  const [saving, setSaving] = useState(false);
  const [pendingShape, setPendingShape] = useState<any | null>(null);
  const [shapeName, setShapeName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();
  const addWarningNotification = useWarningNotification();

  const handleShapeCreated = useCallback((shapeData: any) => {
    setPendingShape(shapeData);
    setIsModalOpen(true);
    setShapeName("");
  }, []);

  const handleSaveShape = useCallback(async () => {
    if (!pendingShape || !shapeName.trim()) return;

    try {
      setSaving(true);

      if (onShapeSave) {
        await onShapeSave(pendingShape, shapeName.trim());
      }

      setIsModalOpen(false);
      setPendingShape(null);
      setShapeName("");

      addSuccessNotification(
        "Shape Saved",
        `"${shapeName}" has been saved successfully`,
      );
    } catch (error) {
      addErrorNotification(
        "Save Failed",
        "Failed to save shape. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    pendingShape,
    shapeName,
    onShapeSave,
    addSuccessNotification,
    addErrorNotification,
  ]);

  const handleCancelShape = useCallback(() => {
    setIsModalOpen(false);
    setPendingShape(null);
    setShapeName("");
  }, []);

  const handleClientZoneCreated = useCallback(
    async (zone: ClientZone) => {
      try {
        addSuccessNotification(
          "Analysis Zone Created",
          `${zone.name} ready for analysis - fetching population data...`,
          { duration: 3000, icon: "tabler:map-pin-plus" },
        );

        const response = await spatialAnalysisApi.analyzeClientZone({
          geometry: zone.geometry,
          name: zone.name,
        });

        if (response.success && response.data) {
          const analysis = response.data.analysis;

          if (isHighPriorityArea(analysis)) {
            const alertMessage = getPriorityAlertMessage(analysis);

            if (analysis.riskAssessment.level === "critical") {
              addWarningNotification("Critical Area Detected", alertMessage!, {
                persistent: true,
                icon: "tabler:alert-triangle",
              });
            } else {
              addWarningNotification("High-Risk Area", alertMessage!, {
                duration: 10000,
                icon: "tabler:shield-x",
              });
            }
          } else {
            addSuccessNotification(
              "Analysis Complete",
              `${zone.name}: ${generateAnalysisSummary(analysis)}`,
              { duration: 6000, icon: "tabler:chart-area" },
            );
          }
        }
      } catch (error) {
        addErrorNotification(
          "Analysis Error",
          "Could not analyze zone automatically - you can analyze it manually from the panel",
        );
      }
    },
    [addSuccessNotification, addErrorNotification, addWarningNotification],
  );

  return {
    saving,
    pendingShape,
    shapeName,
    isModalOpen,

    handleShapeCreated,
    handleSaveShape,
    handleCancelShape,
    setShapeName,
    handleClientZoneCreated,
  };
};
