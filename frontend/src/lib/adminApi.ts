import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Types
export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalSensors: number;
    activeSensors: number;
    inactiveSensors: number;
    totalShapes: number;
    totalReadings: number;
    adminUsers: number;
  };
  activity: {
    newUsersToday: number;
    newSensorsToday: number;
    newShapesToday: number;
    readingsToday: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  _count: {
    sensors: number;
    shapes: number;
    accessTokens: number;
  };
}

export interface AdminSensor {
  id: number;
  sensorId: string;
  type: string;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  location?: any;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  _count: {
    readings: number;
  };
}

export interface AdminShape {
  id: number;
  name: string;
  type: "CIRCLE" | "RECTANGLE" | "POLYGON";
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  _count?: {
    sensorsInside: number;
  };
  sensorsInside?: SensorInShape[];
}

export interface SensorInShape {
  id: number;
  sensorId: string;
  type: string;
  active: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: "USER" | "ADMIN";
  longitude: number;
  latitude: number;
}

export interface ShapeDetails extends AdminShape {
  geometry: any;
  sensorsInside: SensorInShape[];
}

export interface PaginatedUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface PaginatedSensorsResponse {
  success: boolean;
  data: {
    sensors: AdminSensor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface PaginatedShapesResponse {
  success: boolean;
  data: {
    shapes: AdminShape[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<{
    success: boolean;
    data?: AdminDashboardStats;
  }> => {
    const response = await api.get("/admin/dashboard/stats");

    return response.data;
  },

  getSystemAnalytics: async (): Promise<{ success: boolean; data?: any }> => {
    const response = await api.get("/admin/analytics");

    return response.data;
  },

  // User Management
  getUsers: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    } = {},
  ): Promise<PaginatedUsersResponse> => {
    const response = await api.get("/admin/users", { params });

    return response.data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    name: string;
    role?: "USER" | "ADMIN";
  }): Promise<{ success: boolean; data?: { user: AdminUser } }> => {
    const response = await api.post("/admin/users", userData);

    return response.data;
  },

  updateUser: async (
    userId: string,
    userData: {
      email?: string;
      name?: string;
      role?: "USER" | "ADMIN";
    },
  ): Promise<{ success: boolean; data?: { user: AdminUser } }> => {
    const response = await api.put(`/admin/users/${userId}`, userData);

    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/users/${userId}`);

    return response.data;
  },

  // Sensor Management
  getAllSensors: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      active?: boolean;
    } = {},
  ): Promise<PaginatedSensorsResponse> => {
    const response = await api.get("/admin/sensors", { params });

    return response.data;
  },

  deleteSensor: async (sensorId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/sensors/${sensorId}`);

    return response.data;
  },

  // Shape Management
  getAllShapes: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
    } = {},
  ): Promise<PaginatedShapesResponse> => {
    const response = await api.get("/admin/shapes", { params });

    return response.data;
  },

  getShapeDetails: async (
    shapeId: number,
  ): Promise<{ success: boolean; data?: { shape: ShapeDetails } }> => {
    const response = await api.get(`/admin/shapes/${shapeId}`);

    return response.data;
  },

  deleteShape: async (shapeId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/shapes/${shapeId}`);

    return response.data;
  },
};

export default adminApi;
