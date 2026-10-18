/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Mail,
  Phone,
  Linkedin,
  Check,
  Copy,
  X,
  ExternalLink,
  Send,
  ChevronRight,
  Eye,
  Lock,
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Archive,
  AlertCircle,
  CheckCircle,
  FileCode,
  FolderUp,
  HelpCircle,
} from 'lucide-react';
import {
  HERO_PROFILE_DATA,
  KPI_METRICS,
  EDUCATION_DATA,
  SKILLS_MATRIX,
  WORK_EXPERIENCE,
  EXTRACURRICULAR_AND_AWARDS,
  CERTIFICATES_DATA,
  CORPORATE_EVIDENCE_SLOTS,
  ACADEMIC_REFERENCES,
  CertificateItem,
} from './portfolioData';
import {
  SupplyChainBackground,
  CertificateDocumentReplica,
  HeroCutoutPortrait,
  EvidenceUncroppedFrame,
  ExperienceMediaThumb,
} from './SupplyChainVisuals';
import {
  STORAGE_KEY_IMAGES,
  loadAllPersistedImages,
  savePersistedImage,
  compressUploadedImage,
} from './imageStorage';
import { BUNDLED_IMAGES } from './bundledImages';

import {
  SlideId,
  PORTFOLIO_SLIDES,
  FloatingSlideProgress,
  SlideRevealSection,
  StaggerContainer,
  StaggerCard,
} from './SlideTransitions';

