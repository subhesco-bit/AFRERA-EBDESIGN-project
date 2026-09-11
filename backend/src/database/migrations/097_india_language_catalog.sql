-- India-wide language catalogue.
-- Adds all 22 Eighth Schedule languages plus major Northeast field languages.
-- Idempotent so existing installations are preserved.

INSERT INTO languages (iso_code, name, native_name, direction, is_active, priority)
VALUES
  ('en',   'English',              'English',                    'ltr', TRUE, 100),
  ('hi',   'Hindi',                'हिन्दी',                     'ltr', TRUE, 99),
  ('as',   'Assamese',             'অসমীয়া',                    'ltr', TRUE, 98),
  ('bn',   'Bengali',              'বাংলা',                       'ltr', TRUE, 97),
  ('brx',  'Bodo',                 'बड़ो',                        'ltr', TRUE, 96),
  ('doi',  'Dogri',                'डोगरी',                       'ltr', TRUE, 95),
  ('gu',   'Gujarati',             'ગુજરાતી',                     'ltr', TRUE, 94),
  ('kn',   'Kannada',              'ಕನ್ನಡ',                       'ltr', TRUE, 93),
  ('ks',   'Kashmiri',             'कॉशुर / کٲشُر',              'rtl', TRUE, 92),
  ('kok',  'Konkani',              'कोंकणी',                      'ltr', TRUE, 91),
  ('mai',  'Maithili',             'मैथिली',                      'ltr', TRUE, 90),
  ('ml',   'Malayalam',            'മലയാളം',                     'ltr', TRUE, 89),
  ('mni',  'Manipuri (Meitei)',    'মৈতৈলোন্',                    'ltr', TRUE, 88),
  ('mr',   'Marathi',              'मराठी',                       'ltr', TRUE, 87),
  ('ne',   'Nepali',               'नेपाली',                      'ltr', TRUE, 86),
  ('or',   'Odia',                 'ଓଡ଼ିଆ',                      'ltr', TRUE, 85),
  ('pa',   'Punjabi',              'ਪੰਜਾਬੀ',                      'ltr', TRUE, 84),
  ('sa',   'Sanskrit',             'संस्कृतम्',                   'ltr', TRUE, 50),
  ('sat',  'Santali',              'ᱥᱟᱱᱛᱟᱲᱤ',                    'ltr', TRUE, 49),
  ('sd',   'Sindhi',               'सिन्धी / سنڌي',               'rtl', TRUE, 48),
  ('ta',   'Tamil',                'தமிழ்',                       'ltr', TRUE, 83),
  ('te',   'Telugu',               'తెలుగు',                      'ltr', TRUE, 82),
  ('ur',   'Urdu',                 'اردو',                        'rtl', TRUE, 81),
  ('kha',  'Khasi',                'Ka Ktien Khasi',               'ltr', TRUE, 80),
  ('lus',  'Mizo',                 'Mizo ṭawng',                   'ltr', TRUE, 79),
  ('grt',  'Garo',                 'A·chik',                       'ltr', TRUE, 78),
  ('trp',  'Kokborok',             'Kokborok',                     'ltr', TRUE, 77),
  ('njz',  'Ao',                   'Ao',                           'ltr', TRUE, 76),
  ('njm',  'Angami / Tenyidie',    'Tenyidie',                     'ltr', TRUE, 75),
  ('nag',  'Nagamese',              'Nagamese',                     'ltr', TRUE, 74)
ON CONFLICT (iso_code) DO UPDATE SET
  name = EXCLUDED.name,
  native_name = EXCLUDED.native_name,
  direction = EXCLUDED.direction,
  is_active = TRUE,
  priority = EXCLUDED.priority;

-- Locale records for languages with stable Indian locale identifiers.
INSERT INTO locales (language_id, region_code, locale_code, display_name, is_active)
SELECT l.id, 'IN', v.locale_code, v.display_name, TRUE
FROM languages l
JOIN (VALUES
  ('en','en-IN','English (India)'),
  ('hi','hi-IN','Hindi (India)'),
  ('as','as-IN','Assamese (India)'),
  ('bn','bn-IN','Bengali (India)'),
  ('brx','brx-IN','Bodo (India)'),
  ('doi','doi-IN','Dogri (India)'),
  ('gu','gu-IN','Gujarati (India)'),
  ('kn','kn-IN','Kannada (India)'),
  ('ks','ks-IN','Kashmiri (India)'),
  ('kok','kok-IN','Konkani (India)'),
  ('mai','mai-IN','Maithili (India)'),
  ('ml','ml-IN','Malayalam (India)'),
  ('mni','mni-IN','Manipuri (India)'),
  ('mr','mr-IN','Marathi (India)'),
  ('ne','ne-IN','Nepali (India)'),
  ('or','or-IN','Odia (India)'),
  ('pa','pa-IN','Punjabi (India)'),
  ('sa','sa-IN','Sanskrit (India)'),
  ('sat','sat-IN','Santali (India)'),
  ('sd','sd-IN','Sindhi (India)'),
  ('ta','ta-IN','Tamil (India)'),
  ('te','te-IN','Telugu (India)'),
  ('ur','ur-IN','Urdu (India)'),
  ('kha','kha-IN','Khasi (India)'),
  ('lus','lus-IN','Mizo (India)'),
  ('grt','grt-IN','Garo (India)'),
  ('trp','trp-IN','Kokborok (India)'),
  ('njz','njz-IN','Ao (India)'),
  ('njm','njm-IN','Angami / Tenyidie (India)'),
  ('nag','nag-IN','Nagamese (India)')
) AS v(iso_code, locale_code, display_name) ON v.iso_code = l.iso_code
ON CONFLICT (locale_code) DO UPDATE SET
  language_id = EXCLUDED.language_id,
  display_name = EXCLUDED.display_name,
  is_active = TRUE;
