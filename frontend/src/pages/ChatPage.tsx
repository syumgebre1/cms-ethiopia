import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { useSocket } from '../context/useSocket';
import { messageApi, type Message, type Contact } from '../services/api';

const API_BASE = 'http://localhost:5000';

export default function ChatPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Contact | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typing = useRef(false);

  const loadMessages = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await messageApi.getMessages(id);
      setMessages(res.data.messages);
      setOtherUser(res.data.conversation.other_user);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('conversation:join', { conversationId: id });

    const handleNewMessage = (msg: Message) => {
      if (msg.conversation_id !== id) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleDeleted = ({ id: deletedId }: { id: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === deletedId
            ? {
                ...m,
                is_deleted: true,
                body: t('messages.message_deleted'),
                attachment_url: null,
              }
            : m
        )
      );
    };

    const handleTypingStart = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === id && userId !== user?.id) setOtherTyping(true);
    };

    const handleTypingStop = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      if (conversationId === id) setOtherTyping(false);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.emit('conversation:leave', { conversationId: id });
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, id, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleTyping = (value: string) => {
    setBody(value);
    if (!socket || !id) return;

    if (!typing.current) {
      typing.current = true;
      socket.emit('typing:start', { conversationId: id });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typing.current = false;
      socket.emit('typing:stop', { conversationId: id });
    }, 1500);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !id || sending) return;

    const content = body.trim();
    setBody('');
    typing.current = false;
    if (socket) socket.emit('typing:stop', { conversationId: id });

    try {
      setSending(true);
      await messageApi.sendMessage(id, content);
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_send'));
      setBody(content);
    } finally {
      setSending(false);
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploading(true);
      setError('');
      await messageApi.sendAttachment(id, file, body.trim() || undefined);
      setBody('');
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_upload'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messageApi.deleteMessage(msgId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                is_deleted: true,
                body: t('messages.message_deleted'),
                attachment_url: null,
              }
            : m
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || t('messages.failed_to_delete'));
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('messages.today');
    if (d.toDateString() === yesterday.toDateString())
      return t('messages.yesterday');
    return d.toLocaleDateString();
  };

  const renderAttachment = (msg: Message) => {
    if (!msg.attachment_url) return null;
    const url = `${API_BASE}${msg.attachment_url}`;
    const isImage = msg.attachment_type?.startsWith('image/');

    if (isImage) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block mt-1">
          <img
            src={url}
            alt={msg.attachment_name || 'image'}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
          />
        </a>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        download={msg.attachment_name}
        className="flex items-center gap-2 mt-1 p-2 bg-base-200 rounded-lg hover:bg-base-300 transition"
      >
        <span className="text-xl">📄</span>
        <span className="text-sm underline">
          {msg.attachment_name || 'Download'}
        </span>
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <div className="flex-1 flex flex-col">
        <header className="bg-base-100 border-b border-base-300 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => navigate('/messages')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold relative">
            {otherUser?.full_name?.charAt(0).toUpperCase() || '?'}
            {otherUser?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-base-100"></span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {otherUser?.full_name || t('messages.loading')}
            </p>
            <p className="text-xs text-base-content/60">
              {otherTyping
                ? t('messages.typing')
                : otherUser?.is_online
                ? t('messages.online')
                : t('messages.offline')}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-2">
          {error && (
            <div className="alert alert-error text-sm mb-4">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="btn btn-ghost btn-xs"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">👋</p>
              <p className="text-base-content/60">{t('messages.say_hello')}</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                const showDate =
                  idx === 0 ||
                  formatDate(msg.createdAt) !==
                    formatDate(messages[idx - 1].createdAt);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="badge badge-ghost badge-sm">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`chat ${
                        isMine ? 'chat-end' : 'chat-start'
                      }`}
                    >
                      <div className="chat-header text-xs opacity-60 mb-1">
                        {isMine ? t('messages.you') : msg.sender?.full_name || 'User'}
                        <time className="ml-2">{formatTime(msg.createdAt)}</time>
                      </div>
                      <div
                        className={`chat-bubble ${
                          isMine ? 'chat-bubble-primary' : ''
                        } ${msg.is_deleted ? 'italic opacity-60' : ''} group relative`}
                      >
                        {msg.body && <p>{msg.body}</p>}
                        {!msg.is_deleted && renderAttachment(msg)}

                        {isMine && !msg.is_deleted && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-error text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {isMine && !msg.is_deleted && (
                        <div className="chat-footer text-xs opacity-50 mt-1">
                          {msg.is_read
                            ? `✓✓ ${t('messages.read')}`
                            : `✓ ${t('messages.sent')}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {otherTyping && (
                <div className="chat chat-start">
                  <div className="chat-bubble">
                    <span className="loading loading-dots loading-sm"></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </main>

        <form
          onSubmit={handleSend}
          className="bg-base-100 border-t border-base-300 p-3 flex gap-2 items-center"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilePick}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-ghost btn-circle"
            title={t('messages.attach_file')}
          >
            {uploading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              '📎'
            )}
          </button>
          <input
            type="text"
            value={body}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={t('messages.type_message')}
            className="input input-bordered flex-1"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="btn btn-primary"
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              t('messages.send')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}