import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Icon } from "@iconify/react";

import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not admin
  if (!isAdmin) {
    navigate("/dashboard");

    return null;
  }

  const sidebarItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "tabler:dashboard",
      href: "/admin",
    },
    {
      key: "users",
      label: "Users",
      icon: "tabler:users",
      href: "/admin/users",
    },
    {
      key: "sensors",
      label: "Sensors",
      icon: "tabler:device-analytics",
      href: "/admin/sensors",
    },
    {
      key: "shapes",
      label: "Monitoring Areas",
      icon: "tabler:map-pin",
      href: "/admin/shapes",
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: "tabler:chart-line",
      href: "/admin/analytics",
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <Navbar className="border-b border-divider" maxWidth="full">
        <NavbarBrand>
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Icon className="text-xl" icon="tabler:menu-2" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon
                className="text-2xl text-primary"
                icon="tabler:shield-check"
              />
              <span className="font-bold text-xl">Admin Panel</span>
            </div>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              color="primary"
              startContent={<Icon icon="tabler:arrow-left" />}
              to="/dashboard"
              variant="flat"
            >
              Back to App
            </Button>
          </NavbarItem>

          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={user?.name}
                  size="sm"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.email}</p>
                </DropdownItem>
                <DropdownItem
                  key="dashboard"
                  startContent={<Icon icon="tabler:dashboard" />}
                >
                  <Link to="/dashboard">User Dashboard</Link>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<Icon icon="tabler:logout" />}
                >
                  <button className="w-full text-left" onClick={handleLogout}>
                    Log Out
                  </button>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div
          className={`${sidebarCollapsed ? "w-16" : "w-64"} transition-all duration-300 bg-content1 border-r border-divider`}
        >
          <div className="p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.key === "dashboard" && location.pathname === "/admin");

                return (
                  <Link
                    key={item.key}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-content2 hover:text-foreground"
                    }`}
                    to={item.href}
                  >
                    <Icon className="text-xl flex-shrink-0" icon={item.icon} />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
