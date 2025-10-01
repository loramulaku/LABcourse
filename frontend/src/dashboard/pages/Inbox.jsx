import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Button from "../components/header/ui/button/Button";
import { API_URL } from "../../api";

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyForm, setReplyForm] = useState({
    content: "",
    attachment: null
  });
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('role');
      const response = await fetch(`${API_URL}/api/contact/messages?userId=${userId}&role=${role}`);
      const data = await response.json();
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
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
        <PageMeta title="Inbox" description="View your messages" />
        <PageBreadcrumb pageTitle="Inbox" />
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
      <PageMeta title="Inbox" description="View your messages" />
      <PageBreadcrumb pageTitle="Inbox" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Messages List */}
        <ComponentCard title="Your Messages" desc="View and manage your messages">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages found.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {message.sender_name || 'Unknown Sender'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {message.sender_email}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    {!message.is_read && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ComponentCard>

        {/* Message Details & Reply */}
        <ComponentCard title="Message Details" desc="View message and reply">
          {selectedMessage ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedMessage.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  From: {selectedMessage.sender_name} ({selectedMessage.sender_email})
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(selectedMessage.created_at)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
                {selectedMessage.attachment_path && (
                  <div className="mt-4">
                    <a
                      href={`${API_URL}/uploads/${selectedMessage.attachment_path.split('uploads/')[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📎 View Attachment
                    </a>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleReply} className="space-y-4">
                <h4 className="font-medium text-gray-900">Reply to Message</h4>
                <textarea
                  value={replyForm.content}
                  onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                  placeholder="Type your reply here..."
                  rows="4"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="file"
                  onChange={(e) => setReplyForm({ ...replyForm, attachment: e.target.files[0] })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={replying}
                >
                  {replying ? "Sending..." : "Send Reply"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a message to view details</p>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}

