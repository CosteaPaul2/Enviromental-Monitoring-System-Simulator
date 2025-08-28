import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

import { ThemeSwitch } from "@/components/theme-switch";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "tabler:device-desktop",
  },
  {
    label: "Sensors",
    href: "/sensors",
    icon: "tabler:layout-dashboard",
  },
  {
    label: "Map",
    href: "/map",
    icon: "tabler:map",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: "tabler:chart-line",
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <div
        className={`bg-content1 border-r border-divider transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="p-4 border-b border-divider">
          <Link className="flex items-center gap-2" to="/">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex-shrink-0">
              <Icon className="text-white text-xl" icon="tabler:world" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-sm">Environmental</span>
                <span className="text-xs text-default-500">Monitor</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-default-100 text-default-600 hover:text-default-900"
                }`}
                to={item.href}
              >
                <Icon className="text-xl flex-shrink-0" icon={item.icon} />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="bg-content1 border-b border-divider p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => setSidebarOpen(!sidebarOpen)}
              >
                <Icon className="text-xl" icon="tabler:menu-2" />
              </Button>

              <div className="min-w-0">
                <h1 className="text-xl font-semibold">
                  {navigationItems.find(
                    (item) => item.href === location.pathname,
                  )?.label || "Dashboard"}
                </h1>
                <p className="text-sm text-default-500">
                  Environmental Monitoring System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeSwitch />
              <Button isIconOnly size="sm" variant="flat">
                <Icon className="text-xl" icon="tabler:bell" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <div className="max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
