
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, X } from 'lucide-react';
import type { WelcomeModalProps } from './types';

export default function WelcomeModal({ 
  isOpen, 
  onStartTour, 
  onSkip, 
  username = "there" 
}: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onSkip()}>
      <DialogContent className="sm:max-w-md mx-4 rounded-xl border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50">
        <DialogHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to FinBoost, {username}!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="text-center space-y-3">
            <p className="text-gray-700 leading-relaxed">
              You're about to join thousands earning <strong>real cash rewards</strong> while mastering your finances.
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                💰 Weekly Cash Prizes
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                📚 Expert Education
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                🎯 Proven Results
              </Badge>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900">2 Minute</div>
                <div className="text-sm text-gray-600">Quick Setup</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onStartTour}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Play className="h-4 w-4 mr-2" />
              Take the 2-Minute Tour
            </Button>

            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Start earning while learning today
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
