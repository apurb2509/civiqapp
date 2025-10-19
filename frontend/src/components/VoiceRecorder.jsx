import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function VoiceRecorder({ onFileChange }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      recorder.onstop = () => {
        const timestamp = new Date().toISOString();
        const fileName = `voice-note-${timestamp}.webm`;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const newAudioFile = new File([audioBlob], fileName, { type: 'audio/webm' });
        
        setAudioFile(newAudioFile);
        onFileChange(newAudioFile);

        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
      
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (err) {
      alert("Could not access the microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const handleDeleteAudio = () => {
    setAudioFile(null);
    onFileChange(null);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioFile) {
    return (
      <div className="w-full mt-4 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            <span className="text-sm">Voice note added.</span>
        </div>
        <button type="button" onClick={handleDeleteAudio} className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      {!isRecording ? (
        <button type="button" onClick={startRecording} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-5.93 5.98A5.98 5.98 0 0111 14.93zM13 3a1 1 0 10-2 0v5a1 1 0 102 0V3z" clipRule="evenodd"></path></svg>
          {t('reportForm.recordVoice')}
        </button>
      ) : (
        <div className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            <span>{t('reportForm.recording')} {formatTime(recordingTime)}</span>
          </div>
          <button type="button" onClick={stopRecording} className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-md text-sm font-semibold">{t('reportForm.stop')}</button>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;