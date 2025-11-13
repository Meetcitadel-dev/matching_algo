import React from 'react';
import { DinnerGroup } from '../types/index';
import { Users, Heart, Music, Zap } from 'lucide-react';

interface GroupCardProps {
  group: DinnerGroup;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Table {group.group_number}</h3>
          <p className="text-sm text-gray-600">Compatibility Score: {group.compatibility_score}%</p>
        </div>
        <div className="flex gap-3 text-sm font-medium">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
            <Users size={16} />
            {group.female_count}F, {6 - group.female_count}M
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
            Extrovert +{6 - group.introvert_count}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2 mb-2">
          <Zap size={16} className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-sm text-gray-900 mb-1">Why this table works:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {group.matching_reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {group.members.map((member, idx) => (
          <div key={member.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">{idx + 1}. {member.name}</p>
                <p className="text-xs text-gray-600">{member.course} • {member.year} Year • {member.university}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700">{member.city}</p>
                <p className="text-xs text-gray-500">@{member.instagram}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${member.introvert_score >= 7 ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
                <span className="text-gray-600">{member.introvert_score >= 7 ? 'Introvert' : 'Extrovert'} ({member.introvert_score})</span>
              </div>
              <div className="flex items-center gap-1">
                <Music size={14} className="text-gray-500" />
                <span className="text-gray-600">{member.music_vibe}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={14} className="text-gray-500" />
                <span className="text-gray-600">{member.relationship_status}</span>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  member.weekend_plan === 'Partying' || member.weekend_plan === 'Clubbing'
                    ? 'bg-pink-100 text-pink-800'
                    : member.weekend_plan === 'Chill in cafe'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.weekend_plan}
                </span>
              </div>
            </div>

            <div className="mt-2 flex gap-2 flex-wrap text-xs">
              {member.college_vibe && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {member.college_vibe}
                </span>
              )}
              {member.fitness_active && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Fitness Active
                </span>
              )}
              {member.spontaneous_preference && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Spontaneous
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
