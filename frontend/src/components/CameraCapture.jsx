import { useState, useRef, useCallback } from 'react';

function CameraCapture({ onFileChange }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const openCamera = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(streamData);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Could not access the camera. Please check your browser permissions.");
    }
  };

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setStream(null);
  }, [stream]);

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      canvas.toBlob((blob) => {
        const timestamp = new Date().toISOString();
        const fileName = `capture-${timestamp}.jpg`;
        const photoFile = new File([blob], fileName, { type: 'image/jpeg' });
        onFileChange(photoFile);
        closeCamera();
      }, 'image/jpeg');
    }
  };

  const videoElement = isCameraOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-2xl h-auto rounded-lg mb-4"
        onCanPlay={() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }}
      ></video>
      <canvas ref={canvasRef} className="hidden"></canvas>
      <div className="flex space-x-6">
        <button
          onClick={takePicture}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold p-4 rounded-full text-lg shadow-lg"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        <button
          onClick={closeCamera}
          className="bg-red-500 hover:bg-red-600 text-white font-bold p-4 rounded-full text-lg shadow-lg"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openCamera}
        className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 flex items-center justify-center"
      >
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Open Camera
      </button>
      {videoElement}
    </>
  );
}

export default CameraCapture;