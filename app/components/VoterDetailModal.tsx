"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaMapMarkerAlt, FaUser, FaIdCard } from "react-icons/fa";

interface VoterData {
  epic_no: string;
  status: string;
  name: string;
  name_in_regional_lang?: string;
  age: string;
  gender: string;
  father_name: string;
  relation_type: string;
  relation_name: string;
  state: string;
  district: string;
  city?: string;
  assembly_constituency: string;
  parliamentary_constituency: string;
  part_number?: string;
  part_name?: string;
  polling_station?: string;
  address?: string;
  dataSource?: string;
  createdAt?: string;
}

interface Props {
  isOpen: boolean;
  voter: VoterData | null;
  onClose: () => void;
}

export default function VoterDetailModal({ isOpen, voter, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => setVisible(isOpen), [isOpen]);

  if (!visible || !voter) return null;

  const closeModal = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-[800px] max-w-full h-[80vh] transform transition-all ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <FaIdCard className="text-white text-2xl" />
            <div>
              <h2 className="text-white text-xl font-bold">Voter Details</h2>
              <p className="text-indigo-100 text-sm">
                EPIC No: {voter.epic_no}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div
          className="p-6 space-y-8 overflow-y-auto"
          style={{
            height: "calc(80vh - 70px)",
            overflowY: "auto",
          }}
        >
          {/* Status */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Status</h3>
            <span
              className={`px-4 py-2 rounded-full text-white font-semibold ${
                voter.status === "VALID" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {voter.status}
            </span>
          </div>

          {/* Personal Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-indigo-600" /> Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Info label="Full Name" value={voter.name} />
              <Info label="Age" value={`${voter.age} years`} />
              <Info label="Gender" value={voter.gender} />
              <Info label="Father's Name" value={voter.father_name} />
              <Info label="Relation Type" value={voter.relation_type} />
              <Info label="Relation Name" value={voter.relation_name} />
              {voter.name_in_regional_lang && (
                <Info
                  label="Regional Name"
                  value={voter.name_in_regional_lang}
                />
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-indigo-600" /> Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Info label="State" value={voter.state} />
              <Info label="District" value={voter.district} />
              <Info label="City" value={voter.city} />
              <Info
                label="Assembly Constituency"
                value={voter.assembly_constituency}
              />
              <Info
                label="Parliamentary Constituency"
                value={voter.parliamentary_constituency}
              />

              {voter.polling_station && (
                <div className="lg:col-span-4">
                  <Info label="Polling Station" value={voter.polling_station} />
                </div>
              )}
              {voter.address && (
                <div className="lg:col-span-4">
                  <Info label="Address" value={voter.address} />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex gap-4">
            <button
              onClick={closeModal}
              className="flex-1 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(voter, null, 2))
              }
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Copy Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small reusable info component */
function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  );
}
