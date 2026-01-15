import { useState, useEffect } from 'react';
import { X, Clock, MapPin, Mail, Phone, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsAPI } from '../../services/settingsAPI';

const AboutSettingsModal = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    hours: {
      Tuesday: '',
      Friday: '',
      Saturday: ''
    },
    location: {
      building: '',
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    contact_email: '',
    contact_phone: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await settingsAPI.getSettings();

      // Transform settings array into object keyed by setting key
      const settingsObj = {};
      allSettings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      setSettings({
        hours: settingsObj.hours || settings.hours,
        location: settingsObj.location || settings.location,
        contact_email: settingsObj.contact_email || '',
        contact_phone: settingsObj.contact_phone || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (day, value) => {
    setSettings({
      ...settings,
      hours: {
        ...settings.hours,
        [day]: value
      }
    });
  };

  const handleLocationChange = (field, value) => {
    setSettings({
      ...settings,
      location: {
        ...settings.location,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update each setting
      await settingsAPI.updateSetting('hours', settings.hours, 'admin');
      await settingsAPI.updateSetting('location', settings.location, 'admin');
      await settingsAPI.updateSetting('contact_email', settings.contact_email, 'admin');
      await settingsAPI.updateSetting('contact_phone', settings.contact_phone, 'admin');

      toast.success('Settings updated successfully!');
      onSave(); // Trigger parent refresh
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-eco-primary-800">
              Edit About Page Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hours Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-eco-primary-600" />
                  Operating Hours
                </h3>
                <div className="space-y-3">
                  {Object.keys(settings.hours).map(day => (
                    <div key={day} className="flex items-center gap-4">
                      <label className="w-24 text-sm font-medium text-gray-700">
                        {day}:
                      </label>
                      <input
                        type="text"
                        value={settings.hours[day]}
                        onChange={(e) => handleHoursChange(day, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                        placeholder="e.g., 3:00 PM - 5:00 PM"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-eco-primary-600" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building
                    </label>
                    <input
                      type="text"
                      value={settings.location.building}
                      onChange={(e) => handleLocationChange('building', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                      placeholder="e.g., Comfort Hall, Basement"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={settings.location.street}
                      onChange={(e) => handleLocationChange('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                      placeholder="e.g., 370 Lancaster Avenue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={settings.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                      placeholder="e.g., Haverford"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={settings.location.state}
                        onChange={(e) => handleLocationChange('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                        placeholder="PA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP
                      </label>
                      <input
                        type="text"
                        value={settings.location.zip}
                        onChange={(e) => handleLocationChange('zip', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                        placeholder="19041"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-eco-primary-600" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                      placeholder="reuse@haverford.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-eco-primary-500 focus:border-eco-primary-500"
                      placeholder="(610) 896-1000"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-eco-primary-600 text-white rounded-md hover:bg-eco-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutSettingsModal;
