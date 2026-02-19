'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Send, Phone, User, Clock, CheckCheck } from 'lucide-react';
import { getWhatsAppContacts, getWhatsAppMessages, sendWhatsAppMessage, getWhatsAppStats } from '@/app/actions/whatsapp';

export default function CorretorWhatsAppPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([
        getWhatsAppContacts(),
        getWhatsAppStats(),
      ]);
      if (cRes.success) setContacts(cRes.data || []);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedContact) return;
    getWhatsAppMessages(selectedContact).then((res) => {
      if (res.success) setMessages(res.data || []);
    });
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    const res = await sendWhatsAppMessage(selectedContact, newMessage);
    if (res.success) {
      setMessages((prev) => [...prev, { id: Date.now(), text: newMessage, sent: true, timestamp: new Date().toISOString() }]);
      setNewMessage('');
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
      {/* Lista de contatos */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-green-400" />
            WhatsApp
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-white/40 text-sm mt-8">Nenhum contato encontrado</p>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                  selectedContact === contact.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                  <p className="text-xs text-white/50 truncate">{contact.lastMessage || contact.phone}</p>
                </div>
                {contact.unread > 0 && (
                  <span className="h-5 min-w-[20px] rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Selecione um contato para iniciar</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {contacts.find((c) => c.id === selectedContact)?.name || 'Contato'}
                  </p>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
              <Phone className="h-5 w-5 text-white/40 cursor-pointer hover:text-white/60" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                      msg.sent
                        ? 'bg-green-600/30 text-white rounded-br-md'
                        : 'bg-white/10 text-white/90 rounded-bl-md'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Clock className="h-3 w-3 text-white/30" />
                      <span className="text-[10px] text-white/30">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sent && <CheckCheck className="h-3 w-3 text-blue-400" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-green-500/50"
                />
                <button
                  onClick={handleSend}
                  className="h-11 w-11 rounded-xl bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
