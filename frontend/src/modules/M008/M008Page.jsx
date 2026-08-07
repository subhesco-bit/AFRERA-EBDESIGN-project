import React from 'react';
import { Link } from 'react-router-dom';
import './styles.css';

// Real implementation is mounted globally (MultilingualProvider wraps the
// whole app in App.jsx, and LanguageSelector lives in the site header), not
// as a standalone page — there is no dedicated /localization route.
export default function M008Page() {
  return (
    <div className='module-M008 p-4'>
      <h1>Localization Management (M008)</h1>
      <p>Domain: Platform Foundation — Status: HIDDEN</p>
      <p className="text-sm text-gray-600 mt-2">
        This capability is implemented at{' '}
        <code>components/Multilingual/{'{MultilingualProvider,LanguageSelector,AutoTranslate}'}.jsx</code>,
        not here. It is mounted app-wide (see <code>App.jsx</code>) and is
        reachable via the language selector in the site header on every page
        — there is no separate localization page to link to.
      </p>
      <Link to="/" className="text-blue-600 underline">
        Go to the site (see header language selector) →
      </Link>
    </div>
  );
}
