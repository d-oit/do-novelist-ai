import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Award, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { PublishingAlert } from '../types';

interface AlertsSectionProps {
  alerts: PublishingAlert[];
  onMarkAsRead: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onClose: () => void;
  showAlerts: boolean;
}

const AlertCard: React.FC<{
  alert: PublishingAlert;
  onMarkAsRead: () => void;
  onDismiss: () => void;
}> = ({ alert, onMarkAsRead, onDismiss }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'milestone': return Award;
      case 'opportunity': return Zap;
      case 'issue': return AlertTriangle;
      default: return Activity;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/5';
      case 'high': return 'border-orange-500 bg-orange-500/5';
      case 'medium': return 'border-blue-500 bg-blue-500/5';
      default: return 'border-gray-500 bg-gray-500/5';
    }
  };

  const Icon = getAlertIcon(alert.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "p-4 border-l-4 relative",
        getAlertColor(alert.priority),
        !alert.isRead && "ring-1 ring-primary/20"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 mt-1 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">{alert.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>

              {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Actions:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {alert.suggestedActions.map((action, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-current rounded-full" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!alert.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAsRead}
                className="h-8 w-8 p-0 text-xs"
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  onMarkAsRead,
  onDismiss,
  onClose,
  showAlerts
}) => {
  const unreadAlerts = alerts.filter(alert => !alert.isRead);

  if (!showAlerts || unreadAlerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Alerts ({unreadAlerts.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {unreadAlerts.slice(0, 3).map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={() => onMarkAsRead(alert.id)}
              onDismiss={() => onDismiss(alert.id)}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
