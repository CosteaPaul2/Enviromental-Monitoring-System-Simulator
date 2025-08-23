import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";

interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  color: "primary" | "secondary" | "success" | "warning" | "danger";
  description: string;
}

interface DrawingToolButtonProps {
  tool: DrawingTool;
  isSelected: boolean;
  onSelect: () => void;
}

export function DrawingToolButton({
  tool,
  isSelected,
  onSelect,
}: DrawingToolButtonProps) {
  return (
    <Tooltip content={tool.description} placement="top">
      <Button
        className={`h-16 flex-col gap-1 transition-all duration-200 ${
          isSelected ? "shadow-lg scale-105" : "hover:scale-102"
        }`}
        color={isSelected ? tool.color : "default"}
        size="lg"
        variant={isSelected ? "solid" : "flat"}
        onPress={onSelect}
      >
        <Icon className="text-xl" icon={tool.icon} />
        <span className="text-xs">{tool.name}</span>
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </Button>
    </Tooltip>
  );
}
