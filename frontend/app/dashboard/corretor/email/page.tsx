'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Inbox,
  Search,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Paperclip,
  Reply,
} from 'lucide-react';
import { toast } from 'sonner';

type EmailItem = {
  id: number;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
};

const EMAILS_DEMO: EmailItem[] = [
  { id: 1, from: 'Unimed SP', subject: 'Confirmação de proposta #2847', preview: 'A proposta empresarial foi aprovada. Segue em anexo o contrato para assinatura...', date: '14:32', read: false, starred: true, hasAttachment: true },
  { id: 2, from: 'Bradesco Saúde', subject: 'Novos planos empresariais 2026', preview: 'Prezado corretor, informamos que a partir de março teremos novos planos com...', date: '12:15', read: false, starred: false, hasAttachment: true },
  { id: 3, from: 'SulAmérica', subject: 'Reajuste anual - Tabelas atualizadas', preview: 'Seguem as novas tabelas de preços vigentes a partir de 01/03/2026...', date: 'Ontem', read: true, starred: false, hasAttachment: true },
  { id: 4, from: 'Cliente João Oliveira', subject: 'RE: Dúvida sobre cobertura', preview: 'Obrigado pela explicação! Vou analisar e retorno amanhã com a decisão...', date: 'Ontem', read: true, starred: false, hasAttachment: false },
  { id: 5, from: 'Humano Saúde', subject: 'Sua comissão de janeiro foi processada', preview: 'Informamos que o pagamento da comissão referente a janeiro/2026 foi...', date: '17/02', read: true, starred: true, hasAttachment: false },
];

export default function CorretorEmailPage() {
  const [emails, setEmails] = useState<EmailItem[]>(EMAILS_DEMO);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'inbox' | 'sent' | 'starred'>('inbox');

  const filteredEmails = emails.filter((e) => {
    if (tab === 'starred') return e.starred;
    return (
      e.from.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
    );
  });

  const unreadCount = emails.filter((e) => !e.read).length;

  const handleMarkRead = (id: number) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  };

  const handleToggleStar = (id: number) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)));
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
      {/* Sidebar de categorias */}
      <div className="w-56 border-r border-white/10 flex flex-col p-3 gap-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 px-3 py-2 mb-2">
          <Mail className="h-5 w-5 text-[#D4AF37]" />
          E-mail
        </h2>

        <button
          onClick={() => setTab('inbox')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            tab === 'inbox' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span className="flex-1 text-left">Caixa de Entrada</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-[#D4AF37] text-black px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            tab === 'sent' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5'
          }`}
        >
          <Send className="h-4 w-4" />
          <span className="flex-1 text-left">Enviados</span>
        </button>

        <button
          onClick={() => setTab('starred')}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            tab === 'starred' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/60 hover:bg-white/5'
          }`}
        >
          <Star className="h-4 w-4" />
          <span className="flex-1 text-left">Favoritos</span>
        </button>
      </div>

      {/* Lista de emails */}
      <div className="w-96 border-r border-white/10 flex flex-col">
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar e-mails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.map((email) => (
            <button
              key={email.id}
              onClick={() => {
                setSelectedEmail(email);
                handleMarkRead(email.id);
              }}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                selectedEmail?.id === email.id ? 'bg-white/10' : ''
              } ${!email.read ? 'bg-white/[0.02]' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleStar(email.id); }}
                  className="shrink-0"
                >
                  <Star
                    className={`h-4 w-4 ${email.starred ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                  />
                </button>
                <span className={`text-sm truncate ${!email.read ? 'font-bold text-white' : 'text-white/70'}`}>
                  {email.from}
                </span>
                <span className="text-[10px] text-white/30 ml-auto shrink-0">{email.date}</span>
              </div>
              <p className={`text-sm truncate ${!email.read ? 'font-semibold text-white/90' : 'text-white/60'}`}>
                {email.subject}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs text-white/40 truncate flex-1">{email.preview}</p>
                {email.hasAttachment && <Paperclip className="h-3 w-3 text-white/30 shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Leitura do email */}
      <div className="flex-1 flex flex-col">
        {!selectedEmail ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Selecione um e-mail para ler</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{selectedEmail.subject}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.info('Responder em breve...')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10"
                >
                  <Reply className="h-4 w-4" /> Responder
                </button>
                <button
                  onClick={() => handleToggleStar(selectedEmail.id)}
                  className="p-1.5 rounded-lg hover:bg-white/5"
                >
                  <Star className={`h-4 w-4 ${selectedEmail.starred ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                {selectedEmail.from.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{selectedEmail.from}</p>
                <p className="text-xs text-white/40">para mim · {selectedEmail.date}</p>
              </div>
            </div>
            <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
              {selectedEmail.preview}
              {'\n\n'}
              Atenciosamente,{'\n'}
              {selectedEmail.from}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
