# M008 - Localization Management (frontend)

Domain: Platform Foundation
Status: HIDDEN — implemented at `frontend/src/components/Multilingual/`

This module's UI is not built here. `MultilingualProvider.jsx`,
`LanguageSelector.jsx` and `AutoTranslate.jsx` are fully implemented (Hindi,
Bengali, Assamese, Manipuri and Khasi support) and mounted app-wide —
`MultilingualProvider` wraps the whole router in `App.jsx`, and
`LanguageSelector` is rendered in the site header (`components/Header.jsx`)
on every page. There is no dedicated localization page/route; this stub
(`M008Page.jsx`) points to the header selector instead of duplicating the
implementation.
