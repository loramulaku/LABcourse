import React, { useState, useEffect } from "react";
import apiFetch, { API_URL } from "../../api";

export default function AdminMessaging() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messageForm, setMessageForm] = useState({
    subject: "",
    content: "",
    message_type: "individual",
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`${API_URL}/api/users`);
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    if (messageForm.message_type === "broadcast") {
      return; // Don't allow individual selection for broadcast
    }

    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleMessageTypeChange = (type) => {
    setMessageForm((prev) => ({ ...prev, message_type: type }));
    if (type === "broadcast") {
      setSelectedUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      messageForm.message_type === "individual" &&
      selectedUsers.length === 0
    ) {
      alert("Please select at least one user");
      return;
    }

    if (!messageForm.subject.trim() || !messageForm.content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("subject", messageForm.subject);
      formData.append("content", messageForm.content);
      formData.append("message_type", messageForm.message_type);

      if (messageForm.message_type === "individual") {
        selectedUsers.forEach((userId) => {
          formData.append("recipient_ids", userId);
        });
      }

      await apiFetch(`${API_URL}/api/notifications/send-message`, {
        method: "POST",
        body: formData,
      });

      alert(
        `Message sent successfully to ${messageForm.message_type === "broadcast" ? "all users" : selectedUsers.length + " user(s)"}`,
      );

      // Reset form
      setMessageForm({
        subject: "",
        content: "",
        message_type: "individual",
      });
      setSelectedUsers([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Send Message
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Send messages or notifications to users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Form */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Message Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="message_type"
                      value="individual"
                      checked={messageForm.message_type === "individual"}
                      onChange={(e) => handleMessageTypeChange(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-foreground">Individual Message</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="message_type"
                      value="broadcast"
                      checked={messageForm.message_type === "broadcast"}
                      onChange={(e) => handleMessageTypeChange(e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-foreground">
                      Broadcast to All Users
                    </span>
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter message subject"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message Content
                </label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) =>
                    setMessageForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={6}
                  placeholder="Enter your message..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-300 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>

        {/* User Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {messageForm.message_type === "broadcast"
                ? "Broadcast Message"
                : "Select Users"}
            </h3>

            {messageForm.message_type === "broadcast" ? (
              <div className="text-center text-muted-foreground py-8">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                  />
                </svg>
                <p>This message will be sent to all users in the system.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="text-center text-muted-foreground py-4">
                    Loading users...
                  </div>
                ) : (
                  users
                    .filter((user) => user.role === "user") // Only show regular users
                    .map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-white/70 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all duration-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-foreground">
                            {user.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </label>
                    ))
                )}

                {selectedUsers.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      {selectedUsers.length} user(s) selected
                    </p>
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
