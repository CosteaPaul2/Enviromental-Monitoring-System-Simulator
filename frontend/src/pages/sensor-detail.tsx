import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";

import {
  sensorsApi,
  formatSensorValue,
  getSensorTypeInfo,
  type Sensor,
  type SensorReading,
} from "@/lib/sensorsApi";
import DefaultLayout from "@/layouts/default";

interface ChartData {
  timestamp: string;
  value: number;
  formattedTime: string;
  formattedValue: string;
}

const chartTypes = [
  { value: "line", label: "Line Chart", icon: "tabler:chart-line" },
  { value: "area", label: "Area Chart", icon: "tabler:chart-area" },
  { value: "bar", label: "Bar Chart", icon: "tabler:chart-bar" },
];

const dateRanges = [
  { value: "1", label: "Last 24 Hours", days: 1 },
  { value: "7", label: "Last 7 Days", days: 7 },
  { value: "30", label: "Last 30 Days", days: 30 },
  { value: "custom", label: "Custom Range", days: 0 },
];

export default function SensorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("line");
  const [dateRange, setDateRange] = useState("7");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      loadSensorData();
    }
  }, [id, dateRange, customStartDate, customEndDate]);

  const loadSensorData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const sensorsResponse = await sensorsApi.getSensors();

      if (sensorsResponse.success && sensorsResponse.data) {
        const foundSensor = sensorsResponse.data.sensors.find(
          (s) => s.id === parseInt(id),
        );

        if (!foundSensor) {
          navigate("/sensors");

          return;
        }
        setSensor(foundSensor);
      }

      let startDate: string, endDate: string;

      if (dateRange === "custom") {
        if (!customStartDate || !customEndDate) return;
        startDate = format(
          startOfDay(parseISO(customStartDate)),
          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        );
        endDate = format(
          endOfDay(parseISO(customEndDate)),
          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        );
      } else {
        const days = parseInt(dateRange);
        const end = new Date();
        const start = subDays(end, days);

        startDate = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        endDate = format(end, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      }

      const readingsResponse = await sensorsApi.getSensorReadings(
        parseInt(id),
        startDate,
        endDate,
      );

      if (readingsResponse.success && readingsResponse.data) {
        const sortedReadings = readingsResponse.data.readings.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        setReadings(sortedReadings);

        const chartData: ChartData[] = sortedReadings.map((reading) => ({
          timestamp: reading.timestamp,
          value: reading.value,
          formattedTime: format(parseISO(reading.timestamp), "MMM dd, HH:mm"),
          formattedValue: reading.value.toFixed(2),
        }));

        setChartData(chartData);
      }
    } catch (error) {
      console.error("Failed to load sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSensorData();
    setRefreshing(false);
  };

  const renderChart = () => {
    if (!sensor || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Icon
            className="text-6xl text-foreground/20 mb-4"
            icon="tabler:chart-line"
          />
          <p className="text-foreground/60">
            No data available for selected period
          </p>
        </div>
      );
    }

    const sensorType = getSensorTypeInfo(sensor.type);
    const color = sensorType?.color || "#2213ac";

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid stroke="#363636" strokeDasharray="3 3" />
            <XAxis
              angle={-45}
              dataKey="formattedTime"
              fontSize={12}
              height={80}
              stroke="#bee9e8"
              textAnchor="end"
            />
            <YAxis fontSize={12} stroke="#bee9e8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#151515",
                border: "1px solid #363636",
                borderRadius: "8px",
                color: "#bee9e8",
              }}
              formatter={(value: number) => [
                formatSensorValue(value, sensor.type),
                "Value",
              ]}
            />
            <Area
              dataKey="value"
              fill={`${color}40`}
              stroke={color}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid stroke="#363636" strokeDasharray="3 3" />
            <XAxis
              angle={-45}
              dataKey="formattedTime"
              fontSize={12}
              height={80}
              stroke="#bee9e8"
              textAnchor="end"
            />
            <YAxis fontSize={12} stroke="#bee9e8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#151515",
                border: "1px solid #363636",
                borderRadius: "8px",
                color: "#bee9e8",
              }}
              formatter={(value: number) => [
                formatSensorValue(value, sensor.type),
                "Value",
              ]}
            />
            <Bar dataKey="value" fill={color} />
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid stroke="#363636" strokeDasharray="3 3" />
            <XAxis
              angle={-45}
              dataKey="formattedTime"
              fontSize={12}
              height={80}
              stroke="#bee9e8"
              textAnchor="end"
            />
            <YAxis fontSize={12} stroke="#bee9e8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#151515",
                border: "1px solid #363636",
                borderRadius: "8px",
                color: "#bee9e8",
              }}
              formatter={(value: number) => [
                formatSensorValue(value, sensor.type),
                "Value",
              ]}
            />
            <Line
              activeDot={{ r: 5, fill: color }}
              dataKey="value"
              dot={{ fill: color, strokeWidth: 2, r: 3 }}
              stroke={color}
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        );
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Progress
              isIndeterminate
              aria-label="Loading sensor data..."
              className="max-w-md"
              color="primary"
              size="sm"
            />
            <p className="text-sm text-foreground/60 mt-3">
              Loading sensor data...
            </p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!sensor) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Icon
              className="text-6xl text-danger-500 mb-4"
              icon="tabler:alert-circle"
            />
            <h2 className="text-xl font-semibold mb-2">Sensor Not Found</h2>
            <p className="text-foreground/60 mb-6">
              The requested sensor could not be found.
            </p>
            <Button color="primary" onPress={() => navigate("/sensors")}>
              Back to Sensors
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const sensorType = getSensorTypeInfo(sensor.type);
  const latestReading = readings[readings.length - 1];

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="flat"
              onPress={() => navigate("/sensors")}
            >
              <Icon icon="tabler:arrow-left" />
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${sensorType?.color}20` }}
              >
                <Icon
                  className="text-2xl"
                  icon={sensorType?.icon || "tabler:cpu"}
                  style={{ color: sensorType?.color }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {sensor.sensorId}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-foreground/60 capitalize">
                    {sensor.type.toLowerCase()} sensor
                  </p>
                  <Chip
                    color={sensor.active ? "success" : "danger"}
                    size="sm"
                    variant="flat"
                  >
                    {sensor.active ? "Active" : "Inactive"}
                  </Chip>
                </div>
              </div>
            </div>
          </div>

          <Button
            color="primary"
            isLoading={refreshing}
            startContent={<Icon icon="tabler:refresh" />}
            variant="flat"
            onPress={handleRefresh}
          >
            Refresh
          </Button>
        </div>

        {latestReading && (
          <Card className="bg-gradient-to-br from-content1 to-content2/20">
            <CardBody className="p-6">
              <div className="text-center">
                <div
                  className="text-5xl font-bold mb-2"
                  style={{ color: sensorType?.color }}
                >
                  {formatSensorValue(latestReading.value, sensor.type)}
                </div>
                <p className="text-foreground/60">Current Reading</p>
                <p className="text-sm text-foreground/40 mt-1">
                  Last updated:{" "}
                  {format(
                    parseISO(latestReading.timestamp),
                    "MMM dd, yyyy HH:mm:ss",
                  )}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Historical Data</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                classNames={{
                  trigger: "border-divider hover:border-focus bg-content2",
                  value: "text-foreground",
                }}
                label="Chart Type"
                placeholder="Select chart type"
                selectedKeys={[chartType]}
                variant="bordered"
                onSelectionChange={(keys) =>
                  setChartType(Array.from(keys)[0] as string)
                }
              >
                {chartTypes.map((type) => (
                  <SelectItem
                    key={type.value}
                    startContent={<Icon icon={type.icon} />}
                    textValue={type.label}
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                classNames={{
                  trigger: "border-divider hover:border-focus bg-content2",
                  value: "text-foreground",
                }}
                label="Date Range"
                placeholder="Select date range"
                selectedKeys={[dateRange]}
                variant="bordered"
                onSelectionChange={(keys) =>
                  setDateRange(Array.from(keys)[0] as string)
                }
              >
                {dateRanges.map((range) => (
                  <SelectItem key={range.value} textValue={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
              </Select>

              {dateRange === "custom" && (
                <div className="flex gap-2">
                  <Input
                    classNames={{
                      input: "text-foreground",
                      inputWrapper:
                        "border-divider hover:border-focus focus-within:border-focus bg-content2",
                    }}
                    label="Start Date"
                    type="date"
                    value={customStartDate}
                    variant="bordered"
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                  <Input
                    classNames={{
                      input: "text-foreground",
                      inputWrapper:
                        "border-divider hover:border-focus focus-within:border-focus bg-content2",
                    }}
                    label="End Date"
                    type="date"
                    value={customEndDate}
                    variant="bordered"
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="h-96">
              <ResponsiveContainer height="100%" width="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {readings.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Statistics</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-500">
                    {formatSensorValue(
                      Math.max(...readings.map((r) => r.value)),
                      sensor.type,
                    )}
                  </div>
                  <p className="text-sm text-foreground/60">Maximum</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-500">
                    {formatSensorValue(
                      Math.min(...readings.map((r) => r.value)),
                      sensor.type,
                    )}
                  </div>
                  <p className="text-sm text-foreground/60">Minimum</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-500">
                    {formatSensorValue(
                      readings.reduce((sum, r) => sum + r.value, 0) /
                        readings.length,
                      sensor.type,
                    )}
                  </div>
                  <p className="text-sm text-foreground/60">Average</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {readings.length}
                  </div>
                  <p className="text-sm text-foreground/60">Total Readings</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DefaultLayout>
  );
}
