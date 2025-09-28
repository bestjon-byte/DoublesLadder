import React, { useState } from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';

const WhatsAppLeagueExporter = ({
  seasonData,
  onClose,
  appUrl = "https://tennis-ladder-app.vercel.app"
}) => {
  const [copied, setCopied] = useState(false);
  const [formatStyle, setFormatStyle] = useState('table'); // table, list, podium, minimal
  const [includeOnlyPlayersWithMatches, setIncludeOnlyPlayersWithMatches] = useState(true);
  const [includeLadderLink, setIncludeLadderLink] = useState(true);

  // Smart name shortening function - reused from match exporter
  const createShortNames = (allPlayerNames) => {
    const nameMap = {};
    const uniqueNames = [...new Set(allPlayerNames.filter(name => name))];

    const firstNameGroups = {};
    uniqueNames.forEach(fullName => {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

      if (!firstNameGroups[firstName]) {
        firstNameGroups[firstName] = [];
      }
      firstNameGroups[firstName].push({ fullName, firstName, lastName });
    });

    Object.values(firstNameGroups).forEach(group => {
      if (group.length === 1) {
        nameMap[group[0].fullName] = group[0].firstName;
      } else {
        group.forEach(person => {
          if (person.lastName) {
            let shortName = person.firstName;
            let suffixLength = 1;
            let isUnique = false;

            while (!isUnique && suffixLength <= person.lastName.length) {
              const testName = `${person.firstName} ${person.lastName.substring(0, suffixLength)}`;

              const conflicts = group.filter(other =>
                other !== person &&
                other.lastName &&
                other.lastName.substring(0, suffixLength) === person.lastName.substring(0, suffixLength)
              );

              if (conflicts.length === 0) {
                shortName = testName;
                isUnique = true;
              } else {
                suffixLength++;
              }
            }

            if (!isUnique) {
              shortName = `${person.firstName} ${person.lastName}`;
            }

            nameMap[person.fullName] = shortName;
          } else {
            nameMap[person.fullName] = person.firstName;
          }
        });
      }
    });

    return nameMap;
  };

  const generateLeagueTablePost = () => {
    let message = [];

    // Filter players with matches if requested
    const playersToShow = includeOnlyPlayersWithMatches
      ? seasonData.players.filter(player => player.matches_played > 0)
      : seasonData.players;

    if (playersToShow.length === 0) {
      return "No players found with the current filters.";
    }

    // Header
    message.push(`🎾 CAWOOD TENNIS LADDER 🎾`);
    message.push('═'.repeat(14));
    message.push('');

    // Season info
    const seasonType = seasonData.season.season_type === 'league' ? 'League' : 'Ladder';
    message.push(`🏆 ${seasonData.season.name} ${seasonType}`);
    if (seasonData.season.status === 'completed') {
      message.push('🏁 Final Results');
    } else {
      message.push('📊 Current Standings');
    }
    message.push('');

    // Create short names for all players
    const allPlayerNames = playersToShow.map(player => player.name);
    const shortNameMap = createShortNames(allPlayerNames);

    if (formatStyle === 'table') {
      // Table format with emojis
      message.push('┌─────┬──────────────────┬────────┐');
      message.push('│ Pos │      Player      │  Win%  │');
      message.push('├─────┼──────────────────┼────────┤');

      playersToShow.forEach((player, index) => {
        const shortName = shortNameMap[player.name] || player.name;
        const winPercent = player.matches_played > 0
          ? Math.round((player.matches_won / player.matches_played) * 100)
          : 0;

        // Add rank emoji for top 3
        let position = `${player.rank || index + 1}`;
        if (player.rank === 1) position = '🥇';
        else if (player.rank === 2) position = '🥈';
        else if (player.rank === 3) position = '🥉';

        // Pad the name to fit nicely in WhatsApp
        const paddedName = shortName.length > 16 ? shortName.substring(0, 13) + '...' : shortName.padEnd(16);
        const paddedPercent = `${winPercent}%`.padStart(6);

        message.push(`│ ${position.padStart(3)} │ ${paddedName} │ ${paddedPercent} │`);
      });

      message.push('└─────┴──────────────────┴────────┘');

    } else if (formatStyle === 'list') {
      // Simple list format
      message.push('📋 League Table:');
      message.push('');

      playersToShow.forEach((player, index) => {
        const shortName = shortNameMap[player.name] || player.name;
        const winPercent = player.matches_played > 0
          ? Math.round((player.matches_won / player.matches_played) * 100)
          : 0;

        let rankIcon = `${player.rank || index + 1}.`;
        if (player.rank === 1) rankIcon = '🥇';
        else if (player.rank === 2) rankIcon = '🥈';
        else if (player.rank === 3) rankIcon = '🥉';

        message.push(`${rankIcon} ${shortName} - ${winPercent}%`);
      });

    } else if (formatStyle === 'podium') {
      // Podium format - show top 3 prominently, then list others
      message.push('🏆 PODIUM FINISHERS 🏆');
      message.push('');

      // Show top 3
      const topThree = playersToShow.slice(0, 3);
      topThree.forEach((player, index) => {
        const shortName = shortNameMap[player.name] || player.name;
        const winPercent = player.matches_played > 0
          ? Math.round((player.matches_won / player.matches_played) * 100)
          : 0;

        if (index === 0) {
          message.push(`    🥇 ${shortName}`);
          message.push(`    👑 ${winPercent}% wins`);
        } else if (index === 1) {
          message.push(`🥈 ${shortName} - ${winPercent}%`);
        } else if (index === 2) {
          message.push(`🥉 ${shortName} - ${winPercent}%`);
        }
        if (index === 0) message.push('');
      });

      // Show rest if there are more than 3
      if (playersToShow.length > 3) {
        message.push('');
        message.push('📊 Other positions:');
        playersToShow.slice(3).forEach((player, index) => {
          const shortName = shortNameMap[player.name] || player.name;
          const winPercent = player.matches_played > 0
            ? Math.round((player.matches_won / player.matches_played) * 100)
            : 0;
          message.push(`${index + 4}. ${shortName} - ${winPercent}%`);
        });
      }

    } else if (formatStyle === 'minimal') {
      // Ultra minimal - just positions and win percentages
      message.push('Current standings:');
      message.push('');

      playersToShow.forEach((player, index) => {
        const shortName = shortNameMap[player.name] || player.name;
        const winPercent = player.matches_played > 0
          ? Math.round((player.matches_won / player.matches_played) * 100)
          : 0;

        message.push(`${player.rank || index + 1}. ${shortName} ${winPercent}%`);
      });
    }

    message.push('');

    // Add summary stats
    const totalPlayers = playersToShow.length;
    const activePlayers = playersToShow.filter(p => p.matches_played > 0).length;

    if (includeOnlyPlayersWithMatches) {
      message.push(`📈 ${activePlayers} active players`);
    } else {
      message.push(`👥 ${totalPlayers} players (${activePlayers} active)`);
    }

    // Add app link if requested
    if (includeLadderLink) {
      message.push('');
      message.push('📱 View full details:');
      message.push(`${appUrl}`);
    }

    message.push('');
    message.push('─'.repeat(10));
    message.push('Questions? Contact Jon or Charlie 👋');

    return message.join('\n');
  };

  const copyToClipboard = async () => {
    const text = generateLeagueTablePost();

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
    const text = encodeURIComponent(generateLeagueTablePost());
    const url = `https://web.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const generatedMessage = generateLeagueTablePost();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              📱 WhatsApp League Table Export
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Share your league table results on WhatsApp
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Options */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
            <div className="space-y-4">
              {/* Format Style Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📱 Format Style
                </label>
                <select
                  value={formatStyle}
                  onChange={(e) => setFormatStyle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#5D1F1F] focus:border-[#5D1F1F]"
                >
                  <option value="table">📊 Table Format (Clean & Professional)</option>
                  <option value="list">📋 Simple List (Quick & Readable)</option>
                  <option value="podium">🏆 Podium Style (Highlight Top 3)</option>
                  <option value="minimal">✨ Minimal (Ultra Clean)</option>
                </select>
              </div>

              {/* Include only players with matches */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOnlyPlayersWithMatches}
                  onChange={(e) => setIncludeOnlyPlayersWithMatches(e.target.checked)}
                  className="rounded border-gray-300 text-[#5D1F1F] focus:ring-[#5D1F1F]"
                />
                <span className="ml-2 text-sm text-gray-700">
                  🎾 Only show players who have played matches
                </span>
              </label>

              {/* Include app link */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeLadderLink}
                  onChange={(e) => setIncludeLadderLink(e.target.checked)}
                  className="rounded border-gray-300 text-[#5D1F1F] focus:ring-[#5D1F1F]"
                />
                <span className="ml-2 text-sm text-gray-700">
                  🔗 Include link to full ladder app
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
            Copy the message and paste it into your club WhatsApp group
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppLeagueExporter;