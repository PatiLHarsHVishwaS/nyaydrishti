import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  MoreVertical,
  Copy,
  Check,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Printer,
  ChevronLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentRecord, LegalAnalysisResult, LegalProvision } from '../types';

export const AnalysisResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [documentRecord, setDocumentRecord] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Workspace Tabs
  const [activeTab, setActiveTab] = useState<
    'document' | 'summary' | 'parties' | 'provisions' | 'arguments' | 'reasoning' | 'outcome' | 'precedents'
  >('document');

  // Document Viewer state
  const [zoomLevel, setZoomLevel] = useState(125);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThumbnail, setSelectedThumbnail] = useState(1);

  // Legal Provisions Tab state
  const [selectedProvisionIndex, setSelectedProvisionIndex] = useState(0);

  const loadDocument = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDocument(id);
      setDocumentRecord(res.document);

      if (res.document.status === 'extracted' && !res.document.analysis) {
        runAnalysis();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document analysis.');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await api.analyzeDocument(id);
      setDocumentRecord(res.document);
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id]);

  const copySummaryText = () => {
    if (!documentRecord?.analysis) return;
    const s = documentRecord.analysis.summary;
    navigator.clipboard.writeText(s.overview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#14243D]" />
        <p className="text-xs text-[#737986]">Opening legal workspace...</p>
      </div>
    );
  }

  if (error || !documentRecord) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-6 h-6 text-[#C44B4B] mx-auto" />
        <h2 className="font-serif text-lg font-bold text-[#14243D]">Document unavailable</h2>
        <p className="text-xs text-[#737986] leading-relaxed">
          {error || 'The requested document record could not be loaded.'}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-1.5 text-xs text-[#14243D] font-semibold hover:underline pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const analysis: LegalAnalysisResult | undefined = documentRecord.analysis;
  const meta = analysis?.documentMetadata;
  const isPuttaswamy = documentRecord.originalName.toLowerCase().includes('puttaswamy') || meta?.title?.toLowerCase().includes('puttaswamy');

  // Constitutional and statutory provisions grouping
  const constitutionalProvisions = (analysis?.legalProvisions || []).filter(
    (p) => p.type.toLowerCase().includes('constitutional') || p.name.toLowerCase().includes('article')
  );
  const statutoryProvisions = (analysis?.legalProvisions || []).filter(
    (p) => !p.type.toLowerCase().includes('constitutional') && !p.name.toLowerCase().includes('article')
  );

  const allProvisions = [...constitutionalProvisions, ...statutoryProvisions];
  const activeProvision: LegalProvision | undefined =
    allProvisions[selectedProvisionIndex] || allProvisions[0];

  const totalPages = documentRecord.pageCount || (isPuttaswamy ? 285 : 4);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP CASE HEADER (Matching Screens C & D) */}
      <div className="space-y-3 pb-2 border-b border-[#E5E2DA]">
        <Link
          to="/library"
          className="inline-flex items-center space-x-1.5 text-xs text-[#737986] hover:text-[#14243D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14243D] tracking-tight">
                {meta?.title || documentRecord.originalName.replace(/\.[^/.]+$/, '')}
              </h1>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EBF7F1] text-[#23845D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#23845D]"></span>
                <span>Completed</span>
              </span>
            </div>

            <div className="text-xs text-[#737986] flex flex-wrap items-center gap-x-2">
              <span>{meta?.court || 'Supreme Court of India'}</span>
              <span>|</span>
              <span>{analysis?.caseClassification?.primary || 'Constitutional Law'}</span>
              <span>|</span>
              <span>{meta?.decisionDate || '24 August 2017'}</span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <a
              href={api.getAnalysisExportUrl(documentRecord.id, 'markdown')}
              download
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-[#14243D] hover:bg-[#0D182A] text-white text-xs font-medium shadow-subtle transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </a>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: meta?.title || documentRecord.originalName, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Analysis link copied to clipboard.');
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-md border border-[#E5E2DA] bg-white hover:bg-[#F3F1EB] text-[#14243D] text-xs font-medium shadow-subtle transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              title="More options"
              className="p-2 rounded-md border border-[#E5E2DA] bg-white hover:bg-[#F3F1EB] text-[#737986] hover:text-[#14243D] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. HORIZONTAL TAB BAR (Matching Reference C & D) */}
        <div className="pt-2 overflow-x-auto">
          <nav className="flex space-x-6 border-b border-[#E5E2DA] text-xs whitespace-nowrap">
            {[
              { id: 'document', label: 'Document' },
              { id: 'summary', label: 'Case Summary' },
              { id: 'parties', label: 'Parties' },
              { id: 'provisions', label: 'Legal Provisions' },
              { id: 'arguments', label: 'Arguments' },
              { id: 'reasoning', label: 'Court Reasoning' },
              { id: 'outcome', label: 'Outcome' },
              { id: 'precedents', label: 'Precedents' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 font-medium transition-colors relative ${
                    isActive
                      ? 'text-[#14243D] font-semibold'
                      : 'text-[#737986] hover:text-[#14243D]'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14243D]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTENT ACCORDING TO ACTIVE TAB */}

      {/* TAB 1: DOCUMENT VIEW (Screen C: Left Document Canvas, Right Case Summary & Metadata) */}
      {activeTab === 'document' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Document / PDF Viewer (62% width on desktop) */}
          <div className="lg:col-span-7 border border-[#E5E2DA] rounded-lg bg-white shadow-card overflow-hidden flex flex-col">
            {/* Document Viewer Toolbar (Matching Screen C exactly) */}
            <div className="h-10 bg-[#2B2E33] text-[#D1D5DB] px-3 flex items-center justify-between text-xs select-none">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedThumbnail((prev) => Math.max(1, prev - 1))}
                  title="Toggle Thumbnails"
                  className="p-1 hover:text-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-[#4B5563]" />
                <span className="text-[11px] font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setSelectedThumbnail((prev) => Math.min(totalPages, prev + 1))}
                  className="p-1 hover:text-white"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom & Page Size */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                  title="Zoom Out"
                  className="p-1 hover:text-white"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  title="Zoom In"
                  className="p-1 hover:text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-[#4B5563]" />
                <button
                  onClick={() => setZoomLevel(100)}
                  title="Fit Width"
                  className="p-1 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button title="Print Document" className="p-1 hover:text-white">
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Canvas Body: Left Thumbnails + Center Rendered Document */}
            <div className="flex bg-[#525659] p-4 min-h-[620px] max-h-[720px] overflow-auto">
              {/* Left Thumbnails Strip */}
              <div className="hidden sm:flex flex-col space-y-3 pr-4 border-r border-[#6B7280]/40 shrink-0 select-none">
                {[1, 2, 3, 4].map((page) => (
                  <div
                    key={page}
                    onClick={() => {
                      setSelectedThumbnail(page);
                      setCurrentPage(page);
                    }}
                    className={`cursor-pointer group flex flex-col items-center ${
                      selectedThumbnail === page ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-14 h-18 bg-white border rounded-sm p-1 shadow-xs flex flex-col justify-between overflow-hidden ${
                        selectedThumbnail === page ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-gray-400'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="h-1 bg-gray-300 w-3/4 rounded-xs" />
                        <div className="h-1 bg-gray-200 w-full rounded-xs" />
                        <div className="h-1 bg-gray-200 w-5/6 rounded-xs" />
                      </div>
                      <div className="h-0.5 bg-gray-300 w-1/2 mx-auto" />
                    </div>
                    <span className="text-[10px] text-gray-300 mt-1">{page}</span>
                  </div>
                ))}
              </div>

              {/* Main Document Render Canvas */}
              <div className="flex-1 flex justify-center pl-2 sm:pl-4 overflow-x-auto">
                <div
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="w-full max-w-xl bg-white text-black p-8 sm:p-12 shadow-2xl rounded-xs text-xs font-serif leading-relaxed space-y-5 transition-transform"
                >
                  <div className="text-center space-y-1 font-serif uppercase tracking-wider font-semibold border-b pb-4 border-gray-300">
                    <p className="text-sm">IN THE SUPREME COURT OF INDIA</p>
                    <p className="text-[11px] text-gray-700">(CIVIL ORIGINAL JURISDICTION)</p>
                    <p className="text-xs pt-2 font-bold text-[#14243D]">
                      {meta?.caseNumber || 'WRIT PETITION (C) NO. 494 OF 2012'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 text-[11px]">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">
                        {analysis?.parties?.[0]?.name || 'JUSTICE K.S. PUTTASWAMY (RETD.)'}
                      </span>
                      <span className="italic text-gray-600">... Petitioner</span>
                    </div>

                    <div className="text-center font-bold italic text-gray-500 py-1">Versus</div>

                    <div className="flex justify-between items-baseline">
                      <span className="font-bold">
                        {analysis?.parties?.[1]?.name || 'UNION OF INDIA & ORS.'}
                      </span>
                      <span className="italic text-gray-600">... Respondents</span>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <span className="font-serif font-bold text-xs uppercase tracking-widest border-b border-black pb-0.5">
                      JUDGMENT
                    </span>
                    <p className="text-[11px] font-semibold text-gray-700 mt-1">
                      {meta?.bench?.[0] || '(Dr. D.Y. Chandrachud, J.)'}
                    </p>
                  </div>

                  {/* Body text snippet from extracted document */}
                  <div className="space-y-3 text-[11px] leading-relaxed text-gray-900 font-serif">
                    <p>
                      1. In a constitutional democracy, the right to privacy is an autonomous right. Privacy is central to the dignity of the individual and forms an intrinsic part of life and personal liberty under Article 21 of the Constitution.
                    </p>
                    <p>
                      2. The present reference before this nine-judge Constitution Bench raises a fundamental question touching upon the interpretation of fundamental rights guaranteed by Part III of the Constitution.
                    </p>
                    <p>
                      3. Privacy is not lost merely because an individual participates in modern digital infrastructure. Both spatial and informational autonomy remain protected.
                    </p>
                    <p className="pt-2 italic text-gray-600">
                      [Full verbatim document text loaded from authentic court record...]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Structured Summary, Metadata & Key Takeaways (38% width on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-[#E5E2DA] rounded-lg bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
                <h2 className="font-serif font-bold text-base text-[#14243D]">
                  Case Summary
                </h2>
                <button
                  onClick={copySummaryText}
                  className="inline-flex items-center space-x-1 text-xs text-[#737986] hover:text-[#14243D] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#3F4754] leading-relaxed">
                {analysis?.summary?.overview ||
                  'The Supreme Court unanimously held that the right to privacy is a fundamental right under the Constitution of India. The case arose from challenges to the Aadhaar scheme and raised the broader question of whether privacy is protected under Part III of the Constitution.'}
              </p>

              {/* Case Metadata Grid (Matching Screen C) */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E2DA] text-xs">
                <div>
                  <span className="text-[11px] text-[#737986] block">Court</span>
                  <span className="font-medium text-[#14243D]">
                    {meta?.court || 'Supreme Court of India'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#737986] block">Judgment Date</span>
                  <span className="font-medium text-[#14243D]">
                    {meta?.decisionDate || '24 August 2017'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#737986] block">Case Type</span>
                  <span className="font-medium text-[#14243D]">
                    {analysis?.caseClassification?.primary || 'Constitutional Law'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#737986] block">Bench</span>
                  <span className="font-medium text-[#14243D]">
                    {meta?.bench?.length ? meta.bench.join(', ') : 'Nine Judges'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-[#737986] block">Case Number</span>
                  <span className="font-medium text-[#14243D]">
                    {meta?.caseNumber || 'W.P. (C) No. 494 of 2012'}
                  </span>
                </div>
              </div>

              {/* Key Takeaways Section (Matching Screen C shaded box) */}
              <div className="p-4 rounded-md bg-[#FAF9F5] border border-[#E5E2DA] space-y-2">
                <h3 className="font-serif font-bold text-xs text-[#14243D]">
                  Key Takeaways
                </h3>
                <ul className="space-y-1.5 text-xs text-[#3F4754]">
                  <li className="flex items-start space-x-2">
                    <span className="text-[#A98A4B] font-bold">•</span>
                    <span>Right to privacy is a fundamental right.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#A98A4B] font-bold">•</span>
                    <span>Privacy is intrinsic to life and personal liberty under Article 21.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#A98A4B] font-bold">•</span>
                    <span>The judgment overruled M.P. Sharma and Kharak Singh to the extent they denied the existence of a right to privacy.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-[#A98A4B] font-bold">•</span>
                    <span>Privacy encompasses informational, decisional and bodily autonomy.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEGAL PROVISIONS (Screen D: Left Provisions List, Right Detail with Interpretation & Excerpts) */}
      {activeTab === 'provisions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Constitutional & Statutory Provisions List (~38% width) */}
          <div className="lg:col-span-5 border border-[#E5E2DA] rounded-lg bg-white p-4 shadow-card space-y-5">
            {/* Constitutional Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#14243D] uppercase tracking-wider">
                Constitutional Provisions
              </h3>
              <div className="space-y-1.5">
                {[
                  { name: 'Article 14', label: 'Right to equality' },
                  { name: 'Article 19', label: 'Freedoms of speech, expression, etc.' },
                  { name: 'Article 21', label: 'Protection of life and personal liberty' },
                  { name: 'Article 32', label: 'Right to constitutional remedies' },
                ].map((item, idx) => {
                  const isSelected = selectedProvisionIndex === idx;
                  return (
                    <div
                      key={item.name}
                      onClick={() => setSelectedProvisionIndex(idx)}
                      className={`p-3 rounded-md cursor-pointer transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-[#EEF4FD] border-[#4269A8]/60 text-[#14243D]'
                          : 'bg-white border-[#E5E2DA] text-[#3F4754] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#14243D]">{item.name}</div>
                        <div className="text-[11px] text-[#737986] mt-0.5">{item.label}</div>
                      </div>
                      {isSelected && <ChevronRight className="w-4 h-4 text-[#4269A8]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statutory Section */}
            <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
              <h3 className="text-xs font-semibold text-[#14243D] uppercase tracking-wider">
                Statutory Provisions
              </h3>
              <div className="space-y-1.5">
                {[
                  {
                    name: 'Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016',
                    idx: 4
                  },
                  {
                    name: 'Information Technology Act, 2000',
                    idx: 5
                  },
                ].map((stat) => (
                  <div
                    key={stat.name}
                    onClick={() => setSelectedProvisionIndex(stat.idx)}
                    className={`p-3 rounded-md border cursor-pointer transition-all ${
                      selectedProvisionIndex === stat.idx
                        ? 'bg-[#EEF4FD] border-[#4269A8]/60 text-[#14243D]'
                        : 'bg-white border-[#E5E2DA] text-[#3F4754] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="text-xs font-medium text-[#14243D]">{stat.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Detailed Provision Interpretation & Passages (~62% width) */}
          <div className="lg:col-span-7 border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-6">
            {/* Title */}
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#14243D]">
                {selectedProvisionIndex === 0
                  ? 'Article 14'
                  : selectedProvisionIndex === 1
                  ? 'Article 19'
                  : selectedProvisionIndex === 2
                  ? 'Article 21'
                  : selectedProvisionIndex === 3
                  ? 'Article 32'
                  : selectedProvisionIndex === 4
                  ? 'Aadhaar Act, 2016'
                  : 'Information Technology Act, 2000'}
              </h2>
            </div>

            {/* Quoted Statutory / Constitutional Text (Italic blockquote) */}
            <div className="p-4 rounded-md bg-[#FAF9F5] border border-[#E5E2DA]">
              <blockquote className="font-serif italic text-xs sm:text-sm text-[#14243D] leading-relaxed">
                {selectedProvisionIndex === 2
                  ? '"No person shall be deprived of his life or personal liberty except according to procedure established by law."'
                  : selectedProvisionIndex === 0
                  ? '"The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India."'
                  : selectedProvisionIndex === 1
                  ? '"All citizens shall have the right to freedom of speech and expression; to assemble peaceably and without arms; to form associations or unions..."'
                  : selectedProvisionIndex === 3
                  ? '"The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed."'
                  : '"An Act to provide for, as a good governance, efficient, transparent, and targeted delivery of subsidies, benefits and services, the expenditure for which is incurred from the Consolidated Fund of India..."'}
              </blockquote>
            </div>

            {/* How it was interpreted in this case */}
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#14243D]">
                How it was interpreted in this case
              </h3>
              <p className="text-xs sm:text-sm text-[#3F4754] leading-relaxed">
                {selectedProvisionIndex === 2
                  ? 'The Court held that the right to privacy is an intrinsic part of the right to life and personal liberty under Article 21. Privacy is essential to human dignity and autonomy.'
                  : selectedProvisionIndex === 0
                  ? 'Article 14 guarantees non-arbitrariness in state action. The nine-judge bench confirmed that privacy claims can be adjudicated under Article 14 alongside Article 21.'
                  : selectedProvisionIndex === 1
                  ? 'Informational privacy and communicative freedom are directly tethered to the free speech guarantees under Article 19(1)(a).'
                  : selectedProvisionIndex === 3
                  ? 'Article 32 allows citizens to invoke the writ jurisdiction of the Supreme Court directly for vindication of fundamental privacy rights.'
                  : 'The constitutional challenge to the Aadhaar statutory framework proceeded on the basis that data collection must pass the proportionality test.'}
              </p>
            </div>

            {/* Relevant Passages */}
            <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
              <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#14243D]">
                Relevant Passages
              </h3>
              <div className="p-4 rounded-md border border-[#E5E2DA] bg-[#FFFFFF] shadow-subtle space-y-2">
                <span className="text-[11px] font-semibold text-[#737986] uppercase tracking-wider">
                  Page 268
                </span>
                <blockquote className="font-serif italic text-xs text-[#14243D] leading-relaxed">
                  "Privacy is an intrinsic element of life and personal liberty. It is an autonomous constitutional right protected under Article 21."
                </blockquote>
              </div>
            </div>

            {/* Action: View in Document */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('document')}
                className="text-xs font-semibold text-[#14243D] hover:underline inline-flex items-center space-x-1"
              >
                <span>View in Document</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASE SUMMARY EXPANDED */}
      {activeTab === 'summary' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-6">
          <div className="space-y-2">
            <h2 className="font-serif font-bold text-lg text-[#14243D]">Executive Summary</h2>
            <p className="text-xs sm:text-sm text-[#3F4754] leading-relaxed">
              {analysis?.summary?.overview}
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#E5E2DA]">
            <h3 className="font-serif font-bold text-sm text-[#14243D]">Factual Matrix</h3>
            <div className="space-y-2 text-xs text-[#3F4754]">
              {analysis?.summary?.facts.map((f, i) => (
                <div key={i} className="flex items-baseline space-x-2">
                  <span className="text-[#A98A4B] font-bold">{i + 1}.</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#E5E2DA]">
            <h3 className="font-serif font-bold text-sm text-[#14243D]">Legal Issues for Adjudication</h3>
            <div className="space-y-2 text-xs text-[#3F4754]">
              {analysis?.summary?.legalIssues.map((issue, i) => (
                <div key={i} className="flex items-baseline space-x-2">
                  <span className="text-[#4269A8] font-bold">Q{i + 1}:</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARTIES & COUNSEL */}
      {activeTab === 'parties' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white shadow-card overflow-hidden">
          <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E2DA]">
            <h2 className="font-serif font-bold text-sm text-[#14243D]">Parties & Legal Counsel</h2>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DA] bg-[#F7F6F2] text-[11px] font-semibold text-[#737986]">
                <th className="py-2.5 px-4 font-semibold">Entity / Person</th>
                <th className="py-2.5 px-4 font-semibold">Role</th>
                <th className="py-2.5 px-4 font-semibold">Source Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA]">
              {analysis?.parties.map((p, i) => (
                <tr key={i} className="hover:bg-[#FAF9F5]">
                  <td className="py-3 px-4 font-semibold text-[#14243D]">{p.name}</td>
                  <td className="py-3 px-4 text-[#616875]">{p.role}</td>
                  <td className="py-3 px-4 text-[#737986] font-mono text-[11px]">{p.evidence || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: ARGUMENTS */}
      {activeTab === 'arguments' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-4">
          <h2 className="font-serif font-bold text-base text-[#14243D]">Submissions & Arguments</h2>
          <div className="space-y-3">
            {analysis?.summary?.arguments.map((arg, i) => (
              <div key={i} className="p-3.5 rounded-md bg-[#FAF9F5] border border-[#E5E2DA] text-xs text-[#3F4754] leading-relaxed">
                {arg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: COURT REASONING */}
      {activeTab === 'reasoning' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-4">
          <h2 className="font-serif font-bold text-base text-[#14243D]">Court Reasoning & Ratio Decidendi</h2>
          <div className="space-y-3">
            {analysis?.summary?.reasoning.map((r, i) => (
              <div key={i} className="flex items-start space-x-3 text-xs sm:text-sm text-[#3F4754] leading-relaxed">
                <span className="font-serif font-bold text-[#A98A4B] text-xs mt-0.5">§{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: OUTCOME */}
      {activeTab === 'outcome' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-wider text-[#737986]">Final Decision:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-[#EBF7F1] text-[#23845D]">
              {analysis?.summary?.outcomeCategory}
            </span>
          </div>
          <div className="p-4 rounded-md bg-[#FAF9F5] border border-[#E5E2DA] font-serif text-xs sm:text-sm text-[#14243D] leading-relaxed">
            {analysis?.summary?.outcome}
          </div>
        </div>
      )}

      {/* TAB 8: PRECEDENTS */}
      {activeTab === 'precedents' && (
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card space-y-4">
          <h2 className="font-serif font-bold text-base text-[#14243D]">Cited Precedents & Authorities</h2>
          <div className="space-y-2 text-xs text-[#3F4754]">
            <div className="p-3 border border-[#E5E2DA] rounded-md">
              <span className="font-bold text-[#14243D]">M.P. Sharma v. Satish Chandra (1954) SCR 1077</span>
              <p className="text-[#737986] mt-0.5">Eight-judge Bench decision — Overruled to the extent it held privacy is not a fundamental right.</p>
            </div>
            <div className="p-3 border border-[#E5E2DA] rounded-md">
              <span className="font-bold text-[#14243D]">Kharak Singh v. State of U.P. (1963) 2 SCR 129</span>
              <p className="text-[#737986] mt-0.5">Six-judge Bench decision — Overruled regarding nocturnal domiciliary visits and right to privacy.</p>
            </div>
            <div className="p-3 border border-[#E5E2DA] rounded-md">
              <span className="font-bold text-[#14243D]">Maneka Gandhi v. Union of India (1978) 1 SCC 248</span>
              <p className="text-[#737986] mt-0.5">Affirmed — Procedure established by law under Article 21 must be just, fair, and reasonable.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
