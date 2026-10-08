import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { messageApi, type ConversationSummary, type Contact } from '../services/api';

export default function MessagesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await messageApi.listConversations();
      setConversations(res.data.conversations);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await messageApi.getContacts();
      setContacts(res.data.contacts);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_load'));
    }
  };

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, []);

  const startChat = async (contactId: string) => {
    try {
      const res = await messageApi.startConversation(contactId);
      navigate(`/messages/${res.data.conversation.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_send'));
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
      <Sidebar activeItem="messages" />

      <div className="flex-1 min-w-0">
        <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold">{t('messages.title')}</h1>
            <p className="text-xs text-base-content/60">
              {t('messages.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="btn btn-primary btn-sm"
          >
            {t('messages.new_chat')}
          </button>
        </header>

        <main className="p-4 lg:p-6">
          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
            </div>
          )}

          {showNewChat && (
            <div className="card bg-base-100 shadow-sm p-4 mb-4">
              <h2 className="font-bold mb-3 text-sm">
                {t('messages.start_new_chat')}
              </h2>
              {contacts.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  {t('messages.no_contacts')}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => startChat(c.id)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-base-200 hover:bg-base-300 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {c.full_name}
                        </p>
                        <span
                          className={`badge badge-xs capitalize ${roleColor(
                            c.role
                          )}`}
                        >
                          {t(`role.${c.role}`)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card bg-base-100 shadow-sm">
            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">💬</p>
                <p className="font-medium">{t('messages.no_conversations')}</p>
                <p className="text-sm text-base-content/60 mt-1">
                  {t('messages.click_new_chat')}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-base-300">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/messages/${c.id}`)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-base-200 transition text-left"
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {c.other_user.full_name.charAt(0).toUpperCase()}
                        </div>
                        {c.other_user.is_online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-base-100"></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium truncate">
                            {c.other_user.full_name}
                          </p>
                          {c.last_message_at && (
                            <span className="text-xs text-base-content/50 ml-2 shrink-0">
                              {new Date(c.last_message_at).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60 truncate">
                          {c.last_message?.is_deleted
                            ? t('messages.message_deleted')
                            : c.last_message?.body ||
                              c.last_message?.attachment_name ||
                              t('messages.no_messages_yet')}
                        </p>
                      </div>

                      {c.unread_count > 0 && (
                        <span className="badge badge-primary badge-sm">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}