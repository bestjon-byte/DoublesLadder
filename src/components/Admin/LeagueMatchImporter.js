// src/components/Admin/LeagueMatchImporter.js
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, X, Eye, Save } from 'lucide-react';

const LeagueMatchImporter = () => {
  const [screenshots, setScreenshots] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedMatches, setProcessedMatches] = useState([]);

  // Load screenshots from the Screenshots result folder
  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    try {
      // Since we can't directly access the file system from a React app,
      // we'll use the known list of screenshots from the folder
      const screenshotList = [
        'Screenshot 2025-09-08 at 08.04.54.png',
        'Screenshot 2025-09-08 at 08.05.04.png', 
        'Screenshot 2025-09-08 at 08.05.09.png',
        'Screenshot 2025-09-08 at 08.05.17.png',
        'Screenshot 2025-09-08 at 08.05.25.png',
        'Screenshot 2025-09-08 at 08.05.32.png',
        'Screenshot 2025-09-08 at 08.05.38.png',
        'Screenshot 2025-09-08 at 08.05.53.png',
        'Screenshot 2025-09-08 at 08.06.01.png',
        'Screenshot 2025-09-08 at 08.06.07.png',
        'Screenshot 2025-09-08 at 08.06.14.png',
        'Screenshot 2025-09-08 at 08.06.23.png',
        'Screenshot 2025-09-08 at 08.06.31.png',
        'Screenshot 2025-09-08 at 08.06.38.png'
      ];

      setScreenshots(screenshotList.map((filename, index) => ({
        filename,
        path: `/Screenshots result/${filename}`,
        processed: false,
        id: filename.replace('.png', ''),
        matchNumber: index + 1
      })));
    } catch (error) {
      console.error('Error loading screenshots:', error);
    }
  };

  // Process image using Canvas API to extract text data
  const processImage = async (imagePath) => {
    setIsProcessing(true);
    try {
      // For demonstration, we'll extract the data structure manually
      // In a real implementation, this would use OCR or manual text extraction
      
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return structured data based on the screenshot format we can see
      const mockExtractedData = {
        date: '27 April 2025',
        time: '10:00',
        cawoodTeam: 'Cawood 2',
        opponentTeam: 'Market Weighton',
        rubbers: [
          {
            cawoodPair: ['Steven Walter', 'John Best'],
            opponentPair: ['Ian Robson', 'Aled Edwards'],
            scores: ['6-6', '7-5', '10-2'],
            cawoodGames: 23,
            opponentGames: 13
          },
          {
            cawoodPair: ['Nas Shefta', 'Mike Brennan'],
            opponentPair: ['Nick Collins', 'Stewart Berry'],
            scores: ['6-6', '5-7', '11-1'],
            cawoodGames: 22,
            opponentGames: 14
          },
          {
            cawoodPair: ['Mark Bottomley', 'Steve Caslake'],
            opponentPair: ['Ken Bottomer', 'Keigan Freeman Hacker'],
            scores: ['6-6', '5-7', '11-1'],
            cawoodGames: 22,
            opponentGames: 14
          }
        ],
        matchResult: {
          cawoodRubbers: 3.5,
          opponentRubbers: 8.5,
          cawoodTotalGames: 67,
          opponentTotalGames: 41
        }
      };
      
      setExtractedData(mockExtractedData);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image selection and processing
  const handleImageSelect = (screenshot) => {
    setSelectedImage(screenshot);
    processImage(screenshot.path);
  };

  // Save processed match data
  const saveMatchData = (matchData) => {
    // In a real implementation, this would save to the database
    setProcessedMatches(prev => [...prev, {
      ...matchData,
      id: Date.now(),
      processed: true,
      savedAt: new Date().toISOString()
    }]);
    
    // Mark screenshot as processed
    setScreenshots(prev => prev.map(s => 
      s.id === selectedImage.id ? {...s, processed: true} : s
    ));
    
    alert('Match data saved successfully!');
    setSelectedImage(null);
    setExtractedData(null);
  };

  // Manual text input as fallback
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const parseManualText = () => {
    // Parse the manual text input (like your original raw format)
    try {
      const lines = manualText.split('\n').filter(line => line.trim());
      
      // Extract date from first line
      const dateMatch = lines[0].match(/(\d{1,2} \w+ \d{4}) - (\d{1,2}:\d{2})/);
      if (!dateMatch) throw new Error('Could not parse date');
      
      // Extract teams and data...
      const parsedData = {
        date: dateMatch[1],
        time: dateMatch[2],
        // Add more parsing logic here based on your text format
      };
      
      setExtractedData(parsedData);
    } catch (error) {
      alert('Error parsing text: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            League Match Import Tool
          </h2>
          <p className="text-gray-600 mt-2">
            Process match result screenshots and import league match data
          </p>
        </div>

        <div className="p-6">
          {/* Screenshot Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Available Screenshots ({screenshots.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {screenshots.map((screenshot) => (
                <div
                  key={screenshot.id}
                  className={`relative cursor-pointer border-2 rounded-lg p-2 transition-all ${
                    selectedImage?.id === screenshot.id
                      ? 'border-blue-500 bg-blue-50'
                      : screenshot.processed
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleImageSelect(screenshot)}
                >
                  {/* Screenshot preview */}
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={screenshot.path}
                      alt={`Match ${screenshot.matchNumber}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center" style={{display: 'none'}}>
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-center">
                    <p className="font-medium truncate">{screenshot.filename}</p>
                    {screenshot.processed && (
                      <div className="flex items-center justify-center mt-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 ml-1">Processed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-800">Processing image...</span>
              </div>
            </div>
          )}

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Extracted Match Data</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Info */}
                <div>
                  <h4 className="font-medium mb-2">Match Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Date:</span> {extractedData.date}</p>
                    <p><span className="font-medium">Time:</span> {extractedData.time}</p>
                    <p><span className="font-medium">Cawood Team:</span> {extractedData.cawoodTeam}</p>
                    <p><span className="font-medium">Opponent:</span> {extractedData.opponentTeam}</p>
                  </div>
                </div>

                {/* Match Result */}
                <div>
                  <h4 className="font-medium mb-2">Match Result</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Cawood Rubbers:</span> {extractedData.matchResult?.cawoodRubbers}</p>
                    <p><span className="font-medium">Opponent Rubbers:</span> {extractedData.matchResult?.opponentRubbers}</p>
                    <p><span className="font-medium">Cawood Games:</span> {extractedData.matchResult?.cawoodTotalGames}</p>
                    <p><span className="font-medium">Opponent Games:</span> {extractedData.matchResult?.opponentTotalGames}</p>
                  </div>
                </div>
              </div>

              {/* Rubber Details */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Rubber Results</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cawood Pair</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Opponent Pair</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Games</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedData.rubbers?.map((rubber, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">
                            {rubber.cawoodPair.join(' & ')}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rubber.opponentPair.join(' & ')}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rubber.scores.join(', ')}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {rubber.cawoodGames} - {rubber.opponentGames}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => saveMatchData(extractedData)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Match Data
                </button>
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setSelectedImage(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Manual Text Input */}
          <div className="mb-6">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              {showManualInput ? 'Hide' : 'Show'} Manual Text Input
            </button>

            {showManualInput && (
              <div className="mt-4 p-4 border border-gray-300 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste raw match data:
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Paste the raw match data here..."
                />
                <button
                  onClick={parseManualText}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Parse Text Data
                </button>
              </div>
            )}
          </div>

          {/* Processed Matches Summary */}
          {processedMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Processed Matches ({processedMatches.length})</h3>
              <div className="space-y-2">
                {processedMatches.map((match) => (
                  <div key={match.id} className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-medium">{match.date}</span>
                      <span className="mx-2">-</span>
                      <span>{match.cawoodTeam} vs {match.opponentTeam}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Saved at {new Date(match.savedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueMatchImporter;