import { Loader2 } from 'lucide-react';

function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-eco-primary-500 animate-spin`} />
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
