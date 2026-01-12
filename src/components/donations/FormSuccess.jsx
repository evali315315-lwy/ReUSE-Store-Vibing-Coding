import { CheckCircle } from 'lucide-react';

function FormSuccess({ onNewDonation }) {
  return (
    <div className="card max-w-2xl mx-auto text-center bg-gradient-to-br from-eco-primary-50 to-white border-2 border-eco-primary-300">
      <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-4">
        <CheckCircle className="w-16 h-16 text-eco-primary-600" />
      </div>
      <h2 className="text-3xl font-bold text-eco-primary-800 mb-3">
        Thank You for Your Donation!
      </h2>
      <p className="text-gray-700 mb-6">
        Your donation has been successfully logged. Together, we're making a positive impact
        on our environment and community!
      </p>
      <button
        onClick={onNewDonation}
        className="btn-primary"
      >
        Log Another Donation
      </button>
    </div>
  );
}

export default FormSuccess;
