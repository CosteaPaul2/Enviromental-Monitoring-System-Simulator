import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import SensorsPage from "@/pages/sensors";
import SensorDetailPage from "@/pages/sensor-detail";
import MapPage from "@/pages/map";
import AdminDashboardPage from "@/pages/admin";
import AdminUsersPage from "@/pages/admin-users";
import AdminSensorsPage from "@/pages/admin-sensors";
import AdminShapesPage from "@/pages/admin-shapes";
import AnalyticsPage from "@/pages/analytics";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<DashboardPage />} path="/dashboard" />
      <Route element={<SensorsPage />} path="/sensors" />
      <Route element={<SensorDetailPage />} path="/sensors/:id" />
      <Route element={<MapPage />} path="/map" />
      <Route element={<AnalyticsPage />} path="/analytics" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<AdminDashboardPage />} path="/admin" />
      <Route element={<AdminUsersPage />} path="/admin/users" />
      <Route element={<AdminSensorsPage />} path="/admin/sensors" />
      <Route element={<AdminShapesPage />} path="/admin/shapes" />
    </Routes>
  );
}

export default App;
