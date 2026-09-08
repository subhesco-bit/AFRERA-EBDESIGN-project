const VARIANTS = {
  primary: 'bg-amber-700 text-white hover:bg-amber-800',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
}

function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-60 ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
