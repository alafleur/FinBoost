
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface ValidationResult {
  canEarn: boolean;
  reason?: string;
  dailyUsage?: number;
  dailyLimit?: number;
  totalUsage?: number;
  totalLimit?: number;
  cooldownEnds?: string;
}

interface PointsValidationProps {
  actionId: string;
  userId: number;
}

export default function PointsValidation({ actionId, userId }: PointsValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (actionId && userId) {
      checkValidation();
    }
  }, [actionId, userId]);

  const checkValidation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/points/validate/${actionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('Error checking validation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Checking eligibility...</span>
      </div>
    );
  }

  if (!validation) return null;

  return (
    <div className="space-y-3">
      {validation.canEarn ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You're eligible to earn points for this action!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {validation.reason}
          </AlertDescription>
        </Alert>
      )}

      {/* Daily Limit Progress */}
      {validation.dailyLimit && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Usage</span>
              <Badge variant="outline">
                {validation.dailyUsage || 0}/{validation.dailyLimit}
              </Badge>
            </div>
            <Progress 
              value={((validation.dailyUsage || 0) / validation.dailyLimit) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Total Limit Progress */}
      {validation.totalLimit && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Lifetime Usage</span>
              <Badge variant="outline">
                {validation.totalUsage || 0}/{validation.totalLimit}
              </Badge>
            </div>
            <Progress 
              value={((validation.totalUsage || 0) / validation.totalLimit) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Cooldown Timer */}
      {validation.cooldownEnds && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Next available: {new Date(validation.cooldownEnds).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
