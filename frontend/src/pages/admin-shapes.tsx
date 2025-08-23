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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { formatDistanceToNow } from 'date-fns'
import AdminLayout from '@/layouts/AdminLayout'
import { adminApi, AdminShape, ShapeDetails } from '@/lib/adminApi'
import { useSuccessNotification, useErrorNotification } from '@/contexts/NotificationContext'
import { getSensorTypeInfo } from "@/lib/sensorsApi";

export default function AdminShapesPage() {
  const [shapes, setShapes] = useState<AdminShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShape, setSelectedShape] = useState<ShapeDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  useEffect(() => {
    fetchShapes();
  }, [currentPage, searchTerm, typeFilter]);

  const fetchShapes = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllShapes({
        page: currentPage,
        limit: 15,
        search: searchTerm,
        type: typeFilter,
      });

      if (response.success && response.data) {
        setShapes(response.data.shapes || []);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch shapes:", error);
      addErrorNotification("Failed to Load", "Could not fetch shapes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (shape: AdminShape) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);

      const response = await adminApi.getShapeDetails(shape.id);

      if (response.success && response.data) {
        setSelectedShape(response.data.shape);
      }
    } catch (error) {
      console.error("Failed to fetch shape details:", error);
      addErrorNotification("Failed to Load", "Could not fetch shape details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteShape = async (shape: AdminShape) => {
    if (
      confirm(
        `⚠️ ADMIN ACTION: Delete Shape\n\n` +
          `Shape: "${shape.name}"\n` +
          `Owner: ${shape.user.name} (${shape.user.email})\n` +
          `Type: ${getShapeTypeInfo(shape.type).label}\n` +
          `Sensors Inside: ${shape._count?.sensorsInside || 0}\n\n` +
          `This action cannot be undone. Continue?`,
      )
    ) {
      try {
        const response = await adminApi.deleteShape(shape.id);

        if (response.success) {
          addSuccessNotification(
            "🛡️ Admin: Shape Deleted",
            `${shape.name} has been permanently removed from ${shape.user.name}'s account`,
          );
          fetchShapes();
        }
      } catch (error) {
        console.error("Failed to delete shape:", error);
        addErrorNotification(
          "Deletion Failed",
          "Could not delete shape. It may contain active sensors.",
        );
      }
    }
  };

  const getShapeTypeInfo = (type: string) => {
    switch (type) {
      case "CIRCLE":
        return { icon: "tabler:circle", color: "#3b82f6", label: "Circle" };
      case "RECTANGLE":
        return { icon: "tabler:square", color: "#10b981", label: "Rectangle" };
      case "POLYGON":
        return { icon: "tabler:polygon", color: "#8b5cf6", label: "Polygon" };
      default:
        return { icon: "tabler:shape", color: "#6b7280", label: type };
    }
  };

  const exportShapeData = (shape: AdminShape) => {
    const exportData = {
      id: shape.id,
      name: shape.name,
      type: shape.type,
      owner: {
        name: shape.user.name,
        email: shape.user.email,
        role: shape.user.role,
      },
      sensorsInside: shape._count?.sensorsInside || 0,
      createdAt: shape.createdAt,
      updatedAt: shape.updatedAt,
      exportedAt: new Date().toISOString(),
      exportedBy: "Admin Panel",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shape-${shape.id}-${shape.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addSuccessNotification(
      "Export Complete",
      `Shape data exported: ${shape.name}`,
    );
  };

  const exportAllShapes = () => {
    const exportData = {
      shapes: shapes.map((shape) => ({
        id: shape.id,
        name: shape.name,
        type: shape.type,
        owner: {
          name: shape.user.name,
          email: shape.user.email,
          role: shape.user.role,
        },
        sensorsInside: shape._count?.sensorsInside || 0,
        createdAt: shape.createdAt,
        updatedAt: shape.updatedAt,
      })),
      totalShapes: shapes.length,
      exportedAt: new Date().toISOString(),
      exportedBy: "Admin Panel",
      filters: {
        search: searchTerm,
        type: typeFilter,
        page: currentPage,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-shapes-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addSuccessNotification(
      "Export Complete",
      `Exported ${shapes.length} shapes`,
    );
  };

  const shapeTypes = ["CIRCLE", "RECTANGLE", "POLYGON"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shape Management</h1>
            <p className="text-foreground/60 mt-1">
              Monitor and manage all monitoring areas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              color="secondary"
              isDisabled={shapes.length === 0}
              startContent={<Icon icon="tabler:download" />}
              variant="flat"
              onPress={exportAllShapes}
            >
              Export All
            </Button>
            <Button
              isLoading={loading}
              startContent={<Icon icon="tabler:refresh" />}
              variant="flat"
              onPress={fetchShapes}
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
                icon="tabler:map-2"
                className="text-3xl text-primary mx-auto mb-2"
              />
              <div className="text-2xl font-bold">{shapes.length}</div>
              <div className="text-sm text-foreground/60">Total Areas</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                icon="tabler:circle"
                className="text-3xl text-blue-500 mx-auto mb-2"
              />
              <div className="text-2xl font-bold text-blue-500">
                {shapes.filter((s) => s.type === "CIRCLE").length}
              </div>
              <div className="text-sm text-foreground/60">Circles</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                icon="tabler:square"
                className="text-3xl text-green-500 mx-auto mb-2"
              />
              <div className="text-2xl font-bold text-green-500">
                {shapes.filter((s) => s.type === "RECTANGLE").length}
              </div>
              <div className="text-sm text-foreground/60">Rectangles</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Icon
                icon="tabler:polygon"
                className="text-3xl text-purple-500 mx-auto mb-2"
              />
              <div className="text-2xl font-bold text-purple-500">
                {shapes.filter((s) => s.type === "POLYGON").length}
              </div>
              <div className="text-sm text-foreground/60">Polygons</div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex gap-4">
              <Input
                className="flex-1"
                placeholder="Search by name or owner..."
                startContent={<Icon icon="tabler:search" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <Select
                className="w-48"
                items={[{ key: '', label: 'All Types' }, ...shapeTypes.map(type => ({ key: type, label: getShapeTypeInfo(type).label }))]}
                placeholder="Filter by type"
                selectedKeys={typeFilter ? [typeFilter] : []}
                onSelectionChange={(value) => setTypeFilter(Array.from(value)[0] as string || '')}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Shapes Table */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">
              🛡️ Admin: All Monitoring Areas ({shapes.length})
            </h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Shapes table">
              <TableHeader>
                <TableColumn>AREA</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>OWNER</TableColumn>
                <TableColumn>SENSORS INSIDE</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody isLoading={loading}>
                {shapes.map((shape) => {
                  const typeInfo = getShapeTypeInfo(shape.type);

                  return (
                    <TableRow key={shape.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${typeInfo.color}20` }}
                          >
                            <Icon
                              className="text-lg" 
                              icon={typeInfo.icon}
                              style={{ color: typeInfo.color }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{shape.name}</p>
                            <p className="text-sm text-foreground/60">
                              ID: {shape.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color="primary" variant="flat" size="sm">
                          {typeInfo.label}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{shape.user.name}</p>
                          <p className="text-sm text-foreground/60">
                            {shape.user.email}
                          </p>
                          <Chip
                            color={shape.user.role === 'ADMIN' ? 'warning' : 'default'}
                            size="sm"
                            variant="flat"
                          >
                            {shape.user.role}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="tabler:device-analytics"
                            className="text-sm text-primary"
                          />
                          <span className="font-semibold text-primary">
                            {shape._count?.sensorsInside || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(shape.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            color="primary"
                            size="sm"
                            variant="light"
                            onPress={() => handleViewDetails(shape)}
                          >
                            <Icon icon="tabler:eye" />
                          </Button>
                          <Button
                            isIconOnly
                            color="secondary"
                            size="sm"
                            variant="light"
                            onPress={() => exportShapeData(shape)}
                          >
                            <Icon icon="tabler:download" />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            size="sm"
                            variant="light"
                            onPress={() => handleDeleteShape(shape)}
                          >
                            <Icon icon="tabler:trash" />
                          </Button>
                        </div>
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

      {/* Shape Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsDetailsModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>
            {selectedShape && (
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${getShapeTypeInfo(selectedShape.type).color}20`,
                  }}
                >
                  <Icon
                    className="text-lg" 
                    icon={getShapeTypeInfo(selectedShape.type).icon}
                    style={{ color: getShapeTypeInfo(selectedShape.type).color }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedShape.name}</h3>
                  <p className="text-sm text-foreground/60">
                    {getShapeTypeInfo(selectedShape.type).label} • Created by{" "}
                    {selectedShape.user.name}
                  </p>
                </div>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {loadingDetails ? (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3">
                  <Icon className="animate-spin" icon="tabler:loader-2" />
                  Loading shape details...
                </div>
              </div>
            ) : selectedShape ? (
              <div className="space-y-6">
                {/* Shape Info */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold">Area Information</h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-foreground/60">Name</p>
                        <p className="font-semibold">{selectedShape.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Type</p>
                        <Chip color="primary" size="sm" variant="flat">
                          {getShapeTypeInfo(selectedShape.type).label}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Owner</p>
                        <p className="font-semibold">
                          {selectedShape.user.name}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {selectedShape.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Created</p>
                        <p className="font-semibold">
                          {formatDistanceToNow(
                            new Date(selectedShape.createdAt),
                            { addSuffix: true },
                          )}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Sensors Inside */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        Sensors Inside ({selectedShape.sensorsInside.length})
                      </h4>
                      <Chip color="primary" variant="flat">
                        {selectedShape.sensorsInside.length} sensors
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    {selectedShape.sensorsInside.length === 0 ? (
                      <div className="text-center py-8 text-foreground/60">
                        <Icon
                          icon="tabler:device-analytics-off"
                          className="text-4xl mx-auto mb-2"
                        />
                        <p>No sensors found inside this area</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedShape.sensorsInside.map((sensor) => {
                          const sensorInfo = getSensorTypeInfo(
                            sensor.type as any,
                          );

                          return (
                            <div
                              key={sensor.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="p-2 rounded-lg"
                                  style={{
                                    backgroundColor: `${sensorInfo?.color || "#3388ff"}20`,
                                  }}
                                >
                                  <Icon
                                    className="text-lg" 
                                    icon={sensorInfo?.icon || 'tabler:device-analytics'}
                                    style={{ color: sensorInfo?.color || '#3388ff' }}
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {sensor.sensorId}
                                  </p>
                                  <p className="text-sm text-foreground/60">
                                    {sensorInfo?.label || sensor.type} • Owner:{" "}
                                    {sensor.ownerName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Chip
                                      color={sensor.active ? 'success' : 'danger'}
                                      size="sm"
                                      variant="flat"
                                    >
                                      {sensor.active ? "Active" : "Inactive"}
                                    </Chip>
                                    <Chip
                                      color={sensor.ownerRole === 'ADMIN' ? 'warning' : 'default'}
                                      size="sm"
                                      variant="flat"
                                    >
                                      {sensor.ownerRole}
                                    </Chip>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-foreground/60">
                                  Location
                                </p>
                                <p className="text-sm font-mono text-foreground/80">
                                  {sensor.longitude.toFixed(4)},{" "}
                                  {sensor.latitude.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
