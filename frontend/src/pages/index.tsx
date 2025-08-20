import { Link } from "react-router-dom";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
        <div className="text-center max-w-4xl">
          <h1 className={title({ size: "lg" })}>
            Environmental <span className={title({ color: "green" })}>Monitoring</span>
          </h1>
          <h1 className={title({ size: "lg" })}>System</h1>
          <div className={subtitle({ class: "mt-4" })}>
            Environmental monitoring and pollution analysis with sensor data management,
            interactive mapping, and monitoring zone alerts.
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            as={Link}
            to="/dashboard"
            color="primary"
            size="lg"
            radius="full"
            variant="shadow"
            startContent={<Icon icon="tabler:device-desktop" className="text-xl" />}
          >
            Open Dashboard
          </Button>
          <Button
            as={Link}
            to="/map"
            variant="bordered"
            size="lg"
            radius="full"
            startContent={<Icon icon="tabler:map" className="text-xl" />}
          >
            View Map
          </Button>
          <Button
            as={Link}
            to="/sensors"
            variant="flat"
            size="lg"
            radius="full"
            startContent={<Icon icon="tabler:layout-dashboard" className="text-xl" />}
          >
            Manage Sensors
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500">
                  <Icon icon="tabler:layout-dashboard" className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Sensor Management</h3>
                  <Chip size="sm" color="primary" variant="flat">Data Tracking</Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-blue-700">
                Manage and track environmental sensor data including temperature, humidity, 
                air quality, noise levels, and other environmental parameters.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <Icon icon="tabler:map" className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Interactive Maps</h3>
                  <Chip size="sm" color="success" variant="flat">Geospatial</Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-green-700">
                Visualize sensor data on interactive maps with drawing tools to define 
                monitoring zones and analyze environmental patterns.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500">
                  <Icon icon="tabler:chart-area" className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Analytics</h3>
                  <Chip size="sm" color="warning" variant="flat">Data Analysis</Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-orange-700">
                Pollution analysis with risk scoring, monitoring zone assessments, 
                and environmental alerts to help you track conditions over time.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-default-600 text-sm">
            🌍 Protecting the environment through data-driven monitoring
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
