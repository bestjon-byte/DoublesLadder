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

    // Header
    message.push(`🎾 CAWOOD TENNIS LADDER 🎾`);
    message.push('');

    // Match details
    message.push(`📅 **Week ${match.week_number} - ${formatMatchDate(match.match_date)}**`);
    message.push('');

    // Check if fixtures exist (match has been generated)
    if (fixtures && fixtures.length > 0) {
      // Match has been generated - show fixtures
      message.push(`🏆 **MATCH FIXTURES**`);
      message.push('');

      // Group by courts
      const courtGroups = {};
      fixtures.forEach(fixture => {
        if (!courtGroups[fixture.court_number]) {
          courtGroups[fixture.court_number] = [];
        }
        courtGroups[fixture.court_number].push(fixture);
      });

      // Display each court
      Object.entries(courtGroups).forEach(([courtNumber, courtFixtures]) => {
        message.push(`**Court ${courtNumber}:**`);

        // Get unique players for this court
        const players = [...new Set([
          ...courtFixtures.map(f => f.player1?.name),
          ...courtFixtures.map(f => f.player2?.name),
          ...courtFixtures.map(f => f.player3?.name),
          ...courtFixtures.map(f => f.player4?.name)
        ].filter(Boolean))];

        message.push(`Players: ${players.join(', ')}`);

        // Show individual matches
        courtFixtures.forEach((fixture, index) => {
          const pair1 = [fixture.player1?.name, fixture.player2?.name].filter(Boolean);
          const pair2 = [fixture.player3?.name, fixture.player4?.name].filter(Boolean);

          message.push(`  ${index + 1}. ${pair1.join(' & ')} vs ${pair2.join(' & ')}`);
          if (fixture.sitting_player) {
            message.push(`     (${fixture.sitting_player.name} sitting)`);
          }
        });
        message.push('');
      });

      message.push(`⏰ **Please arrive 15 minutes early for warm-up**`);
      message.push('');
      message.push(`📊 **Don't forget to enter your scores in the app after playing!**`);

    } else {
      // Match not generated yet - availability check
      message.push(`🤔 **AVAILABILITY CHECK**`);
      message.push('');
      message.push(`We need to know who's available for Week ${match.week_number}!`);
      message.push('');

      if (availabilityStats) {
        message.push(`Current status:`);
        message.push(`✅ Available: ${availabilityStats.available}`);
        message.push(`⏳ Pending: ${availabilityStats.pending}`);
        message.push(`❌ Unavailable: ${availabilityStats.unavailable}`);
        message.push('');
      }

      message.push(`⚠️ **We need at least 4 players to generate matches**`);
      message.push('');
    }

    // Add availability poll if requested
    if (includeAvailabilityPoll && (!fixtures || fixtures.length === 0)) {
      message.push(`📊 **POLL: Are you available for ${formatMatchDate(match.match_date)}?**`);
      message.push('');
      message.push(`Please react with:`);
      message.push(`✅ Yes, I'm available`);
      message.push(`❌ No, I can't make it`);
      message.push(`❓ Maybe/not sure yet`);
      message.push('');
    }

    // Add ladder link if requested
    if (includeLadderLink) {
      message.push(`🔗 **Update your availability in the app:**`);
      message.push(appUrl);
      message.push('');
    }

    message.push(`Questions? Contact the committee 👋`);

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
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
        <div className="p-6 flex-1 overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-3">Message Preview</h4>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {generatedMessage}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200">
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