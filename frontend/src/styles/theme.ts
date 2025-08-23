// Environmental color palette
const colors = {
  primary: {
    50: "#E6F6EC",
    100: "#C3E9D0",
    200: "#9FDBB3",
    300: "#7BCD96",
    400: "#57C079",
    500: "#33B25C", // Primary brand color
    600: "#2E9E52",
    700: "#288A47",
    800: "#22763D",
    900: "#1C6233",
  },
  success: {
    50: "#E8F8F3",
    100: "#D1F1E7",
    200: "#A3E4CF",
    300: "#75D6B7",
    400: "#47C99F",
    500: "#19BB87", // Success actions
    600: "#16A578",
    700: "#148F69",
    800: "#11795A",
    900: "#0E634B",
  },
  warning: {
    50: "#FFF8E6",
    100: "#FFECB3",
    200: "#FFE080",
    300: "#FFD44D",
    400: "#FFC81A",
    500: "#E6B000", // Warning indicators
    600: "#B38900",
    700: "#806200",
    800: "#4D3B00",
    900: "#1A1400",
  },
  danger: {
    50: "#FEEBEB",
    100: "#FCD7D7",
    200: "#F9AFAF",
    300: "#F68787",
    400: "#F35F5F",
    500: "#F03737", // Danger/Alert indicators
    600: "#E31313",
    700: "#B30F0F",
    800: "#830B0B",
    900: "#530707",
  },
  background: {
    light: "#FFFFFF",
    dark: "#0A0A0A",
  },
  content: {
    light: "#F8F9FA",
    dark: "#111111",
  },
};

// Semantic colors for environmental monitoring
export const semanticColors = {
  airQuality: {
    good: colors.success[500],
    moderate: colors.warning[500],
    poor: colors.danger[500],
  },
  temperature: {
    cold: "#3B82F6",
    normal: colors.success[500],
    hot: colors.danger[500],
  },
  humidity: {
    low: colors.warning[500],
    normal: colors.success[500],
    high: colors.primary[500],
  },
};

// Custom theme configuration object
export const theme = {
  colors: {
    ...colors,
    ...semanticColors,
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  fonts: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
  },
  components: {
    // Custom component variants
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "lg",
      },
      variants: {
        sensor: {
          base: "bg-content1 border-none",
          header: "pb-2",
          body: "pt-2",
        },
        monitor: {
          base: "bg-content2 border-none",
          header: "pb-0",
          body: "pt-3",
        },
      },
    },
    Button: {
      defaultProps: {
        radius: "lg",
        shadow: "sm",
      },
      variants: {
        eco: {
          base: "bg-primary-500 text-white hover:bg-primary-600",
          icon: "text-white/90",
        },
        monitor: {
          base: "bg-content2 hover:bg-content3",
          icon: "text-default-500",
        },
      },
    },
  },

  animations: {
    button: {
      initial: { scale: 1 },
      hover: { scale: 1.02 },
      tap: { scale: 0.98 },
    },
    card: {
      initial: { opacity: 0, y: 20 },
      enter: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
  },
};

// Theme utilities
export const getAirQualityColor = (aqi: number) => {
  if (aqi <= 50) return colors.success[500];
  if (aqi <= 100) return colors.warning[500];

  return colors.danger[500];
};

export const getTemperatureColor = (temp: number) => {
  if (temp < 18) return semanticColors.temperature.cold;
  if (temp > 28) return semanticColors.temperature.hot;

  return semanticColors.temperature.normal;
};

export const getHumidityColor = (humidity: number) => {
  if (humidity < 30) return semanticColors.humidity.low;
  if (humidity > 70) return semanticColors.humidity.high;

  return semanticColors.humidity.normal;
};
