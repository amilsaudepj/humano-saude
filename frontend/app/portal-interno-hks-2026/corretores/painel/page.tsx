'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    Edit2,
    Trash2,
    UserX,
    UserCheck,
    Eye,
    X,
    Mail,
    Phone,
    Shield,
    Briefcase,
    Calendar,
    DollarSign,
    MoreVertical,
    RefreshCw,
    Download,
    CheckCircle,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getCorretores,
    getCorretoresStats,
    updateCorretor,
    toggleStatusCorretor,
    deleteCorretor,
    type Corretor,
    type UpdateCorretorData,
} from '@/app/actions/corretores';
import { toast } from 'sonner';

// ─── Modal de Edição ────────────────────────────────────
function EditModal({
    corretor,
    onClose,
    onSave,
}: {
    corretor: Corretor;
    onClose: () => void;
    onSave: (id: string, dados: UpdateCorretorData) => void;
}) {
    const [formData, setFormData] = useState<UpdateCorretorData>({
        nome: corretor.nome,
        email: corretor.email,
        cpf: corretor.cpf || '',
        telefone: corretor.telefone || '',
        whatsapp: corretor.whatsapp || '',
        susep: corretor.susep || '',
        role: corretor.role,
        comissao_padrao_pct: corretor.comissao_padrao_pct || 100,
    });

    const handleSubmit = () => {
        if (!formData.nome?.trim() || !formData.email?.trim()) {
            toast.error('Nome e e-mail são obrigatórios');
            return;
        }
        if (!formData.whatsapp?.trim()) {
            toast.error('WhatsApp é obrigatório');
            return;
        }
        onSave(corretor.id, formData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Editar Corretor</h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">Nome Completo *</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">CPF</label>
                            <input
                                type="text"
                                value={formData.cpf || ''}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">E-mail *</label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">Telefone</label>
                            <input
                                type="text"
                                value={formData.telefone || ''}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">WhatsApp *</label>
                            <input
                                type="text"
                                value={formData.whatsapp || ''}
                                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                placeholder="(00) 00000-0000"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">SUSEP</label>
                            <input
                                type="text"
                                value={formData.susep || ''}
                                onChange={(e) => setFormData({ ...formData, susep: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">Função</label>
                            <select
                                value={formData.role || 'corretor'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                            >
                                <option value="corretor">Corretor</option>
                                <option value="assistente">Assistente</option>
                                <option value="gestor_trafego">Gestor de Tráfego</option>
                                <option value="administrador">Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1.5 block font-medium">Tipo de Comissão</label>
                            <select
                                value={formData.comissao_padrao_pct || 100}
                                onChange={(e) => setFormData({ ...formData, comissao_padrao_pct: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                            >
                                <option value="100">Interno</option>
                                <option value="75">Externo</option>
                                <option value="50">Personalizado 1</option>
                                <option value="25">Personalizado 2</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm font-medium hover:text-white hover:bg-white/10 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-sm font-bold hover:shadow-lg transition-all"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Modal de Detalhes ──────────────────────────────────
function DetalhesModal({ corretor, onClose }: { corretor: Corretor; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-white">{corretor.nome}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                                corretor.role === 'administrador' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : corretor.role === 'gestor_trafego' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : corretor.role === 'assistente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            )}>
                                {corretor.role === 'gestor_trafego' ? 'GESTOR DE TRÁFEGO'
                                    : corretor.role === 'administrador' ? 'ADMINISTRADOR'
                                        : corretor.role === 'assistente' ? 'ASSISTENTE'
                                            : 'CORRETOR'}
                            </span>
                            <span className={cn(
                                'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                                corretor.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20',
                            )}>
                                {corretor.ativo ? 'ATIVO' : 'INATIVO'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Dados */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">E-mail</span>
                            <p className="text-sm text-white flex items-center gap-2">
                                <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                <span className="truncate">{corretor.email}</span>
                            </p>
                        </div>
                        {corretor.telefone && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Telefone</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                    {corretor.telefone}
                                </p>
                            </div>
                        )}
                        <div className="bg-white/[0.03] rounded-xl p-3 sm:col-span-2">
                            <span className="text-xs text-white/40 uppercase block mb-1">Status do e-mail</span>
                            <p className={cn(
                                'text-sm flex items-center gap-2',
                                corretor.email_confirmado_em ? 'text-green-400' : 'text-amber-400',
                            )}>
                                {corretor.email_confirmado_em ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 shrink-0" />
                                        Confirmado em {new Date(corretor.email_confirmado_em).toLocaleString('pt-BR')}
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        E-mail não confirmado
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {corretor.cpf && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">CPF</span>
                                <p className="text-sm text-white">{corretor.cpf}</p>
                            </div>
                        )}
                        {corretor.susep && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">SUSEP</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-[#D4AF37]" />
                                    {corretor.susep}
                                </p>
                            </div>
                        )}
                        {corretor.data_admissao && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Data Admissão</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#D4AF37]" />
                                    {new Date(corretor.data_admissao).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-xs text-white/40 uppercase block mb-1">Tipo de Comissão</span>
                        <p className="text-sm text-white flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            {corretor.comissao_padrao_pct === 100 ? 'Interno'
                                : corretor.comissao_padrao_pct === 75 ? 'Externo'
                                    : corretor.comissao_padrao_pct === 50 ? 'Personalizado 1'
                                        : corretor.comissao_padrao_pct === 25 ? 'Personalizado 2'
                                            : `${corretor.comissao_padrao_pct}%`}
                        </p>
                    </div>

                    {corretor.whatsapp && (
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">WhatsApp</span>
                            <p className="text-sm text-white">{corretor.whatsapp}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">Cadastrado em</span>
                            <p className="text-sm text-white">{new Date(corretor.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">Última Atualização</span>
                            <p className="text-sm text-white">{new Date(corretor.updated_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] rounded-xl p-3">
                        <span className="text-xs text-white/40 uppercase block mb-2">ID do Corretor</span>
                        <p className="text-xs text-white/60 font-mono break-all">{corretor.id}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Página Principal ──────────────────────────────────
export default function PainelCorretoresPage() {
    const [corretores, setCorretores] = useState<Corretor[]>([]);
    const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, administradores: 0 });
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
    const [filtroRole, setFiltroRole] = useState<string>('');
    const [busca, setBusca] = useState('');
    const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
    const [editingCorretor, setEditingCorretor] = useState<Corretor | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCorretores = useCallback(async () => {
        setLoading(true);
        const filtros: { ativo?: boolean; role?: string; busca?: string } = {};
        if (filtroStatus === 'ativo') filtros.ativo = true;
        if (filtroStatus === 'inativo') filtros.ativo = false;
        if (filtroRole) filtros.role = filtroRole;
        if (busca) filtros.busca = busca;

        const result = await getCorretores(filtros);
        if (result.success) {
            setCorretores(result.data);
        }
        setLoading(false);
    }, [filtroStatus, filtroRole, busca]);

    const fetchStats = useCallback(async () => {
        const result = await getCorretoresStats();
        if (result.success) {
            setStats(result.data);
        }
    }, []);

    useEffect(() => {
        fetchCorretores();
        fetchStats();
    }, [fetchCorretores, fetchStats]);

    const handleSave = async (id: string, dados: UpdateCorretorData) => {
        setActionLoading(id);
        const result = await updateCorretor(id, dados);
        if (result.success) {
            toast.success('Corretor atualizado com sucesso!');
            setEditingCorretor(null);
            fetchCorretores();
            fetchStats();
        } else {
            toast.error(result.error || 'Erro ao atualizar');
        }
        setActionLoading(null);
    };

    const handleToggleStatus = async (id: string, ativo: boolean) => {
        setActionLoading(id);
        const result = await toggleStatusCorretor(id, ativo);
        if (result.success) {
            toast.success(ativo ? 'Corretor ativado' : 'Corretor suspenso');
            fetchCorretores();
            fetchStats();
        } else {
            toast.error(result.error || 'Erro ao alterar status');
        }
        setActionLoading(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este corretor? Esta ação não pode ser desfeita.')) return;
        setActionLoading(id);
        const result = await deleteCorretor(id, false);
        if (result.success) {
            toast.success('Corretor excluído');
            fetchCorretores();
            fetchStats();
        } else {
            toast.error(result.error || 'Erro ao excluir');
        }
        setActionLoading(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#D4AF37]" />
                        Painel de Corretores
                    </h1>
                    <p className="text-sm text-white/40 mt-1">Visualize, edite e gerencie todos os corretores cadastrados</p>
                </div>
                <button
                    onClick={() => { fetchCorretores(); fetchStats(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <p className="text-xs text-white/30 uppercase mb-1">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <p className="text-xs text-white/30 uppercase mb-1">Ativos</p>
                    <p className="text-2xl font-bold text-green-400">{stats.ativos}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <p className="text-xs text-white/30 uppercase mb-1">Inativos</p>
                    <p className="text-2xl font-bold text-red-400">{stats.inativos}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <p className="text-xs text-white/30 uppercase mb-1">Administradores</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">{stats.administradores}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFiltroStatus('todos')}
                        className={cn(
                            'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                            filtroStatus === 'todos'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                                : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent',
                        )}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFiltroStatus('ativo')}
                        className={cn(
                            'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                            filtroStatus === 'ativo'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                                : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent',
                        )}
                    >
                        ✅ Ativos
                    </button>
                    <button
                        onClick={() => setFiltroStatus('inativo')}
                        className={cn(
                            'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                            filtroStatus === 'inativo'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                                : 'bg-white/5 text-white/50 hover:text-white/70 border border-transparent',
                        )}
                    >
                        ❌ Inativos
                    </button>
                </div>

                <select
                    value={filtroRole}
                    onChange={(e) => setFiltroRole(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/30"
                >
                    <option value="">Todas as Funções</option>
                    <option value="corretor">Corretor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                </select>

                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, e-mail ou CPF..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30"
                    />
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse" />
                    ))}
                </div>
            ) : corretores.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-white/20">
                    <Users className="h-10 w-10 mb-3" />
                    <p className="text-sm">Nenhum corretor encontrado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {corretores.map((corretor, index) => (
                        <motion.div
                            key={corretor.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                                'flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm hover:border-white/15 transition-all',
                                corretor.ativo ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-red-500/[0.02] border-red-500/10',
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    'h-10 w-10 rounded-xl flex items-center justify-center',
                                    corretor.ativo ? 'bg-[#D4AF37]/10' : 'bg-red-500/10',
                                )}>
                                    {corretor.ativo ? (
                                        <UserCheck className="h-5 w-5 text-[#D4AF37]" />
                                    ) : (
                                        <UserX className="h-5 w-5 text-red-400" />
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-white">{corretor.nome}</p>
                                        <span className={cn(
                                            'text-[11px] font-bold px-1.5 py-0.5 rounded',
                                            corretor.role === 'administrador' ? 'bg-red-500/10 text-red-400'
                                                : corretor.role === 'gestor_trafego' ? 'bg-blue-500/10 text-blue-400'
                                                    : corretor.role === 'assistente' ? 'bg-yellow-500/10 text-yellow-400'
                                                        : 'bg-purple-500/10 text-purple-400',
                                        )}>
                                            {corretor.role === 'gestor_trafego' ? 'TRÁFEGO'
                                                : corretor.role === 'administrador' ? 'ADMIN'
                                                    : corretor.role === 'assistente' ? 'ASSISTENTE'
                                                        : 'CORRETOR'}
                                        </span>
                                        {corretor.susep && (
                                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                                                <Shield className="h-2.5 w-2.5" />
                                                SUSEP
                                            </span>
                                        )}
                                        <span className={cn(
                                            'text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1',
                                            corretor.email_confirmado_em ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400',
                                        )}>
                                            <Mail className="h-2.5 w-2.5" />
                                            {corretor.email_confirmado_em ? 'E-mail confirmado' : 'E-mail não confirmado'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-white/40 flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {corretor.email}
                                        </span>
                                        {corretor.telefone && (
                                            <span className="text-sm text-white/30 flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {corretor.telefone}
                                            </span>
                                        )}
                                        <span className="text-sm text-white/20">
                                            {new Date(corretor.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'text-xs font-bold px-2 py-0.5 rounded-full border',
                                    corretor.ativo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20',
                                )}>
                                    {corretor.ativo ? 'ATIVO' : 'INATIVO'}
                                </span>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setSelectedCorretor(corretor)}
                                        className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        title="Ver detalhes"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingCorretor(corretor)}
                                        className="h-8 w-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
                                        title="Editar"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(corretor.id, !corretor.ativo)}
                                        disabled={actionLoading === corretor.id}
                                        className={cn(
                                            'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                                            corretor.ativo
                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
                                        )}
                                        title={corretor.ativo ? 'Suspender' : 'Ativar'}
                                    >
                                        {actionLoading === corretor.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : corretor.ativo ? (
                                            <UserX className="h-4 w-4" />
                                        ) : (
                                            <UserCheck className="h-4 w-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(corretor.id)}
                                        disabled={actionLoading === corretor.id}
                                        className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedCorretor && (
                    <DetalhesModal corretor={selectedCorretor} onClose={() => setSelectedCorretor(null)} />
                )}
                {editingCorretor && (
                    <EditModal
                        corretor={editingCorretor}
                        onClose={() => setEditingCorretor(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
