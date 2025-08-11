'use client';

import { useState, useEffect } from 'react';
import { getEveryOrgClient, type EveryOrgNonprofit } from '@/lib/everyorg/client';

export default function TestEveryOrgPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<EveryOrgNonprofit[]>([]);
  const [browseResults, setBrowseResults] = useState<EveryOrgNonprofit[]>([]);
  const [selectedCause, setSelectedCause] = useState('animals');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [client, setClient] = useState<ReturnType<typeof getEveryOrgClient> | null>(null);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState(false);

  // Initialize client on mount
  useEffect(() => {
    try {
      const everyOrgClient = getEveryOrgClient();
      setClient(everyOrgClient);
    } catch (error) {
      console.error('Failed to initialize Every.org client:', error);
    }
  }, []);

  const baseCauses = client?.getPopularCauses() || [];
  const causes = [...baseCauses, ...dynamicCategories];

  // Format cause name for display
  const formatCauseName = (cause: string) => {
    return cause
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Search nonprofits
  const handleSearch = async () => {
    if (!searchTerm.trim() || !client) return;
    
    setLoading(true);
    setSearchMode(true); // Enter search mode
    setBrowseResults([]); // Clear browse results
    
    try {
      const results = await client.searchNonprofits(searchTerm, { take: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Browse nonprofits by cause  
  const handleBrowse = async (cause: string, page: number = 1, isNewCategory = false) => {
    if (!client) return;
    
    setLoading(true);
    setSearchMode(false); // Exit search mode
    setSearchResults([]); // Clear search results
    
    try {
      const response = await client.browseNonprofits(cause, { 
        take: 12, 
        page 
      });
      
      if (response && response.nonprofits.length > 0) {
        setBrowseResults(response.nonprofits);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
        setTotalResults(response.pagination.total_results);
        
        // If this is a new category discovered from tags, add it to our dynamic list
        if (isNewCategory && !baseCauses.includes(cause) && !dynamicCategories.includes(cause)) {
          setDynamicCategories(prev => [...prev, cause]);
          console.log(`✅ New working category discovered: "${cause}" - added to category list!`);
        }
      } else {
        // Category returned no results
        if (isNewCategory) {
          console.log(`❌ Category "${cause}" returned no results - not adding to category list`);
        }
      }
    } catch (error) {
      console.error('Browse error:', error);
      if (isNewCategory) {
        console.log(`❌ Category "${cause}" failed - not adding to category list`);
      }
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  // Load initial browse results
  useEffect(() => {
    if (client) {
      handleBrowse(selectedCause, 1, false);
    }
  }, [selectedCause, client]);

  const NonprofitCard = ({ nonprofit }: { nonprofit: EveryOrgNonprofit }) => (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-3">
        {nonprofit.logoUrl && (
          <img
            src={nonprofit.logoUrl}
            alt={`${nonprofit.name} logo`}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {nonprofit.name}
          </h3>
          {nonprofit.locationAddress && (
            <p className="text-sm text-gray-500 mb-2">
              {nonprofit.locationAddress}
            </p>
          )}
          <p className="text-sm text-gray-600 line-clamp-3">
            {nonprofit.description}
          </p>
          {nonprofit.ein && (
            <p className="text-xs text-gray-400 mt-2">
              EIN: {nonprofit.ein}
            </p>
          )}
          {nonprofit.matchedTerms && nonprofit.matchedTerms.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-blue-600">
                Matches: {nonprofit.matchedTerms.join(', ')}
              </span>
            </div>
          )}
          {nonprofit.tags && nonprofit.tags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Tags:</p>
              <div className="flex flex-wrap gap-1">
                {nonprofit.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-200"
                    onClick={() => {
                      console.log(`🏷️ Tag clicked: "${tag}"`);
                      // Test if this tag works as a browse category
                      handleBrowse(tag, 1, true); // true = isNewCategory
                      setSelectedCause(tag);
                    }}
                    title={`Click to browse "${tag}" category`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 flex space-x-2">
            <a
              href={nonprofit.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              View on Every.org
            </a>
            {nonprofit.websiteUrl && (
              <a
                href={nonprofit.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading Every.org API client...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Every.org Integration Test
          </h1>
          <p className="text-gray-600">
            Test searching and browsing nonprofits from Every.org API
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ✅ API Working: Valid categories show results, invalid ones show nothing
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Nonprofits</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for nonprofits (e.g., 'pets', 'environment')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>

          {searchMode && searchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Search Results for "{searchTerm}" ({searchResults.length})
                </h3>
                <button
                  onClick={() => {
                    setSearchMode(false);
                    setSearchResults([]);
                    setSearchTerm('');
                    handleBrowse(selectedCause, 1, false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Clear Search
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((nonprofit) => (
                  <NonprofitCard key={nonprofit.ein} nonprofit={nonprofit} />
                ))}
              </div>
            </div>
          )}
          
          {searchMode && searchResults.length === 0 && !loading && searchTerm && (
            <div className="mt-6 text-center py-8">
              <p className="text-gray-600">No results found for "{searchTerm}"</p>
              <button
                onClick={() => {
                  setSearchMode(false);
                  setSearchTerm('');
                  handleBrowse(selectedCause, 1);
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Browse
              </button>
            </div>
          )}
        </div>

        {/* Browse Section */}
        {!searchMode && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Browse by Cause</h2>
          
          {/* Cause Selection */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {causes.map((cause) => {
                const isDynamic = dynamicCategories.includes(cause);
                return (
                  <button
                    key={cause}
                    onClick={() => {
                      setSelectedCause(cause);
                      setCurrentPage(1);
                      handleBrowse(cause, 1, false); // false = not a new category
                    }}
                    className={`px-4 py-2 rounded-lg transition-colors relative ${
                      selectedCause === cause
                        ? isDynamic 
                          ? 'bg-green-600 text-white' 
                          : 'bg-blue-600 text-white'
                        : isDynamic
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isDynamic ? 'Discovered from nonprofit tags' : 'Default category'}
                  >
                    {formatCauseName(cause)}
                    {isDynamic && (
                      <span className="ml-1 text-xs">🆕</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">
                {loadingProgress || 'Loading...'}
              </p>
            </div>
          )}

          {/* Browse Results */}
          {browseResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {formatCauseName(selectedCause)} ({totalResults.toLocaleString()} results)
                </h3>
                <button
                  onClick={() => {
                    setBrowseResults([]);
                    setSelectedCause('');
                    setCurrentPage(1);
                    setTotalPages(1);
                    setTotalResults(0);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Clear Browse
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {browseResults.map((nonprofit) => (
                  <NonprofitCard key={nonprofit.ein} nonprofit={nonprofit} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => handleBrowse(selectedCause, currentPage - 1, false)}
                    disabled={currentPage <= 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handleBrowse(selectedCause, currentPage + 1, false)}
                    disabled={currentPage >= totalPages || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}