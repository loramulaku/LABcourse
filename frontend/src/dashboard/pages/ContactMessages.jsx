import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/header/ui/button/Button";
import { API_URL } from "../../api";

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyForm, setReplyForm] = useState({
    content: "",
    attachment: null
  });
  const [forwardForm, setForwardForm] = useState({
    email: "",
    subject: "",
    message: ""
  });
  const [redirectForm, setRedirectForm] = useState({
    recipientType: "", // "doctor" or "laboratory"
    redirectToUserId: "",
    redirectReason: ""
  });
  const [doctors, setDoctors] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    loadMessages();
    loadDoctorsAndLabs();
  }, []);

  const loadDoctorsAndLabs = async () => {
    try {
      const [doctorsRes, labsRes] = await Promise.all([
        fetch(`${API_URL}/api/doctors`),
        fetch(`${API_URL}/api/laboratories`)
      ]);
      const doctorsData = await doctorsRes.json();
      const labsData = await labsRes.json();
      setDoctors(doctorsData || []);
      setLaboratories(labsData || []);
    } catch (error) {
      console.error("Error loading doctors and labs:", error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') || '1'; // Fallback to admin user ID 1
      const response = await fetch(`${API_URL}/api/contact/messages?userId=${userId}&role=admin`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      alert('Failed to load messages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    setReplying(true);

    try {
      const formData = new FormData();
      formData.append('content', replyForm.content);
      formData.append('senderId', localStorage.getItem('userId'));
      if (replyForm.attachment) {
        formData.append('attachment', replyForm.attachment);
      }

      const response = await fetch(`${API_URL}/api/contact/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Reply sent successfully');
        setReplyForm({ content: "", attachment: null });
        setSelectedMessage(null);
        loadMessages();
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleForward = async (e) => {
    e.preventDefault();
    setForwarding(true);

    try {
      const response = await fetch(`${API_URL}/api/contact/messages/${selectedMessage.id}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(forwardForm)
      });

      if (response.ok) {
        alert('Message forwarded successfully');
        setForwardForm({ email: "", subject: "", message: "" });
        setSelectedMessage(null);
      } else {
        alert('Failed to forward message');
      }
    } catch (error) {
      console.error("Error forwarding message:", error);
      alert('Failed to forward message');
    } finally {
      setForwarding(false);
    }
  };

  const handleRedirect = async (e) => {
    e.preventDefault();
    setRedirecting(true);

    try {
      const response = await fetch(`${API_URL}/api/contact/redirect-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          redirectToUserId: redirectForm.redirectToUserId,
          redirectReason: redirectForm.redirectReason,
          adminId: localStorage.getItem('userId')
        })
      });

      if (response.ok) {
        alert('Message redirected successfully');
        setRedirectForm({ recipientType: "", redirectToUserId: "", redirectReason: "" });
        setSelectedMessage(null);
        loadMessages();
      } else {
        alert('Failed to redirect message');
      }
    } catch (error) {
      console.error("Error redirecting message:", error);
      alert('Failed to redirect message');
    } finally {
      setRedirecting(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`${API_URL}/api/contact/messages/${messageId}/read`, {
        method: 'PUT'
      });
      loadMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <PageMeta title="Contact Messages" description="Manage contact messages" />
        <PageBreadcrumb pageTitle="Contact Messages" />
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-0 space-y-8">
      <PageMeta title="Contact Messages" description="Manage contact messages" />
      <PageBreadcrumb pageTitle="Contact Messages" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Messages List */}
        <div className="xl:col-span-1">
          <ComponentCard title="📨 Incoming Messages" desc="View and manage contact messages">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg">No messages found</p>
                  <p className="text-gray-400 text-sm mt-2">New contact messages will appear here</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      message.is_read 
                        ? 'bg-white border-gray-200 hover:border-gray-300' 
                        : 'bg-blue-50 border-blue-300 hover:border-blue-400 shadow-sm'
                    } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.is_read) {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {message.sender_name || 'Unknown Sender'}
                          </h3>
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {message.sender_email}
                        </p>
                        <p className="text-sm font-medium text-gray-800 truncate mb-2">
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Message Details & Actions */}
        <div className="xl:col-span-2">
          <ComponentCard title="💬 Message Details" desc="View message and take actions">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Message Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedMessage.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">From:</span>
                          <span>{selectedMessage.sender_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Email:</span>
                          <span className="text-blue-600">{selectedMessage.sender_email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(selectedMessage.created_at)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!selectedMessage.is_read && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-gray-50 p-6 rounded-xl border">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.content}
                  </p>
                  {selectedMessage.attachment_path && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={`${API_URL}/uploads/${selectedMessage.attachment_path.split('uploads/')[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        📎 View Attachment
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Tabs */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      <button
                        className="flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                      >
                        💬 Reply
                      </button>
                      <button
                        className="flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          // Switch to redirect tab
                          document.querySelector('[data-tab="redirect"]').click();
                        }}
                      >
                        🔄 Redirect
                      </button>
                      <button
                        className="flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          // Switch to forward tab
                          document.querySelector('[data-tab="forward"]').click();
                        }}
                      >
                        📧 Forward
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Reply Form */}
                    <form onSubmit={handleReply} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reply Message
                        </label>
                        <textarea
                          value={replyForm.content}
                          onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                          placeholder="Type your reply here..."
                          rows="4"
                          required
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachment (Optional)
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setReplyForm({ ...replyForm, attachment: e.target.files[0] })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={replying}
                        className="w-full"
                      >
                        {replying ? "Sending Reply..." : "Send Reply"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Redirect Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    🔄 Redirect Message
                  </h4>
                  <form onSubmit={handleRedirect} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose Recipient Type
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="recipientType"
                            value="doctor"
                            checked={redirectForm.recipientType === "doctor"}
                            onChange={(e) => setRedirectForm({ 
                              ...redirectForm, 
                              recipientType: e.target.value,
                              redirectToUserId: "" // Reset selection when type changes
                            })}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">👨‍⚕️ Doctor</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="recipientType"
                            value="laboratory"
                            checked={redirectForm.recipientType === "laboratory"}
                            onChange={(e) => setRedirectForm({ 
                              ...redirectForm, 
                              recipientType: e.target.value,
                              redirectToUserId: "" // Reset selection when type changes
                            })}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">🧪 Laboratory</span>
                        </label>
                      </div>
                    </div>

                    {redirectForm.recipientType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select {redirectForm.recipientType === "doctor" ? "Doctor" : "Laboratory"}
                        </label>
                        <select
                          value={redirectForm.redirectToUserId}
                          onChange={(e) => setRedirectForm({ ...redirectForm, redirectToUserId: e.target.value })}
                          required
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="">Choose a {redirectForm.recipientType === "doctor" ? "doctor" : "laboratory"}...</option>
                          {redirectForm.recipientType === "doctor" ? (
                            doctors.map(doctor => (
                              <option key={`doctor-${doctor.id}`} value={doctor.user_id}>
                                Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                              </option>
                            ))
                          ) : (
                            laboratories.map(lab => (
                              <option key={`lab-${lab.id}`} value={lab.user_id}>
                                {lab.name} - {lab.address}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Redirect (Optional)
                      </label>
                      <textarea
                        value={redirectForm.redirectReason}
                        onChange={(e) => setRedirectForm({ ...redirectForm, redirectReason: e.target.value })}
                        placeholder="Explain why you're redirecting this message..."
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={redirecting || !redirectForm.recipientType || !redirectForm.redirectToUserId}
                      className="w-full"
                    >
                      {redirecting ? "Redirecting..." : "Redirect Message"}
                    </Button>
                  </form>
                </div>

                {/* Forward Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📧 Forward to Email
                  </h4>
                  <form onSubmit={handleForward} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        value={forwardForm.email}
                        onChange={(e) => setForwardForm({ ...forwardForm, email: e.target.value })}
                        placeholder="Enter email address"
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject (Optional)
                      </label>
                      <input
                        type="text"
                        value={forwardForm.subject}
                        onChange={(e) => setForwardForm({ ...forwardForm, subject: e.target.value })}
                        placeholder="Enter email subject"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Message (Optional)
                      </label>
                      <textarea
                        value={forwardForm.message}
                        onChange={(e) => setForwardForm({ ...forwardForm, message: e.target.value })}
                        placeholder="Add any additional message..."
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={forwarding}
                      className="w-full"
                    >
                      {forwarding ? "Forwarding..." : "Forward to Email"}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-lg font-medium">Select a message to view details</p>
                <p className="text-gray-400 text-sm mt-2">Choose a message from the list to see its content and take actions</p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
