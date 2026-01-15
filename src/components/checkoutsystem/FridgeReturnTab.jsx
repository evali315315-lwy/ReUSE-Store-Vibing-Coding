import { useState } from 'react';
import { Calendar, Search, Snowflake, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentLookup from './StudentLookup';
import { useStudentLookup } from '../../hooks/useStudentLookup';
import { fridgeAPI } from '../../services/api';

function FridgeReturnTab() {
  const { students, loading: loadingStudents, searchStudents } = useStudentLookup();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fridgeCheckouts, setFridgeCheckouts] = useState([]);
  const [selectedFridges, setSelectedFridges] = useState([]); // Array of fridge IDs
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  const currentDate = new Date().toLocaleDateString();

  // Handle student selection from lookup
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSelectedFridges([]);

    // Fetch student's active fridge checkouts
    if (student && student.email) {
      setLoading(true);
      try {
        const checkouts = await fridgeAPI.getStudentCheckouts(student.email);
        setFridgeCheckouts(checkouts);
        if (checkouts.length === 0) {
          toast.info(`${student.name} has no active fridge checkouts`);
        }
      } catch (error) {
        console.error('Error fetching fridge checkouts:', error);
        toast.error('Failed to fetch fridge checkouts');
        setFridgeCheckouts([]);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle fridge selection
  const toggleFridgeSelection = (fridgeId) => {
    if (selectedFridges.includes(fridgeId)) {
      setSelectedFridges(selectedFridges.filter(id => id !== fridgeId));
    } else {
      setSelectedFridges([...selectedFridges, fridgeId]);
    }
  };

  // Submit fridge return
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (selectedFridges.length === 0) {
      toast.error('Please select at least one fridge to return');
      return;
    }

    setSubmitting(true);

    try {
      // Return each selected fridge
      for (const fridgeId of selectedFridges) {
        await fridgeAPI.returnFridge({
          fridgeId,
          studentEmail: selectedStudent.email,
          returnedBy: 'worker@haverford.edu', // TODO: Get from auth context
          returnNotes: returnNotes
        });
      }

      toast.success(`Successfully returned ${selectedFridges.length} fridge(s)!`);

      // Reset form
      setSelectedStudent(null);
      setFridgeCheckouts([]);
      setSelectedFridges([]);
      setReturnNotes('');
    } catch (error) {
      console.error('Fridge return error:', error);
      toast.error(error.response?.data?.error || 'Failed to return fridges');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Snowflake className="w-6 h-6" />
          Fridge Return
        </h2>
        <p className="text-sm text-blue-700 mt-1">Date: {currentDate}</p>
        <p className="text-xs text-blue-600 mt-2">
          Search for student to see their active fridge checkouts
        </p>
      </div>

      {/* Student Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Student Search</h3>

        <StudentLookup
          field="name"
          value={selectedStudent?.name || ''}
          onChange={(value) => {
            if (!value) {
              setSelectedStudent(null);
              setFridgeCheckouts([]);
              setSelectedFridges([]);
            }
            searchStudents(value, true); // Only show students with active fridge checkouts
          }}
          onStudentSelect={handleStudentSelect}
          students={students}
          loading={loadingStudents}
        />

        {selectedStudent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">Selected Student:</p>
            <p className="text-lg font-semibold text-blue-600">{selectedStudent.name}</p>
            <p className="text-sm text-gray-600">{selectedStudent.email}</p>
            {selectedStudent.housing_assignment && (
              <p className="text-sm text-gray-600">Housing: {selectedStudent.housing_assignment}</p>
            )}
          </div>
        )}
      </div>

      {/* Active Fridge Checkouts */}
      {selectedStudent && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Fridge Checkouts ({fridgeCheckouts.length})
          </h3>

          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading checkouts...
            </div>
          )}

          {!loading && fridgeCheckouts.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Snowflake className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No active fridge checkouts found</p>
            </div>
          )}

          {!loading && fridgeCheckouts.length > 0 && (
            <div className="space-y-3">
              {fridgeCheckouts.map((checkout) => (
                <div
                  key={checkout.fridgeId}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedFridges.includes(checkout.fridgeId)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => toggleFridgeSelection(checkout.fridgeId)}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedFridges.includes(checkout.fridgeId)
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selectedFridges.includes(checkout.fridgeId) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Fridge Icon */}
                    <div className="flex-shrink-0">
                      <Snowflake className="w-8 h-8 text-blue-500" />
                    </div>

                    {/* Fridge Details */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        Fridge #{checkout.fridgeNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {checkout.brand} • {checkout.hasFreezer ? 'With Freezer' : 'No Freezer'}
                      </p>
                      {checkout.size && (
                        <p className="text-sm text-gray-500">Size: {checkout.size}</p>
                      )}
                      {checkout.color && (
                        <p className="text-sm text-gray-500">Color: {checkout.color}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Checked out: {new Date(checkout.checkoutDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFridges.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                Selected: <span className="text-blue-600 font-bold">{selectedFridges.length}</span> fridge(s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Return Notes */}
      {selectedStudent && selectedFridges.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Return Notes (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-2">
            Optionally specify the condition of the fridge interior. Was it cleaned out? Any issues?
          </p>
          <textarea
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Fridge was cleaned out and in good condition, or Fridge had food residue and needs cleaning..."
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || !selectedStudent || selectedFridges.length === 0}
        className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" />
        {submitting ? 'Processing...' : `Return ${selectedFridges.length || ''} Fridge(s)`}
      </button>

      {!selectedStudent && (
        <p className="text-center text-sm text-gray-500">
          Search for a student to see their active fridge checkouts
        </p>
      )}
    </form>
  );
}

export default FridgeReturnTab;
