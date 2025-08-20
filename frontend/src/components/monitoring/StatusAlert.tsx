import { Icon } from '@iconify/react';

interface StatusAlertProps {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
  details?: string[];
}

export function StatusAlert({ type, title, message, details }: StatusAlertProps) {
  const alertConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: 'tabler:info-circle',
      iconColor: 'text-blue-500',
    },
    warning: {
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-700',
      icon: 'tabler:alert-triangle',
      iconColor: 'text-warning-500',
    },
    success: {
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-700',
      icon: 'tabler:check',
      iconColor: 'text-success-500',
    },
  };

  const config = alertConfig[type];

  return (
    <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={config.icon} className={`text-lg ${config.iconColor}`} />
        <span className={`font-medium ${config.textColor}`}>{title}</span>
      </div>
      <p className={`text-sm ${config.textColor} mb-2`}>{message}</p>
      {details && details.length > 0 && (
        <div className={`text-sm ${config.textColor} space-y-1`}>
          {details.map((detail, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
              <span>{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}