import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import axios from "axios";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    language: "en",
    theme: "light",
    twoFactor: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    // Apply theme from localStorage
    const theme = localStorage.getItem("theme") || "light";
    applyTheme(theme);
  }, []);

  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem("userSettings", JSON.stringify(settings));
      
      // Apply theme immediately
      applyTheme(settings.theme);

      // Try to save to backend if user exists
      if (user?.id) {
        await axios.post("/api/user/settings", settings);
      }

      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings. Changes saved locally.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/change-password", {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      setError("");
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await axios.delete("/api/user/account");
      alert("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete account");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">User Settings</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950">Settings</h1>
              <p className="mt-2 text-slate-600">Manage your preferences and account settings.</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Back
            </button>
          </div>
        </div>

        {saved && (
          <div className="mb-6 rounded-3xl bg-emerald-50 p-4 text-emerald-700 border border-emerald-200">
            ✓ Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950 mb-6">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Push Notifications</p>
                  <p className="mt-1 text-sm text-slate-500">Receive booking updates and reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange("notifications", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div>
                  <p className="font-semibold text-slate-900">Email Updates</p>
                  <p className="mt-1 text-sm text-slate-500">Receive newsletter and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(e) => handleSettingChange("emailUpdates", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950 mb-6">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange("language", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value)}
                  className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950 mb-6">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                  <p className="mt-1 text-sm text-slate-500">Add an extra layer of security</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactor}
                    onChange={(e) => handleSettingChange("twoFactor", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="rounded-3xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded-3xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-3xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          </div>

          {/* Account Actions */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm mt-8">
            <h2 className="text-2xl font-semibold text-slate-950 mb-6">Account</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full rounded-3xl bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition"
              >
                Delete Account
              </button>
              <button
                onClick={handleLogout}
                className="w-full rounded-3xl bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
            <div className="rounded-3xl bg-white p-8 shadow-xl max-w-md w-full mx-4">
              <h3 className="text-2xl font-semibold text-slate-950 mb-4">Change Password</h3>
              
              {error && (
                <div className="mb-4 rounded-3xl bg-rose-50 p-3 text-rose-600 text-sm border border-rose-200">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full rounded-3xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full rounded-3xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full rounded-3xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
            <div className="rounded-3xl bg-white p-8 shadow-xl max-w-md w-full mx-4">
              <h3 className="text-2xl font-semibold text-rose-600 mb-3">Delete Account</h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete your account? This action cannot be undone. All your bookings and data will be permanently deleted.
              </p>

              {error && (
                <div className="mb-4 rounded-3xl bg-rose-50 p-3 text-rose-600 text-sm border border-rose-200">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
