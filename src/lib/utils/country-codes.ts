/**
 * ISO 3166-1 Alpha-3 Country Code to Country Name Mapping
 * For ACNC operating countries field conversion
 */

export const COUNTRY_CODES: Record<string, string> = {
  // Major countries likely to appear in ACNC data
  'AUS': 'Australia',
  'USA': 'United States',
  'GBR': 'United Kingdom',
  'CAN': 'Canada',
  'NZL': 'New Zealand',
  'DEU': 'Germany',
  'FRA': 'France',
  'ITA': 'Italy',
  'ESP': 'Spain',
  'NLD': 'Netherlands',
  'BEL': 'Belgium',
  'CHE': 'Switzerland',
  'AUT': 'Austria',
  'SWE': 'Sweden',
  'NOR': 'Norway',
  'DNK': 'Denmark',
  'FIN': 'Finland',
  'IRL': 'Ireland',
  'PRT': 'Portugal',
  'GRC': 'Greece',
  'POL': 'Poland',
  'CZE': 'Czech Republic',
  'HUN': 'Hungary',
  'SVK': 'Slovakia',
  'SVN': 'Slovenia',
  'HRV': 'Croatia',
  'BGR': 'Bulgaria',
  'ROU': 'Romania',
  'ROM': 'Romania', // Non-standard code sometimes used
  'EST': 'Estonia',
  'LVA': 'Latvia',
  'LTU': 'Lithuania',
  'JPN': 'Japan',
  'KOR': 'South Korea',
  'CHN': 'China',
  'IND': 'India',
  'SGP': 'Singapore',
  'MYS': 'Malaysia',
  'THA': 'Thailand',
  'IDN': 'Indonesia',
  'PHL': 'Philippines',
  'VNM': 'Vietnam',
  'HKG': 'Hong Kong',
  'TWN': 'Taiwan',
  'ZAF': 'South Africa',
  'KEN': 'Kenya',
  'NGA': 'Nigeria',
  'EGY': 'Egypt',
  'MAR': 'Morocco',
  'BRA': 'Brazil',
  'ARG': 'Argentina',
  'CHL': 'Chile',
  'MEX': 'Mexico',
  'COL': 'Colombia',
  'PER': 'Peru',
  'VEN': 'Venezuela',
  'URY': 'Uruguay',
  'ECU': 'Ecuador',
  'BOL': 'Bolivia',
  'PRY': 'Paraguay',
  'ISR': 'Israel',
  'ARE': 'United Arab Emirates',
  'SAU': 'Saudi Arabia',
  'QAT': 'Qatar',
  'KWT': 'Kuwait',
  'BHR': 'Bahrain',
  'BRN': 'Bahrain', // Alternative code sometimes used
  'OMN': 'Oman',
  'JOR': 'Jordan',
  'LBN': 'Lebanon',
  'TUR': 'Turkey',
  'RUS': 'Russia',
  'UKR': 'Ukraine',
  'BLR': 'Belarus',
  'KAZ': 'Kazakhstan',
  'UZB': 'Uzbekistan',
  'KGZ': 'Kyrgyzstan',
  'TJK': 'Tajikistan',
  'TKM': 'Turkmenistan',
  'AFG': 'Afghanistan',
  'PAK': 'Pakistan',
  'BGD': 'Bangladesh',
  'LKA': 'Sri Lanka',
  'NPL': 'Nepal',
  'BTN': 'Bhutan',
  'MDV': 'Maldives',
  'MMR': 'Myanmar',
  'LAO': 'Laos',
  'KHM': 'Cambodia',
  'PNG': 'Papua New Guinea',
  'FJI': 'Fiji',
  'VUT': 'Vanuatu',
  'SLB': 'Solomon Islands',
  'NCL': 'New Caledonia',
  'PYF': 'French Polynesia',
  'GUM': 'Guam',
  'ASM': 'American Samoa',
  'WSM': 'Samoa',
  'TON': 'Tonga',
  'KIR': 'Kiribati',
  'TUV': 'Tuvalu',
  'NRU': 'Nauru',
  'PLW': 'Palau',
  'MHL': 'Marshall Islands',
  'FSM': 'Federated States of Micronesia',
  'COK': 'Cook Islands',
  'NIU': 'Niue',
  'TKL': 'Tokelau',
  'WLF': 'Wallis and Futuna',
  'VAT': 'Vatican City',
  'SMR': 'San Marino',
  'LIE': 'Liechtenstein',
  'MCO': 'Monaco',
  'AND': 'Andorra',
  'GIB': 'Gibraltar',
  'IMN': 'Isle of Man',
  'JEY': 'Jersey',
  'GGY': 'Guernsey',
  'FRO': 'Faroe Islands',
  'ISL': 'Iceland',
  'MLT': 'Malta',
  'CYP': 'Cyprus',
  'MKD': 'North Macedonia',
  'MNE': 'Montenegro',
  'SRB': 'Serbia',
  'BIH': 'Bosnia and Herzegovina',
  'ALB': 'Albania',
  'MDA': 'Moldova',
  'GEO': 'Georgia',
  'ARM': 'Armenia',
  'AZE': 'Azerbaijan',
  
  // Additional codes that might appear in ACNC data
  'PSE': 'Palestine',
  'ESH': 'Western Sahara',
  'SSD': 'South Sudan',
  'SOM': 'Somalia',
  'SDN': 'Sudan',
  'TLS': 'Timor-Leste',
  'SYR': 'Syria',
  'YEM': 'Yemen',
  'IRQ': 'Iraq',
  'IRN': 'Iran',
  'LBY': 'Libya',
  'DZA': 'Algeria',
  'TUN': 'Tunisia',
  'ETH': 'Ethiopia',
  'ERI': 'Eritrea',
  'DJI': 'Djibouti',
  'TCD': 'Chad',
  'CAF': 'Central African Republic',
  'CMR': 'Cameroon',
  'GAB': 'Gabon',
  'GNQ': 'Equatorial Guinea',
  'STP': 'São Tomé and Príncipe',
  'CIV': 'Côte d\'Ivoire',
  'LBR': 'Liberia',
  'SLE': 'Sierra Leone',
  'GIN': 'Guinea',
  'GNB': 'Guinea-Bissau',
  'SEN': 'Senegal',
  'GMB': 'Gambia',
  'MLI': 'Mali',
  'BFA': 'Burkina Faso',
  'NER': 'Niger',
  'MRT': 'Mauritania',
  'MOZ': 'Mozambique',
  'MDG': 'Madagascar',
  'MWI': 'Malawi',
  'ZMB': 'Zambia',
  'ZWE': 'Zimbabwe',
  'BWA': 'Botswana',
  'NAM': 'Namibia',
  'SWZ': 'Eswatini',
  'LSO': 'Lesotho',
  'RWA': 'Rwanda',
  'BDI': 'Burundi',
  'TZA': 'Tanzania',
  'UGA': 'Uganda',
  'COD': 'Democratic Republic of the Congo',
  'COG': 'Republic of the Congo',
  'AGO': 'Angola'
}

