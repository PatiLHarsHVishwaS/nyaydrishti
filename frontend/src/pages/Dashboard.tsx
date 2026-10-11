import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  ArrowRight,
  Upload,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, DocumentRecord, SampleDocumentItem } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [samples, setSamples] = useState<SampleDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, samplesData] = await Promise.all([
        api.getStats(),
        api.getSampleDocuments(),
      ]);
      setStats(statsData);
      setSamples(samplesData.samples);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadSample = async (sampleId: string) => {
    setLoadingSampleId(sampleId);
    try {
      const res = await api.loadSampleDocument(sampleId);
      navigate(`/analysis/${res.document.id}`);
    } catch (err: any) {
      alert(`Could not load sample: ${err.message}`);
    } finally {
      setLoadingSampleId(null);
    }
  };

  const recentDocs = stats?.recent || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* TOP HEADER ROW: Title, Subtitle & "+ Upload Document" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14243D] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#737986] mt-1">
            Manage and analyze your legal documents
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-md bg-[#14243D] hover:bg-[#0D182A] text-white text-xs font-medium shadow-subtle self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* FOUR COMPACT HORIZONTAL METRIC PANELS (Matching Reference B) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E2DA] shadow-card flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FAF4E8] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#A98A4B]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#14243D] leading-tight">
              {stats?.total ?? 0}
            </div>
            <div className="text-[11px] text-[#737986] font-medium mt-0.5">
              Total Documents
            </div>
          </div>
        </div>

        {/* Analysis Completed */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E2DA] shadow-card flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#EBF7F1] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#23845D]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#14243D] leading-tight">
              {stats?.analyzed ?? 0}
            </div>
            <div className="text-[11px] text-[#737986] font-medium mt-0.5">
              Analysis Completed
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E2DA] shadow-card flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#EEF4FD] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#4269A8]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#14243D] leading-tight">
              {stats?.pending ?? 0}
            </div>
            <div className="text-[11px] text-[#737986] font-medium mt-0.5">
              Processing
            </div>
          </div>
        </div>

        {/* Failed */}
        <div className="p-4 rounded-lg bg-white border border-[#E5E2DA] shadow-card flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FDF0F0] flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-[#C44B4B]" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-serif text-[#14243D] leading-tight">
              {stats?.errors ?? 0}
            </div>
            <div className="text-[11px] text-[#737986] font-medium mt-0.5">
              Failed
            </div>
          </div>
        </div>
      </div>

      {/* RECENT DOCUMENTS SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-base sm:text-lg text-[#14243D]">
            Recent Documents
          </h2>
          <Link
            to="/library"
            className="text-xs font-semibold text-[#14243D] hover:underline flex items-center space-x-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Professional Document Table Matching Screen B */}
        {recentDocs.length > 0 ? (
          <div className="border border-[#E5E2DA] rounded-lg bg-white shadow-card overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E2DA] bg-[#FAF9F5] text-[11px] font-semibold text-[#737986]">
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Court</th>
                  <th className="py-3 px-4 font-semibold">Upload Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/analysis/${doc.id}`)}
                    className="hover:bg-[#FBFBF9] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        {/* Red PDF Icon */}
                        <div className="w-7 h-8 rounded-sm bg-[#FDEDED] border border-[#F5C2C2] flex items-center justify-center shrink-0 text-[#C44B4B] font-bold text-[9px] uppercase tracking-tighter">
                          PDF
                        </div>
                        <div>
                          <div className="font-semibold text-[#14243D] line-clamp-1">
                            {doc.originalName}
                          </div>
                          {doc.caseNumber && (
                            <div className="text-[11px] text-[#737986] mt-0.5 line-clamp-1">
                              {doc.caseNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#616875] whitespace-nowrap">
                      {doc.court || 'Supreme Court of India'}
                    </td>

                    <td className="py-3.5 px-4 text-[#737986] whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {doc.status === 'analyzed' ? (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF7F1] text-[#23845D]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#23845D]"></span>
                          <span>Completed</span>
                        </div>
                      ) : doc.status === 'error' ? (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF0F0] text-[#C44B4B]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C44B4B]"></span>
                          <span>Failed</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4FD] text-[#4269A8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4269A8]"></span>
                          <span>Processing</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => navigate(`/analysis/${doc.id}`)}
                          className="px-2.5 py-1 rounded border border-[#E5E2DA] bg-white hover:bg-[#F3F1EB] text-xs font-medium text-[#14243D] transition-colors"
                        >
                          View
                        </button>
                        <button
                          title="More options"
                          className="p-1 rounded text-[#737986] hover:text-[#14243D] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[#E5E2DA] rounded-lg bg-white p-10 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#A98A4B] mx-auto opacity-70" />
            <h3 className="font-serif font-bold text-sm text-[#14243D]">No legal documents uploaded yet</h3>
            <p className="text-xs text-[#737986] max-w-sm mx-auto">
              Upload your first court judgment or order in PDF to run automated extraction.
            </p>
            <Link
              to="/upload"
              className="inline-block mt-2 px-4 py-2 rounded-md bg-[#14243D] text-white text-xs font-medium"
            >
              Upload Document
            </Link>
          </div>
        )}
      </div>

      {/* QUICK PRELOADED LANDMARK JUDGMENTS LIST */}
      <div className="space-y-3 pt-4 border-t border-[#E5E2DA]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-sm sm:text-base text-[#14243D]">
            Try a Landmark Judgment
          </h2>
          <span className="text-xs text-[#737986]">
            One-click demonstration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {samples.map((s) => (
            <div
              key={s.id}
              onClick={() => handleLoadSample(s.id)}
              className="p-3.5 rounded-lg border border-[#E5E2DA] bg-white hover:border-[#14243D] hover:shadow-subtle cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#14243D] group-hover:text-[#A98A4B] transition-colors">
                  {s.title}
                </div>
                <div className="text-[11px] text-[#737986]">
                  {s.court} • {s.caseType}
                </div>
              </div>

              <span className="text-xs text-[#14243D] font-medium shrink-0 pl-3 flex items-center space-x-1">
                <span>{loadingSampleId === s.id ? 'Loading...' : 'Open Case'}</span>
                {loadingSampleId === s.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
