'use strict';
/** Real port of pine-shadow src/lib/library/index.ts. Replaces the earlier
 * fabricated LibraryCatalog class (generic add/find/search/tag methods with
 * invented entries) with the real doctrine-and-diagnosis knowledge base. */
module.exports = {
  ...require('./catalog'),
  ...require('./match'),
  ...require('./diagnose'),
  ...require('./queries'),
};
