// src/components/TrophyCabinet/TrophyModal.js
import React, { useState, useEffect } from 'react';
import { X, Trophy, Star } from 'lucide-react';

const TrophyModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  trophy = null,
  seasons = [],
  allUsers = [],
  currentUser
}) => {
  const [formData, setFormData] = useState({
    season_id: '',
    trophy_type: 'gold_cup',
    competition_type: 'custom',
    winner_player1_id: '',
    winner_player2_id: '',
    custom_title: '',
    engraving_text: '',
    position: 1,
    awarded_date: new Date().toISOString().split('T')[0],
    display_order: 0,
    is_featured: false,
    trophy_image_url: ''
  });

  const [errors, setErrors] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Trophy type options with descriptions
  const trophyTypes = [
    { value: 'custom_image', label: 'Custom Image', icon: '📷', description: 'Upload your own trophy image' },
    { value: 'gold_cup', label: 'Gold Cup', icon: '🏆', description: 'Classic golden trophy cup' },
    { value: 'silver_cup', label: 'Silver Cup', icon: '🥈', description: 'Silver trophy cup' },
    { value: 'bronze_cup', label: 'Bronze Cup', icon: '🥉', description: 'Bronze trophy cup' },
    { value: 'champion_cup', label: 'Champion Cup', icon: '👑', description: 'Special champion trophy' },
    { value: 'gold_shield', label: 'Gold Shield', icon: '🛡️', description: 'Golden shield award' },
    { value: 'silver_shield', label: 'Silver Shield', icon: '🔰', description: 'Silver shield award' },
    { value: 'bronze_shield', label: 'Bronze Shield', icon: '🛡️', description: 'Bronze shield award' },
    { value: 'gold_star', label: 'Gold Star', icon: '⭐', description: 'Golden star award' },
    { value: 'silver_star', label: 'Silver Star', icon: '✨', description: 'Silver star award' },
    { value: 'bronze_star', label: 'Bronze Star', icon: '🌟', description: 'Bronze star award' },
    { value: 'diamond_cup', label: 'Diamond Cup', icon: '💎', description: 'Premium diamond trophy' },
    { value: 'platinum_shield', label: 'Platinum Shield', icon: '⚡', description: 'Exclusive platinum shield' }
  ];

  const competitionTypes = [
    { value: 'singles_winner', label: 'Singles Winner' },
    { value: 'doubles_winner', label: 'Doubles Winner' },
    { value: 'league_winner', label: 'League Winner' },
    { value: 'tournament_winner', label: 'Tournament Winner' },
    { value: 'season_champion', label: 'Season Champion' },
    { value: 'best_player', label: 'Best Player' },
    { value: 'most_improved', label: 'Most Improved' },
    { value: 'sportsmanship', label: 'Sportsmanship Award' },
    { value: 'participation', label: 'Participation Award' },
    { value: 'custom', label: 'Custom Achievement' }
  ];

  // Initialize form data when modal opens or trophy changes
  useEffect(() => {
    if (isOpen) {
      if (trophy) {
        setFormData({
          season_id: trophy.season_id || '',
          trophy_type: trophy.trophy_type || 'gold_cup',
          competition_type: trophy.competition_type || 'custom',
          winner_player1_id: trophy.winner_player1_id || '',
          winner_player2_id: trophy.winner_player2_id || '',
          custom_title: trophy.custom_title || '',
          engraving_text: trophy.engraving_text || '',
          position: trophy.position || 1,
          awarded_date: trophy.awarded_date || new Date().toISOString().split('T')[0],
          display_order: trophy.display_order || 0,
          is_featured: trophy.is_featured || false,
          trophy_image_url: trophy.trophy_image_url || ''
        });
      } else {
        // Reset for new trophy
        setFormData({
          season_id: '',
          trophy_type: 'custom_image',
          competition_type: 'custom',
          winner_player1_id: '',
          winner_player2_id: '',
          custom_title: '',
          engraving_text: '',
          position: 1,
          awarded_date: new Date().toISOString().split('T')[0],
          display_order: 0,
          is_featured: false,
          trophy_image_url: ''
        });
      }
      setErrors({});
      // setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen, trophy]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.season_id) {
      newErrors.season_id = 'Season is required';
    }

    if (!formData.winner_player1_id) {
      newErrors.winner_player1_id = 'At least one winner is required';
    }

    if (!formData.custom_title?.trim() && formData.competition_type === 'custom') {
      newErrors.custom_title = 'Custom title is required for custom achievements';
    }

    if (formData.competition_type === 'doubles_winner' && !formData.winner_player2_id) {
      newErrors.winner_player2_id = 'Second player is required for doubles awards';
    }

    if (formData.trophy_type === 'custom_image' && !imagePreview && !formData.trophy_image_url) {
      newErrors.trophy_image = 'Trophy image is required for custom image type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare form data with image URL if available
    const submitData = { ...formData };
    if (formData.trophy_type === 'custom_image' && imagePreview) {
      submitData.trophy_image_url = imagePreview; // Use the data URL
    }

    const result = await onSave(submitData);
    if (result.success) {
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    // setImageFile(null);
    setImagePreview(null);
    handleInputChange('trophy_image_url', '');
  };

  const getDefaultTitle = () => {
    const competitionType = competitionTypes.find(ct => ct.value === formData.competition_type);
    return competitionType?.label || 'Achievement';
  };

  const selectedTrophyType = trophyTypes.find(tt => tt.value === formData.trophy_type);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {trophy ? 'Edit Trophy' : 'Add New Trophy'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Trophy Preview */}
          {previewMode && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
              <div className="mb-4">
                {formData.trophy_type === 'custom_image' && imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Custom trophy preview" 
                    className="mx-auto max-h-24 w-24 object-contain rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="text-6xl">{selectedTrophyType?.icon}</div>
                )}
              </div>
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-gray-900 text-xl">
                  {formData.custom_title || getDefaultTitle()}
                </h3>
                {formData.engraving_text && (
                  <p className="text-gray-700 italic mt-2">"{formData.engraving_text}"</p>
                )}
              </div>
              <div className="text-gray-600">
                Winner: {allUsers.find(u => u.id === formData.winner_player1_id)?.name || 'Select winner'}
                {formData.winner_player2_id && (
                  <> & {allUsers.find(u => u.id === formData.winner_player2_id)?.name}</>
                )}
              </div>
            </div>
          )}

          {/* Toggle Preview */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {previewMode ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Season Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season *
              </label>
              <select
                value={formData.season_id}
                onChange={(e) => handleInputChange('season_id', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent ${
                  errors.season_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Season</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name} ({season.season_type === 'league' ? 'League' : 'Ladder'})
                  </option>
                ))}
              </select>
              {errors.season_id && (
                <p className="text-red-600 text-sm mt-1">{errors.season_id}</p>
              )}
            </div>


            {/* Image Upload for Custom Image Type */}
            {formData.trophy_type === 'custom_image' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trophy Image *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Trophy preview" 
                        className="mx-auto max-h-32 rounded-lg shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <p className="text-sm text-gray-600 mt-2">Click × to remove image</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <label htmlFor="trophy-image" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload trophy image
                          </span>
                          <span className="block text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </label>
                        <input
                          id="trophy-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {errors.trophy_image && (
                  <p className="text-red-600 text-sm mt-1">{errors.trophy_image}</p>
                )}
              </div>
            )}

            {/* Competition Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Award Type
              </label>
              <select
                value={formData.competition_type}
                onChange={(e) => handleInputChange('competition_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              >
                {competitionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => handleInputChange('position', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              >
                <option value={1}>1st Place</option>
                <option value={2}>2nd Place</option>
                <option value={3}>3rd Place</option>
                <option value={4}>4th Place</option>
                <option value={5}>5th Place</option>
              </select>
            </div>
          </div>

          {/* Winners */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Winners *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  value={formData.winner_player1_id}
                  onChange={(e) => handleInputChange('winner_player1_id', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent ${
                    errors.winner_player1_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Winner</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {errors.winner_player1_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.winner_player1_id}</p>
                )}
              </div>
              
              <div>
                <select
                  value={formData.winner_player2_id}
                  onChange={(e) => handleInputChange('winner_player2_id', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent ${
                    errors.winner_player2_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Partner (Optional)</option>
                  {allUsers
                    .filter(user => user.id !== formData.winner_player1_id)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
                {errors.winner_player2_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.winner_player2_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Title {formData.competition_type === 'custom' && '*'}
            </label>
            <input
              type="text"
              value={formData.custom_title}
              onChange={(e) => handleInputChange('custom_title', e.target.value)}
              placeholder={getDefaultTitle()}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent ${
                errors.custom_title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.custom_title && (
              <p className="text-red-600 text-sm mt-1">{errors.custom_title}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Leave blank to use default: "{getDefaultTitle()}"
            </p>
          </div>

          {/* Engraving Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engraving Text
            </label>
            <textarea
              value={formData.engraving_text}
              onChange={(e) => handleInputChange('engraving_text', e.target.value)}
              placeholder="Optional custom message to engrave on the trophy..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
            />
            <p className="text-gray-500 text-xs mt-1">
              This text will appear as an engraved message on the trophy
            </p>
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Awarded Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Awarded Date
              </label>
              <input
                type="date"
                value={formData.awarded_date}
                onChange={(e) => handleInputChange('awarded_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
              />
            </div>

          </div>

          {/* Featured Toggle */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                className="w-4 h-4 text-[#5D1F1F] border-gray-300 rounded focus:ring-[#5D1F1F]"
              />
              <span className="text-sm font-medium text-gray-700">Featured Trophy</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </label>
            <p className="text-gray-500 text-xs mt-1 ml-7">
              Featured trophies appear in the special showcase section
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#5D1F1F] to-red-600 text-white py-2 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              {trophy ? 'Update Trophy' : 'Create Trophy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrophyModal;