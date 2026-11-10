/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  X,
  TrendingUp,
  FileCheck,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Employee, QuarterlyReview } from '../../types/office';

interface QuarterlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  reviewerName: string;
  reviewerRole: string;
  onSaveReview: (review: QuarterlyReview) => void;
  lang: 'sw' | 'en';
}

export const QuarterlyReviewModal: React.FC<QuarterlyReviewModalProps> = ({
  isOpen,
  onClose,
  employee,
  reviewerName,
  reviewerRole,
  onSaveReview,
  lang,
}) => {
  const isSw = lang === 'sw';
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [reviewDate, setReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // 5 Ratings (1 to 5)
  const [technical, setTechnical] = useState<number>(4);
  const [delivery, setDelivery] = useState<number>(4);
  const [teamwork, setTeamwork] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(4);
  const [initiative, setInitiative] = useState<number>(4);

  // Text inputs
  const [achievements, setAchievements] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<QuarterlyReview['recommendedAction']>(
    'Kudumisha Wadhifa (Retain)'
  );

  if (!isOpen) return null;

  // Calculate score
  const overallScore = Number(((technical + delivery + teamwork + punctuality + initiative) / 5).toFixed(1));

  const getCategory = (score: number): QuarterlyReview['ratingCategory'] => {
    if (score >= 4.5) return 'Bora Sana (Outstanding)';
    if (score >= 3.8) return 'Nzuri (Good)';
    if (score >= 3.0) return 'Wastani (Satisfactory)';
    if (score >= 2.0) return 'Inahitaji Maboresho (Needs Improvement)';
    return 'Chini ya Kiwango (Unsatisfactory)';
  };

  const category = getCategory(overallScore);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const review: QuarterlyReview = {
      id: `REV-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      year,
      quarter,
      reviewDate,
      reviewerName: reviewerName || 'Admin Mkuu',
      reviewerRole: reviewerRole || 'Msimamizi wa Idara',
      technicalProficiency: technical,
      taskDelivery: delivery,
      teamworkCommunication: teamwork,
      punctualityReliability: punctuality,
      leadershipInitiative: initiative,
      overallScore,
      ratingCategory: category,
      keyAchievements: achievements.trim() || (isSw ? 'Utekelezaji mzuri wa majukumu ya kila siku.' : 'Consistent execution of routine duties.'),
      areasForGrowth: growthAreas.trim() || (isSw ? 'Kuongeza kasi ya utoaji wa ripoti kwa wakati.' : 'Enhance reporting timelines.'),
      nextQuarterGoals: goals.trim() || (isSw ? 'Kufikia malengo 100% ya idara na kutoa mafunzo kwa wenzake.' : 'Meet 100% departmental KPI targets.'),
      recommendedAction: recommendation,
      reviewerNotes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveReview(review);
    onClose();
  };

  const renderStarRating = (value: number, onChange: (val: number) => void, label: string, sub: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 gap-2">
      <div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{label}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
      </div>
      <div className="flex items-center gap-1.5 self-start sm:self-center">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded-md transition-all ${
              star <= value
                ? 'text-amber-500 hover:scale-110'
                : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
            }`}
            title={`${star} / 5`}
          >
            <Star className={`w-5 h-5 ${star <= value ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        ))}
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 ml-1.5 min-w-[28px]">
          {value}/5
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isSw ? 'Tathmini ya Utendaji ya Robo Mwaka' : 'Quarterly Performance Review'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {quarter} {year}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {isSw
                  ? `Kumbukumbu rasmi ya tathmini ya utendaji kazi kwa ${employee.fullName}`
                  : `Official performance feedback record for ${employee.fullName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={employee.avatarUrl}
              alt={employee.fullName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500"
            />
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">{employee.fullName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {employee.roleTitle} · {employee.department}
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Namba: {employee.employeeNo}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {isSw ? 'Wastani wa Alama:' : 'Overall Score:'}
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {overallScore}
              </span>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {category}
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Quarter & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Robo Mwaka (Quarter):' : 'Quarter:'}
              </label>
              <select
                value={quarter}
                onChange={e => setQuarter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Q1">Q1 (Januari - Machi)</option>
                <option value="Q2">Q2 (Aprili - Juni)</option>
                <option value="Q3">Q3 (Julai - Septemba)</option>
                <option value="Q4">Q4 (Oktoba - Desemba)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Mwaka (Year):' : 'Year:'}
              </label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={2020}
                max={2030}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Tarehe ya Tathmini:' : 'Review Date:'}
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium font-mono"
              />
            </div>
          </div>

          {/* Performance Pillars Ratings */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{isSw ? 'Nguzo 5 za Upimaji wa Utendaji (1 - 5 Stars):' : '5 Core Performance Pillars:'}</span>
            </div>

            {renderStarRating(
              technical,
              setTechnical,
              isSw ? '1. Umahiri wa Kitaalamu (Technical Proficiency)' : '1. Technical Proficiency & Core Job Skills',
              isSw ? 'Uelewa wa majukumu na ubora wa kitaalamu wa matokeo.' : 'Deep understanding of job functions and deliverables.'
            )}

            {renderStarRating(
              delivery,
              setDelivery,
              isSw ? '2. Utekelezaji na Kasi ya Majukumu (Task Delivery)' : '2. Task Execution & Delivery Timelines',
              isSw ? 'Kukamilisha kazi kwa wakati na kufuata vigezo.' : 'Completing assigned tasks on schedule with minimal revisions.'
            )}

            {renderStarRating(
              teamwork,
              setTeamwork,
              isSw ? '3. Ushirikiano na Mawasiliano (Teamwork & Communication)' : '3. Teamwork & Communication',
              isSw ? 'Kufanya kazi vizuri na timu na kutoa mrejesho kwa wakati.' : 'Collaborative spirit and prompt communication with colleagues.'
            )}

            {renderStarRating(
              punctuality,
              setPunctuality,
              isSw ? '4. Mahudhurio na Nidhamu (Punctuality & Reliability)' : '4. Attendance, Punctuality & Discipline',
              isSw ? 'Kufika kazini kwa wakati na kufuata kanuni za ofisi.' : 'Consistent on-time clock-in and observance of workplace ethics.'
            )}

            {renderStarRating(
              initiative,
              setInitiative,
              isSw ? '5. Ubunifu na Uongozi (Leadership & Initiative)' : '5. Leadership, Innovation & Proactivity',
              isSw ? 'Kutatua changamoto bila kusubiri kuambiwa kila kitu.' : 'Self-starter mentality, problem-solving, and positive influence.'
            )}
          </div>

          {/* Qualitative Feedback */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Mafanikio Makuu Katika Robo Hii (Key Achievements): *' : 'Key Achievements During This Quarter: *'}
              </label>
              <textarea
                value={achievements}
                onChange={e => setAchievements(e.target.value)}
                required
                rows={3}
                placeholder={
                  isSw
                    ? 'Mfano: Alifanikiwa kukamilisha mradi wa ukaguzi kwa siku 5 kabla ya wakati, na kuongeza ufanisi wa idara kwa 20%...'
                    : 'Example: Successfully spearheaded the departmental audit 5 days ahead of schedule, improving workflow efficiency...'
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Maeneo ya Kurekebisha / Kuboresha (Areas for Improvement):' : 'Areas for Growth / Improvement:'}
              </label>
              <textarea
                value={growthAreas}
                onChange={e => setGrowthAreas(e.target.value)}
                rows={2}
                placeholder={
                  isSw
                    ? 'Mfano: Kutoa taarifa mapema za dharura na kuweka ripoti za kila siku kwenye mfumo...'
                    : 'Example: Proactively communicate potential blockers earlier and update daily logs consistently...'
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Malengo Mahususi ya Robo Ijayo (Next Quarter Goals):' : 'Next Quarter Objectives & KPIs:'}
              </label>
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                rows={2}
                placeholder={
                  isSw
                    ? 'Mfano: Kukamilisha mafunzo ya mfumo mpya na kusimamia timu ya mradi wa mkoa...'
                    : 'Example: Complete system certifications and mentor junior associates on reporting...'
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Mapendekezo ya Utawala (Administrative Recommendation):' : 'Management Recommendation:'}
              </label>
              <select
                value={recommendation}
                onChange={e => setRecommendation(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Kudumisha Wadhifa (Retain)">Kudumisha Wadhifa (Retain Current Role)</option>
                <option value="Kupandishwa Cheo (Promotion)">Kupandishwa Cheo (Promotion)</option>
                <option value="Nyongeza ya Mshahara (Increment)">Nyongeza ya Mshahara (Salary Increment)</option>
                <option value="Mafunzo ya Ziada (Training)">Mafunzo ya Ziada & Maendeleo (Specialized Training)</option>
                <option value="Mpango wa Maboresho (PIP)">Mpango Maalum wa Maboresho (Performance Improvement Plan - PIP)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isSw ? 'Maoni ya Ziada ya Mkaguzi (Reviewer Notes):' : 'Additional Reviewer Notes:'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={isSw ? 'Maoni ya siri au maelekezo ya kiutawala...' : 'Confidential administrative notes...'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Signoff Context */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isSw
                  ? `Imethibitishwa na: ${reviewerName} (${reviewerRole})`
                  : `Validated by: ${reviewerName} (${reviewerRole})`}
              </span>
            </div>
            <span className="font-mono">{reviewDate}</span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isSw ? 'Ghairi' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSw ? 'Hifadhi Tathmini ya Robo Mwaka' : 'Save Performance Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
