'use client';

import { useState, useEffect,useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useSearch } from '@/app/hooks/useSearch';
import { FaEye, FaSearch, FaSpinner } from 'react-icons/fa';
import { apiClient } from "@/app/lib/secureAxios";
import VoterDetailModal from '../components/VoterDetailModal';

// Type definitions
interface VoterData {
  _id: string;
  epic_no: string;
  name: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  status: string;
  city?: string;
  assembly_constituency?: string;
  father_name?: string;
  createdAt?: string;
  dataSource?: "api" | "database" | "cache" | "static";
}

export default function SearchPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const { results, loading, error, debouncedSearch, clearResults } = useSearch();

  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedVoter, setSelectedVoter] = useState<VoterData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/voter-data-management-login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setSearchInput('');
    clearResults();
  };

  if (!isAuthenticated) {
    return null;
  }

  // ========== Message Handlers ==========
  const showMessage = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setActionMessage(message);
      setMessageType(type);
      setTimeout(() => setActionMessage(null), 4000);
    },
    []
  );

  // ========== FIXED View Details Handler ==========
    const handleViewDetails = useCallback(
      async (voterRecord: VoterData) => {
        console.log("🔍 Opening voter details for:", voterRecord.epic_no);
  
        setLoadingDetails(true);
  
        try {
          // Try to fetch full details from API using epic_no
          console.log("📡 Fetching details from API...");
  
          // Try multiple possible API endpoints
          let response:any;
          let voterData = null;
  
          try {
            // First try: using epic_no
            //response = await apiClient.get(`/voter-data/${voterRecord.epic_no}`);
            response = await apiClient.get(`/voter-data/details/${voterRecord.epic_no}`);
            console.log("✅ API Response (epic_no):", response);
            voterData = response.data || response;
          } catch (firstError: any) {
            console.log("⚠️ First attempt failed, trying _id...");
  
            /*try {
              // Second try: using _id
              response = await apiClient.get(
                `/voter-data/details/${voterRecord._id}`
              );
              console.log("✅ API Response (_id):", response);
              voterData = response.data || response;
            } catch (secondError: any) {
              console.log("⚠️ Second attempt failed, using fallback data");
              throw secondError;
            }*/
          }
  
          if (!voterData) {
            throw new Error("No data in response");
          }
  
          console.log("📄 Setting voter data:", voterData);
          setSelectedVoter(voterData);
          setIsModalOpen(true);
        } catch (error: any) {
          console.error("❌ Error fetching voter details:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error message:", error.message);
          console.error("Error status:", error.response?.status);
  
          // Fallback to existing data if API fails
          console.log("⚠️ Using fallback data from table");
          setSelectedVoter(voterRecord);
          setIsModalOpen(true);
  
          // Only show error message if it's not a 404 (data still shown with fallback)
          if (error.response?.status !== 404) {
            showMessage(
              "Could not fetch complete details from server. Showing available information.",
              "error"
            );
          }
        } finally {
          setLoadingDetails(false);
        }
      },
      [showMessage]
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Search Voter Data</h1>
        <p className="text-gray-500 mt-1">
          Enter EPIC numbers separated by commas
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EPIC Numbers
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="XKQ5571104, XKQ5571105..."
                value={searchInput}
                onChange={handleSearchChange}
              />
              {searchInput && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tip: Search results will update as you type
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">
              Results ({results.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    EPIC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result: any) => (
                  <tr key={result.epic_no} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {result.epic_no}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {result.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {result.age}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {result.gender}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {result.state}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {result.status || 'VALID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <button
                        onClick={() => handleViewDetails(result)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEye size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && searchInput && results.length === 0 && !error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-center">
          No results found for "{searchInput}"
        </div>
      )}

      {/* ========== Voter Detail Modal ========== */}
            <VoterDetailModal
              isOpen={isModalOpen}
              voter={selectedVoter}
              onClose={() => {
                console.log("🔒 Closing modal");
                setIsModalOpen(false);
                setSelectedVoter(null);
              }}
            />
    </div>
  );
}