"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { apiClient } from "@/app/lib/secureAxios";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaBan,
  FaSearch,
  FaSync,
  FaDownload,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import VoterDetailModal from "./VoterDetailModal";

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

interface ApiResponse {
  data: VoterData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function DataListContent() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // ========== State Management ==========
  const [data, setData] = useState<VoterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Additional filters
  const [stateFilter, setStateFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedVoter, setSelectedVoter] = useState<VoterData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ========== Data Fetching ==========
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(stateFilter && { state: stateFilter }),
        ...(genderFilter && { gender: genderFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiClient.get<ApiResponse>(
        `/voter-data?${params.toString()}`
      );

      setData(Array.isArray(response.data) ? response.data : []);

      if (response.pagination) {
        setTotalRecords(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to fetch data";
      setError(errorMsg);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    stateFilter,
    genderFilter,
    statusFilter,
    isAuthenticated,
  ]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

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

  // ========== API Actions ==========
  const handleDisable = useCallback(
    async (epicNo: string, name: string) => {
      const confirmMsg = t('dataManagement.confirmDisable', { name });
      if (!confirm(confirmMsg)) return;

      try {
        await apiClient.post(`/voter-data/disable/${epicNo}`, {});
        setData(data.filter((d) => d.epic_no !== epicNo));
        showMessage(
          t('dataManagement.recordDisabled', { name }),
          "success"
        );
      } catch (err: any) {
        showMessage(err.message || t('dataManagement.failedToDisable'), "error");
        console.error("Disable error:", err);
      }
    },
    [data, showMessage, t]
  );

  const handleDelete = useCallback(
    async (epicNo: string, name: string) => {
      const confirmMsg = t('dataManagement.confirmDelete', { name });
      if (!confirm(confirmMsg)) return;

      try {
        await apiClient.delete(`/voter-data/${epicNo}`);
        setData(data.filter((d) => d.epic_no !== epicNo));
        setTotalRecords((prev) => Math.max(0, prev - 1));
        showMessage(
          t('dataManagement.recordDeleted', { name }),
          "success"
        );
      } catch (err: any) {
        showMessage(err.message || t('dataManagement.failedToDelete'), "error");
        console.error("Delete error:", err);
      }
    },
    [data, showMessage, t]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ========== Data Transformation ==========
  const displayedData = useMemo(() => {
    return data;
  }, [data]);

  // Get unique values for filter dropdowns
  const uniqueStates = useMemo(() => {
    return Array.from(
      new Set(displayedData.map((d) => d.state).filter(Boolean))
    );
  }, [displayedData]);

  const uniqueGenders = useMemo(() => {
    return Array.from(
      new Set(displayedData.map((d) => d.gender).filter(Boolean))
    );
  }, [displayedData]);

  // ========== Export Data Handler ==========
  const handleExportCSV = useCallback(() => {
    if (displayedData.length === 0) {
      showMessage("No data to export", "error");
      return;
    }

    const headers = [
      "EPIC No",
      "Name",
      "Age",
      "Gender",
      "State",
      "District",
      "Status",
      "Data Source",
    ];
    const rows = displayedData.map((d) => [
      d.epic_no,
      d.name,
      d.age,
      d.gender,
      d.state,
      d.district,
      d.status,
      d.dataSource || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `voter-data-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showMessage(
      `Exported ${displayedData.length} records successfully`,
      "success"
    );
  }, [displayedData, showMessage]);

  // ========== Reset Filters ==========
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStateFilter("");
    setGenderFilter("");
    setStatusFilter("");
    setPage(1);
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilterOpen(false);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ========== Header ========== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('dataManagement.voterDataList')}</h1>
          <p className="text-gray-500 mt-1">
            {t('dataManagement.manageAndSearch')}
            {totalRecords > 0 && (
              <span className="ml-2 text-sm">
                ({t('dataManagement.totalRecords')}:{" "}
                <span className="font-semibold text-gray-700">
                  {totalRecords.toLocaleString()}
                </span>{" "}
                {t('dataManagement.records')})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{t('dataManagement.refresh')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={displayedData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('dataManagement.export')}
          >
            <FaDownload />
            <span className="hidden sm:inline">{t('dataManagement.export')}</span>
          </button> 
        </div>
      </div>

      {/* ========== Messages ========== */}
      {actionMessage && (
        <div
          className={`px-4 py-3 rounded-lg flex items-center justify-between ${
            messageType === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-lg hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-lg hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========== Search Bar ========== */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dataManagement.quickSearch')}
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('dataManagement.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FaFilter size={16} />
              {t('dataManagement.advancedFilters')} {filterOpen ? "▼" : "▶"}
            </button>
            {(stateFilter || genderFilter || statusFilter) && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                {t('dataManagement.resetFilters')}
              </button>
            )}
          </div>

          {filterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dataManagement.sortBy')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="createdAt">{t('profile.profileUpdated')}</option>
                  <option value="name">{t('dataManagement.name')}</option>
                  <option value="epic_no">{t('dataManagement.epicNo')}</option>
                  <option value="state">{t('dataManagement.state')}</option>
                  <option value="age">{t('dataManagement.age')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dataManagement.order')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                >
                  <option value="desc">{t('dataManagement.descendingNewFirst')}</option>
                  <option value="asc">{t('dataManagement.ascendingOldFirst')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dataManagement.state')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t('dataManagement.allStates')}</option>
                  {uniqueStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dataManagement.gender')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={genderFilter}
                  onChange={(e) => {
                    setGenderFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t('dataManagement.allGenders')}</option>
                  {uniqueGenders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dataManagement.recordsPerPage')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== Data Table ========== */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4 font-medium">
              {t('dataManagement.loadingVoterRecords')}
            </p>
          </div>
        ) : displayedData.length === 0 ? (
          <div className="p-8 text-center">
            <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {search || stateFilter || genderFilter || statusFilter
                ? t('dataManagement.noRecordsFound')
                : t('dataManagement.noVoterRecords')}
            </p>
            {(search || stateFilter || genderFilter || statusFilter) && (
              <button
                onClick={handleResetFilters}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {t('dataManagement.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.epicNo')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.name')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.age')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.gender')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.state')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.district')}
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.status')}
                    </th>
                    {data[0]?.dataSource && (
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        {t('dataManagement.source')}
                      </th>
                    )}
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      {t('dataManagement.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedData.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-blue-50 transition duration-150"
                    >
                      <td className="px-6 py-4 font-semibold text-indigo-600">
                        {record.epic_no}
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {record.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{record.age}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.gender}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.state}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.district}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {record.status}
                        </span>
                      </td>
                      {record.dataSource && (
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              record.dataSource === "cache"
                                ? "bg-blue-100 text-blue-800"
                                : record.dataSource === "database"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {record.dataSource}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(record)}
                            disabled={loadingDetails}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition disabled:opacity-50"
                            title={t('dataManagement.viewDetails')}
                          >
                            <FaEye size={18} />
                          </button>
                          {user?.role === "admin" && (
                            <>
                              <button
                                onClick={() =>
                                  handleDisable(record.epic_no, record.name)
                                }
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                                title={t('dataManagement.disableRecord')}
                              >
                                <FaBan size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(record.epic_no, record.name)
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                title={t('dataManagement.deleteRecord')}
                              >
                                <FaTrash size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ========== Pagination ========== */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600">
                  {t('dataManagement.page')}{" "}
                  <span className="font-semibold text-gray-800">{page}</span> {t('dataManagement.of')}{" "}
                  <span className="font-semibold text-gray-800">
                    {totalPages}
                  </span>
                  {totalRecords > 0 && (
                    <>
                      {" "}
                      • {t('dataManagement.showing')}{" "}
                      <span className="font-semibold text-gray-800">
                        {(page - 1) * limit + 1}-
                        {Math.min(page * limit, totalRecords)}
                      </span>{" "}
                      {t('dataManagement.of')}{" "}
                      <span className="font-semibold text-gray-800">
                        {totalRecords}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Previous page"
                  >
                    <FaChevronLeft />
                  </button>

                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition ${
                            pageNum === page
                              ? "bg-indigo-600 text-white font-semibold"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    title="Next page"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
