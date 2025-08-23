import { Button } from "@heroui/button";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <RouterLink className="flex justify-start items-center gap-2" to="/">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-blue-500">
              <Icon className="text-white text-xl" icon="tabler:world" />
            </div>
            <div className="flex flex-col">
              <p className="font-bold text-inherit text-sm">Environmental</p>
              <p className="text-xs text-default-500">Monitor</p>
            </div>
          </RouterLink>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem
              key={item.href}
              isActive={location.pathname === item.href}
            >
              <RouterLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "transition-colors hover:text-primary",
                  location.pathname === item.href && "text-primary font-medium",
                )}
                to={item.href}
              >
                {item.label}
              </RouterLink>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        {user ? (
          <NavbarItem className="hidden md:flex gap-2">
            {isAdmin && (
              <Button
                as={RouterLink}
                color="warning"
                size="sm"
                startContent={<Icon icon="tabler:shield-check" />}
                to="/admin"
                variant="flat"
              >
                Admin
              </Button>
            )}
            <Button
              color="danger"
              size="sm"
              startContent={<Icon icon="tabler:logout" />}
              variant="flat"
              onPress={logout}
            >
              Logout
            </Button>
          </NavbarItem>
        ) : (
          <NavbarItem className="hidden md:flex gap-2">
            <Button
              as={RouterLink}
              size="sm"
              startContent={<Icon icon="tabler:login" />}
              to="/login"
              variant="flat"
            >
              Login
            </Button>
            <Button
              as={RouterLink}
              color="primary"
              size="sm"
              startContent={<Icon icon="tabler:user-plus" />}
              to="/register"
            >
              Register
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <RouterLink
                className={clsx(
                  "w-full text-lg",
                  location.pathname === item.href
                    ? "text-primary font-medium"
                    : "text-foreground",
                )}
                to={item.href}
              >
                {item.label}
              </RouterLink>
            </NavbarMenuItem>
          ))}
          <div className="mt-4 pt-4 border-t border-divider">
            {user ? (
              <>
                {isAdmin && (
                  <NavbarMenuItem>
                    <Button
                      as={RouterLink}
                      className="w-full justify-start"
                      color="warning"
                      size="sm"
                      startContent={<Icon icon="tabler:shield-check" />}
                      to="/admin"
                      variant="flat"
                    >
                      Admin Panel
                    </Button>
                  </NavbarMenuItem>
                )}
                <NavbarMenuItem>
                  <Button
                    className="w-full justify-start"
                    color="danger"
                    size="sm"
                    startContent={<Icon icon="tabler:logout" />}
                    variant="flat"
                    onPress={logout}
                  >
                    Logout
                  </Button>
                </NavbarMenuItem>
              </>
            ) : (
              <>
                <NavbarMenuItem>
                  <Button
                    as={RouterLink}
                    className="w-full justify-start"
                    size="sm"
                    startContent={<Icon icon="tabler:login" />}
                    to="/login"
                    variant="flat"
                  >
                    Login
                  </Button>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <Button
                    as={RouterLink}
                    className="w-full justify-start"
                    color="primary"
                    size="sm"
                    startContent={<Icon icon="tabler:user-plus" />}
                    to="/register"
                  >
                    Register
                  </Button>
                </NavbarMenuItem>
              </>
            )}
          </div>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
