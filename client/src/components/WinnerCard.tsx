import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface WinnerCardProps {
  winner: any;
  selectedForDisbursement: Set<number>;
  onSelectionChange: (winnerId: number, selected: boolean) => void;
}

export function WinnerCard({ winner, selectedForDisbursement, onSelectionChange }: WinnerCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selectedForDisbursement.has(winner.id)}
          onChange={(e) => onSelectionChange(winner.id, e.target.checked)}
          disabled={winner.disbursed}
        />
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {winner.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="font-medium">{winner.username}</div>
          <div className="text-sm text-gray-500">{winner.email}</div>
          <div className="text-xs text-blue-600">
            PayPal: {winner.paypalEmail || 'Not provided'}
          </div>
          {winner.disbursed && winner.disbursementDate && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Sent: {new Date(winner.disbursementDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-green-600">
          ${((winner.rewardAmount || 0) / 100).toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">
          {winner.rewardPercentage}% of pool
        </div>
        <div className="text-xs">
          <Badge variant={winner.disbursed ? "default" : "secondary"}>
            {winner.disbursed ? "Disbursed" : "Pending"}
          </Badge>
        </div>
      </div>
    </div>
  );
}