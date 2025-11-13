import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Profile, GroupingResult } from './types/index';
import { createDinnerGroups } from './utils/grouping';
import { Loader2 } from 'lucide-react';

function App() {
  const [results, setResults] = useState<GroupingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedProfiles, setLoadedProfiles] = useState<Profile[]>([]);

  const handleProfilesLoaded = async (profiles: Profile[]) => {
    setLoadedProfiles(profiles);
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const groupingResult = createDinnerGroups(profiles);
      setResults(groupingResult);
    } catch (error) {
      console.error('Error creating groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setLoadedProfiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dinner Party Grouping System</h1>
            {results && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                New Grouping
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!results ? (
          <FileUpload onProfilesLoaded={handleProfilesLoaded} isLoading={isLoading} />
        ) : (
          <>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <span className="text-blue-900 font-medium">Processing {loadedProfiles.length} profiles...</span>
              </div>
            )}
            <ResultsDisplay result={results} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
