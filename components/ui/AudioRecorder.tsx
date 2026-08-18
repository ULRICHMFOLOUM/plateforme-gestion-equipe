"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  onCancel?: () => void;
}

export default function AudioRecorder({
  onRecordingComplete,
  onCancel,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setIsPreparing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setIsPreparing(false);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Impossible d'accéder au microphone:", error);
      alert("Accès au microphone refusé ou non supporté par votre navigateur.");
      setIsPreparing(false);
      if (onCancel) onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (onCancel) onCancel();
  };

  const handleSendAudio = () => {
    if (audioBlob) {
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: "audio/webm",
      });
      onRecordingComplete(file);
      cancelRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRecording && !audioBlob) {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={startRecording}
        disabled={isPreparing}
        className="p-2.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 transition-all flex items-center justify-center flex-shrink-0"
        title="Enregistrer un message vocal"
      >
        {isPreparing ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-red-50/90 backdrop-blur-md border border-red-200 px-4 py-2 rounded-2xl flex-1 animate-in fade-in">
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-3 h-3 rounded-full bg-red-500"
        />
        <span className="text-xs font-mono font-black text-red-600">
          {formatSeconds(recordingTime)}
        </span>
      </div>

      <div className="flex-1 text-xs text-red-500 font-bold truncate">
        {isRecording ? "Enregistrement en cours..." : "Message vocal prêt"}
      </div>

      <div className="flex items-center gap-2">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
            title="Arrêter l'enregistrement"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendAudio}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1 text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            Envoyer
          </button>
        )}

        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
          title="Annuler"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
