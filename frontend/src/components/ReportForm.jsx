import { useState } from 'react';
import FileUpload from './FileUpload';
import CameraCapture from './CameraCapture';

function ReportForm() {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [formKey, setFormKey] = useState(Date.now());

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!issueType || description.trim() === '') {
      alert('Please select an issue type and provide a description.');
      return;
    }
    console.log({
      issueType: issueType,
      description: description,
      file: file,
    });
    alert('Report submitted successfully! (Check the console for data)');
    setIssueType('');
    setDescription('');
    setFile(null);
    setFormKey(Date.now());
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Report a Civic Issue
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="issueType" className="block text-gray-300 text-sm font-bold mb-2">
            Type of Issue
          </label>
          <select
            id="issueType"
            name="issueType"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
          >
            <option value="">Select an issue type...</option>
            <option value="pothole">Pothole</option>
            <option value="tree_cutting">Tree Cutting</option>
            <option value="water_clogging">Water Clogging</option>
            <option value="debris">Debris / Garbage</option>
            <option value="unsafe_street">Unsafe Street (e.g., no light)</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            placeholder="Describe the issue in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 border-gray-600 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-cyan-500"
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Add Media (Optional)
          </label>
          <FileUpload key={formKey} onFileChange={(selectedFile) => setFile(selectedFile)} />
          <CameraCapture onFileChange={(selectedFile) => setFile(selectedFile)} />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 w-full"
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportForm;