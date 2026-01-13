import { useState } from 'react';
import { CheckCircle, AlertCircle, Camera } from 'lucide-react';
import SwipeCard from '../components/verification/SwipeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

// Mock data - this will be replaced with actual data from Excel/Google Sheets
const mockDonationData = [
  {
    id: 1,
    timestamp: '2024-01-15 10:30:00',
    donorName: 'Jane Smith',
    donorEmail: 'jane.smith@example.com',
    objectName: 'Desk Lamp',
    description: 'Black adjustable desk lamp, good condition',
    submissionId: 'DON-2024-001',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    status: 'pending', // pending, checked, flagged
  },
  {
    id: 2,
    timestamp: '2024-01-15 11:45:00',
    donorName: 'John Doe',
    donorEmail: 'john.doe@example.com',
    objectName: 'Office Chair',
    description: 'Ergonomic office chair with wheels, minor wear',
    submissionId: 'DON-2024-002',
    imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400',
    status: 'pending',
  },
  {
    id: 3,
    timestamp: '2024-01-15 14:20:00',
    donorName: 'Sarah Johnson',
    donorEmail: 'sarah.j@example.com',
    objectName: 'Textbooks',
    description: 'Set of 5 biology textbooks',
    submissionId: 'DON-2024-003',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    status: 'pending',
  },
  {
    id: 4,
    timestamp: '2024-01-15 16:00:00',
    donorName: 'Michael Chen',
    donorEmail: 'mchen@example.com',
    objectName: 'Mini Fridge',
    description: 'Small dorm fridge, white, working condition',
    submissionId: 'DON-2024-004',
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400',
    status: 'pending',
  },
  {
    id: 5,
    timestamp: '2024-01-15 17:30:00',
    donorName: 'Emily Rodriguez',
    donorEmail: 'emily.r@example.com',
    objectName: 'Backpack',
    description: 'Blue hiking backpack with multiple compartments',
    submissionId: 'DON-2024-005',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    status: 'pending',
  },
];

const PhotoVerification = () => {
  const [donations, setDonations] = useState(mockDonationData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentDonation = donations[currentIndex];
  const totalDonations = donations.length;
  const pendingCount = donations.filter(d => d.status === 'pending').length;
  const checkedCount = donations.filter(d => d.status === 'checked').length;
  const flaggedCount = donations.filter(d => d.status === 'flagged').length;

  const handleSwipeLeft = () => {
    // Swipe left = Approve/Check
    const updatedDonations = [...donations];
    updatedDonations[currentIndex].status = 'checked';
    setDonations(updatedDonations);

    toast.success('Donation approved and marked as checked!', {
      icon: '✓',
      duration: 2000,
    });

    // Move to next item
    if (currentIndex < totalDonations - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      toast.success('All donations reviewed!', {
        icon: '🎉',
        duration: 3000,
      });
    }
  };

  const handleSwipeRight = () => {
    // Swipe right = Flag for review
    const updatedDonations = [...donations];
    updatedDonations[currentIndex].status = 'flagged';
    setDonations(updatedDonations);

    toast.error('Donation flagged for review', {
      icon: '🚩',
      duration: 2000,
    });

    // Move to next item
    if (currentIndex < totalDonations - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      toast.success('All donations reviewed!', {
        icon: '🎉',
        duration: 3000,
      });
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalDonations - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 to-eco-teal-light flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-primary-50 via-white to-eco-teal-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="w-10 h-10 text-eco-primary-600" />
            <h1 className="text-4xl font-bold text-eco-primary-800">
              Photo Verification
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Review donation photos and confirm information accuracy
          </p>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <Camera className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalDonations}</p>
            <p className="text-sm text-gray-600">Total Items</p>
          </div>
          <div className="card text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-8 h-8 text-eco-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-eco-primary-600">{checkedCount}</p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
          <div className="card text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
            <p className="text-sm text-gray-600">Flagged</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Item {currentIndex + 1} of {totalDonations}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentIndex + 1) / totalDonations) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-eco-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalDonations) * 100}%` }}
            />
          </div>
        </div>

        {/* Swipe Card */}
        {currentDonation ? (
          <div className="mb-8">
            <SwipeCard
              data={currentDonation}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          </div>
        ) : (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-eco-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              All Done!
            </h2>
            <p className="text-gray-600">
              You've reviewed all donations. Great job!
            </p>
          </div>
        )}

        {/* Navigation Controls */}
        {currentDonation && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-2 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleSkip}
              disabled={currentIndex >= totalDonations - 1}
              className="px-6 py-2 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
          </div>
        )}

        {/* Summary Section */}
        <div className="mt-12 card bg-eco-primary-50">
          <h3 className="text-lg font-semibold text-eco-primary-800 mb-4">
            Review Summary
          </h3>
          <div className="space-y-2">
            {donations.map((donation, index) => (
              <div
                key={donation.id}
                className={`flex items-center justify-between py-2 px-4 rounded ${
                  index === currentIndex ? 'bg-white shadow' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    #{donation.submissionId}
                  </span>
                  <span className="text-sm text-gray-600">
                    {donation.objectName}
                  </span>
                </div>
                <div>
                  {donation.status === 'checked' && (
                    <span className="inline-flex items-center gap-1 text-sm text-eco-primary-600">
                      <CheckCircle size={16} />
                      Approved
                    </span>
                  )}
                  {donation.status === 'flagged' && (
                    <span className="inline-flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle size={16} />
                      Flagged
                    </span>
                  )}
                  {donation.status === 'pending' && (
                    <span className="text-sm text-gray-400">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoVerification;
