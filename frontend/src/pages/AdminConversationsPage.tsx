import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adminApi, type AuditConversation, type Message } from '../services/api';

export default function AdminConversationsPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<AuditConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Selected conversation
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{
    user1: { full_name: string; email: string };
    user2: { full_name: string; email: string };
  } | null>(null);

  const loadConversations = async (q?: string) => {
    try {
      setLoading(true);
      const res = await adminApi.listAllConversations(q);
      setConversations(res.data.conversations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadConversations(search);
  };

  const openConversation = async (id: string) => {
    setSelected(id);
    setMessagesLoading(true);
    try {
      const res = await adminApi.getConversationMessages(id);
      setMessages(res.data.messages);
      setSelectedInfo({
        user1: res.data.conversation.user1,
        user2: res.data.conversation.user2,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-error';
      case 'detective':
        return 'badge-info';
      case 'officer':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <Sidebar activeItem="audit" />

      <div className="flex-1 min-w-0">
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">Conversation Audit</h1>
            <p className="text-xs text-base-content/60">
              Read-only access to all system conversations
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input input-bordered input-sm w-64"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>
        </header>

        <main className="p-4 lg:p-6">
          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Conversation list */}
            <div className="card bg-base-100 shadow-sm lg:col-span-2 max-h-[75vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-base-content/60">
                    No conversations found.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-base-300">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => openConversation(c.id)}
                        className={`w-full p-3 hover:bg-base-200 transition text-left ${
                          selected === c.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`badge badge-xs capitalize ${roleColor(
                              c.user1.role
                            )}`}
                          >
                            {c.user1.full_name}
                          </span>
                          <span className="text-xs">↔</span>
                          <span
                            className={`badge badge-xs capitalize ${roleColor(
                              c.user2.role
                            )}`}
                          >
                            {c.user2.full_name}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/60 truncate">
                          {c.last_message?.body ||
                            c.last_message?.attachment_name ||
                            'No messages'}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-base-content/50">
                            {c.message_count} message
                            {c.message_count !== 1 ? 's' : ''}
                          </span>
                          {c.last_message_at && (
                            <span className="text-xs text-base-content/50">
                              {new Date(
                                c.last_message_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Message viewer */}
            <div className="card bg-base-100 shadow-sm lg:col-span-3 flex flex-col max-h-[75vh]">
              {!selected ? (
                <div className="text-center py-24">
                  <p className="text-5xl mb-3">🔍</p>
                  <p className="text-base-content/60">
                    Select a conversation to view
                  </p>
                  <p className="text-xs text-base-content/40 mt-2">
                    Admin audit access
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-3 border-b border-base-300 bg-warning/10">
                    <p className="text-xs text-warning-content font-medium">
                      ⚠️ Audit Mode — Read only
                    </p>
                    {selectedInfo && (
                      <p className="text-sm font-medium mt-1">
                        {selectedInfo.user1.full_name} ↔{' '}
                        {selectedInfo.user2.full_name}
                      </p>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-base-content/60 py-8">
                        No messages in this conversation.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <div className="flex gap-2 items-baseline">
                            <span className="font-semibold text-xs">
                              {msg.sender?.full_name || 'Unknown'}:
                            </span>
                            <span className="text-xs text-base-content/50">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p
                            className={`ml-4 mt-1 ${
                              msg.is_deleted
                                ? 'italic text-base-content/40'
                                : ''
                            }`}
                          >
                            {msg.is_deleted
                              ? 'This message was deleted'
                              : msg.body}
                          </p>
                          {msg.attachment_url && !msg.is_deleted && (
                            <a
                              href={`http://localhost:5000${msg.attachment_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-4 text-xs link link-primary"
                            >
                              📎 {msg.attachment_name || 'Attachment'}
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}