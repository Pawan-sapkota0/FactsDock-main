/**
 * Country list and utilities for bulk fact generation
 */

export const COUNTRIES_A_TO_Z = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

/**
 * Check if two facts are duplicates based on similarity
 * @param fact1 First fact text
 * @param fact2 Second fact text
 * @returns true if facts are likely duplicates
 */
export const areDuplicateFacts = (fact1: string, fact2: string): boolean => {
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[^\w\s]/g, "");
  const norm1 = normalize(fact1);
  const norm2 = normalize(fact2);

  if (norm1 === norm2) return true;

  // Check if one is a substring of the other (allowing for variations)
  const minLength = Math.min(norm1.length, norm2.length);
  if (minLength > 10) {
    const threshold = minLength * 0.8; // 80% similarity
    let matches = 0;
    for (let i = 0; i < Math.min(norm1.length, norm2.length); i++) {
      if (norm1[i] === norm2[i]) matches++;
    }
    if (matches >= threshold) return true;
  }

  return false;
};

/**
 * Detect duplicate facts in a generated list
 * @param facts Array of fact objects with content field
 * @param contentField Field name containing the fact text
 * @returns Array of facts with duplicates removed
 */
export const removeDuplicateFacts = (
  facts: unknown[],
  contentField: string = "text"
): unknown[] => {
  const seen: Set<string> = new Set();
  const result: unknown[] = [];

  for (const fact of facts || []) {
    const obj = (fact as Record<string, unknown> | null) || {};
    const raw = obj[contentField];
    const content = raw != null ? String(raw) : "";
    const isDuplicate = Array.from(seen).some((s) => areDuplicateFacts(s, content));

    if (!isDuplicate && content) {
      seen.add(content);
      result.push(fact);
    }
  }

  return result;
};

/**
 * Extract calling code from country data
 * Priority: callingCodes[0] > callingCode > idd.root+suffixes (if 1 suffix) > idd.root
 * Avoids concatenating with multiple suffixes (which are usually area codes, not country codes)
 */
export const extractCallingCode = (country: Record<string, unknown>, meta?: Record<string, unknown>): string | null => {
  // 1. Try callingCodes array (authoritative source)
  if (Array.isArray(country?.callingCodes) && country.callingCodes.length > 0) {
    return country.callingCodes[0];
  }

  // 2. Try callingCode field
  if (country?.callingCode) {
    return country.callingCode;
  }

  // 3. Try metadata callingCodes
  if (meta && Array.isArray(meta.callingCodes) && meta.callingCodes.length > 0) {
    return meta.callingCodes[0];
  }

  // 4. Try metadata callingCode
  if (meta?.callingCode) {
    return meta.callingCode;
  }

  // 5. Concatenate idd.root + idd.suffixes[0] ONLY if exactly 1 suffix (Nepal case)
  // Don't concatenate with multiple suffixes (US has 200+ area codes)
  if (
    country?.idd?.root &&
    Array.isArray(country.idd.suffixes) &&
    country.idd.suffixes.length === 1
  ) {
    return `${country.idd.root}${country.idd.suffixes[0]}`;
  }

  // 6. Fall back to idd.root alone (Russia, etc.)
  if (country?.idd?.root) {
    return country.idd.root;
  }

  return null;
};
