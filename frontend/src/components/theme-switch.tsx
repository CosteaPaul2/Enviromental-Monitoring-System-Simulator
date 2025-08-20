import { FC, useState, useEffect } from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { SwitchProps, useSwitch } from "@heroui/switch";
import clsx from "clsx";
import { useTheme } from "@heroui/use-theme";

import { Icon } from "@iconify/react";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
}

const THEME_STORAGE_KEY = 'environmental-monitoring-theme';

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  const { setTheme } = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    
    setCurrentTheme(initialTheme);
    setTheme(initialTheme);
    setIsMounted(true);
  }, [setTheme]);

  const handleThemeChange = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    
    setCurrentTheme(newTheme);
    setTheme(newTheme);
    
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    window.dispatchEvent(new CustomEvent('theme-changed', { 
      detail: { theme: newTheme }
    }));
  };

  const {
    Component,
    slots,
    isSelected,
    getBaseProps,
    getInputProps,
    getWrapperProps,
  } = useSwitch({
    isSelected: currentTheme === "light",
    onChange: handleThemeChange,
  });

  if (!isMounted) return <div className="w-6 h-6" />;

  return (
    <Component
      aria-label={isSelected ? "Switch to dark mode" : "Switch to light mode"}
      title={isSelected ? "Switch to dark mode" : "Switch to light mode"}
      {...getBaseProps({
        className: clsx(
          "px-px transition-all duration-200 hover:opacity-80 cursor-pointer hover:scale-105",
          className,
          classNames?.base,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div
        {...getWrapperProps()}
        className={slots.wrapper({
          class: clsx(
            [
              "w-auto h-auto",
              "bg-transparent",
              "rounded-lg",
              "flex items-center justify-center",
              "group-data-[selected=true]:bg-transparent",
              "text-foreground",
              "pt-px",
              "px-2 py-2",
              "mx-0",
              "hover:bg-content2",
              "transition-all duration-200"
            ],
            classNames?.wrapper,
          ),
        })}
      >
        {isSelected ? (
          <Icon 
            icon="tabler:moon" 
            width={22} 
            height={22} 
            className="text-primary"
          />
        ) : (
          <Icon 
            icon="tabler:sun" 
            width={22} 
            height={22}
            className="text-warning" 
          />
        )}
      </div>
    </Component>
  );
};
