export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Environmental Monitor",
  description: "Real-time environmental monitoring and pollution analysis system.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard", 
      href: "/dashboard",
    },
    {
      label: "Sensors",
      href: "/sensors",
    },
    {
      label: "Map",
      href: "/map",
    },
    {
      label: "Docs",
      href: "/docs",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Sensors",
      href: "/sensors",
    },
    {
      label: "Map",
      href: "/map",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
  links: {
    github: "https://github.com/yourusername/environmental-monitor",
    docs: "/docs",
  },
};
