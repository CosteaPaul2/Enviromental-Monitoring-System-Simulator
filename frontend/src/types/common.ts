// Base utility types for better type inference and safety
export type NonEmptyArray<T> = [T, ...T[]];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface OptionalCoordinates {
  readonly latitude?: number;
  readonly longitude?: number;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type EntityStatus = "active" | "inactive" | "pending" | "error";

export type Timestamp = string;
export type Duration = number;

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SelectionState<T = string> {
  selected: Set<T>;
  isAllSelected: boolean;
  toggleSelection: (id: T) => void;
  toggleAll: () => void;
  clearSelection: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export type ColorVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "default";

export type ComponentSize = "sm" | "md" | "lg";

export type EventHandler<T = void> = () => T;
export type ParameterizedEventHandler<P, T = void> = (param: P) => T;

export type AsyncEventHandler = () => Promise<void>;
export type AsyncParameterizedEventHandler<P> = (param: P) => Promise<void>;
