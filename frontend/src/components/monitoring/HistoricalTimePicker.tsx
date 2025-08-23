import { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { format } from "date-fns";

interface HistoricalTimePickerProps {
  selectedDateTime: Date;
  onDateTimeChange: (dateTime: Date) => void;
  onToggleHistoricalMode: (enabled: boolean) => void;
  isHistoricalMode: boolean;
  onQuickSelect?: (date: Date) => void;
}

export default function HistoricalTimePicker({
  selectedDateTime,
  onDateTimeChange,
  onToggleHistoricalMode,
  isHistoricalMode,
  onQuickSelect,
}: HistoricalTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(
    format(selectedDateTime, "yyyy-MM-dd"),
  );
  const [selectedTime, setSelectedTime] = useState(
    format(selectedDateTime, "HH:mm"),
  );

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    const newDateTime = new Date(`${date}T${selectedTime}:00`);

    onDateTimeChange(newDateTime);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    const newDateTime = new Date(`${selectedDate}T${time}:00`);

    onDateTimeChange(newDateTime);
  };

  const generateTimeOptions = () => {
    const options = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        options.push(timeStr);
      }
    }

    return options;
  };

  const quickSelectOptions = [
    { label: "1 Hour Ago", days: 0, hours: 1 },
    { label: "6 Hours Ago", days: 0, hours: 6 },
    { label: "12 Hours Ago", days: 0, hours: 12 },
    { label: "1 Day Ago", days: 1, hours: 0 },
    { label: "3 Days Ago", days: 3, hours: 0 },
    { label: "7 Days Ago", days: 7, hours: 0 },
    { label: "30 Days Ago", days: 30, hours: 0 },
  ];

  const handleQuickSelectWithHours = (daysBack: number, hoursBack: number) => {
    const now = new Date();
    const targetDate = new Date(
      now.getTime() -
        daysBack * 24 * 60 * 60 * 1000 -
        hoursBack * 60 * 60 * 1000,
    );

    const dateStr = format(targetDate, "yyyy-MM-dd");
    const timeStr = format(targetDate, "HH:mm");

    setSelectedDate(dateStr);
    setSelectedTime(timeStr);

    const newDateTime = new Date(`${dateStr}T${timeStr}:00`);

    onDateTimeChange(newDateTime);

    if (onQuickSelect) {
      onQuickSelect(newDateTime);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex w-full gap-2">
          <Button
            className="flex-1"
            color={!isHistoricalMode ? "success" : "default"}
            size="sm"
            startContent={<Icon icon="tabler:eye" />}
            variant={!isHistoricalMode ? "solid" : "flat"}
            onPress={() => onToggleHistoricalMode(false)}
          >
            Live
          </Button>
          <Button
            className="flex-1"
            color={isHistoricalMode ? "warning" : "default"}
            size="sm"
            startContent={<Icon icon="tabler:history" />}
            variant={isHistoricalMode ? "solid" : "flat"}
            onPress={() => onToggleHistoricalMode(true)}
          >
            Historical
          </Button>
        </div>
      </CardHeader>

      {isHistoricalMode && (
        <CardBody className="pt-0">
          <div className="space-y-4">
            {/* Date and Time Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date"
                max={format(new Date(), "yyyy-MM-dd")}
                startContent={<Icon icon="tabler:calendar" />}
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <Select
                label="Time"
                placeholder="Select time"
                selectedKeys={[selectedTime]}
                startContent={<Icon icon="tabler:clock" />}
                onSelectionChange={(keys) => {
                  const time = Array.from(keys)[0] as string;

                  if (time) handleTimeChange(time);
                }}
              >
                {generateTimeOptions().map((time) => (
                  <SelectItem key={time}>{time}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Current Selection Display */}
            <div className="p-3 bg-content2 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70">
                    Viewing data from:
                  </p>
                  <p className="font-semibold">
                    {format(selectedDateTime, "PPP")} at{" "}
                    {format(selectedDateTime, "p")}
                  </p>
                </div>
                <Chip color="warning" size="sm" variant="flat">
                  {format(selectedDateTime, "MMM dd, HH:mm")}
                </Chip>
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/70">
                Quick Select:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickSelectOptions.map((option, index) => (
                  <Button
                    key={index}
                    className="justify-start"
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      handleQuickSelectWithHours(option.days, option.hours)
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Jump to Now Button */}
            <Button
              className="w-full"
              color="success"
              startContent={<Icon icon="tabler:clock-play" />}
              variant="flat"
              onPress={() => {
                const now = new Date();
                const dateStr = format(now, "yyyy-MM-dd");
                const timeStr = format(now, "HH:mm");

                setSelectedDate(dateStr);
                setSelectedTime(timeStr);
                onDateTimeChange(now);
              }}
            >
              Jump to Now
            </Button>
          </div>
        </CardBody>
      )}
    </Card>
  );
}
