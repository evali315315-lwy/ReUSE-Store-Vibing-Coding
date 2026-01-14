function FormField({
  label,
  id,
  type = 'text',
  required = false,
  error,
  children,
  helpText
}) {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

export default FormField;
