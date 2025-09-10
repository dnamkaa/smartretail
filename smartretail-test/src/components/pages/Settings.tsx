"use client";
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    darkMode: false,
    language: 'en',
  });

  async function updateProfile() {
    try {
      // This would call your auth service to update profile
      alert('Profile update functionality will be added when we create the user update endpoint!');
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    }
  }

  async function changePassword() {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      // This would call your auth service to change password
      alert('Password change functionality will be added when we create the password change endpoint!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      alert('Failed to change password: ' + error.message);
    }
  }

  async function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
        try {
          // This would call your auth service to delete account
          alert('Account deletion functionality will be added to the auth service!');
        } catch (error: any) {
          alert('Failed to delete account: ' + error.message);
        }
      }
    }
  }

  function updatePreferences() {
    // Save preferences to localStorage or send to backend
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    alert('Preferences saved successfully!');
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'danger', name: 'Danger Zone', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-1/4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:w-3/4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600">Update your account profile information.</p>
                </div>

                {/* Current User Info Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        user?.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user?.role === 'admin' ? '👑 Admin' : '🛍️ Customer'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={updateProfile}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-600">Ensure your account is using a long, random password.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={changePassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                </div>

                {/* Session Management */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Current Session</p>
                        <p className="text-sm text-gray-600">You are currently signed in</p>
                      </div>
                      <button
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
                  <p className="text-sm text-gray-600">Customize your experience.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications about your orders</p>
                    </div>
                    <button
                      onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                      <p className="text-sm text-gray-600">Receive emails about new products and offers</p>
                    </div>
                    <button
                      onClick={() => setPreferences({ ...preferences, emailUpdates: !preferences.emailUpdates })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.emailUpdates ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.emailUpdates ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                      <p className="text-sm text-gray-600">Use dark theme (Coming soon)</p>
                    </div>
                    <button
                      onClick={() => setPreferences({ ...preferences, darkMode: !preferences.darkMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.darkMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      disabled
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={updatePreferences}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
                  <p className="text-sm text-red-600">Irreversible and destructive actions.</p>
                </div>

                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                      <p className="text-sm text-red-600 mt-1">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                    <button
                      onClick={deleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-yellow-900">Admin Warning</h3>
                        <p className="text-sm text-yellow-600 mt-1">
                          As an admin, deleting your account may affect system functionality.
                          Ensure there are other admin users before proceeding.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}