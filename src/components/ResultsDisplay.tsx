import React, { useState } from 'react';
import { GroupingResult } from '../types/index';
import { GroupCard } from './GroupCard';
import { Download, AlertCircle } from 'lucide-react';

interface ResultsDisplayProps {
  result: GroupingResult;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const downloadJSON = () => {
    const exportData = {
      summary: {
        total_profiles: result.totalProfiles,
        groups_formed: result.groupsFormed,
        ungrouped_count: result.ungroupedProfiles.length,
      },
      groups: result.groups.map(group => ({
        group_number: group.group_number,
        compatibility_score: group.compatibility_score,
        female_count: group.female_count,
        introvert_count: group.introvert_count,
        matching_reasons: group.matching_reasons,
        members: group.members.map(m => ({
          name: m.name,
          phone: m.phone,
          email: `${m.instagram}@instagram.com`,
          university: m.university,
          year: m.year,
          gender: m.gender,
          city: m.city,
          course: m.course,
          instagram: m.instagram,
        })),
      })),
      ungrouped_profiles: result.ungroupedProfiles.map(p => ({
        name: p.name,
        phone: p.phone,
        university: p.university,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinner-groups-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadCSV = () => {
    let csv = 'Group Number,Name,Phone,University,Year,Gender,City,Course,Instagram\n';

    result.groups.forEach(group => {
      group.members.forEach(member => {
        csv += `${group.group_number},"${member.name}","${member.phone}","${member.university}","${member.year}","${member.gender}","${member.city}","${member.course}","${member.instagram}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinner-groups-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const totalMembers = result.groups.reduce((sum, g) => sum + g.members.length, 0);
  const stats = {
    totalFemales: result.groups.reduce((sum, g) => sum + g.female_count, 0),
    avgCompatibility:
      result.groups.length > 0
        ? Math.round((result.groups.reduce((sum, g) => sum + g.compatibility_score, 0) / result.groups.length) * 100) / 100
        : 0,
    avgIntroverts:
      result.groups.length > 0
        ? Math.round((result.groups.reduce((sum, g) => sum + g.introvert_count, 0) / result.groups.length) * 100) / 100
        : 0,
    avgGroupSize: result.groups.length > 0 ? (totalMembers / result.groups.length).toFixed(1) : 0,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Results</h2>
            <p className="text-gray-600 mt-1">
              {result.groupsFormed} groups created from {result.totalProfiles} profiles
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={18} />
              JSON
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} />
              CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-600">Groups Formed</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{result.groupsFormed}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-purple-600">Avg Compatibility</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">{stats.avgCompatibility}%</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
            <p className="text-sm font-medium text-pink-600">Female Representation</p>
            <p className="text-3xl font-bold text-pink-900 mt-1">{stats.totalFemales}/{totalMembers}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-600">Avg Group Size</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{stats.avgGroupSize}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-gray-900">Dinner Groups</h3>
        {result.groups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
};
