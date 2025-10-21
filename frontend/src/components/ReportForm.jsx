import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import CameraCapture from './CameraCapture';
import VoiceRecorder from './VoiceRecorder';

function ReportForm() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const cardRef = useRef(null);

  // ✅ Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.error('Location permission denied:', err);
        setLocationError('Unable to get your location. Please enable location access.');
      }
    );
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!session) {
      alert("You must be logged in to submit a report.");
      return;
    }
    if (!issueType || description.trim() === '') {
      alert(t('alerts.fillAllFields'));
      return;
    }
    if (!location) {
      alert('Location is required. Please enable location access in your browser.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('issueType', issueType);
    formData.append('description', description);
    formData.append('lat', location.lat);
    formData.append('lon', location.lon);
    if (file) formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'An unknown error occurred.');

      alert(t('alerts.reportSuccess'));
      setIssueType('');
      setDescription('');
      setFile(null);
      setFormKey(Date.now());
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueTypes = [
    'pothole',           // Original 1
    'treeCutting',       // Original 2
    'waterClogging',     // Original 3
    'debris',            // Original 4
    'unsafeStreet',      // Original 5
    'strayAnimals',
    'illegalParking',
    'garbageBurning',
    'damagedProperty',
    'noisePollution',
    'brokenStreetlight', // <-- New
    'sewageOverflow',    // <-- New
    'leakingPipe',       // <-- New
    'mosquitoMenace',    // <-- New
    'publicToiletIssue', // <-- New
    'other'
  ];
  const isDisabled = !session || isSubmitting;

  // 🎢 3D tilt effect
  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * -6;
    const rotateY = ((x - midX) / midX) * 6;

    cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-slate-900/60 border border-slate-700/40 backdrop-blur-2xl p-8 sm:p-10 transition-transform duration-300 perspective-[1000px]"
    >
      {!session && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center z-20 rounded-3xl">
          <p className="text-white font-bold text-lg text-center">
            Please log in to submit a report.
          </p>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]">
        {t('reportForm.title')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            {t('reportForm.issueTypeLabel')}
          </label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 shadow-inner shadow-black/20"
            disabled={isDisabled}
            required
          >
            <option value="">{t('reportForm.issueTypePlaceholder')}</option>
            {issueTypes.map((type) => (
              <option key={type} value={type}>
                {t(`reportForm.issueTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            {t('reportForm.descriptionLabel')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            placeholder={t('reportForm.descriptionPlaceholder')}
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 shadow-inner shadow-black/20 resize-none"
            disabled={isDisabled}
            required
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-semibold mb-2">
            {t('reportForm.mediaLabel')}
          </label>
          <div className="space-y-4 bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl shadow-inner shadow-black/20">
            <FileUpload key={formKey} onFileChange={(selectedFile) => setFile(selectedFile)} />
            <CameraCapture onFileChange={(selectedFile) => setFile(selectedFile)} />
            <VoiceRecorder onFileChange={(selectedFile) => setFile(selectedFile)} />
          </div>
        </div>

        {/* ✅ Show location status */}
        <div className="text-sm text-center text-gray-400">
          {location
            ? `📍 Location captured (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})`
            : locationError
              ? `⚠️ ${locationError}`
              : 'Fetching your location...'}
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-3.5 font-semibold text-lg rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('reportForm.submittingButton') : t('reportForm.submitButton')}
        </button>
      </form>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 opacity-60 rounded-full"></div>
    </div>
  );
}

export default ReportForm;
