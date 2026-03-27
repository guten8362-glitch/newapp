import React from 'react';
import AudioRecorder from '@/components/AudioRecorder';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AudioTest = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Voice Recorder
            </h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Test the standalone audio recording and upload functionality.
            </p>
          </div>
          
          <AudioRecorder />
          
          <div className="pt-8 text-center">
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-[0.3em]">
              Powered by MediaRecorder API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTest;
