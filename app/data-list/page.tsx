"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/app/components/DashboardLayout"; //'@/components/DashboardLayout';
import VoterDetailModal from "@/app/components/VoterDetailModal"; //'@/components/VoterDetailModal';
import axios from "@/app/lib/axios"; //'@/lib/axios';
import Cookies from "js-cookie";
import {
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaBan,
  FaEye,
} from "react-icons/fa";

interface VoterRecord {
  _id: string;
  epic_no: string;
  name: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  status: string;
  isDisabled: boolean;
  createdAt: string;
  dataSource: string;
}

export default function DataListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedVoter, setSelectedVoter] = useState<VoterRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const userData = Cookies.get("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchData();
  }, [pagination.page, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/voter-data", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          sortBy,
          sortOrder,
          search,
        },
      });

      setData(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchData();
  };

  const handleViewDetails = async (voterRecord: VoterRecord) => {
    try {
      // Fetch full details from API
      const response = await axios.get(`/voter-data/${voterRecord._id}`);
      setSelectedVoter(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching voter details:", error);
      // Fallback to existing data if API fails
      setSelectedVoter(voterRecord);
      setIsModalOpen(true);
    }
  };

  const handleDisable = async (epicNo: string) => {
    if (!confirm("Are you sure you want to disable this record?")) return;

    try {
      await axios.post(`/voter-data/disable/${epicNo}`);
      fetchData();
    } catch (error) {
      console.error("Error disabling record:", error);
    }
  };

  const handleDelete = async (epicNo: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      )
    )
      return;

    try {
      await axios.delete(`/voter-data/${epicNo}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Voter Data List
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage all voter records
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name or EPIC No
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Date Added</option>
                <option value="name">Name</option>
                <option value="epic_no">EPIC No</option>
                <option value="state">State</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        EPIC No
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
                        District
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          {record.epic_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {record.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.gender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.district}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === "VALID"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(record)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                              title="View Details"
                            >
                              <FaEye size={18} />
                            </button>
                            {user?.role === "admin" && (
                              <>
                                <button
                                  onClick={() => handleDisable(record.epic_no)}
                                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded transition"
                                  title="Disable"
                                >
                                  <FaBan size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(record.epic_no)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                                  title="Delete"
                                >
                                  <FaTrash size={18} />
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Voter Detail Modal */}
      <VoterDetailModal
        isOpen={isModalOpen}
        voter={selectedVoter}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVoter(null);
        }}
      />
    </DashboardLayout>
  );
}
