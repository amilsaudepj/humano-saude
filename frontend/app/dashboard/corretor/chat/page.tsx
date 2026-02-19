'use client';

import { useState } from 'react';
import { MessageSquare, Send, Users, Search, Circle, Phone, Video } from 'lucide-react';

type ChatUser = {
  id: number;
  nome: string;
  cargo: string;
  avatar: string;
  online: boolean;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
};

type Mensagem = {
  id: number;
  de: string;
  texto: string;
  hora: string;
  minha: boolean;
};

const EQUIPE: ChatUser[] = [
  { id: 1, nome: 'Ana Silva', cargo: 'Corretora Sênior', avatar: 'AS', online: true, ultimaMensagem: 'Fechei a proposta do cliente Oliveira!', hora: '14:32', naoLidas: 2 },
  { id: 2, nome: 'Carlos Mendes', cargo: 'Analista Comercial', avatar: 'CM', online: true, ultimaMensagem: 'Preciso dos dados da Unimed SP', hora: '14:15', naoLidas: 0 },
  { id: 3, nome: 'Juliana Costa', cargo: 'Gestora de Ads', avatar: 'JC', online: false, ultimaMensagem: 'Campanha nova ativa amanhã', hora: '13:45', naoLidas: 1 },
  { id: 4, nome: 'Roberto Almeida', cargo: 'Financeiro', avatar: 'RA', online: false, ultimaMensagem: 'Comissões de janeiro prontas', hora: '12:20', naoLidas: 0 },
  { id: 5, nome: 'Maria Fernanda', cargo: 'Atendimento', avatar: 'MF', online: true, ultimaMensagem: 'Cliente pediu reagendamento', hora: '11:50', naoLidas: 0 },
];

const MENSAGENS_DEMO: Mensagem[] = [
  { id: 1, de: 'Ana Silva', texto: 'Oi! Consegui fechar a proposta do cliente Oliveira.', hora: '14:28', minha: false },
  { id: 2, de: 'Você', texto: 'Parabéns! Qual operadora?', hora: '14:30', minha: true },
  { id: 3, de: 'Ana Silva', texto: 'Bradesco Saúde, plano empresarial 50 vidas.', hora: '14:31', minha: false },
  { id: 4, de: 'Ana Silva', texto: 'Já encaminhei a documentação pro financeiro.', hora: '14:32', minha: false },
];

export default function CorretorChatPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(EQUIPE[0]);
  const [search, setSearch] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>(MENSAGENS_DEMO);

  const filteredEquipe = EQUIPE.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.cargo.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = () => {
    if (!newMsg.trim()) return;
    setMensagens((prev) => [
      ...prev,
      { id: Date.now(), de: 'Você', texto: newMsg, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), minha: true },
    ]);
    setNewMsg('');
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
      {/* Lista da equipe */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-blue-400" />
            Chat Equipe
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar colega..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredEquipe.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                selectedUser?.id === user.id ? 'bg-white/10' : ''
              }`}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                  {user.avatar}
                </div>
                <Circle
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 ${
                    user.online ? 'text-green-400 fill-green-400' : 'text-white/20 fill-white/20'
                  }`}
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.nome}</p>
                <p className="text-xs text-white/40 truncate">{user.ultimaMensagem}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/30">{user.hora}</span>
                {user.naoLidas > 0 && (
                  <span className="h-5 min-w-[20px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {user.naoLidas}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área do chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser && (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                    {selectedUser.avatar}
                  </div>
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 ${
                      selectedUser.online ? 'text-green-400 fill-green-400' : 'text-white/20 fill-white/20'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedUser.nome}</p>
                  <p className="text-xs text-white/40">{selectedUser.cargo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-white/40 cursor-pointer hover:text-white/60" />
                <Video className="h-5 w-5 text-white/40 cursor-pointer hover:text-white/60" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map((msg) => (
                <div key={msg.id} className={`flex ${msg.minha ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                      msg.minha
                        ? 'bg-blue-600/30 text-white rounded-br-md'
                        : 'bg-white/10 text-white/90 rounded-bl-md'
                    }`}
                  >
                    {!msg.minha && <p className="text-[10px] text-blue-400 font-medium mb-1">{msg.de}</p>}
                    <p>{msg.texto}</p>
                    <p className="text-[10px] text-white/30 text-right mt-1">{msg.hora}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={handleSend}
                  className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors"
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
