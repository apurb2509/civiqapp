import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';
import CameraCapture from './CameraCapture';
import VoiceRecorder from './VoiceRecorder';

function ReportForm() {
  const { t } = useTranslation();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!issueType || description.trim() === '') {
      alert(t('alerts.fillAllFields'));
      return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('issueType', issueType);
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('http://localhost:8080/api/reports', {
        method: 'POST',
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

  const issueTypes = ['pothole', 'treeCutting', 'waterClogging', 'debris', 'unsafeStreet'];

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('reportForm.title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="issueType" className="block text-gray-300 text-sm font-bold mb-2">{t('reportForm.issueTypeLabel')}</label>
          <select
            id="issueType"
            name="issueType"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
            disabled={isSubmitting}
          >
            <option value="">{t('reportForm.issueTypePlaceholder')}</option>
            {issueTypes.map(type => (
              <option key={type} value={type}>{t(`reportForm.issueTypes.${type}`)}</option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">{t('reportForm.descriptionLabel')}</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            placeholder={t('reportForm.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2">{t('reportForm.mediaLabel')}</label>
          <FileUpload key={formKey} onFileChange={(selectedFile) => setFile(selectedFile)} />
          <CameraCapture onFileChange={(selectedFile) => setFile(selectedFile)} />
          <VoiceRecorder onFileChange={(selectedFile) => setFile(selectedFile)} />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 w-full disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('reportForm.submittingButton') : t('reportForm.submitButton')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;