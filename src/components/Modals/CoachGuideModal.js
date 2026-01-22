import React from 'react';
import { X, CheckCircle, UserPlus, UserMinus, Clock, Calendar } from 'lucide-react';

const CoachGuideModal = ({ showModal, setShowModal }) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-blue-600 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Coach Guide</h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Welcome */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Welcome! This app helps you take attendance at coaching sessions and track who has attended.
            </p>
          </div>

          {/* Taking the Register */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Taking the Register
            </h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Tap <strong>"Take Register"</strong> on your next session</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Tap each player's name to mark them as <strong>present</strong> (they'll turn green with a tick)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Tap <strong>"Save"</strong> when you're done</span>
              </li>
            </ol>
          </section>

          {/* Adding Someone New */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Adding Someone New
            </h3>
            <p className="text-gray-700 mb-3">
              If someone turns up who isn't on the list:
            </p>
            <ol className="space-y-2 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Tap the blue <strong>"Add Someone"</strong> button</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Type their name to search existing members</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>If they're not found, tap <strong>"Add as New Person"</strong> - the admin will be notified to get their details later</span>
              </li>
            </ol>
          </section>

          {/* Removing Someone */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-500" />
              Removing Someone from the Group
            </h3>
            <p className="text-gray-700">
              If someone has left and won't be coming back, tap the <strong>person-minus icon</strong> on the right of their name. They won't appear on future registers.
            </p>
          </section>

          {/* Catching Up */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Forgot to Take the Register?
            </h3>
            <p className="text-gray-700">
              No problem! The <strong>"Last 7 Days"</strong> section shows recent sessions. Tap any of them to add attendance after the fact.
            </p>
          </section>

          {/* Dashboard Overview */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Your Dashboard
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Next Session:</strong> Shows all sessions for the next coaching day</li>
              <li><strong>Last 7 Days:</strong> Recent sessions you can still update</li>
              <li><strong>Payments tab:</strong> See who owes money for sessions</li>
            </ul>
          </section>

          {/* Tips */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Quick Tips</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Take the register at the start of each session</li>
              <li>• The attendance count shows at the bottom of the screen</li>
              <li>• Green background = marked present</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setShowModal(false)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachGuideModal;
