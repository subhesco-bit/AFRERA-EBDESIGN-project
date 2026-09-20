import { forwardRef, useId } from 'react';
import PropTypes from 'prop-types';

// Professional Component: Accessibility, compound patterns, prop validation
const ErrorBoundary = forwardRef(({ loading, error, disabled, children, className, ...props }, ref) => {
  const id = useId();
  const ariaDescribedBy = error ? \-error : undefined;

  return (
    <div role="region" aria-label="ErrorBoundary component">
      <div
        ref={ref}
        role="group"
        aria-busy={loading}
        aria-disabled={disabled}
        aria-describedby={ariaDescribedBy}
        className={component-root \}
        {...props}
      >
        {loading && <span aria-label="Loading">Loading...</span>}
        {!loading && children}
      </div>
      {error && (
        <div id={\-error} role="alert" className="error-message">
          {error}
        </div>
      )}
    </div>
  );
});

ErrorBoundary.displayName = 'ErrorBoundary';
ErrorBoundary.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
};

export default ErrorBoundary;