/**
 * Convert ISO 3166-1 Alpha-3 country code to full country name
 * @param code - Three-letter country code (e.g., 'AUS', 'USA')
 * @returns Full country name or null if not found (to exclude unknown codes)
 */
export function getCountryName(code: string): string | null {
  if (!code || typeof code !== 'string') {
    return null
  }
  
  const upperCode = code.trim().toUpperCase()
  return COUNTRY_CODES[upperCode] || null
}

/**
 * Convert a string of country codes (separated by delimiters) to country names
 * @param countriesString - String containing country codes separated by commas, semicolons, or pipes
 * @returns Array of country names (excludes unknown codes)
 */
export function parseOperatingCountries(countriesString: string): string[] {
  if (!countriesString || typeof countriesString !== 'string') {
    return []
  }
  
  return countriesString
    .split(/[,;|]/)
    .map(code => code.trim())
    .filter(code => code.length > 0)
    .map(code => getCountryName(code))
    .filter(name => name !== null) // Remove unknown codes
    .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
    .sort()
}

/**
 * Get country code from country name (reverse lookup)
 * @param countryName - Full country name (e.g., 'Afghanistan')
 * @returns ISO 3166-1 Alpha-3 code or null if not found
 */
export function getCountryCode(countryName: string): string | null {
  if (!countryName || typeof countryName !== 'string') {
    return null
  }
  
  const searchName = countryName.trim().toLowerCase()
  for (const [code, name] of Object.entries(COUNTRY_CODES)) {
    if (name.toLowerCase() === searchName) {
      return code
    }
  }
  return null
}

/**
 * Check if a string contains a country (by name or code)
 * Used for filtering organizations by operating country
 * @param countriesString - String containing country codes
 * @param searchCountry - Country name to search for
 * @returns True if the country is found
 */
export function containsOperatingCountry(countriesString: string, searchCountry: string): boolean {
  if (!countriesString || !searchCountry) {
    return false
  }
  
  // First try direct code matching (if searchCountry is a code)
  const upperCountriesString = countriesString.toUpperCase()
  const upperSearchCountry = searchCountry.toUpperCase()
  
  // Check if searchCountry is already a code
  if (upperCountriesString.includes(upperSearchCountry)) {
    return true
  }
  
  // Get the ISO code for the country name and check if it exists in the string
  const countryCode = getCountryCode(searchCountry)
  if (countryCode && upperCountriesString.includes(countryCode)) {
    return true
  }
  
  // Fallback: convert all codes to names and check
  const countryNames = parseOperatingCountries(countriesString)
  return countryNames.some(name => 
    name && name.toLowerCase().includes(searchCountry.toLowerCase())
  )
}