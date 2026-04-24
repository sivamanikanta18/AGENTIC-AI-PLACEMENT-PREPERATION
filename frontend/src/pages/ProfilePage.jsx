import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Building, GraduationCap, Briefcase, Target, Save, Camera } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profile: {
      college: user?.profile?.college || '',
      yearOfStudy: user?.profile?.yearOfStudy || '',
      experience: user?.profile?.experience || '',
      targetCompanies: user?.profile?.targetCompanies || [],
      preferredRoles: user?.profile?.preferredRoles || []
    }
  })

  const handleSave = async () => {
    try {
      updateUser(formData)
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-white/80">{user?.email}</p>
              <p className="text-white/60 text-sm mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                />
              </div>
            </div>

            {/* College */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College/University</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.profile.college}
                  onChange={(e) => handleProfileChange('college', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., IIT Bombay"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.profile.yearOfStudy}
                  onChange={(e) => handleProfileChange('yearOfStudy', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.profile.experience}
                  onChange={(e) => handleProfileChange('experience', e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                >
                  <option value="">Select Experience</option>
                  <option value="0">Fresher</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-2">1-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
              </div>
            </div>

            {/* Target Companies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Companies</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.profile.targetCompanies.join(', ')}
                  onChange={(e) => handleProfileChange('targetCompanies', e.target.value.split(',').map(s => s.trim()))}
                  disabled={!isEditing}
                  placeholder="e.g., Google, Amazon, Microsoft"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Preferred Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Roles</label>
            <div className="flex flex-wrap gap-2">
              {['Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Engineer', 'Machine Learning Engineer'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    if (!isEditing) return
                    const current = formData.profile.preferredRoles
                    const updated = current.includes(role)
                      ? current.filter(r => r !== role)
                      : [...current, role]
                    handleProfileChange('preferredRoles', updated)
                  }}
                  disabled={!isEditing}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.profile.preferredRoles.includes(role)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:cursor-not-allowed`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
            {isEditing ? (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      profile: {
                        college: user?.profile?.college || '',
                        yearOfStudy: user?.profile?.yearOfStudy || '',
                        experience: user?.profile?.experience || '',
                        targetCompanies: user?.profile?.targetCompanies || [],
                        preferredRoles: user?.profile?.preferredRoles || []
                      }
                    })
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm mb-1">Current Level</p>
          <p className="text-2xl font-bold text-gray-900">{user?.gamification?.level || 'Beginner'}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm mb-1">Total XP</p>
          <p className="text-2xl font-bold text-gray-900">{user?.gamification?.xp || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-600 text-sm mb-1">Readiness Score</p>
          <p className="text-2xl font-bold text-gray-900">{user?.readiness?.score || 0}/100</p>
        </div>
      </motion.div>
    </div>
  )
}

export default ProfilePage
