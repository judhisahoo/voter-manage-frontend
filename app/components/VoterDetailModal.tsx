"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTimes, FaMapMarkerAlt, FaUser, FaIdCard } from "react-icons/fa";

interface VoterData {
  epic_no: string;
  status: string;
  name: string;
  name_in_regional_lang?: string;
  age: string;
  gender: string;
  father_name?: string;
  relation_type?: string;
  relation_name?: string;
  state: string;
  district: string;
  city?: string;
  assembly_constituency?: string;
  parliamentary_constituency?: string;
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
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!visible || !voter) return null;

  const closeModal = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ zIndex: 99999 }}
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-[90vw] md:w-[800px] max-w-full h-[85vh] md:h-[80vh] transform transition-all ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ zIndex: 100000 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <FaIdCard className="text-white text-2xl" />
            <div>
              <h2 className="text-white text-xl font-bold">{t('voterModal.voterDetails')}</h2>
              <p className="text-indigo-100 text-sm">
                {t('voterModal.epicNo')}: {voter.epic_no}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div
          className="p-6 space-y-8 overflow-y-auto"
          style={{
            height: "calc(85vh - 70px)",
            maxHeight: "calc(80vh - 70px)",
          }}
        >
          {/* Status */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">{t('voterModal.status')}</h3>
            <span
              className={`px-4 py-2 rounded-full text-white font-semibold ${
                voter.status === "VALID" || voter.status === "Active" 
                  ? "bg-green-500" 
                  : "bg-red-500"
              }`}
            >
              {voter.status}
            </span>
          </div>

          {/* Personal Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <FaUser className="text-indigo-600" /> {t('voterModal.personalInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Info label={t('voterModal.fullName')} value={voter.name} />
              <Info label={t('voterModal.age')} value={`${voter.age} ${t('voterModal.years')}`} />
              <Info label={t('voterModal.gender')} value={voter.gender} />
              <Info label={t('voterModal.fatherName')} value={voter.father_name} />
              <Info label={t('voterModal.relationType')} value={voter.relation_type} />
              <Info label={t('voterModal.relationName')} value={voter.relation_name} />
              {voter.name_in_regional_lang && (
                <Info
                  label={t('voterModal.regionalName')}
                  value={voter.name_in_regional_lang}
                />
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <FaMapMarkerAlt className="text-indigo-600" /> {t('voterModal.addressInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Info label={t('voterModal.state')} value={voter.state} />
              <Info label={t('voterModal.district')} value={voter.district} />
              <Info label={t('voterModal.city')} value={voter.city} />
              <Info
                label={t('voterModal.assemblyConstituency')}
                value={voter.assembly_constituency}
              />
              <Info
                label={t('voterModal.parliamentaryConstituency')}
                value={voter.parliamentary_constituency}
              />
              <Info label={t('voterModal.partNumber')} value={voter.part_number} />
              <Info label={t('voterModal.partName')} value={voter.part_name} />

              {voter.polling_station && (
                <div className="lg:col-span-4">
                  <Info label={t('voterModal.pollingStation')} value={voter.polling_station} />
                </div>
              )}
              {voter.address && (
                <div className="lg:col-span-4">
                  <Info label={t('voterModal.address')} value={voter.address} />
                </div>
              )}
            </div>
          </div>

          {/* Meta Information */}
          {(voter.dataSource || voter.createdAt) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {t('voterModal.additionalInformation')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {voter.dataSource && (
                  <Info label={t('voterModal.dataSource')} value={voter.dataSource} />
                )}
                {voter.createdAt && (
                  <Info 
                    label={t('voterModal.addedOn')} 
                    value={new Date(voter.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6 flex gap-4">
            <button
              onClick={closeModal}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              {t('voterModal.close')}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(voter, null, 2));
                alert(t('voterModal.voterDetailsCopied'));
              }}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              {t('voterModal.copyDetails')}
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
      <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
      <p className="text-gray-900 font-semibold">{value}</p>
    </div>
  );
}