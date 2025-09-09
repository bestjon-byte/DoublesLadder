// League Import Modal - New Implementation
import React, { useState } from 'react';
import { X, Globe, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { parseLeagueMatchFromURL } from '../../utils/leagueURLParser';

const LeagueImportModal = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleParseURL = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.includes('yorkmenstennisleague.co.uk')) {
      setError('Please provide a valid York Men\'s Tennis League URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const parseResult = await parseLeagueMatchFromURL(url);
      
      if (parseResult.success) {
        setResult(parseResult.data);
        setError('');
      } else {
        setError(parseResult.error || 'Failed to parse URL');
        setResult(null);
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderParsedData = () => {
    if (!result) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Match Data Parsed Successfully!</h3>
        </div>

        <div className="space-y-4">
          {/* Match Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Match Information</h4>
              <div className="text-sm space-y-1">
                <p><strong>Date:</strong> {result.matchDate || 'Not found'}</p>
                <p><strong>Time:</strong> {result.matchTime || 'Not found'}</p>
                <p><strong>Home Team:</strong> {result.homeTeam || 'Not found'}</p>
                <p><strong>Away Team:</strong> {result.awayTeam || 'Not found'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Data Summary</h4>
              <div className="text-sm space-y-1">
                <p><strong>Home Team Pairs:</strong> {result.homeTeamPairs?.length || 0}</p>
                <p><strong>Away Team Pairs:</strong> {result.awayTeamPairs?.length || 0}</p>
                <p><strong>Scoring Matrix:</strong> {result.scoringMatrix?.length || 0} rows</p>
              </div>
            </div>
          </div>

          {/* Team Pairs */}
          {result.homeTeamPairs && result.homeTeamPairs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Home Team Pairs ({result.homeTeam})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.homeTeamPairs.map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <p className="font-medium">Pair {index + 1}</p>
                    <p>{pair.player1}</p>
                    <p>{pair.player2}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.awayTeamPairs && result.awayTeamPairs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Away Team Pairs ({result.awayTeam})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {result.awayTeamPairs.map((pair, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    <p className="font-medium">Pair {index + 1}</p>
                    <p>{pair.player1}</p>
                    <p>{pair.player2}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scoring Matrix */}
          {result.scoringMatrix && result.scoringMatrix.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Scoring Matrix</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1">Home Pair</th>
                      {result.awayTeamPairs?.map((pair, index) => (
                        <th key={index} className="border border-gray-300 px-2 py-1">
                          vs Away Pair {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.scoringMatrix.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-2 py-1 font-medium">
                          Home Pair {rowIndex + 1}
                        </td>
                        {row.map((score, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 px-2 py-1 text-center">
                            {score ? `${score.homeScore}-${score.awayScore}` : 'No score'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Show Raw Parsed Data (for debugging)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 text-xs overflow-auto max-h-40 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">League Match Import</h2>
              <p className="text-sm text-gray-600">Import match results from York Men's Tennis League URL</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League Match URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.yorkmenstennisleague.co.uk/fixtures/339"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={handleParseURL}
                  disabled={loading || !url.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Parse URL</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a valid York Men's Tennis League fixture URL to import match results
              </p>
            </div>

            {/* Example URL */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800 mb-2"><strong>Example URL:</strong></p>
              <code className="text-xs text-blue-700 bg-white px-2 py-1 rounded">
                https://www.yorkmenstennisleague.co.uk/fixtures/339
              </code>
              <button
                onClick={() => setUrl('https://www.yorkmenstennisleague.co.uk/fixtures/339')}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Use Example
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Parse Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parsed Data Display */}
            {renderParsedData()}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end space-x-3">
            {result && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Parse Another URL
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            {result && (
              <button
                onClick={() => {
                  // TODO: Implement data import to database
                  alert('Import functionality will be implemented next!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Import to Database
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueImportModal;