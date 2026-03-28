import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Mic, StopCircle, Upload, Play, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type RecordingState = 'idle' | 'recording' | 'stopped' | 'uploading' | 'success' | 'error';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob, priority: string, assignee: string) => void;
  className?: string;
  showPrioritySelector?: boolean;
  team?: any[];
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, className, team = [] }) => {
  const [status, setStatus] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // WebM is standard for MediaRecorder in most browsers
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setStatus('stopped');
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setStatus('recording');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or not supported.');
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    // Wrap blob in a File for better backend compatibility
    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    formData.append('file', file);

    try {
      const response = await fetch('/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload audio. Please try again.');
      setStatus('stopped');
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setStatus('idle');
    setError(null);
    setPriority('medium');
  };

  const handleConfirmAssign = () => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, priority, selectedAssignee);
      // Automatically reset to idle state for next recording
      resetRecording();
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto p-6 bg-background border rounded-2xl shadow-xl space-y-6", className)}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold tracking-tight">Audio Recorder</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {status === 'recording' ? 'Recording in progress...' : 'Ready to record'}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        {/* Main Mic Button / Interaction Area */}
        <div className="relative group">
          {/* Wave Animation (Visible only when recording) */}
          {status === 'recording' && (
            <div className="absolute inset-0 -m-8 flex items-center justify-center pointer-events-none">
              <div className="absolute w-32 h-32 bg-primary/20 rounded-full animate-ping shadow-[0_0_30px_10px_rgba(30,144,255,0.3)]" />
              <div className="absolute w-40 h-40 bg-primary/10 rounded-full animate-pulse blur-xl" />
              {/* Particle-like waves */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute border border-primary/30 rounded-full"
                    initial={{ width: 60, height: 60, opacity: 0.5 }}
                    animate={{ width: 140, height: 140, opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={status === 'recording' ? stopRecording : startRecording}
            disabled={status === 'uploading' || status === 'success'}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 shadow-2xl active:scale-95",
              status === 'recording' 
                ? "bg-red-500 scale-110 shadow-red-500/40" 
                : "bg-gradient-to-br from-primary to-blue-600 shadow-primary/30"
            )}
          >
            {status === 'recording' ? (
              <StopCircle className="w-10 h-10 text-white animate-pulse" />
            ) : status === 'uploading' ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
          status === 'recording' ? "text-red-500 animate-pulse" : "text-muted-foreground/60"
        )}>
          {status === 'recording' ? 'Recording Directive...' : 
           status === 'stopped' ? 'Review & Assign' : 
           status === 'uploading' ? 'Transmitting...' : 
           'Tap Mic to Record'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 w-full">
          {status === 'stopped' && (
            <div className="flex flex-col gap-4 w-full">
              {/* Employee & Priority Controls */}
              <div className="grid grid-cols-2 gap-3">
                {/* Assignee Pop-up/Dropdown */}
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Assign To</p>
                  <Button 
                    variant="glass" 
                    className="w-full text-[10px] font-bold uppercase h-10 rounded-xl border-white/5 bg-white/5"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    {selectedAssignee === 'All' ? 'ALL TEAM' : selectedAssignee}
                  </Button>
                  
                  {showAssigneeDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-0 w-48 mb-2 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-48 overflow-y-auto"
                    >
                      <button
                        onClick={() => { setSelectedAssignee('All'); setShowAssigneeDropdown(false); }}
                        className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all", selectedAssignee === 'All' ? "bg-primary text-white" : "hover:bg-white/5")}
                      >
                        Assign to All
                      </button>
                      {team.map((emp) => (
                        <button
                          key={emp.$id}
                          onClick={() => { setSelectedAssignee(emp.name); setShowAssigneeDropdown(false); }}
                          className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all", selectedAssignee === emp.name ? "bg-primary text-white" : "hover:bg-white/5")}
                        >
                          {emp.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Priority Selector */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Priority</p>
                  <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/50">
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                          priority === p 
                            ? "bg-background text-primary shadow-sm ring-1 ring-primary/20" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button onClick={resetRecording} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-border/50">
                  <Trash2 className="w-4 h-4" />
                </Button>
                {onRecordingComplete ? (
                  <Button onClick={handleConfirmAssign} className="flex-1 h-12 rounded-xl text-sm font-bold gap-2 bg-gradient-to-r from-primary to-blue-500 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="w-4 h-4" /> CONFIRM & ASSIGN
                  </Button>
                ) : (
                  <Button onClick={handleUpload} className="flex-1 h-12 rounded-xl text-sm font-bold gap-2">
                    <Upload className="w-4 h-4" /> UPLOAD AUDIO
                  </Button>
                )}
              </div>
            </div>
          )}

          {status === 'uploading' && (
            <Button disabled className="w-full h-12 rounded-xl text-sm font-bold gap-2 opacity-80">
              <Loader2 className="w-4 h-4 animate-spin" /> UPLOADING...
            </Button>
          )}

          {status === 'success' && (
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Upload Successful
              </div>
              <Button onClick={resetRecording} variant="ghost" className="w-full h-10 text-xs font-bold uppercase tracking-widest">
                Record New
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Audio Preview */}
      {audioUrl && (status === 'stopped' || status === 'uploading') && (
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            <Play className="w-3 h-3" /> Audio Preview
          </div>
          <audio src={audioUrl} controls className="w-full h-10" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-[11px] font-medium rounded-xl border border-destructive/20">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
