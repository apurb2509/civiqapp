import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function FileUpload({ onFileChange }) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file) {
      onFileChange(file);
      setFileName(file.name);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    handleFile(e.target.files[0]);
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div onDragEnter={handleDrag} className="relative w-full">
      <label
        className={`w-full h-48 flex flex-col justify-center items-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragActive ? "border-cyan-500 bg-gray-700" : "border-gray-600 bg-gray-800 hover:bg-gray-700"}`}
      >
        <div className="text-center p-4">
          <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p className="mt-4 text-gray-400">{t('reportForm.fileUpload')}</p>
          <p className="text-gray-500 text-sm my-2">or</p>
          <button type="button" onClick={onButtonClick} className="font-semibold text-cyan-400 hover:text-cyan-300">{t('reportForm.browseFile')}</button>
          {fileName && <p className="text-green-400 mt-4 text-sm font-semibold">{fileName}</p>}
        </div>
      </label>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept="image/*,video/*"/>
      {dragActive && (
        <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>
      )}
    </div>
  );
}

export default FileUpload;