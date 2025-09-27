import React, { useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';

const WhatsAppPostGenerator = ({
  match,
  fixtures,
  users,
  availabilityStats,
  onClose,
  appUrl = "https://tennis-ladder-llw0ervod-jons-projects-9634d9db.vercel.app"
}) => {
  const [copied, setCopied] = useState(false);
  const [includeAvailabilityPoll, setIncludeAvailabilityPoll] = useState(true);
  const [includeLadderLink, setIncludeLadderLink] = useState(true);

  const formatMatchDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-GB', options);
  };

  const generateWhatsAppPost = () => {
    let message = [];

    // Header with cleaner formatting
    message.push(`🎾 CAWOOD TENNIS LADDER 🎾`);
    message.push('═'.repeat(28));
    message.push('');

    // Match details with better date formatting
    const dayName = new Date(match.match_date).toLocaleDateString('en-GB', { weekday: 'long' });
    const dateFormatted = new Date(match.match_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });

    message.push(`📅 Week ${match.week_number} - ${dayName} ${dateFormatted}`);
    message.push('');

    // Check if fixtures exist (match has been generated)
    if (fixtures && fixtures.length > 0) {
      // Match has been generated - show fixtures with beautiful table formatting
      message.push(`🏆 MATCH FIXTURES`);
      message.push('─'.repeat(20));
      message.push('');

      // Group by courts
      const courtGroups = {};
      fixtures.forEach(fixture => {
        if (!courtGroups[fixture.court_number]) {
          courtGroups[fixture.court_number] = [];
        }
        courtGroups[fixture.court_number].push(fixture);
      });

      // Display each court with proper table formatting
      Object.entries(courtGroups).forEach(([courtNumber, courtFixtures], courtIndex) => {
        if (courtIndex > 0) message.push('');

        message.push(`🏟️ Court ${courtNumber}`);
        message.push('');

        // Create a beautiful table for matches
        message.push('```');
        message.push('Match | Pair 1      vs  Pair 2');
        message.push('------|------------------------');

        courtFixtures.forEach((fixture, index) => {
          const pair1Names = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
          const pair2Names = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);

          // Format names to fit nicely
          const pair1 = pair1Names.join(' & ');
          const pair2 = pair2Names.join(' & ');

          // Create properly aligned table row
          const matchNum = `  ${index + 1}`;
          const vs = 'vs';
          const maxPair1Length = 12;
          const pair1Padded = pair1.length > maxPair1Length ?
            pair1.substring(0, maxPair1Length - 1) + '…' :
            pair1.padEnd(maxPair1Length);

          message.push(`${matchNum}   | ${pair1Padded} ${vs} ${pair2}`);

          // Show sitting player on separate line if exists
          if (fixture.sitting_player) {
            message.push(`      | (${fixture.sitting_player.name} sitting)`);
          }
        });
        message.push('```');

        // Get unique players for this court
        const allPlayers = [...new Set([
          ...courtFixtures.map(f => f.player1?.name),
          ...courtFixtures.map(f => f.player2?.name),
          ...courtFixtures.map(f => f.player3?.name),
          ...courtFixtures.map(f => f.player4?.name)
        ].filter(Boolean))];

        message.push(`👥 Players: ${allPlayers.join(', ')}`);
      });

      message.push('');
      message.push('⏰ Please arrive 15 minutes early for warm-up');

    } else {
      // Match not generated yet - availability check
      message.push(`🤔 AVAILABILITY CHECK`);
      message.push('─'.repeat(18));
      message.push('');
      message.push(`We need to know who's available for Week ${match.week_number}!`);
      message.push('');

      // Show current availability stats if available
      if (availabilityStats) {
        message.push('📊 Current responses:');
        message.push('```');
        message.push(`Available:     ${availabilityStats.available || 0}`);
        message.push(`Not available: ${availabilityStats.unavailable || 0}`);
        message.push(`No response:   ${availabilityStats.pending || 0}`);
        message.push('```');
        message.push('');
      }
    }

    // Add availability poll if requested
    if (includeAvailabilityPoll && (!fixtures || fixtures.length === 0)) {
      message.push('💬 PLEASE RESPOND TO POLL:');
      message.push('• ✅ Available');
      message.push('• ❌ Not available');
      message.push('• ❓ Maybe/unsure');
      message.push('');
      message.push('(Create a WhatsApp poll with these options)');
      message.push('');
    }

    // Add ladder link if requested
    if (includeLadderLink) {
      message.push('📱 Update availability in the app:');
      message.push(`${appUrl}`);
      message.push('');
    }

    message.push('─'.repeat(25));
    message.push('Questions? Contact Jon or Charlie 👋');

    return message.join('\n');
  };

  const copyToClipboard = async () => {
    const text = generateWhatsAppPost();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsAppWeb = () => {
    const text = encodeURIComponent(generateWhatsAppPost());
    const url = `https://web.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const generatedMessage = generateWhatsAppPost();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              📱 WhatsApp Post Generator
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Generate a formatted message for your club WhatsApp group
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Options */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Message Options</h4>
            <div className="space-y-3">
              {(!fixtures || fixtures.length === 0) && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeAvailabilityPoll}
                    onChange={(e) => setIncludeAvailabilityPoll(e.target.checked)}
                    className="rounded border-gray-300 text-[#5D1F1F] focus:ring-[#5D1F1F]"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include availability poll instructions
                  </span>
                </label>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeLadderLink}
                  onChange={(e) => setIncludeLadderLink(e.target.checked)}
                  className="rounded border-gray-300 text-[#5D1F1F] focus:ring-[#5D1F1F]"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include link to ladder app
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-6">
            <h4 className="font-medium text-gray-900 mb-3">Message Preview</h4>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {generatedMessage}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-[#5D1F1F] text-white py-3 px-4 rounded-md hover:bg-[#4A1818] transition-colors flex items-center justify-center space-x-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>

            <button
              onClick={openWhatsAppWeb}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp Web</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Copy the message and paste it into your club WhatsApp group, or click "Open WhatsApp Web" to send directly
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPostGenerator;