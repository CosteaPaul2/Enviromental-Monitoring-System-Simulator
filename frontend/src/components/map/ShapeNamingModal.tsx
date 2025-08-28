import { memo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

interface ShapeNamingModalProps {
  readonly isOpen: boolean;
  readonly shapeName: string;
  readonly pendingShapeType?: string;
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onShapeNameChange: (name: string) => void;
  readonly onSaveShape: () => void;
}

const ShapeNamingModal = memo<ShapeNamingModalProps>(
  ({
    isOpen,
    shapeName,
    pendingShapeType = "shape",
    isSaving,
    onClose,
    onShapeNameChange,
    onSaveShape,
  }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && shapeName.trim()) {
        onSaveShape();
      }
    };

    return (
      <Modal
        backdrop="blur"
        classNames={{
          wrapper: "z-[1000]",
          backdrop: "z-[999]",
          base: "z-[1001]",
        }}
        isOpen={isOpen}
        placement="center"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Name Your Shape</h3>
            <p className="text-sm text-foreground/60">
              Give your {pendingShapeType} a descriptive name
            </p>
          </ModalHeader>
          <ModalBody>
            <Input
              autoFocus
              label="Shape Name"
              placeholder="Enter a name for your shape"
              value={shapeName}
              onKeyDown={handleKeyDown}
              onValueChange={onShapeNameChange}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="success"
              isDisabled={!shapeName.trim() || isSaving}
              isLoading={isSaving}
              onPress={onSaveShape}
            >
              {isSaving ? "Saving..." : "Save Shape"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  },
);

ShapeNamingModal.displayName = "ShapeNamingModal";

export default ShapeNamingModal;
