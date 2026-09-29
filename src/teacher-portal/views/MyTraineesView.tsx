import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrainerAssignedTrainees } from '../../services/trainerDiscoveryService';
import { Users, Search, RefreshCw, UserCheck, Award, AlertCircle, BookOpen, ExternalLink, X, ShieldCheck } from 'lucide-react';

import { TrainerAssignmentRecord } from '../../types';

interface TraineeAssignedItem {
  assignment: TrainerAssignmentRecord;
  traineeProfile: {
    uid: string;
    fullName: string;
    email: string;
    organization?: string;
    department?: string;
    designation?: string;
    skills?: string[];
    competencies?: any[];
    skillGapsCount?: number;
    trainingProgress?: number;
  };
}

export function MyTraineesView() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<TraineeAssignedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeAssignedItem | null>(null);

  const fetchAssignedTrainees = async () => {
    setLoading(true);
    try {
      const trainerId = profile?.id || 'faculty-1';
      const data = await getTrainerAssignedTrainees(trainerId, profile?.email);
      setTrainees(data);
    } catch (err) {
      console.error('Failed to load assigned trainees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTrainees();
  }, [profile?.id, profile?.email]);

  const filteredTrainees = trainees.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = item.traineeProfile.fullName?.toLowerCase() || '';
    const dept = item.traineeProfile.department?.toLowerCase() || '';
    const org = item.traineeProfile.organization?.toLowerCase() || '';
    const skills = item.traineeProfile.skills?.join(' ').toLowerCase() || '';
    return name.includes(q) || dept.includes(q) || org.includes(q) || skills.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#12121a] via-[#1a1329] to-[#12121a] border border-[#992e9d]/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#992e9d]/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#992e9d] mb-1">
            <Users className="w-4 h-4" />
            <span>Trainer Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Trainees
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Trainees who have selected you as their mentor/trainer. Monitor their skill gaps, competencies, and active training progress.
          </p>
        </div>

        <button
          onClick={fetchAssignedTrainees}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#992e9d]/20 hover:bg-[#992e9d]/30 text-purple-200 border border-[#992e9d]/40 transition text-sm font-semibold cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assigned trainees by name, organization, department, or skill..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#161622] text-white border border-gray-800 focus:border-[#992e9d] focus:outline-none focus:ring-1 focus:ring-[#992e9d] text-sm transition placeholder-gray-500 shadow-inner"
        />
      </div>

      {/* Trainees Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-[#992e9d] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your assigned trainees...</p>
        </div>
      ) : filteredTrainees.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#161622] border border-gray-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#992e9d]/10 border border-[#992e9d]/30 text-[#992e9d] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {searchQuery ? 'No trainees match your search' : 'No trainees assigned yet'}
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Trainees who select you from the "Find a Trainer" discovery page will appear here automatically.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainees.map(({ assignment, traineeProfile }) => (
            <div
              key={assignment.id}
              className="p-5 rounded-2xl bg-[#161622] border border-gray-800/80 hover:border-[#992e9d]/50 transition duration-200 shadow-lg flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#992e9d] to-purple-800 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-md">
                    {traineeProfile.fullName ? traineeProfile.fullName.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-purple-300 transition">
                      {traineeProfile.fullName}
                    </h3>
                    <p className="text-xs text-purple-400 font-medium truncate">
                      {traineeProfile.designation || 'Trainee Learner'}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {traineeProfile.department || 'Operations'} • {traineeProfile.organization || 'Capacity Building'}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 bg-[#0e0e17] p-3 rounded-xl border border-gray-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">Training Progress</span>
                    <span className="text-purple-300">{traineeProfile.trainingProgress || 75}%</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-[#992e9d] h-full rounded-full transition-all duration-500"
                      style={{ width: `${traineeProfile.trainingProgress || 75}%` }}
                    />
                  </div>
                </div>

                {/* Skills Chips */}
                {traineeProfile.skills && traineeProfile.skills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {traineeProfile.skills.slice(0, 4).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-md bg-purple-950/60 text-purple-200 border border-purple-800/40"
                        >
                          {sk}
                        </span>
                      ))}
                      {traineeProfile.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-md bg-gray-800 text-gray-400">
                          +{traineeProfile.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Skill Gaps badge */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800/60 text-gray-400">
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {traineeProfile.skillGapsCount || 1} Identified Skill Gap{(traineeProfile.skillGapsCount || 1) > 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => setSelectedTrainee({ assignment, traineeProfile })}
                className="mt-5 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-[#992e9d] text-gray-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>View Trainee Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trainee Detail Modal Drawer */}
      {selectedTrainee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#14141f] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in my-8">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-[#1a1329] via-[#14141f] to-[#1a1329] border-b border-gray-800 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#992e9d] to-purple-800 text-white font-extrabold flex items-center justify-center text-2xl shadow-lg border border-purple-400/20">
                  {selectedTrainee.traineeProfile.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                      {selectedTrainee.traineeProfile.fullName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Active Trainee
                    </span>
                  </div>
                  <p className="text-sm text-purple-300 font-medium">
                    {selectedTrainee.traineeProfile.designation || 'Trainee Associate'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedTrainee.traineeProfile.department} • {selectedTrainee.traineeProfile.organization}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrainee(null)}
                className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-sm text-gray-300 max-h-[70vh] overflow-y-auto">
              {/* Account Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0e0e17] border border-gray-800">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase block">Email</span>
                  <span className="text-white font-medium text-xs break-all">
                    {selectedTrainee.traineeProfile.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase block">Assignment Status</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    {selectedTrainee.assignment.status}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  Skills Profile
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTrainee.traineeProfile.skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-purple-950/70 text-purple-200 border border-purple-800/50 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Competencies */}
              {selectedTrainee.traineeProfile.competencies && selectedTrainee.traineeProfile.competencies.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Declared Competencies
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTrainee.traineeProfile.competencies.map((c: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#0e0e17] border border-gray-800 flex justify-between items-center">
                        <span className="font-semibold text-white text-xs">{c.name || c.title || `Competency #${idx + 1}`}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900/60 text-purple-300">
                          {c.level || 'Intermediate'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Privacy Notice */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs text-purple-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Private information protected. Only relevant trainee competency records are exposed to authorized trainers.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0e0e17] border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setSelectedTrainee(null)}
                className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
