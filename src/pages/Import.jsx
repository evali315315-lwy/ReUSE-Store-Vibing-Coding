import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { importAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Import() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const csvFile = acceptedFiles[0];
    setFile(csvFile);
    setPreview(null);
    setImportResults(null);

    // Auto-preview when file is dropped
    try {
      setLoading(true);
      const previewData = await importAPI.previewDonors(csvFile);
      setPreview(previewData);

      toast.success(`Found ${previewData.total} donors in CSV`);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error(error.response?.data?.error || 'Failed to preview CSV');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    try {
      setImporting(true);
      const results = await importAPI.importDonors(file);
      setImportResults(results);

      toast.success(`Successfully imported ${results.imported} donors!`);

      // Clear file and preview after successful import
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.error || 'Failed to import donors');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Import Donors from CSV
        </h1>
        <p className="text-gray-600">
          Upload a CSV file to import donor information into the database.
        </p>
      </div>

      {/* Supported Formats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Supported CSV Formats:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Stickered Items:</strong> Owner's Name, Email, Category, Item...</li>
          <li>• <strong>Waitlist:</strong> Requestor, Email, Housing Assignment, Graduation Year...</li>
          <li>• <strong>Simple:</strong> Name, Email, Housing, GradYear</li>
          <li>• The system will auto-detect the format and extract donor information</li>
        </ul>
      </div>

      {/* File Upload Dropzone */}
      {!importResults && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
            }
          `}
        >
          <input {...getInputProps()} />

          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {file ? (
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="mt-4">
              {isDragActive ? (
                <p className="text-lg text-blue-600 font-medium">Drop the CSV file here</p>
              ) : (
                <>
                  <p className="text-lg text-gray-900 font-medium">
                    Drag and drop a CSV file here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Analyzing CSV file...</p>
        </div>
      )}

      {/* Preview Results */}
      {preview && !importResults && (
        <div className="mt-6">
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            {/* Summary Stats */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview Results</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-2xl font-bold text-gray-900">{preview.total}</p>
                  <p className="text-sm text-gray-600">Total Donors</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-2xl font-bold text-green-700">{preview.valid}</p>
                  <p className="text-sm text-green-600">Ready to Import</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-700">{preview.duplicates}</p>
                  <p className="text-sm text-yellow-600">Already Exist</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-2xl font-bold text-red-700">{preview.invalid}</p>
                  <p className="text-sm text-red-600">Invalid</p>
                </div>
              </div>
            </div>

            {/* Donor List */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Housing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grad Year</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.donors.map((donor, index) => (
                    <tr key={index} className={
                      !donor.valid ? 'bg-red-50' :
                      donor.exists ? 'bg-yellow-50' :
                      'hover:bg-gray-50'
                    }>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!donor.valid ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                            Invalid
                          </span>
                        ) : donor.exists ? (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                            Exists
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{donor.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{donor.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{donor.housing || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{donor.gradYear || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || preview.valid === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  `Import ${preview.valid} Donors`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="mt-6">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Completed!</h3>

              <div className="text-sm text-gray-600 space-y-1 mb-6">
                <p><strong>{importResults.imported}</strong> donors successfully imported</p>
                <p><strong>{importResults.skipped}</strong> donors skipped</p>
                {importResults.errors.length > 0 && (
                  <p className="text-red-600">
                    <strong>{importResults.errors.length}</strong> errors occurred
                  </p>
                )}
              </div>

              {/* Error Details */}
              {importResults.errors.length > 0 && (
                <div className="mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                  <div className="bg-red-50 border border-red-200 rounded p-4 max-h-40 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 mb-2">
                        Row {error.row}: {error.error} ({error.email})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Import Another File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
