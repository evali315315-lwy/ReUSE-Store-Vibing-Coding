import { useState, useEffect } from 'react';
import { Recycle, ShoppingBag, Clock, MapPin, Mail, Heart } from 'lucide-react';
import reuseLogo from '../../assets/(RE)use Store Logo for Email (2) (1).png';
import { settingsAPI } from '../../services/settingsAPI';
import { useVersion } from '../../contexts/VersionContext';
import InlineEditableField from './InlineEditableField';
import InlineEditableList from './InlineEditableList';
import toast from 'react-hot-toast';

function AboutContent() {
  const { version } = useVersion();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await settingsAPI.getSettings();

      // Transform settings array into object keyed by setting key
      const settingsObj = {};
      allSettings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      setSettings(settingsObj);
    } catch (error) {
      console.error('Error loading settings:', error);
      // If settings fail to load, component will use hardcoded fallbacks
    } finally {
      setLoading(false);
    }
  };

  // Fallback values if settings not loaded
  const hours = settings?.hours || {
    Tuesday: '3:00 PM - 5:00 PM',
    Friday: '1:00 PM - 3:00 PM',
    Saturday: '9:00 AM - 11:00 AM'
  };

  const location = settings?.location || {
    building: 'Comfort Hall, Basement',
    street: '370 Lancaster Avenue',
    city: 'Haverford',
    state: 'PA',
    zip: '19041'
  };

  const contactEmail = settings?.contact_email || 'reuse@haverford.edu';
  const contactPhone = settings?.contact_phone || '(610) 896-1000';

  // Hero section
  const heroTitle = settings?.hero_title || 'Welcome to the ReUSE Store';
  const heroSubtitle = settings?.hero_subtitle || "Haverford College's sustainable solution for reducing waste and promoting reuse on campus";

  // Content sections
  const whatIsTitle = settings?.what_is_title || 'What is the ReUSE Store?';
  const whatIsText = settings?.what_is_text || "The ReUSE Store is Haverford College's sustainability initiative dedicated to reducing waste and promoting a circular economy on campus. We collect gently used items from students, faculty, and staff, and make them available for free to the Haverford community.\n\nBy participating in the ReUSE Store, you're helping to divert usable items from landfills, reduce carbon emissions, and support fellow students who need essential items.";
  const donatingTitle = settings?.donating_title || 'Donating Items';
  const shoppingTitle = settings?.shopping_title || 'Shopping/Taking Items';

  // Additional static text
  const blackSquirrelText = settings?.black_squirrel_text || 'Home of the Black Squirrel Initiative';
  const howItWorksHeading = settings?.how_it_works_heading || 'How It Works';
  const acceptedItemsHeading = settings?.accepted_items_heading || 'Accepted & Non-Accepted Items';
  const weAcceptTitle = settings?.we_accept_title || 'We Accept';
  const weDontAcceptTitle = settings?.we_dont_accept_title || "We Don't Accept";
  const visitUsHeading = settings?.visit_us_heading || 'Visit Us';
  const locationHeading = settings?.location_heading || 'Location';
  const hoursHeading = settings?.hours_heading || 'Hours';
  const hoursNote = settings?.hours_note || '*Hours may vary during breaks and exam periods';
  const getInTouchHeading = settings?.get_in_touch_heading || 'Get in Touch';
  const getInTouchDescription = settings?.get_in_touch_description || 'Have questions about donations, need to arrange a large item drop-off, or want to volunteer?';
  const environmentalImpactHeading = settings?.environmental_impact_heading || 'Our Environmental Impact';
  const environmentalImpactText = settings?.environmental_impact_text || "Every item reused is an item that doesn't end up in a landfill. Check out our Statistics page to see the incredible impact our community has made through the ReUSE Store.";

  // Lists
  const donatingItems = settings?.donating_items || [
    'Bring clean, gently used items to the ReUSE Store during open hours',
    'Accepted items include: hangers, fans, kitchen goods, lamps, minifridges and small appliances, new toiletries, office goods, and much more!',
    'Our student workers will log your donation and ensure it finds a new home'
  ];
  const shoppingItems = settings?.shopping_items || [
    'All items are completely free for Haverford students, faculty, and staff',
    'Visit during our open hours and browse available items',
    'Take what you need - no purchase or checkout required',
    'Please only take items you will actually use to ensure availability for others'
  ];
  const acceptedItems = settings?.accepted_items || [
    'Hangers',
    'Fans',
    'Kitchen Goods',
    'Lamps',
    'Minifridges and Small Appliances',
    'New Toiletries',
    'Office Goods',
    'So much more!!'
  ];
  const notAcceptedItems = settings?.not_accepted_items || [
    'Broken items',
    'Clothing and soft goods (towels, bedding, etc.)',
    'Dirty items',
    'Opened/Used toiletries',
    'Large furniture',
    'Mattress pads',
    'Nonperishable food',
    'Rugs',
    'Trash'
  ];
  const impactLabels = settings?.impact_labels || [
    'Reduce Waste',
    'Lower Carbon Footprint',
    'Support Community'
  ];

  // Save handlers for inline editing
  const handleSaveHours = async (day, newValue) => {
    try {
      const updatedHours = { ...hours, [day]: newValue };
      await settingsAPI.updateSetting('hours', updatedHours, 'admin');
      toast.success('Hours updated successfully');
      loadSettings();
    } catch (error) {
      console.error('Error updating hours:', error);
      toast.error('Failed to update hours');
    }
  };

  const handleSaveLocation = async (field, newValue) => {
    try {
      const updatedLocation = { ...location, [field]: newValue };
      await settingsAPI.updateSetting('location', updatedLocation, 'admin');
      toast.success('Location updated successfully');
      loadSettings();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const handleSaveEmail = async (newValue) => {
    try {
      await settingsAPI.updateSetting('contact_email', newValue, 'admin');
      toast.success('Email updated successfully');
      loadSettings();
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    }
  };

  const handleSavePhone = async (newValue) => {
    try {
      await settingsAPI.updateSetting('contact_phone', newValue, 'admin');
      toast.success('Phone updated successfully');
      loadSettings();
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Failed to update phone');
    }
  };

  const handleSaveSimple = async (key, newValue, successMessage = 'Updated successfully') => {
    try {
      await settingsAPI.updateSetting(key, newValue, 'admin');
      toast.success(successMessage);
      loadSettings();
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast.error(`Failed to update ${key}`);
    }
  };

  const handleSaveList = async (key, newItems, successMessage = 'List updated successfully') => {
    try {
      await settingsAPI.updateSetting(key, newItems, 'admin');
      toast.success(successMessage);
      loadSettings();
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast.error(`Failed to update ${key}`);
    }
  };

  const isAdmin = version === 'admin';
  const canEdit = isAdmin && editMode;

  return (
    <div className="space-y-12">
      {/* Admin Edit Mode Toggle */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              editMode
                ? 'bg-eco-primary-600 text-white hover:bg-eco-primary-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {editMode ? '✓ Edit Mode ON' : 'Edit Page'}
          </button>
        </div>
      )}

      {/* Edit Mode indicator */}
      {canEdit && (
        <div className="bg-eco-primary-50 border border-eco-primary-200 rounded-lg p-3 text-center">
          <p className="text-sm text-eco-primary-700">
            <strong>Edit Mode Active:</strong> Hover over any text to edit inline
          </p>
        </div>
      )}
      {/* Hero Section with ReUSE Logo */}
      <section className="text-center py-12 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-eco-primary-100 via-eco-teal-light/20 to-transparent rounded-full blur-3xl -z-10"></div>

        <div className="flex justify-center items-center mb-6">
          <img src={reuseLogo} alt="ReUSE Store Logo" className="h-32 w-auto object-contain" />
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-eco-primary-700 via-eco-teal-dark to-eco-primary-800 bg-clip-text text-transparent mb-4 font-display">
          <InlineEditableField
            value={heroTitle}
            onSave={(newValue) => handleSaveSimple('hero_title', newValue, 'Title updated')}
            isAdmin={canEdit}
            placeholder="Main title"
          />
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
          <InlineEditableField
            value={heroSubtitle}
            onSave={(newValue) => handleSaveSimple('hero_subtitle', newValue, 'Subtitle updated')}
            isAdmin={canEdit}
            placeholder="Subtitle"
            multiline={true}
          />
        </p>
        <p className="text-lg text-eco-primary-600 mt-2 font-semibold">
          <InlineEditableField
            value={blackSquirrelText}
            onSave={(newValue) => handleSaveSimple('black_squirrel_text', newValue, 'Text updated')}
            isAdmin={canEdit}
            placeholder="Tagline"
          />
        </p>
      </section>

      {/* What is ReUSE Store */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-white via-eco-primary-50 to-eco-teal-light/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-eco-primary-200 to-eco-teal-light rounded-lg shadow-md">
            <Heart className="w-8 h-8 text-eco-primary-700" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-800 to-eco-teal-dark bg-clip-text text-transparent mb-4">
              <InlineEditableField
                value={whatIsTitle}
                onSave={(newValue) => handleSaveSimple('what_is_title', newValue, 'Title updated')}
                isAdmin={canEdit}
                placeholder="Section title"
              />
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <InlineEditableField
                value={whatIsText}
                onSave={(newValue) => handleSaveSimple('what_is_text', newValue, 'Description updated')}
                isAdmin={canEdit}
                placeholder="Section description"
                multiline={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-8 text-center">
          <InlineEditableField
            value={howItWorksHeading}
            onSave={(newValue) => handleSaveSimple('how_it_works_heading', newValue, 'Heading updated')}
            isAdmin={canEdit}
            placeholder="Section heading"
          />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Donating */}
          <div className="card bg-gradient-to-br from-eco-lime-light/30 to-eco-primary-100 border-2 border-eco-primary-300 hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-primary-300 to-eco-lime-light rounded-lg shadow-md">
                <Recycle className="w-6 h-6 text-eco-primary-700" />
              </div>
              <h3 className="text-2xl font-bold text-eco-primary-800">
                <InlineEditableField
                  value={donatingTitle}
                  onSave={(newValue) => handleSaveSimple('donating_title', newValue, 'Title updated')}
                  isAdmin={canEdit}
                  placeholder="Donating title"
                />
              </h3>
            </div>
            <InlineEditableList
              items={donatingItems}
              onSave={(newItems) => handleSaveList('donating_items', newItems, 'Donating items updated')}
              isAdmin={canEdit}
              bulletColor="text-eco-primary-500"
            />
          </div>

          {/* Shopping */}
          <div className="card bg-gradient-to-br from-eco-teal-light/30 to-eco-primary-100 border-2 border-eco-teal-light hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-teal-light to-eco-primary-300 rounded-lg shadow-md">
                <ShoppingBag className="w-6 h-6 text-eco-teal-dark" />
              </div>
              <h3 className="text-2xl font-bold text-eco-teal-dark">
                <InlineEditableField
                  value={shoppingTitle}
                  onSave={(newValue) => handleSaveSimple('shopping_title', newValue, 'Title updated')}
                  isAdmin={canEdit}
                  placeholder="Shopping title"
                />
              </h3>
            </div>
            <InlineEditableList
              items={shoppingItems}
              onSave={(newItems) => handleSaveList('shopping_items', newItems, 'Shopping items updated')}
              isAdmin={canEdit}
              bulletColor="text-eco-primary-500"
            />
          </div>
        </div>
      </section>

      {/* What We Accept / Don't Accept */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-8 text-center">
          <InlineEditableField
            value={acceptedItemsHeading}
            onSave={(newValue) => handleSaveSimple('accepted_items_heading', newValue, 'Heading updated')}
            isAdmin={canEdit}
            placeholder="Section heading"
          />
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* What We Accept */}
          <div className="card bg-gradient-to-br from-eco-primary-100 to-eco-lime-light/30 border-2 border-eco-primary-400">
            <h3 className="text-2xl font-bold text-eco-primary-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">✅</span>{' '}
              <InlineEditableField
                value={weAcceptTitle}
                onSave={(newValue) => handleSaveSimple('we_accept_title', newValue, 'Title updated')}
                isAdmin={canEdit}
                placeholder="Title"
              />
            </h3>
            <InlineEditableList
              items={acceptedItems}
              onSave={(newItems) => handleSaveList('accepted_items', newItems, 'Accepted items updated')}
              isAdmin={canEdit}
              bulletColor="text-eco-primary-500"
            />
          </div>

          {/* What We Don't Accept */}
          <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <span className="text-3xl">❌</span>{' '}
              <InlineEditableField
                value={weDontAcceptTitle}
                onSave={(newValue) => handleSaveSimple('we_dont_accept_title', newValue, 'Title updated')}
                isAdmin={canEdit}
                placeholder="Title"
              />
            </h3>
            <InlineEditableList
              items={notAcceptedItems}
              onSave={(newItems) => handleSaveList('not_accepted_items', newItems, 'Non-accepted items updated')}
              isAdmin={canEdit}
              bulletColor="text-red-500"
            />
          </div>
        </div>
      </section>

      {/* Hours & Location */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-primary-100 via-eco-teal-light/20 to-eco-lime-light/20 border-2 border-eco-primary-400 shadow-lg">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-6 text-center">
          <InlineEditableField
            value={visitUsHeading}
            onSave={(newValue) => handleSaveSimple('visit_us_heading', newValue, 'Heading updated')}
            isAdmin={canEdit}
            placeholder="Section heading"
          />
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Location */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-primary-300 to-eco-teal-light rounded-lg shadow-md">
                <MapPin className="w-6 h-6 text-eco-primary-800" />
              </div>
              <h3 className="text-xl font-bold text-eco-primary-800">
                <InlineEditableField
                  value={locationHeading}
                  onSave={(newValue) => handleSaveSimple('location_heading', newValue, 'Heading updated')}
                  isAdmin={canEdit}
                  placeholder="Subsection heading"
                />
              </h3>
            </div>
            <p className="text-gray-700">
              <strong>Haverford College</strong><br />
              <InlineEditableField
                value={location.building}
                onSave={(newValue) => handleSaveLocation('building', newValue)}
                isAdmin={canEdit}
                placeholder="Building name"
              />
              <br />
              <InlineEditableField
                value={location.street}
                onSave={(newValue) => handleSaveLocation('street', newValue)}
                isAdmin={canEdit}
                placeholder="Street address"
              />
              <br />
              <InlineEditableField
                value={location.city}
                onSave={(newValue) => handleSaveLocation('city', newValue)}
                isAdmin={canEdit}
                placeholder="City"
              />
              {', '}
              <InlineEditableField
                value={location.state}
                onSave={(newValue) => handleSaveLocation('state', newValue)}
                isAdmin={canEdit}
                placeholder="State"
              />
              {' '}
              <InlineEditableField
                value={location.zip}
                onSave={(newValue) => handleSaveLocation('zip', newValue)}
                isAdmin={canEdit}
                placeholder="ZIP"
              />
            </p>
          </div>

          {/* Hours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-eco-teal-light to-eco-primary-300 rounded-lg shadow-md">
                <Clock className="w-6 h-6 text-eco-teal-dark" />
              </div>
              <h3 className="text-xl font-bold text-eco-teal-dark">
                <InlineEditableField
                  value={hoursHeading}
                  onSave={(newValue) => handleSaveSimple('hours_heading', newValue, 'Heading updated')}
                  isAdmin={canEdit}
                  placeholder="Subsection heading"
                />
              </h3>
            </div>
            <div className="text-gray-700 space-y-1">
              {Object.entries(hours).map(([day, time]) => (
                <p key={day}>
                  <strong>{day}:</strong>{' '}
                  <InlineEditableField
                    value={time}
                    onSave={(newValue) => handleSaveHours(day, newValue)}
                    isAdmin={canEdit}
                    placeholder="Enter hours"
                  />
                </p>
              ))}
              <p className="text-sm text-eco-primary-600 mt-3">
                <InlineEditableField
                  value={hoursNote}
                  onSave={(newValue) => handleSaveSimple('hours_note', newValue, 'Note updated')}
                  isAdmin={canEdit}
                  placeholder="Hours note"
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="card max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-eco-primary-100 rounded-lg">
            <Mail className="w-8 h-8 text-eco-primary-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-eco-primary-800 mb-4">
              <InlineEditableField
                value={getInTouchHeading}
                onSave={(newValue) => handleSaveSimple('get_in_touch_heading', newValue, 'Heading updated')}
                isAdmin={canEdit}
                placeholder="Section heading"
              />
            </h2>
            <p className="text-gray-700 mb-4">
              <InlineEditableField
                value={getInTouchDescription}
                onSave={(newValue) => handleSaveSimple('get_in_touch_description', newValue, 'Description updated')}
                isAdmin={canEdit}
                placeholder="Contact description"
                multiline={true}
              />
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>Email:</strong>{' '}
                {canEdit ? (
                  <InlineEditableField
                    value={contactEmail}
                    onSave={handleSaveEmail}
                    isAdmin={canEdit}
                    placeholder="email@haverford.edu"
                    className="text-eco-primary-600"
                  />
                ) : (
                  <a href={`mailto:${contactEmail}`} className="text-eco-primary-600 hover:text-eco-primary-700 underline">
                    {contactEmail}
                  </a>
                )}
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong>{' '}
                <InlineEditableField
                  value={contactPhone}
                  onSave={handleSavePhone}
                  isAdmin={canEdit}
                  placeholder="(XXX) XXX-XXXX"
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="card max-w-4xl mx-auto bg-gradient-to-br from-eco-lime-light/30 via-eco-primary-100 to-eco-teal-light/30 border-2 border-eco-lime shadow-lg">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-eco-primary-700 via-eco-lime-dark to-eco-teal-dark bg-clip-text text-transparent mb-4 text-center">
          <InlineEditableField
            value={environmentalImpactHeading}
            onSave={(newValue) => handleSaveSimple('environmental_impact_heading', newValue, 'Heading updated')}
            isAdmin={canEdit}
            placeholder="Section heading"
          />
        </h2>
        <p className="text-gray-700 text-center max-w-2xl mx-auto mb-6">
          <InlineEditableField
            value={environmentalImpactText}
            onSave={(newValue) => handleSaveSimple('environmental_impact_text', newValue, 'Text updated')}
            isAdmin={canEdit}
            placeholder="Impact description"
            multiline={true}
          />
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">♻️</p>
            <p className="text-sm text-gray-600 font-semibold">
              <InlineEditableField
                value={impactLabels[0]}
                onSave={(newValue) => {
                  const newLabels = [...impactLabels];
                  newLabels[0] = newValue;
                  handleSaveList('impact_labels', newLabels, 'Label updated');
                }}
                isAdmin={canEdit}
                placeholder="Impact label"
              />
            </p>
          </div>
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">🌱</p>
            <p className="text-sm text-gray-600 font-semibold">
              <InlineEditableField
                value={impactLabels[1]}
                onSave={(newValue) => {
                  const newLabels = [...impactLabels];
                  newLabels[1] = newValue;
                  handleSaveList('impact_labels', newLabels, 'Label updated');
                }}
                isAdmin={canEdit}
                placeholder="Impact label"
              />
            </p>
          </div>
          <div className="p-4">
            <p className="text-4xl font-bold text-eco-primary-600 mb-2">💚</p>
            <p className="text-sm text-gray-600 font-semibold">
              <InlineEditableField
                value={impactLabels[2]}
                onSave={(newValue) => {
                  const newLabels = [...impactLabels];
                  newLabels[2] = newValue;
                  handleSaveList('impact_labels', newLabels, 'Label updated');
                }}
                isAdmin={canEdit}
                placeholder="Impact label"
              />
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutContent;
