import React, { useState } from 'react';
import { Calendar, Users, DollarSign, Clock, Settings } from 'lucide-react';
import { useCoaching } from '../../hooks/useCoaching';
import ScheduleManagement from './Admin/ScheduleManagement';
import UnifiedSessionManagement from './Admin/UnifiedSessionManagement';
import PaymentManagement from './Admin/PaymentManagement';
import AccessManagement from './Admin/AccessManagement';

const CoachingAdminTab = ({ currentUser, allUsers }) => {
  const [activeSection, setActiveSection] = useState('schedules');
  const coaching = useCoaching(currentUser?.id, true); // isAdmin = true

  const sections = [
    { id: 'schedules', name: 'Schedules', icon: Clock, color: 'blue' },
    { id: 'sessions', name: 'Sessions & Attendance', icon: Calendar, color: 'green' },
    { id: 'payments', name: 'Payments', icon: DollarSign, color: 'orange' },
    { id: 'access', name: 'Access Control', icon: Users, color: 'red' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'schedules':
        return (
          <ScheduleManagement
            schedules={coaching.schedules}
            loading={coaching.loading.schedules}
            actions={coaching.actions}
            currentUser={currentUser}
          />
        );
      case 'sessions':
        return (
          <UnifiedSessionManagement
            sessions={coaching.sessions}
            schedules={coaching.schedules}
            attendance={coaching.attendance}
            loading={coaching.loading.sessions || coaching.loading.attendance}
            actions={coaching.actions}
            allUsers={allUsers}
            currentUser={currentUser}
          />
        );
      case 'payments':
        return (
          <PaymentManagement
            payments={coaching.payments}
            loading={coaching.loading.payments}
            actions={coaching.actions}
            allUsers={allUsers}
            currentUser={currentUser}
          />
        );
      case 'access':
        return (
          <AccessManagement
            accessList={coaching.accessList}
            loading={coaching.loading.access}
            actions={coaching.actions}
            allUsers={allUsers}
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-[#5D1F1F]" />
          <h2 className="text-2xl font-bold text-gray-900">Coaching Management</h2>
        </div>
        <p className="text-gray-600">
          Manage coaching schedules, sessions, attendance, and payments
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap
                  ${isActive
                    ? `text-${section.color}-600 border-b-2 border-${section.color}-600 bg-${section.color}-50`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{section.name}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default CoachingAdminTab;
