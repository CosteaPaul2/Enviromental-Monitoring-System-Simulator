import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Pagination } from "@heroui/pagination";
import { formatDistanceToNow } from "date-fns";

import AdminLayout from "@/layouts/AdminLayout";
import { adminApi, AdminSensor } from "@/lib/adminApi";
import {
  useSuccessNotification,
  useErrorNotification,
} from "@/contexts/NotificationContext";
import { getSensorTypeInfo } from "@/lib/sensorsApi";

export default function AdminSensorsPage() {
  const [sensors, setSensors] = useState<AdminSensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  useEffect(() => {
    fetchSensors();
  }, [currentPage, searchTerm, typeFilter, activeFilter]);

  const fetchSensors = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllSensors({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        type: typeFilter,
        active: activeFilter ? activeFilter === "true" : undefined,
      });

      if (response.success && response.data) {
        setSensors(response.data.sensors);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      addErrorNotification("Failed to Load", "Could not fetch sensors");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSensor = async (sensor: AdminSensor) => {
    if (
      confirm(
        `Are you sure you want to delete sensor ${sensor.sensorId}? This will also delete all its readings.`,
      )
    ) {
      try {
        const response = await adminApi.deleteSensor(sensor.id);

        if (response.success) {
          addSuccessNotification(
            "Sensor Deleted",
            `${sensor.sensorId} has been removed`,
          );
          fetchSensors();
        }
      } catch (error) {
        addErrorNotification("Deletion Failed", "Could not delete sensor");
      }
    }
  };

  const sensorTypes = [
    "TEMPERATURE",
    "HUMIDITY",
    "AIR_QUALITY",
    "LIGHT",
    "NOISE",
    "CO2",
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sensor Management</h1>
            <p className="text-foreground/60 mt-1">
              Monitor and manage all system sensors
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              isLoading={loading}
              startContent={<Icon icon="tabler:refresh" />}
              variant="flat"
              onPress={fetchSensors}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="text-center">
              <Icon
                className="text-3xl text-primary mx-auto mb-2"
                icon="tabler:device-analytics"
              />
              <div className="text-2xl font-bold">{sensors.length}</div>
              <div className="text-sm text-foreground/60">Total Sensors</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                className="text-3xl text-success mx-auto mb-2"
                icon="tabler:activity"
              />
              <div className="text-2xl font-bold text-success">
                {sensors.filter((s) => s.active).length}
              </div>
              <div className="text-sm text-foreground/60">Active</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                className="text-3xl text-danger mx-auto mb-2"
                icon="tabler:activity-off"
              />
              <div className="text-2xl font-bold text-danger">
                {sensors.filter((s) => !s.active).length}
              </div>
              <div className="text-sm text-foreground/60">Inactive</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                className="text-3xl text-warning mx-auto mb-2"
                icon="tabler:chart-line"
              />
              <div className="text-2xl font-bold">
                {sensors
                  .reduce((sum, s) => sum + s._count.readings, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-foreground/60">Total Readings</div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex gap-4">
              <Input
                className="flex-1"
                placeholder="Search by sensor ID..."
                startContent={<Icon icon="tabler:search" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <Select
                className="w-48"
                items={[
                  { key: "", label: "All Types" },
                  ...sensorTypes.map((type) => ({
                    key: type,
                    label: getSensorTypeInfo(type as any)?.label || type,
                  })),
                ]}
                placeholder="Filter by type"
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(value) =>
                  setTypeFilter((Array.from(value)[0] as string) || "")
                }
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
              <Select
                className="w-48"
                items={[
                  { key: "", label: "All Status" },
                  { key: "true", label: "Active" },
                  { key: "false", label: "Inactive" },
                ]}
                placeholder="Filter by status"
                selectedKeys={activeFilter ? [activeFilter] : []}
                onSelectionChange={(value) =>
                  setActiveFilter((Array.from(value)[0] as string) || "")
                }
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Sensors Table */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">
              Sensors ({sensors.length})
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Sensors table">
              <TableHeader>
                <TableColumn>SENSOR</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>OWNER</TableColumn>
                <TableColumn>READINGS</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody isLoading={loading}>
                {sensors.map((sensor) => {
                  const sensorInfo = getSensorTypeInfo(sensor.type as any);

                  return (
                    <TableRow key={sensor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: `${sensorInfo?.color || "#3388ff"}20`,
                            }}
                          >
                            <Icon
                              className="text-lg"
                              icon={
                                sensorInfo?.icon || "tabler:device-analytics"
                              }
                              style={{ color: sensorInfo?.color || "#3388ff" }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{sensor.sensorId}</p>
                            <p className="text-sm text-foreground/60">
                              ID: {sensor.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color="primary" size="sm" variant="flat">
                          {sensorInfo?.label || sensor.type}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={sensor.active ? "success" : "danger"}
                          size="sm"
                          startContent={
                            <Icon
                              icon={
                                sensor.active
                                  ? "tabler:activity"
                                  : "tabler:activity-off"
                              }
                            />
                          }
                          variant="flat"
                        >
                          {sensor.active ? "Active" : "Inactive"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sensor.user.name}</p>
                          <p className="text-sm text-foreground/60">
                            {sensor.user.email}
                          </p>
                          <Chip
                            color={
                              sensor.user.role === "ADMIN"
                                ? "warning"
                                : "default"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {sensor.user.role}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {sensor._count.readings.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(sensor.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleDeleteSensor(sensor)}
                        >
                          <Icon icon="tabler:trash" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  page={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}
