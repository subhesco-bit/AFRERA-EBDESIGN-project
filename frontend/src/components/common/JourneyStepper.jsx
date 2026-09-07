import { Check } from 'lucide-react';

/**
 * Shared progress indicator for booking, checkout, claims, and applications.
 * The parent owns navigation; this component only communicates state.
 */
export default function JourneyStepper({ steps, currentStep, className = '' }) {
  const activeIndex = Math.max(0, currentStep - 1);

  return (
    <nav aria-label="Journey progress" className={`w-full ${className}`}>
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li key={label} className="flex min-w-0 flex-1 items-start last:flex-none">
              <div className="flex min-w-0 flex-col items-center">
                <span
                  aria-current={active ? 'step' : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    complete ?
                      'border-v42-forest bg-v42-forest text-v42-paddy' :
                      active ?
                        'border-v42-turmeric bg-v42-turmeric text-v42-forestd' :
                        'border-v42-line bg-v42-paddy text-v42-mut'
                  }`}
                >
                  {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className={`mt-2 max-w-28 text-center text-xs ${active ? 'font-semibold text-v42-ink' : 'text-v42-mut'}`}>
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mt-4 h-0.5 min-w-4 flex-1 ${index < activeIndex ? 'bg-v42-forest' : 'bg-v42-line'}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
