import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export * from "./common";
export * from "./sensors";
export * from "./geometry";
export * from "./spatial-analysis";

export interface TableColumn<T = any> {
  readonly key: keyof T | string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly render?: (item: T) => React.ReactNode;
  readonly width?: string;
}

export interface TableProps<T = any> {
  readonly data: readonly T[];
  readonly columns: readonly TableColumn<T>[];
  readonly loading?: boolean;
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly onPageChange: (page: number) => void;
  };
  readonly selection?: {
    readonly selectedItems: readonly T[];
    readonly onSelectionChange: (items: readonly T[]) => void;
  };
}

export interface FormField<T = any> {
  readonly name: string;
  readonly label: string;
  readonly type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "checkbox"
    | "textarea";
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly validation?: {
    readonly pattern?: RegExp;
    readonly min?: number;
    readonly max?: number;
    readonly custom?: (value: T) => string | null;
  };
  readonly options?: readonly { label: string; value: any }[];
}

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly icon?: string;
  readonly children?: readonly NavigationItem[];
  readonly permissions?: readonly string[];
  readonly badge?: {
    readonly text: string;
    readonly variant:
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "danger";
  };
}

export interface ThemeConfig {
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly success: string;
    readonly warning: string;
    readonly danger: string;
  };
  readonly spacing: Record<string, string>;
  readonly typography: {
    readonly fontFamily: string;
    readonly sizes: Record<string, string>;
  };
}

export interface ChartDataPoint {
  readonly x: string | number;
  readonly y: number;
  readonly label?: string;
  readonly color?: string;
}

export interface ChartConfig {
  readonly type: "line" | "bar" | "pie" | "scatter";
  readonly data: readonly ChartDataPoint[];
  readonly options?: {
    readonly title?: string;
    readonly xAxisLabel?: string;
    readonly yAxisLabel?: string;
    readonly showLegend?: boolean;
    readonly colors?: readonly string[];
  };
}