export default function App() {
  const [activeSlide, setActiveSlide] = useState<SlideId>('top');
  const [selectedCertCategory, setSelectedCertCategory] = useState<string>('All');
  const [activeExperienceTab, setActiveExperienceTab] = useState<'all' | 'work' | 'leadership'>('all');

  // Lightbox / Modal states
  const [activeCertificate, setActiveCertificate] = useState<CertificateItem | null>(null);

  // Clipboard & Form feedback states
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    recruiterName: '',
    companyName: '',
    email: '',
    internshipRole: 'Logistics & Supply Chain Intern',
    interviewWindow: '',
  });
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);
  const [savedInvitations, setSavedInvitations] = useState<
    Array<{
      id: string;
      recruiterName: string;
      companyName: string;
      email: string;
      internshipRole: string;
      interviewWindow: string;
      createdAt: string;
    }>
  >(() => {
    try {
      const raw = localStorage.getItem('hein_htet_aung_hr_invitations_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persisted custom images dictionary (hydrated from bundled assets, localStorage & IndexedDB)
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IMAGES);
      const parsed = saved ? JSON.parse(saved) : {};
      return { ...BUNDLED_IMAGES, ...parsed };
    } catch {
      return { ...BUNDLED_IMAGES };
    }
  });

  // Admin Media Asset Manager modal state (for Hein Htet Aung to manage images & export for Netlify)
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState<boolean>(false);
  const [batchUploadStatus, setBatchUploadStatus] = useState<string | null>(null);
  const [showZeroImagesModal, setShowZeroImagesModal] = useState<boolean>(false);

  // Hydrate from unlimited-capacity IndexedDB on mount so large photos never disappear
  useEffect(() => {
    let mounted = true;
    loadAllPersistedImages().then((persisted) => {
      if (mounted) {
        setCustomImages((prev) => ({
          ...BUNDLED_IMAGES,
          ...prev,
          ...persisted,
        }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCertificate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time IntersectionObserver to track active slide as visitor scrolls
  useEffect(() => {
    const elements = PORTFOLIO_SLIDES.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[0].target.id as SlideId;
          setActiveSlide(id);
        }
      },
      {
        rootMargin: '-22% 0px -45% 0px',
        threshold: [0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const recordInvitation = (formValues: typeof inquiryForm) => {
    const newEntry = {
      id: `inv-${Date.now()}`,
      ...formValues,
      createdAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updated = [newEntry, ...savedInvitations].slice(0, 10);
    setSavedInvitations(updated);
    try {
      localStorage.setItem('hein_htet_aung_hr_invitations_v1', JSON.stringify(updated));
    } catch {
      // Ignore storage error
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.recruiterName || !inquiryForm.companyName || !inquiryForm.email) return;
    recordInvitation(inquiryForm);
    setInquirySubmitted(true);
  };

  const handleTestHRFastTrack = () => {
    const sample = {
      recruiterName: 'Nattapong S. (Talent Acquisition)',
      companyName: 'DHL Supply Chain (Thailand) Ltd.',
      email: 'nattapong.hr@dhl.com',
      internshipRole: 'Logistics & Supply Chain Intern',
      interviewWindow: 'Next Tuesday · 10:00 AM ICT (Bangkok / MS Teams)',
    };
    setInquiryForm(sample);
    recordInvitation(sample);
    setInquirySubmitted(true);
  };

  const proceedDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await downloadFullProjectZip(customImages);
      setCopyNotification('ZIP ဖိုင်ကို အောင်မြင်စွာ ဒေါင်းလုဒ်လုပ်ပြီးပါပြီ!');
      setTimeout(() => setCopyNotification(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingZip(false);
      setShowZeroImagesModal(false);
    }
  };

  const handleDownloadZipRequest = async () => {
    if (Object.keys(customImages).length === 0) {
      setShowZeroImagesModal(true);
      return;
    }
    await proceedDownloadZip();
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsBatchUploading(true);
    let matchedCount = 0;
    const updated = { ...customImages };

    for (const file of files) {
      try {
        const name = file.name.toLowerCase();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const compressed = await compressUploadedImage(dataUrl);

        let targetSlot: string | null = null;
        if (name.includes('unilever')) targetSlot = 'cert_unilever';
        else if (name.includes('thekap') || name.includes('kap')) targetSlot = 'cert_thekap';
        else if (name.includes('gee') || name.includes('police') || name.includes('zealand')) targetSlot = 'cert_gee';
        else if (name.includes('simplilearn') || name.includes('content')) targetSlot = 'cert_simplilearn';
        else if (name.includes('nlp') || name.includes('gifted')) targetSlot = 'cert_nlp';
        else if (name.includes('hypen')) targetSlot = 'cert_hypen';
        else if (name.includes('adcamp') || name.includes('facebook')) targetSlot = 'cert_adcamp';
        else if (name.includes('yaymal') && (name.includes('adv') || name.includes('4'))) targetSlot = 'cert_yaymal_adv';
        else if (name.includes('yaymal') && (name.includes('basic') || name.includes('27'))) targetSlot = 'cert_yaymal_basic';
        else if (name.includes('shell') || name.includes('thanet')) {
          targetSlot = 'evidence_shell';
          updated['evidence_shell_director'] = compressed;
          await savePersistedImage('evidence_shell_director', compressed);
        } else if (name.includes('phanrajit') || name.includes('ibm') || name.includes('faculty') || name.includes('head')) {
          targetSlot = 'evidence_ib_head';
          updated['evidence_stamford_head'] = compressed;
          await savePersistedImage('evidence_stamford_head', compressed);
        } else if (
          name.includes('hero') ||
          name.includes('portrait') ||
          name.includes('blazer') ||
          name.includes('profile') ||
          name.includes('hein') ||
          name.includes('design') ||
          name.includes('suit')
        ) {
          targetSlot = 'hero_portrait_raw';
          updated['hero_portrait'] = compressed;
          updated['hero_arms_crossed_portrait'] = compressed;
          updated['hero_suit_portrait'] = compressed;
          updated['hero_arms_crossed_cutout'] = compressed;
          await savePersistedImage('hero_portrait', compressed);
          await savePersistedImage('hero_arms_crossed_portrait', compressed);
          await savePersistedImage('hero_suit_portrait', compressed);
        } else if (name.includes('table') || name.includes('tennis') || name.includes('president')) {
          targetSlot = 'lead_photo_tt_president';
        } else if (name.includes('council') || name.includes('student')) {
          targetSlot = 'lead_photo_council';
        } else if (name.includes('redcross') || name.includes('covid')) {
          targetSlot = 'lead_photo_redcross';
        } else if (name.includes('enervon') || name.includes('film') || name.includes('sportsman')) {
          targetSlot = 'lead_photo_enervon';
        } else if (name.includes('tutor') || name.includes('navigator') || name.includes('john')) {
          targetSlot = 'exp_photo_tutor';
        } else if (name.includes('aim') || name.includes('construction')) {
          targetSlot = 'exp_photo_aim';
        } else if (name.includes('nca') || name.includes('chapter') || name.includes('abroad')) {
          targetSlot = 'exp_photo_nca';
        } else if (name.includes('helix')) {
          targetSlot = 'exp_photo_helix';
        } else if (name.includes('cypress')) {
          targetSlot = 'exp_photo_cypress';
        }

        if (targetSlot) {
          updated[targetSlot] = compressed;
          await savePersistedImage(targetSlot, compressed);
          matchedCount++;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setCustomImages(updated);
    setIsBatchUploading(false);
    setBatchUploadStatus(`ဓာတ်ပုံ ${matchedCount} ပုံကို အလိုအလျောက် သက်ဆိုင်ရာ Slot များထဲသို့ ထည့်သွင်းပြီးပါပြီ!`);
    setTimeout(() => setBatchUploadStatus(null), 6000);
    e.target.value = '';
  };

  const filteredCertificates =
    selectedCertCategory === 'All'
      ? CERTIFICATES_DATA
      : CERTIFICATES_DATA.filter((cert) => cert.category === selectedCertCategory);

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] font-sans relative selection:bg-[#D97706] selection:text-white">
      {/* ANIMATED GLOBAL SUPPLY CHAIN ROUTE MAP & NODE NETWORK BACKGROUND */}
      <SupplyChainBackground />

      {/* FLOATING SIDE PROGRESS DOTS + TOP SCROLL PROGRESS HAIRLINE */}
      <FloatingSlideProgress activeSlide={activeSlide} onSelectSlide={setActiveSlide} />

      {/* STRICT 3-ZONE TOP BAR CONTRACT (WITH ACTIVE SLIDE HIGHLIGHT) */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={() => setActiveSlide('top')}
          className={`text-lg font-display font-extrabold tracking-tight transition-colors whitespace-nowrap shrink-0 ${
            activeSlide === 'top' ? 'text-[#F59E0B]' : 'text-[#F8FAFC]'
          }`}
        >
          HEIN HTET AUNG
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a
            href="#network"
            onClick={() => setActiveSlide('network')}
            className={`transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
              activeSlide === 'network'
                ? 'text-[#F59E0B] underline decoration-[#F59E0B] decoration-2 font-semibold'
                : 'hover:text-[#F8FAFC] hover:underline'
            }`}
          >
            Network & Evidence
          </a>
          <a
            href="#education"
            onClick={() => setActiveSlide('education')}
            className={`transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
              activeSlide === 'education'
                ? 'text-[#F59E0B] underline decoration-[#F59E0B] decoration-2 font-semibold'
                : 'hover:text-[#F8FAFC] hover:underline'
            }`}
          >
            Education & Skills
          </a>
          <a
            href="#experience"
            onClick={() => setActiveSlide('experience')}
            className={`transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
              activeSlide === 'experience'
                ? 'text-[#F59E0B] underline decoration-[#F59E0B] decoration-2 font-semibold'
                : 'hover:text-[#F8FAFC] hover:underline'
            }`}
          >
            Experience & Awards
          </a>
          <a
            href="#certificates"
            onClick={() => setActiveSlide('certificates')}
            className={`transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
              activeSlide === 'certificates'
                ? 'text-[#F59E0B] underline decoration-[#F59E0B] decoration-2 font-semibold'
                : 'hover:text-[#F8FAFC] hover:underline'
            }`}
          >
            Certificates
          </a>
        </nav>

        {/* Zone 3: Primary action + Project ZIP Backup */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 hover:text-amber-300 rounded-lg transition-colors shadow-sm"
            title="Download Complete Project ZIP or Manage Media"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Project ZIP & Media</span>
            <span className="sm:hidden">ZIP</span>
          </button>
          <a
            href="#contact"
            onClick={() => setActiveSlide('contact')}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm ${
              activeSlide === 'contact'
                ? 'bg-[#F59E0B] text-[#0B1120] ring-2 ring-[#F8FAFC]/40'
                : 'bg-[#D97706] hover:bg-[#B45309]'
            }`}
          >
            Schedule Interview
          </a>
        </div>
      </header>

      <main className="relative z-10">
        {/* 1. 40% CENTER-STAGE HERO SECTION — 30% LEFT · 40% CENTER PORTRAIT · 30% RIGHT */}
        <SlideRevealSection
          id="top"
          className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 lg:pt-8 pb-12 overflow-hidden"
        >
          {/* Top Centered Kicker */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <span className="text-xs font-mono text-[#F59E0B] font-semibold tracking-widest uppercase">
              LOGISTICS & SUPPLY CHAIN INTERNSHIP CANDIDATE · BANGKOK, THAILAND
            </span>
          </motion.div>

          {/* Balanced 30% Left · 40% Center Portrait · 30% Right Layout */}
          <StaggerContainer
            staggerDelay={0.11}
            className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-6 min-h-[460px] lg:min-h-[500px]"
          >
            {/* LEFT 30% COLUMN: Catchy Slogan + Academic Identity */}
            <StaggerCard
              hoverLift={false}
              className="w-full lg:w-[30%] shrink-0 flex flex-col justify-between gap-6 order-2 lg:order-1 text-left z-20"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-display font-extrabold text-[#F8FAFC] tracking-tight leading-[1.08] text-balance">
                  Eager to Learn, Ready to{' '}
                  <span className="text-[#F59E0B]">Streamline Operations.</span>
                </h1>

                <div className="mt-5 pt-4 border-t border-slate-800/90">
                  <div className="text-xl font-display font-bold text-[#F8FAFC]">
                    Hein Htet Aung
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-[#F59E0B] mt-1 leading-snug">
                    B.B.A. in Logistics & Supply Chain Management
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-1">
                    Stamford International University (Thailand) · 2024 – Present
                  </div>
                </div>
              </div>

              {/* Left-Side Quick Credentials Highlight */}
              <div className="bg-[#111C33]/90 backdrop-blur-xs border border-slate-800 rounded-xl p-4 shadow-lg">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
                  Key Distinction
                </div>
                <div className="text-xs text-[#F8FAFC] font-medium mt-1 leading-relaxed">
                  2026 Global Enterprise Experience Award Winner · Stamford Table Tennis Club
                  President (2025–2026)
                </div>
              </div>
            </StaggerCard>

            {/* CENTER 40% STAGE: Arms-Crossed Blazer Cutout Portrait Occupying 40% of the Slide */}
            <StaggerCard
              hoverLift={false}
              className="w-full lg:w-[40%] shrink-0 order-1 lg:order-2 flex items-center justify-center z-10"
            >
              <HeroCutoutPortrait
                rawImageUrl={
                  customImages['hero_portrait_raw'] ||
                  customImages['hero_portrait'] ||
                  customImages['hero_arms_crossed_portrait'] ||
                  customImages['hero_suit_portrait']
                }
                cutoutImageUrl={
                  customImages['hero_arms_crossed_cutout'] ||
                  customImages['hero_suit_cutout'] ||
                  customImages['hero_portrait_raw'] ||
                  customImages['hero_portrait'] ||
                  customImages['hero_arms_crossed_portrait']
                }
              />
            </StaggerCard>

            {/* RIGHT 30% COLUMN: Executive Readiness, CTAs & Direct Contact */}
            <StaggerCard
              hoverLift={false}
              className="w-full lg:w-[30%] shrink-0 flex flex-col justify-between gap-5 order-3 text-left z-20"
            >
              <div className="bg-[#111C33]/90 backdrop-blur-xs border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#F59E0B] font-semibold mb-2">
                  Executive Readiness
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {HERO_PROFILE_DATA.executiveSummary}
                </p>

                {/* Direct Contact Coordinates */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/90 flex flex-col gap-2 text-xs font-mono text-slate-300">
                  <button
                    type="button"
                    onClick={() => handleCopyText(HERO_PROFILE_DATA.phone, 'phone')}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 text-left"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span>{HERO_PROFILE_DATA.phone} (TH)</span>
                    {copiedField === 'phone' && (
                      <span className="text-[#F59E0B] ml-1">[Copied]</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(HERO_PROFILE_DATA.email, 'email')}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 text-left truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span className="truncate">{HERO_PROFILE_DATA.email}</span>
                    {copiedField === 'email' && (
                      <span className="text-[#F59E0B] ml-1">[Copied]</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Right-Side Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                <a
                  href="#contact"
                  className="w-full px-5 py-3 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-lg"
                >
                  <span>Invite to Interview</span>
                  <ChevronRight className="w-4 h-4" />
                </a>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="#experience"
                    className="w-full px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] bg-[#111C33] hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors inline-flex items-center justify-center whitespace-nowrap"
                  >
                    Experience
                  </a>

                  <a
                    href="#certificates"
                    className="w-full px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] bg-[#111C33] hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors inline-flex items-center justify-center whitespace-nowrap"
                  >
                    Certificates
                  </a>
                </div>
              </div>
            </StaggerCard>
          </StaggerContainer>

          {/* Full-Width 4-Column Quantitative KPI Strip Below Center-Stage Hero */}
          <StaggerContainer
            staggerDelay={0.07}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-20"
          >
            {KPI_METRICS.map((kpi, idx) => (
              <StaggerCard
                key={idx}
                className="bg-[#111C33]/90 backdrop-blur-xs border border-slate-800 rounded-xl p-6 flex flex-col justify-between"
              >
                <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#F59E0B] tabular-nums">
                  {kpi.value}
                </div>
                <div className="mt-2">
                  <div className="text-sm font-semibold text-[#F8FAFC]">{kpi.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{kpi.detail}</div>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </SlideRevealSection>

        {/* MARQUEE RIBBON */}
        <div className="bg-[#0F172A] text-slate-300 py-3.5 border-y border-slate-800 overflow-hidden">
          <div className="animate-marquee flex items-center gap-10 text-xs font-mono tracking-widest whitespace-nowrap">
            <span>UNILEVER SUPPLY CHAIN ANALYTICS CERTIFIED</span>
            <span className="text-[#F59E0B]">·</span>
            <span>STAMFORD INTERNATIONAL UNIVERSITY (THAILAND)</span>
            <span className="text-[#F59E0B]">·</span>
            <span>GLOBAL ENTERPRISE EXPERIENCE AWARD WINNER</span>
            <span className="text-[#F59E0B]">·</span>
            <span>TABLE TENNIS CLUB PRESIDENT (2025–2026)</span>
            <span className="text-[#F59E0B]">·</span>
            <span>IGCSE BUSINESS & ECONOMICS TUTOR</span>
            <span className="text-[#F59E0B]">·</span>
            <span>UNILEVER SUPPLY CHAIN ANALYTICS CERTIFIED</span>
            <span className="text-[#F59E0B]">·</span>
            <span>STAMFORD INTERNATIONAL UNIVERSITY (THAILAND)</span>
          </div>
        </div>

        {/* 2. INDUSTRY & ACADEMIC LEADERSHIP EVIDENCE (100% UNCROPPED FULL PORTRAIT VIEW) */}
        <SlideRevealSection
          id="network"
          className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono text-[#F59E0B] font-semibold tracking-wider uppercase">
                01. INDUSTRY & ACADEMIC ENDORSEMENT
              </div>
              <h2 className="mt-1 text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
                Executive Network & Faculty Evidence
              </h2>
            </div>
          </div>

          <StaggerContainer staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Evidence 1: Shell Director (Uncropped Frame + Clean Caption Below) */}
            <StaggerCard className="bg-[#111C33]/95 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
              <EvidenceUncroppedFrame
                slotKey="evidence_shell_director"
                imageUrl={
                  customImages['evidence_shell_director'] ||
                  customImages['evidence_shell'] ||
                  customImages['shell_director']
                }
                badgeText="SHELL COMPANY LIMITED · EXECUTIVE SESSION"
                variant="shell-director"
              />
              <div className="p-6 border-t border-slate-800 bg-[#111C33]">
                <div className="text-xs font-mono text-[#F59E0B]">
                  Mr. Thanet Puwapiromkwan · Director of Shell Company Limited
                </div>
                <h3 className="text-lg font-display font-bold text-[#F8FAFC] mt-1">
                  Corporate Engagement with Director of Shell Company Limited
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {CORPORATE_EVIDENCE_SLOTS[0].context}
                </p>
              </div>
            </StaggerCard>

            {/* Evidence 2: Head of IB Department (Uncropped Frame + Clean Caption Below) */}
            <StaggerCard className="bg-[#111C33]/95 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
              <EvidenceUncroppedFrame
                slotKey="evidence_ib_head"
                imageUrl={customImages['evidence_ib_head']}
                badgeText="ACADEMIC DEPARTMENT HEAD ENDORSEMENT"
                variant="ib-head"
              />
              <div className="p-6 border-t border-slate-800 bg-[#111C33]">
                <div className="text-xs font-mono text-[#F59E0B]">
                  Asst. Prof. Dr. Phanrajit Havarangsi · Head of International Business Department
                </div>
                <h3 className="text-lg font-display font-bold text-[#F8FAFC] mt-1">
                  Faculty Endorsement — Stamford International University
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {CORPORATE_EVIDENCE_SLOTS[1].context}
                </p>
              </div>
            </StaggerCard>
          </StaggerContainer>
        </SlideRevealSection>

        {/* 3. EDUCATION & SKILLS MATRIX */}
        <SlideRevealSection
          id="education"
          className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80"
        >
          <div className="mb-10">
            <div className="text-xs font-mono text-[#F59E0B] font-semibold tracking-wider uppercase">
              02. EDUCATION & CORE CAPABILITIES
            </div>
            <h2 className="mt-1 text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
              Academic Foundation & Skills Matrix
            </h2>
          </div>

          <StaggerContainer className="grid grid-cols-1 gap-6 mb-8">
            {EDUCATION_DATA.map((edu) => (
              <StaggerCard
                key={edu.id}
                className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mb-2">
                    <span>
                      {edu.institution} · {edu.location}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-semibold text-[#F59E0B] tabular-nums">{edu.period}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC]">
                    {edu.degree}
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-slate-300">{edu.focusAreas}</div>
                </div>
                <div className="lg:max-w-md lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 lg:pl-6 text-xs font-mono text-slate-300">
                  <div className="text-[#F59E0B] font-semibold uppercase tracking-wider mb-1">
                    University Leadership & Distinction
                  </div>
                  <div className="leading-relaxed">{edu.leadershipRole}</div>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>

          <StaggerContainer staggerDelay={0.09} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StaggerCard className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-6">
              <div className="text-xs font-mono text-[#F59E0B] font-semibold uppercase tracking-wider mb-1">
                Major Core
              </div>
              <h3 className="text-lg font-display font-bold text-[#F8FAFC] mb-4">
                Supply Chain & Logistics
              </h3>
              <div className="divide-y divide-slate-800/80">
                {SKILLS_MATRIX.supplyChainCore.map((skill, idx) => (
                  <div key={idx} className="py-2.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-[#F8FAFC]">{skill.name}</span>
                    <span className="text-xs font-mono text-[#F59E0B] shrink-0">{skill.level}</span>
                  </div>
                ))}
              </div>
            </StaggerCard>

            <StaggerCard className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-6">
              <div className="text-xs font-mono text-[#F59E0B] font-semibold uppercase tracking-wider mb-1">
                Technical & Strategy
              </div>
              <h3 className="text-lg font-display font-bold text-[#F8FAFC] mb-4">
                Hard Skills & Applied AI
              </h3>
              <div className="divide-y divide-slate-800/80">
                {SKILLS_MATRIX.hardAndDigitalSkills.map((skill, idx) => (
                  <div key={idx} className="py-2.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-[#F8FAFC]">{skill.name}</span>
                    <span className="text-xs font-mono text-slate-400 shrink-0">{skill.level}</span>
                  </div>
                ))}
              </div>
            </StaggerCard>

            <StaggerCard className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-[#F59E0B] font-semibold uppercase tracking-wider mb-1">
                  Communication & Profile
                </div>
                <h3 className="text-lg font-display font-bold text-[#F8FAFC] mb-4">
                  Languages, Soft Skills & Interests
                </h3>

                <div className="space-y-2.5 mb-5">
                  {SKILLS_MATRIX.languages.map((lang, idx) => (
                    <div
                      key={idx}
                      className="flex items-baseline justify-between border-b border-slate-800/80 pb-2 text-sm"
                    >
                      <span className="font-semibold text-[#F8FAFC]">{lang.language}</span>
                      <span className="text-xs font-mono text-slate-300">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Soft Skills
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {SKILLS_MATRIX.softSkills.join(' · ')}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-mono uppercase text-[#F59E0B] mb-1.5">Interests</div>
                <div className="text-sm text-[#F8FAFC] font-medium">
                  Procurement <span className="text-[#F59E0B]">·</span> Supply Chain{' '}
                  <span className="text-[#F59E0B]">·</span> Community Services{' '}
                  <span className="text-[#F59E0B]">·</span>{' '}
                  <span className="text-[#F59E0B] font-semibold">Create something with AI</span>
                </div>
              </div>
            </StaggerCard>
          </StaggerContainer>
        </SlideRevealSection>

        {/* 4. EXPERIENCE, TUTORING & EXTRACURRICULAR AWARDS — PAIRED WITH PHOTOS & CERTIFICATES */}
        <SlideRevealSection
          id="experience"
          className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-mono text-[#F59E0B] font-semibold tracking-wider uppercase">
                03. PROFESSIONAL & LEADERSHIP TRACK RECORD
              </div>
              <h2 className="mt-1 text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
                Experience, Tutoring & Extracurricular Awards
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verified professional roles, academic tutoring, and international leadership awards.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#111C33] border border-slate-800 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setActiveExperienceTab('all')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeExperienceTab === 'all'
                    ? 'bg-[#D97706] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All Track Record
              </button>
              <button
                type="button"
                onClick={() => setActiveExperienceTab('work')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeExperienceTab === 'work'
                    ? 'bg-[#D97706] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Work & Tutoring (5)
              </button>
              <button
                type="button"
                onClick={() => setActiveExperienceTab('leadership')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeExperienceTab === 'leadership'
                    ? 'bg-[#D97706] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Leadership & Awards (6)
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeExperienceTab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              {/* Work & Tutoring Experience List with Paired Visual Slots */}
              {(activeExperienceTab === 'all' || activeExperienceTab === 'work') && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold mb-4">
                    Work & Academic Tutoring Experience
                  </div>
                  <StaggerContainer
                    staggerDelay={0.075}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {WORK_EXPERIENCE.map((exp) => (
                      <StaggerCard
                        key={exp.id}
                        className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-stretch"
                      >
                        <ExperienceMediaThumb
                          slotKey={exp.imageSlotKey}
                          visualCode={exp.visualCode}
                          categoryLabel={exp.period}
                          imageUrl={customImages[exp.imageSlotKey]}
                        />

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-mono text-slate-400">
                              <span>
                                {exp.organization} · {exp.location}
                              </span>
                              <span className="font-semibold text-[#F59E0B] tabular-nums">
                                {exp.period}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-display font-bold text-[#F8FAFC] mt-1">
                              {exp.role}
                            </h3>
                            <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-300 leading-relaxed list-disc pl-4">
                              {exp.highlights.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                            {exp.keywords}
                          </div>
                        </div>
                      </StaggerCard>
                    ))}
                  </StaggerContainer>
                </div>
              )}

              {/* Extracurricular Leadership & Awards List with Paired Visual Slots & Certificate Previews */}
              {(activeExperienceTab === 'all' || activeExperienceTab === 'leadership') && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold mb-4">
                    Extracurricular Leadership & Global Awards (With Visual Evidence)
                  </div>
                  <StaggerContainer
                    staggerDelay={0.075}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {EXTRACURRICULAR_AND_AWARDS.map((item) => {
                      const matchingCert =
                        item.id === 'lead-1'
                          ? CERTIFICATES_DATA.find((c) => c.id === 'cert-gee')
                          : item.id === 'lead-3'
                          ? CERTIFICATES_DATA.find((c) => c.id === 'cert-hypen')
                          : undefined;

                      return (
                        <StaggerCard
                          key={item.id}
                          className="bg-[#111C33]/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-stretch"
                        >
                          {matchingCert && !customImages[item.imageSlotKey] ? (
                            <div
                              onClick={() => setActiveCertificate(matchingCert)}
                              className="relative w-full sm:w-44 h-36 sm:h-auto shrink-0 bg-white border border-slate-700 rounded-xl overflow-hidden cursor-pointer group"
                              title="Click to inspect full certificate"
                            >
                              <div className="w-full h-full transform scale-95 origin-center">
                                <CertificateDocumentReplica
                                  cert={matchingCert}
                                  customImageUrl={customImages[matchingCert.imageSlotKey]}
                                  compact={true}
                                />
                              </div>
                              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/80 text-center">
                                <span className="text-[10px] font-mono text-[#F59E0B] font-semibold">
                                  Inspect Award Cert
                                </span>
                              </div>
                            </div>
                          ) : (
                            <ExperienceMediaThumb
                              slotKey={item.imageSlotKey}
                              visualCode={item.visualCode}
                              categoryLabel={item.period}
                              imageUrl={customImages[item.imageSlotKey]}
                            />
                          )}

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                                <span>{item.category}</span>
                                <span className="font-semibold text-[#F59E0B] tabular-nums">
                                  {item.period}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-display font-bold text-[#F8FAFC] mt-1">
                                {item.role}
                              </h3>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {item.organization}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>Verified Activity</span>
                              <span className="text-[#F59E0B]">{item.visualCode}</span>
                            </div>
                          </div>
                        </StaggerCard>
                      );
                    })}
                  </StaggerContainer>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </SlideRevealSection>

        {/* 5. VERIFIED CERTIFICATES & TRAINING VAULT */}
        <SlideRevealSection
          id="certificates"
          className="max-w-7xl mx-auto px-6 lg:px-12 py-16 border-b border-slate-800/80"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs font-mono text-[#F59E0B] font-semibold tracking-wider uppercase">
                04. VERIFIED CREDENTIALS & TRAINING
              </div>
              <h2 className="mt-1 text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
                Certificates & Supply Chain Training
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#111C33] border border-slate-800 rounded-lg self-start">
              {[
                'All',
                'Supply Chain & Logistics',
                'Global Awards & Leadership',
                'Digital Strategy & Communication',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCertCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCertCategory === cat
                      ? 'bg-[#D97706] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCertCategory}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <StaggerContainer
                staggerDelay={0.065}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredCertificates.map((cert) => (
                  <StaggerCard
                    key={cert.id}
                    onClick={() => setActiveCertificate(cert)}
                    className="group bg-[#111C33]/90 border border-slate-800 hover:border-[#F59E0B] rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer transition-colors shadow-lg"
                  >
                    <div className="h-48 border-b border-slate-800 bg-white relative overflow-hidden">
                      <CertificateDocumentReplica
                        cert={cert}
                        customImageUrl={customImages[cert.imageSlotKey]}
                        compact={true}
                      />
                      <div className="absolute inset-0 bg-[#0B1120]/0 group-hover:bg-[#0B1120]/25 transition-colors flex items-end justify-end p-3">
                        <span className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-[#D97706] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 shadow-sm">
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-mono text-slate-400 mb-1">
                          {cert.category} · <span className="text-[#F59E0B]">{cert.date}</span>
                        </div>
                        <h3 className="text-base font-display font-bold text-[#F8FAFC] group-hover:text-[#F59E0B] transition-colors">
                          {cert.title}
                        </h3>
                        <div className="text-xs text-slate-400 mt-0.5">{cert.issuer}</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between gap-2">
                        <span className="truncate">{cert.skillsValidated}</span>
                        <ArrowUpRight className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                      </div>
                    </div>
                  </StaggerCard>
                ))}
              </StaggerContainer>
            </motion.div>
          </AnimatePresence>
        </SlideRevealSection>

        {/* 6. REFERENCES & FAST-TRACK HR INTERVIEW CONTACT */}
        <SlideRevealSection id="contact" className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <StaggerContainer staggerDelay={0.12} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <StaggerCard
              hoverLift={false}
              className="lg:col-span-6 flex flex-col justify-between gap-6"
            >
              <div>
                <div className="text-xs font-mono text-[#F59E0B] font-semibold tracking-wider uppercase">
                  05. DIRECT CONTACT & UNIVERSITY REFERENCES
                </div>
                <h2 className="mt-1 text-3xl font-display font-bold text-[#F8FAFC] tracking-tight">
                  Ready for Immediate Internship Interview
                </h2>

                <div className="mt-6 space-y-3">
                  <div className="bg-[#111C33] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Phone className="w-5 h-5 text-[#F59E0B] shrink-0" />
                      <div>
                        <div className="text-xs font-mono text-slate-400">Thailand Mobile</div>
                        <div className="text-sm font-mono font-bold text-[#F8FAFC] tabular-nums">
                          0994947850 · +66 99-494-7850
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(HERO_PROFILE_DATA.phone, 'contact-phone')}
                      className="px-3 py-1.5 text-xs font-mono font-semibold text-[#F8FAFC] bg-slate-800 hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'contact-phone' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-[#111C33] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-5 h-5 text-[#F59E0B] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-slate-400">Email Address</div>
                        <div className="text-sm font-mono font-bold text-[#F8FAFC] truncate">
                          {HERO_PROFILE_DATA.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(HERO_PROFILE_DATA.email, 'contact-email')}
                      className="px-3 py-1.5 text-xs font-mono font-semibold text-[#F8FAFC] bg-slate-800 hover:bg-slate-700 rounded-md transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'contact-email' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-[#111C33] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Linkedin className="w-5 h-5 text-[#F59E0B] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-slate-400">LinkedIn</div>
                        <div className="text-sm font-mono font-bold text-[#F8FAFC] truncate">
                          {HERO_PROFILE_DATA.linkedinHandle}
                        </div>
                      </div>
                    </div>
                    <a
                      href={HERO_PROFILE_DATA.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-mono font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-md transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-[#111C33] border border-slate-800 rounded-2xl p-6">
                <div className="text-xs font-mono text-[#F59E0B] font-semibold uppercase tracking-wider mb-3">
                  Stamford International University References
                </div>
                <div className="divide-y divide-slate-800">
                  {ACADEMIC_REFERENCES.map((ref) => (
                    <div key={ref.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="text-sm font-display font-bold text-[#F8FAFC]">{ref.name}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{ref.role}</div>
                      <div className="text-xs font-mono text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                        {ref.phone && (
                          <>
                            <span>{ref.phone}</span>
                            <span className="text-slate-600">·</span>
                          </>
                        )}
                        <a
                          href={`mailto:${ref.email}`}
                          className="text-[#F59E0B] hover:underline"
                        >
                          {ref.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyText(ref.email, `ref-${ref.id}`)}
                          className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                        >
                          {copiedField === `ref-${ref.id}` ? 'Copied!' : 'Copy Email'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </StaggerCard>

            <StaggerCard hoverLift={false} className="lg:col-span-6">
              <div className="bg-[#111C33] border border-slate-800 rounded-2xl p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <div>
                    <div className="text-xs font-mono text-[#F59E0B] font-semibold uppercase tracking-wider mb-1">
                      HR Fast-Track
                    </div>
                    <h3 className="text-2xl font-display font-bold text-[#F8FAFC]">
                      Send Interview Invitation
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestHRFastTrack}
                    className="px-3 py-1.5 text-xs font-mono font-semibold text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    ⚡ Test Fast-Track Demo
                  </button>
                </div>

                {inquirySubmitted ? (
                  <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-6 text-left">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-lg font-display font-bold text-[#F8FAFC]">
                          Interview Invitation Confirmed & Logged
                        </h4>
                        <p className="text-xs text-slate-400">
                          Ready to dispatch to <span className="text-[#F59E0B] font-mono">{HERO_PROFILE_DATA.email}</span>
                        </p>
                      </div>
                    </div>

                    {/* Structured Invitation Summary Preview */}
                    <div className="my-4 p-4 rounded-lg bg-[#111C33] border border-slate-800 font-mono text-xs space-y-1.5 text-slate-200">
                      <div>
                        <span className="text-slate-400">TO: </span>
                        <span className="text-[#F8FAFC] font-semibold">
                          Hein Htet Aung ({HERO_PROFILE_DATA.email})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">FROM: </span>
                        <span className="text-[#F8FAFC]">
                          {inquiryForm.recruiterName} · {inquiryForm.companyName} ({inquiryForm.email})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">ROLE: </span>
                        <span className="text-[#F59E0B] font-semibold">{inquiryForm.internshipRole}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">PROPOSED SLOT: </span>
                        <span className="text-[#F8FAFC]">
                          {inquiryForm.interviewWindow || 'Flexible (Bangkok / Online)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      {/* 1. Direct Gmail Web Compose (works in any browser without needing desktop Outlook) */}
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          HERO_PROFILE_DATA.email
                        )}&su=${encodeURIComponent(
                          `Internship Interview: ${inquiryForm.internshipRole} at ${inquiryForm.companyName}`
                        )}&body=${encodeURIComponent(
                          `Dear Hein Htet Aung,\n\nWe would like to invite you for an interview for the ${inquiryForm.internshipRole} position at ${inquiryForm.companyName}.\n\nProposed Date/Time: ${
                            inquiryForm.interviewWindow || 'Flexible'
                          }\n\nBest regards,\n${inquiryForm.recruiterName}\n${inquiryForm.companyName}\n${inquiryForm.email}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-md"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Open in Gmail Web</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* 2. One-Click Copy Full Invitation Text */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `To: ${HERO_PROFILE_DATA.email}\nSubject: Internship Interview: ${inquiryForm.internshipRole} at ${inquiryForm.companyName}\n\nDear Hein Htet Aung,\nWe would like to invite you for an interview for the ${inquiryForm.internshipRole} role at ${inquiryForm.companyName}.\nProposed Time: ${
                              inquiryForm.interviewWindow || 'Flexible'
                            }\n\nBest regards,\n${inquiryForm.recruiterName} (${inquiryForm.email})`,
                            'fast-track-invite'
                          )
                        }
                        className="px-3.5 py-2.5 text-xs font-mono font-semibold text-[#F8FAFC] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        {copiedField === 'fast-track-invite' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Invitation Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>Copy Invitation</span>
                          </>
                        )}
                      </button>

                      {/* 3. Edit / Send Another */}
                      <button
                        type="button"
                        onClick={() => setInquirySubmitted(false)}
                        className="px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors"
                      >
                        Edit / New
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.recruiterName}
                          onChange={(e) =>
                            setInquiryForm({ ...inquiryForm, recruiterName: e.target.value })
                          }
                          placeholder="HR / Hiring Manager"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#0B1120] border border-slate-700 rounded-lg text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.companyName}
                          onChange={(e) =>
                            setInquiryForm({ ...inquiryForm, companyName: e.target.value })
                          }
                          placeholder="Company / Organization"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#0B1120] border border-slate-700 rounded-lg text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                          Corporate Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={inquiryForm.email}
                          onChange={(e) =>
                            setInquiryForm({ ...inquiryForm, email: e.target.value })
                          }
                          placeholder="hr@company.com"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#0B1120] border border-slate-700 rounded-lg text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                          Internship Role
                        </label>
                        <select
                          value={inquiryForm.internshipRole}
                          onChange={(e) =>
                            setInquiryForm({ ...inquiryForm, internshipRole: e.target.value })
                          }
                          className="w-full px-3 py-2.5 text-sm bg-[#0B1120] border border-slate-700 rounded-lg text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                        >
                          <option value="Logistics & Supply Chain Intern">
                            Logistics & Supply Chain Intern
                          </option>
                          <option value="Procurement & Sourcing Intern">
                            Procurement & Sourcing Intern
                          </option>
                          <option value="Supply Chain Analytics Intern">
                            Supply Chain Analytics Intern
                          </option>
                          <option value="Warehouse & Inventory Intern">
                            Warehouse & Inventory Intern
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                        Proposed Interview Date / Time
                      </label>
                      <input
                        type="text"
                        value={inquiryForm.interviewWindow}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, interviewWindow: e.target.value })
                        }
                        placeholder="e.g. Next Tuesday 10:00 AM ICT (Online / Bangkok)"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#0B1120] border border-slate-700 rounded-lg text-[#F8FAFC] placeholder-slate-500 focus:outline-none focus:border-[#F59E0B]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                      <span>Confirm Interview Invitation</span>
                    </button>
                  </form>
                )}

                {/* Logged HR Invitations History (Verifies Fast-Track Persistence) */}
                {savedInvitations.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800/90">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        ✓ Logged HR Invitations ({savedInvitations.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSavedInvitations([]);
                          localStorage.removeItem('hein_htet_aung_hr_invitations_v1');
                        }}
                        className="text-[11px] font-mono text-slate-400 hover:text-white"
                      >
                        Clear Log
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {savedInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 rounded-lg bg-[#0B1120] border border-slate-800/90 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#F8FAFC] truncate">
                              {inv.companyName} · <span className="text-[#F59E0B]">{inv.internshipRole}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              {inv.recruiterName} ({inv.email}) · {inv.interviewWindow || 'Flexible'}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {inv.createdAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </StaggerCard>
          </StaggerContainer>
        </SlideRevealSection>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#070B14] text-slate-400 border-t border-slate-800/80 px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-display font-bold text-[#F8FAFC]">HEIN HTET AUNG</span> · B.B.A.
            Logistics & Supply Chain Management · Stamford International University, Thailand
          </div>
          <div className="flex items-center gap-5 font-mono">
            <a href="#network" className="hover:text-white transition-colors">
              Network
            </a>
            <a href="#education" className="hover:text-white transition-colors">
              Skills
            </a>
            <a href="#experience" className="hover:text-white transition-colors">
              Experience
            </a>
            <a href="#certificates" className="hover:text-white transition-colors">
              Certificates
            </a>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/40"
              title="Download Full Project ZIP or Open Media Asset Hub"
            >
              <Archive className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-slate-300 hover:text-amber-300">Project ZIP & Media</span>
            </button>
          </div>
        </div>
      </footer>

      {/* CERTIFICATE LIGHTBOX MODAL WITH 3D DEPTH TRANSITION */}
      <AnimatePresence>
        {activeCertificate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            onClick={() => setActiveCertificate(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95, rotateX: 4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 1000 }}
              className="bg-[#111C33] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-[#F8FAFC]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-[#F59E0B] font-semibold">
                    {activeCertificate.category} · {activeCertificate.date}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC] mt-0.5">
                    {activeCertificate.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">{activeCertificate.issuer}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCertificate(null)}
                  className="p-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-6 aspect-[16/10] w-full rounded-xl overflow-hidden border border-slate-700 bg-white">
                <CertificateDocumentReplica
                  cert={activeCertificate}
                  customImageUrl={customImages[activeCertificate.imageSlotKey]}
                  compact={false}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs font-mono text-slate-300">
                  <strong className="text-[#F59E0B]">Validated Skills: </strong>
                  {activeCertificate.skillsValidated}
                </div>

                {activeCertificate.verificationUrl && (
                  <div className="flex items-center gap-3">
                    <a
                      href={activeCertificate.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Verify on Coursera</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN & NETLIFY MEDIA ASSET HUB MODAL */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setIsAdminOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0B1120] border border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-[#F8FAFC]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      ASSET HUB
                    </span>
                    <span className="text-xs font-mono text-slate-400">Netlify Image Exporter</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white mt-1">
                    Portfolio Media Assets & Netlify Exporter
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload your real photos and certificate scans here, then export as code for Netlify so everyone can see them permanently.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(false)}
                  className="p-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Toolbar for Netlify Export & Full Project Backup */}
              <div className="px-5 sm:px-6 py-3.5 bg-[#111C33] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="font-bold text-amber-400 text-sm">{Object.keys(customImages).length}</span>
                  <span>media assets loaded in memory.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* BATCH UPLOAD ALL PHOTOS AT ONCE */}
                  <label className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95">
                    <FolderUp className="w-4 h-4" />
                    <span>{isBatchUploading ? 'Uploading Photos...' : 'Batch Upload (တစ်ပြိုင်နက် ပုံများတင်ရန်)'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={isBatchUploading}
                      onChange={handleBatchUpload}
                    />
                  </label>

                  {/* FULL PROJECT ZIP DOWNLOAD */}
                  <button
                    type="button"
                    disabled={isExportingZip}
                    onClick={handleDownloadZipRequest}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    title="Download entire codebase with embedded images as a complete ZIP"
                  >
                    <Archive className="w-4 h-4 text-slate-950" />
                    <span>{isExportingZip ? 'Creating ZIP...' : 'Download Full Project (ZIP)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (Object.keys(customImages).length === 0) {
                        setShowZeroImagesModal(true);
                        return;
                      }
                      const exportImages: Record<string, string> = { ...customImages };
                      const heroPic =
                        exportImages['hero_portrait_raw'] ||
                        exportImages['hero_arms_crossed_portrait'] ||
                        exportImages['hero_suit_portrait'];
                      if (heroPic) {
                        exportImages['hero_portrait_raw'] = heroPic;
                        exportImages['hero_arms_crossed_portrait'] = heroPic;
                        exportImages['hero_suit_portrait'] = heroPic;
                        exportImages['hero_arms_crossed_cutout'] = heroPic;
                        exportImages['hero_suit_cutout'] = heroPic;
                      }
                      const shellPic =
                        exportImages['evidence_shell'] ||
                        exportImages['evidence_shell_director'];
                      if (shellPic) {
                        exportImages['evidence_shell'] = shellPic;
                        exportImages['evidence_shell_director'] = shellPic;
                      }

                      const fileContent = `/**\n * Bundled Static Image Assets for Netlify & Public Production\n * Generated automatically from Portfolio Media Hub.\n */\n\nexport interface BundledImagesRegistry {\n  [key: string]: string | undefined;\n}\n\nexport const BUNDLED_IMAGES: BundledImagesRegistry = ${JSON.stringify(exportImages, null, 2)};\n\nexport function getBundledImage(key: string): string | undefined {\n  return BUNDLED_IMAGES[key];\n}\n`;
                      const blob = new Blob([fileContent], { type: 'text/typescript' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'bundledImages.ts';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-amber-500/30 shadow"
                    title="Export src/bundledImages.ts file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download bundledImages.ts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const exportImages: Record<string, string> = { ...customImages };
                      navigator.clipboard.writeText(JSON.stringify(exportImages, null, 2));
                      setCopyNotification('Copied image data JSON to clipboard!');
                      setTimeout(() => setCopyNotification(null), 3000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </button>
                </div>
              </div>

              {/* In-UI Copy or Batch Upload Notifications */}
              {copyNotification && (
                <div className="mx-5 sm:mx-6 mt-3 px-3.5 py-2 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs rounded-lg flex items-center gap-2 shadow-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{copyNotification}</span>
                </div>
              )}

              {batchUploadStatus && (
                <div className="mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 bg-sky-950/80 border border-sky-500 text-sky-200 text-xs rounded-lg flex items-center gap-2 shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{batchUploadStatus}</span>
                </div>
              )}

              {/* Step-by-Step Instructions & Status Banner */}
              {Object.keys(customImages).length === 0 ? (
                <div className="mx-5 sm:mx-6 mt-3 p-4 bg-amber-950/40 border border-amber-600/50 rounded-xl text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Netlify တွင် သင့်ဓာတ်ပုံများ အမြဲတမ်း ပေါ်စေရန် အလွယ်ဆုံး အဆင့် (၃) ဆင့်-</span>
                  </div>
                  <div className="text-amber-100/90 text-xs leading-relaxed space-y-1.5 pl-6">
                    <div>
                      <strong>အဆင့် ၁:</strong> အပေါ်ရှိ <span className="text-sky-300 font-bold">&quot;Batch Upload (တစ်ပြိုင်နက် ပုံများတင်ရန်)&quot;</span> ကို နှိပ်ပြီး သင့်ဖုန်း/ကွန်ပျူတာထဲရှိ Certificates နှင့် Profile ပုံများကို တစ်ခါတည်း အားလုံး ရွေးပေးပါ (သို့မဟုတ် အောက်ပါ Slot များတွင် တစ်ပုံချင်းစီ &quot;Upload Photo&quot; နှိပ်၍ တင်ပါ)။
                    </div>
                    <div>
                      <strong>အဆင့် ၂:</strong> ဓာတ်ပုံများ တင်ပြီးပါက <span className="text-amber-300 font-bold">&quot;Download Full Project (ZIP)&quot;</span> ကို နှိပ်ပါ။ သင့်ဓာတ်ပုံများ အလိုအလျောက် ပရောဂျက်ထဲသို့ ပေါင်းစပ်ပြီးသား ဖြစ်သွားပါမည်။
                    </div>
                    <div>
                      <strong>အဆင့် ၃:</strong> ထို ZIP ဖိုင်ကို Extract လုပ်ပြီး Netlify Drop (https://app.netlify.com/drop) သို့မဟုတ် GitHub ထဲသို့ တင်လိုက်သည်နှင့် Netlify တွင် ပုံများ ၁၀၀% အမြဲပေါ်နေပါမည်။
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-5 sm:mx-6 mt-3 p-3.5 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-emerald-300">{Object.keys(customImages).length} ခု</strong> သော မီဒီယာပုံများ အဆင်သင့် ဖြစ်နေပါပြီ။
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-300/90 font-medium">
                    &quot;Download Full Project (ZIP)&quot; ကို နှိပ်ပါက သင့်ဓာတ်ပုံများ public/images/ ထဲသို့ အလိုအလျောက် ထည့်သွင်းပေးမည် ဖြစ်ပါသည်။
                  </span>
                </div>
              )}

              {/* Slots List */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <div className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider mb-2">
                  1. Executive & Endorsement Photographs
                </div>
                {[
                  {
                    key: 'hero_portrait_raw',
                    aliases: ['hero_arms_crossed_portrait', 'hero_suit_portrait', 'hero_arms_crossed_cutout'],
                    label: 'Hero Cutout / Blazer Portrait',
                    desc: 'Waist-up blazer portrait of Hein Htet Aung with arms crossed',
                  },
                  {
                    key: 'evidence_shell',
                    aliases: ['evidence_shell_director'],
                    label: 'Director of Shell Company Limited Endorsement',
                    desc: 'Mr. Thanet Puwapiromkwan & Hein Htet Aung at Stamford backdrop',
                  },
                  {
                    key: 'evidence_ib_head',
                    aliases: ['evidence_ib_head'],
                    label: 'Head of International Business Department Endorsement',
                    desc: 'Asst. Prof. Dr. Phanrajit Havarangsi & Hein Htet Aung',
                  },
                  {
                    key: 'lead_photo_tt_president',
                    aliases: [],
                    label: 'Stamford Table Tennis Club VP Poster',
                    desc: 'Official poster with Stamford logo and Hein Htet Aung in purple sports jersey',
                  },
                  {
                    key: 'lead_photo_redcross',
                    aliases: [],
                    label: 'Myanmar Red Cross Society & COVID-19 Task Force',
                    desc: 'Frontline emergency supply distribution and community relief',
                  },
                  {
                    key: 'lead_photo_enervon',
                    aliases: [],
                    label: 'ENERVON C Filmmaking & Regional Table Tennis Sportsman',
                    desc: 'Appreciation award and sportsmanship honors',
                  },
                  {
                    key: 'lead_photo_council',
                    aliases: [],
                    label: 'Student Council President & Annual Fun Fair Host',
                    desc: 'Helix International School leadership photo',
                  },
                  {
                    key: 'lead_photo_gee',
                    aliases: [],
                    label: 'Global Enterprise Experience Team 20 Award Photo',
                    desc: 'Victoria University of Wellington international award',
                  },
                  {
                    key: 'lead_photo_hypen',
                    aliases: [],
                    label: 'Hypen Organization Volunteer Outreach Photo',
                    desc: 'Community education outreach certificate / photo',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {customImages[item.key] || (item.aliases && item.aliases.some(a => customImages[a])) ? (
                          <img
                            src={customImages[item.key] || item.aliases?.map(a => customImages[a]).find(Boolean)}
                            alt={item.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                          <span>{item.label}</span>
                          {(customImages[item.key] || item.aliases?.some(a => customImages[a])) && (
                            <span className="text-[10px] text-emerald-400 font-mono inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{customImages[item.key] || item.aliases?.some(a => customImages[a]) ? 'Replace' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(item.key);
                              const dataUrl = await compressUploadedImage(file, 1200);
                              if (dataUrl) {
                                await savePersistedImage(item.key, dataUrl);
                                const updates: Record<string, string> = { [item.key]: dataUrl };
                                if (item.aliases) {
                                  for (const alias of item.aliases) {
                                    await savePersistedImage(alias, dataUrl);
                                    updates[alias] = dataUrl;
                                  }
                                }
                                setCustomImages((prev) => ({ ...prev, ...updates }));
                              }
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </label>
                      {(customImages[item.key] || item.aliases?.some(a => customImages[a])) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = { ...customImages };
                            delete updated[item.key];
                            await savePersistedImage(item.key, '');
                            if (item.aliases) {
                              for (const alias of item.aliases) {
                                delete updated[alias];
                                await savePersistedImage(alias, '');
                              }
                            }
                            setCustomImages(updated);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider pt-4 mb-2">
                  2. Verified Certificates & Scans
                </div>
                {CERTIFICATES_DATA.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {customImages[cert.imageSlotKey] ? (
                          <img
                            src={customImages[cert.imageSlotKey]}
                            alt={cert.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-[9px] font-mono font-bold text-amber-500/80 text-center px-1">
                            {cert.badgeType.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                          <span>{cert.title}</span>
                          {customImages[cert.imageSlotKey] ? (
                            <span className="text-[10px] text-emerald-400 font-mono inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Scanned File Loaded
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (High-Res Document Replica Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {cert.issuer} · {cert.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{customImages[cert.imageSlotKey] ? 'Replace Scan' : 'Upload Scan'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadingSlot(cert.imageSlotKey);
                              const dataUrl = await compressUploadedImage(file, 1200);
                              if (dataUrl) {
                                await savePersistedImage(cert.imageSlotKey, dataUrl);
                                setCustomImages((prev) => ({ ...prev, [cert.imageSlotKey]: dataUrl }));
                              }
                              setUploadingSlot(null);
                            }
                          }}
                        />
                      </label>
                      {customImages[cert.imageSlotKey] && (
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = { ...customImages };
                            delete updated[cert.imageSlotKey];
                            await savePersistedImage(cert.imageSlotKey, '');
                            setCustomImages(updated);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Warning Modal when downloading ZIP with 0 images */}
        {showZeroImagesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111C33] border border-amber-500/70 rounded-2xl p-6 max-w-lg w-full text-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400 font-bold text-base border-b border-slate-800 pb-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <span>ဓာတ်ပုံများ Upload မတင်ရသေးပါ (0 Photos Loaded)</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                လက်ရှိ Browser ထဲတွင် သင့်ဓာတ်ပုံများ (Profile ပုံနှင့် Certificates စကင်ဖတ်ထားသော ပုံများ) Upload မတင်ရသေးပါ။
                ယခု ဆက်လက် ဒေါင်းလုဒ်လုပ်ပါက ပုံအစစ်များ မပါဘဲ <strong>မူလ Vector သရုပ်ဖော်ပုံများသာ</strong> ပါဝင်သွားမည် ဖြစ်ပါသည်။
              </p>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-amber-200/95 space-y-1.5 leading-relaxed">
                <div className="font-bold text-amber-300">အကြံပြုချက်-</div>
                <div>၁။ <span className="font-semibold text-white">&quot;ဓာတ်ပုံများ အရင်တင်မည်&quot;</span> ကို နှိပ်ပါ။</div>
                <div>၂။ အပေါ်ရှိ <span className="text-sky-300 font-bold">&quot;Batch Upload&quot;</span> ဖြင့် သင့်ဖုန်း/ကွန်ပျူတာထဲမှ ဓာတ်ပုံအားလုံးကို တစ်ခါတည်း ရွေးပေးပါ။</div>
                <div>၃။ ပြီးမှ ဒေါင်းလုဒ်လုပ်ပါက Netlify တွင် သင့်ဓာတ်ပုံအစစ်များ အမြဲတမ်း ပေါ်နေပါမည်။</div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowZeroImagesModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
                >
                  ဓာတ်ပုံများ အရင်တင်မည် (Cancel)
                </button>
                <button
                  type="button"
                  onClick={proceedDownloadZip}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-all shadow"
                >
                  ပုံမပါဘဲ ဆက်လက် Download လုပ်မည်
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
