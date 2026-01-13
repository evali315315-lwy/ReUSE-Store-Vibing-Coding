import { AlertCircle } from 'lucide-react';

function TypoSuggestion({ originalQuery, suggestion, onSuggestionClick }) {
  if (!suggestion) return null;

  return (
    <div className="bg-eco-sky-50 border border-eco-sky-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-eco-sky-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-gray-700">
            No results found for <strong>"{originalQuery}"</strong>.{' '}
            Did you mean{' '}
            <button
              onClick={() => onSuggestionClick(suggestion)}
              className="text-eco-primary-600 font-semibold underline hover:text-eco-primary-700 transition-colors"
            >
              {suggestion}
            </button>
            ?
          </p>
        </div>
      </div>
    </div>
  );
}

export default TypoSuggestion;
