import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import FormField from '../common/FormField';

function DonorLookup({
  field,  // 'name' or 'email'
  value,
  onChange,
  onDonorSelect,
  donors = [],
  loading = false,
  error,
  disabled = false
}) {
  const [query, setQuery] = useState(value || '');
  const [selectedDonor, setSelectedDonor] = useState(null);

  // Update query when external value changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
    }
  }, [value]);

  // Filter donors based on query
  const filteredDonors = query === ''
    ? donors.slice(0, 5)
    : donors
        .filter((donor) => {
          const searchText = field === 'name'
            ? donor.name
            : donor.email;
          return searchText.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, 5);

  const handleSelect = (donor) => {
    if (donor) {
      setSelectedDonor(donor);
      const newValue = field === 'name' ? donor.name : donor.email;
      setQuery(newValue);
      onChange(newValue);

      // Notify parent component to auto-fill other fields
      if (onDonorSelect) {
        onDonorSelect(donor);
      }
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);

    // Clear selection if user modifies the input
    if (selectedDonor) {
      setSelectedDonor(null);
    }
  };

  const label = field === 'name' ? "Owner's Name" : "Email";
  const placeholder = field === 'name'
    ? 'Start typing name to search past donors...'
    : 'Start typing email to search past donors...';

  return (
    <FormField
      label={label}
      id={`donor-${field}`}
      required
      error={error}
      helpText={loading ? 'Searching past donors...' : 'Type to search, or enter new'}
    >
      <Combobox value={selectedDonor} onChange={handleSelect} disabled={disabled}>
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
                Loading donors...
              </div>
            ) : filteredDonors.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {query ? 'No past donors found. Enter new donor info.' : 'Start typing to search...'}
              </div>
            ) : (
              filteredDonors.map((donor) => (
                <Combobox.Option
                  key={donor.email}
                  value={donor}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                      active ? 'bg-eco-primary-50 text-eco-primary-800' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex flex-col">
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {donor.name}
                        </span>
                        <span className={`text-xs ${active ? 'text-eco-primary-600' : 'text-gray-500'}`}>
                          {donor.email}
                        </span>
                        {donor.housing && (
                          <span className={`text-xs ${active ? 'text-eco-primary-500' : 'text-gray-400'}`}>
                            {donor.housing} • Class of {donor.gradYear || 'N/A'}
                          </span>
                        )}
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-eco-primary-600">
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

export default DonorLookup;
