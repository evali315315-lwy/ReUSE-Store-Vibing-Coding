import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import FormField from '../common/FormField';

function StudentLookup({
  field,  // 'name' or 'email'
  value,
  onChange,
  onStudentSelect,
  students = [],
  loading = false,
  error,
  disabled = false
}) {
  const [query, setQuery] = useState(value || '');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Update query when external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
    }
  }, [value]);

  // Filter students based on query
  const filteredStudents = query === ''
    ? students.slice(0, 5)
    : students
        .filter((student) => {
          const searchText = field === 'name'
            ? student.name
            : student.email;
          return searchText.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, 5);

  const handleSelect = (student) => {
    if (student) {
      setSelectedStudent(student);
      const newValue = field === 'name' ? student.name : student.email;
      setQuery(newValue);
      onChange(newValue);

      // Notify parent component to auto-fill other fields
      if (onStudentSelect) {
        onStudentSelect(student);
      }
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);

    // Clear selection if user modifies the input
    if (selectedStudent) {
      setSelectedStudent(null);
    }
  };

  const label = field === 'name' ? "Student Name" : "Email";
  const placeholder = field === 'name'
    ? 'Start typing name to search students...'
    : 'Start typing email to search students...';

  return (
    <FormField
      label={label}
      id={`student-${field}`}
      required
      error={error}
      helpText={loading ? 'Searching students...' : 'Search existing or enter new student'}
    >
      <Combobox value={selectedStudent} onChange={handleSelect} disabled={disabled}>
        <div className="relative">
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Combobox.Input
              className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-eco-primary-300 focus:ring-eco-primary-500'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronsUpDown className="w-5 h-5 text-gray-400" />
            </Combobox.Button>
          </div>

          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 border border-gray-200 overflow-auto focus:outline-none">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Loading students...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {query === '' ? 'Type to search students' : (
                  <span className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>No match found - you can proceed with new student "{query}"</span>
                  </span>
                )}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Combobox.Option
                  key={student.id}
                  value={student}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                      active ? 'bg-eco-primary-50 text-eco-primary-900' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex flex-col">
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {student.name}
                        </span>
                        <span className="text-sm text-gray-500">{student.email}</span>
                        {student.housing_assignment && (
                          <span className="text-xs text-gray-400">
                            {student.housing_assignment} • {student.gradYear}
                          </span>
                        )}
                      </div>
                      {selected && (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-eco-primary-600' : 'text-eco-primary-600'
                        }`}>
                          <Check className="w-5 h-5" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </FormField>
  );
}

export default StudentLookup;
