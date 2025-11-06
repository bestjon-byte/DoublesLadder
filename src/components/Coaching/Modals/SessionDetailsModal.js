import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const SessionDetailsModal = ({ isOpen, onClose, session, actions }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      setLoading(true);
      actions.getSessionAttendance(session.id).then(result => {
        if (!result.error) {
          setAttendance(result.data || []);
        }
        setLoading(false);
      });
    }
  }, [session, actions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Session Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Session Information</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Type:</span> {session.session_type}</p>
              <p><span className="font-medium">Date:</span> {new Date(session.session_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><span className="font-medium">Time:</span> {session.session_time}</p>
              <p><span className="font-medium">Status:</span> {session.status}</p>
              {session.notes && <p><span className="font-medium">Notes:</span> {session.notes}</p>}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Attendance ({attendance.length})
            </h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : attendance.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance recorded yet</p>
            ) : (
              <div className="space-y-2">
                {attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span>{record.player?.name}</span>
                    {record.self_registered && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Self-registered
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;
