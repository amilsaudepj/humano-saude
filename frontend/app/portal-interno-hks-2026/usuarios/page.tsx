'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Search,
    Eye,
    X,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    XCircle,
    User,
    Briefcase,
    Clock,
    RefreshCw,
    Download,
    Filter,
    Users,
    UserCheck,
    UserX,
    AlertCircle,
    AlertTriangle,
    Ban,
    Edit,
    Trash2,
    Key,
    UserCog,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getUsuarios,
    getUsuariosStats,
    suspenderUsuario,
    reativarUsuario,
    atualizarUsuario,
    redefinirSenhaUsuario,
    excluirUsuario,
    reenviarEmailConfirmacao,
    type Usuario,
    type UsuarioStats,
} from '@/app/actions/usuarios';
import { toast } from 'sonner';
import PermissionsSheet from '@/app/components/PermissionsSheet';
import { assignGradeToCorretor, type GradeId } from '@/app/actions/grades';

const GRADE_OPTIONS: { id: GradeId; label: string; color: string }[] = [
    { id: 'interno', label: 'Interno', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    { id: 'externo', label: 'Externo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { id: 'personalizado_1', label: 'Personalizado 1', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    { id: 'personalizado_2', label: 'Personalizado 2', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
];

// ─── Modal de Edição ──────────────────────────────────
function EditarModal({ usuario, onClose, onSave }: { usuario: Usuario; onClose: () => void; onSave: () => void }) {
    const [nome, setNome] = useState(usuario.user_metadata.nome || '');
    const [email, setEmail] = useState(usuario.email);
    const [telefone, setTelefone] = useState(usuario.phone || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const result = await atualizarUsuario(usuario.id, {
            email,
            phone: telefone,
            user_metadata: { ...usuario.user_metadata, nome },
        });

        if (result.success) {
            toast.success('Usuário atualizado com sucesso!');
            onSave();
            onClose();
        } else {
            toast.error(result.error || 'Erro ao atualizar usuário');
        }
        setSaving(false);
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
                className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Edit className="h-5 w-5 text-[#D4AF37]" />
                        Editar Usuário
                    </h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase block mb-2">Nome</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            placeholder="Nome completo"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 uppercase block mb-2">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 uppercase block mb-2">Telefone</label>
                        <input
                            type="tel"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            placeholder="(11) 99999-9999"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.05] text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black hover:bg-[#C4A137] transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Salvar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Modal de Redefinir Senha ─────────────────────────
function RedefinirSenhaModal({ usuario, onClose, onSave }: { usuario: Usuario; onClose: () => void; onSave: () => void }) {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (novaSenha !== confirmarSenha) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (novaSenha.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setSaving(true);
        const result = await redefinirSenhaUsuario(usuario.id, novaSenha);

        if (result.success) {
            toast.success('Senha redefinida com sucesso!');
            onSave();
            onClose();
        } else {
            toast.error(result.error || 'Erro ao redefinir senha');
        }
        setSaving(false);
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
                className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-lg"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-[#D4AF37]" />
                        Redefinir Senha
                    </h3>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-white/60 mb-4">
                    Redefinindo senha para: <span className="text-white font-medium">{usuario.email}</span>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-white/60 uppercase block mb-2">Nova Senha</label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-white/60 uppercase block mb-2">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            placeholder="Digite novamente"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.05] text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black hover:bg-[#C4A137] transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Key className="h-4 w-4" />
                                    Redefinir
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Modal de Confirmação ─────────────────────────────
function ConfirmarModal({
    titulo,
    mensagem,
    icone,
    onConfirm,
    onClose,
}: {
    titulo: string;
    mensagem: string;
    icone: React.ReactNode;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
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
                className="bg-[#0B1215] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md"
            >
                <div className="flex items-center gap-3 mb-4">
                    {icone}
                    <h3 className="text-lg font-bold text-white">{titulo}</h3>
                </div>

                <p className="text-sm text-white/60 mb-6">{mensagem}</p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.05] text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Modal de Detalhes (Expandido) ──────────────────────
function DetalhesModal({ usuario, onClose, onAction }: { usuario: Usuario; onClose: () => void; onAction: () => void }) {
    const [modalAberto, setModalAberto] = useState<'editar' | 'senha' | 'suspender' | 'reativar' | 'excluir' | null>(null);
    const [reenviandoEmail, setReenviandoEmail] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [selectedGrade, setSelectedGrade] = useState<string>(
        usuario.corretor?.grade_comissionamento || 'interno'
    );
    const [savingGrade, setSavingGrade] = useState(false);
    const isSuspenso = usuario.banned_until && new Date(usuario.banned_until) > new Date();

    const handleChangeGrade = async (gradeId: string) => {
        if (!usuario.corretor) return;
        setSavingGrade(true);
        setSelectedGrade(gradeId);
        const result = await assignGradeToCorretor(usuario.corretor.id, gradeId);
        if (result.success) {
            toast.success(`Grade alterada para "${GRADE_OPTIONS.find(g => g.id === gradeId)?.label}"`);
            onAction();
        } else {
            toast.error(result.error || 'Erro ao alterar grade');
        }
        setSavingGrade(false);
    };

    const handleSuspender = async () => {
        const result = await suspenderUsuario(usuario.id);
        if (result.success) {
            toast.success('Usuário suspenso');
            onAction();
            setModalAberto(null);
        } else {
            toast.error(result.error || 'Erro ao suspender');
        }
    };

    const handleReativar = async () => {
        const result = await reativarUsuario(usuario.id);
        if (result.success) {
            toast.success('Usuário reativado');
            onAction();
            setModalAberto(null);
        } else {
            toast.error(result.error || 'Erro ao reativar');
        }
    };

    const handleExcluir = async () => {
        const result = await excluirUsuario(usuario.id);
        if (result.success) {
            toast.success('Usuário excluído');
            onAction();
            setModalAberto(null);
            onClose();
        } else {
            toast.error(result.error || 'Erro ao excluir');
        }
    };

    const handleReenviarEmail = async () => {
        setReenviandoEmail(true);
        const result = await reenviarEmailConfirmacao(usuario.email);
        if (result.success) {
            toast.success('E-mail de confirmação reenviado!');
        } else {
            toast.error(result.error || 'Erro ao reenviar e-mail');
        }
        setReenviandoEmail(false);
    };

    return (
        <>
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
                            <h3 className="text-lg font-bold text-white">{usuario.user_metadata.nome || usuario.email}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {usuario.email_confirmed_at ? (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                                        ✓ E-MAIL CONFIRMADO
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                        ⚠ E-MAIL NÃO CONFIRMADO
                                    </span>
                                )}
                                {isSuspenso && (
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                                        🚫 SUSPENSO
                                    </span>
                                )}
                                {usuario.corretor && (
                                    <span className={cn(
                                        'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                                        usuario.corretor.role === 'administrador' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : usuario.corretor.role === 'gestor_trafego' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : usuario.corretor.role === 'assistente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                                    )}>
                                        {usuario.corretor.role === 'gestor_trafego' ? 'GESTOR DE TRÁFEGO'
                                            : usuario.corretor.role === 'administrador' ? 'ADMINISTRADOR'
                                                : usuario.corretor.role === 'assistente' ? 'ASSISTENTE'
                                                    : 'CORRETOR'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Dados */}
                    <div className="space-y-3 mb-5">
                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">E-mail</span>
                            <p className="text-sm text-white flex items-center gap-2">
                                <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                <span className="truncate">{usuario.email}</span>
                            </p>
                        </div>

                        {usuario.phone && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Telefone</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                    {usuario.phone}
                                </p>
                            </div>
                        )}

                        <div className="bg-white/[0.03] rounded-xl p-3">
                            <span className="text-xs text-white/40 uppercase block mb-1">Cadastro</span>
                            <p className="text-sm text-white flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>

                        {usuario.ultimo_login && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Último Login</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-green-400 shrink-0" />
                                    {new Date(usuario.ultimo_login).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        )}

                        {usuario.last_sign_in_at && !usuario.ultimo_login && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Último Acesso (Auth)</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                    {new Date(usuario.last_sign_in_at).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        )}

                        {usuario.corretor && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-1">Corretor Vinculado</span>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-[#D4AF37] shrink-0" />
                                    {usuario.corretor.nome}
                                </p>
                            </div>
                        )}

                        {/* Grade de Comissionamento */}
                        {usuario.corretor && (
                            <div className="bg-white/[0.03] rounded-xl p-3">
                                <span className="text-xs text-white/40 uppercase block mb-2">Grade de Comissionamento</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {GRADE_OPTIONS.map((grade) => (
                                        <button
                                            key={grade.id}
                                            onClick={() => handleChangeGrade(grade.id)}
                                            disabled={savingGrade}
                                            className={cn(
                                                'px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
                                                selectedGrade === grade.id
                                                    ? cn(grade.color, 'ring-1 ring-white/20')
                                                    : 'bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/[0.05]',
                                                savingGrade && 'opacity-50 cursor-not-allowed',
                                            )}
                                        >
                                            {selectedGrade === grade.id && <Check className="inline h-3 w-3 mr-1" />}
                                            {grade.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="space-y-2">
                        {/* Permissões RBAC — apenas para corretores vinculados */}
                        {usuario.corretor && (
                            <button
                                onClick={() => setShowPermissions(true)}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] transition-all font-medium"
                            >
                                <Shield className="h-4 w-4" />
                                Ajustar Permissões
                            </button>
                        )}

                        <button
                            onClick={() => setModalAberto('editar')}
                            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white transition-all"
                        >
                            <Edit className="h-4 w-4 text-blue-400" />
                            Editar Usuário
                        </button>

                        <button
                            onClick={() => setModalAberto('senha')}
                            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white transition-all"
                        >
                            <Key className="h-4 w-4 text-yellow-400" />
                            Redefinir Senha
                        </button>

                        {isSuspenso ? (
                            <button
                                onClick={() => setModalAberto('reativar')}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
                            >
                                <UserCheck className="h-4 w-4" />
                                Reativar Usuário
                            </button>
                        ) : (
                            <button
                                onClick={() => setModalAberto('suspender')}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-all"
                            >
                                <Ban className="h-4 w-4" />
                                Suspender Usuário
                            </button>
                        )}

                        {!usuario.email_confirmed_at && (
                            <button
                                onClick={handleReenviarEmail}
                                disabled={reenviandoEmail}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Mail className="h-4 w-4" />
                                {reenviandoEmail ? 'Reenviando...' : 'Reenviar E-mail de Confirmação'}
                            </button>
                        )}

                        <button
                            onClick={() => setModalAberto('excluir')}
                            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir Usuário
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {/* Modais de Ação */}
            <AnimatePresence>
                {modalAberto === 'editar' && (
                    <EditarModal
                        usuario={usuario}
                        onClose={() => setModalAberto(null)}
                        onSave={onAction}
                    />
                )}
                {modalAberto === 'senha' && (
                    <RedefinirSenhaModal
                        usuario={usuario}
                        onClose={() => setModalAberto(null)}
                        onSave={onAction}
                    />
                )}
                {modalAberto === 'suspender' && (
                    <ConfirmarModal
                        titulo="Suspender Usuário"
                        mensagem={`Tem certeza que deseja suspender ${usuario.email}? O usuário não poderá fazer login até ser reativado.`}
                        icone={<Ban className="h-6 w-6 text-orange-400" />}
                        onConfirm={handleSuspender}
                        onClose={() => setModalAberto(null)}
                    />
                )}
                {modalAberto === 'reativar' && (
                    <ConfirmarModal
                        titulo="Reativar Usuário"
                        mensagem={`Tem certeza que deseja reativar ${usuario.email}? O usuário poderá fazer login novamente.`}
                        icone={<UserCheck className="h-6 w-6 text-green-400" />}
                        onConfirm={handleReativar}
                        onClose={() => setModalAberto(null)}
                    />
                )}
                {modalAberto === 'excluir' && (
                    <ConfirmarModal
                        titulo="Excluir Usuário"
                        mensagem={`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente ${usuario.email}? Esta ação NÃO PODE ser desfeita!`}
                        icone={<Trash2 className="h-6 w-6 text-red-400" />}
                        onConfirm={handleExcluir}
                        onClose={() => setModalAberto(null)}
                    />
                )}
            </AnimatePresence>

            {/* Sheet de Permissões RBAC */}
            {usuario.corretor && (
                <PermissionsSheet
                    open={showPermissions}
                    onClose={() => setShowPermissions(false)}
                    corretor={{
                        id: usuario.corretor.id,
                        nome: usuario.corretor.nome,
                        email: usuario.email,
                        role: usuario.corretor.role,
                    }}
                    onSaved={onAction}
                />
            )}
        </>
    );
}

// ─── Página Principal ───────────────────────────────────
export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [stats, setStats] = useState<UsuarioStats>({ total: 0, confirmados: 0, nao_confirmados: 0, com_corretor: 0, sem_corretor: 0, ultimos_7_dias: 0 });
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'todos' | 'confirmado' | 'nao_confirmado'>('todos');
    const [filtroCorretor, setFiltroCorretor] = useState<'todos' | 'com' | 'sem'>('todos');
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
    const [erroConfig, setErroConfig] = useState<string | null>(null);

    const carregarDados = async () => {
        setLoading(true);
        setErroConfig(null);
        const [resUsuarios, resStats] = await Promise.all([
            getUsuarios(),
            getUsuariosStats(),
        ]);

        if (resUsuarios.success && resUsuarios.data) {
            setUsuarios(resUsuarios.data);
        } else {
            const errorMsg = resUsuarios.error || 'Erro ao carregar usuários';
            toast.error(errorMsg);
            if (errorMsg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                setErroConfig(errorMsg);
            }
        }

        if (resStats.success && resStats.data) {
            setStats(resStats.data);
        }

        setLoading(false);
    };

    useEffect(() => {
        carregarDados();
    }, []);

    // Filtragem
    const usuariosFiltrados = usuarios.filter((usuario) => {
        const matchBusca = busca === '' ||
            usuario.email.toLowerCase().includes(busca.toLowerCase()) ||
            usuario.corretor?.nome.toLowerCase().includes(busca.toLowerCase()) ||
            usuario.user_metadata.nome?.toLowerCase().includes(busca.toLowerCase());

        const matchStatus = filtroStatus === 'todos' ||
            (filtroStatus === 'confirmado' && usuario.email_confirmed_at) ||
            (filtroStatus === 'nao_confirmado' && !usuario.email_confirmed_at);

        const matchCorretor = filtroCorretor === 'todos' ||
            (filtroCorretor === 'com' && usuario.corretor) ||
            (filtroCorretor === 'sem' && !usuario.corretor);

        return matchBusca && matchStatus && matchCorretor;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0A0A0A] to-[#0F0F0F] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="h-8 w-8 text-[#D4AF37]" />
                            Usuários do Sistema
                        </h1>
                        <p className="text-white/50 mt-1">Visualize todos os usuários cadastrados na plataforma</p>
                    </div>
                    <button
                        onClick={carregarDados}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        Atualizar
                    </button>
                </div>

                {/* Aviso de Config */}
                {erroConfig && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-orange-400">Configuração Incompleta</p>
                            <p className="text-xs text-orange-400/70 mt-1">{erroConfig}</p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Total</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Confirmados</p>
                        <p className="text-2xl font-bold text-green-400 mt-1">{stats.confirmados}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Não Confirmados</p>
                        <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.nao_confirmados}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Com Corretor</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">{stats.com_corretor}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Sem Corretor</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">{stats.sem_corretor}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                        <p className="text-xs text-white/40 uppercase">Últimos 7 Dias</p>
                        <p className="text-2xl font-bold text-[#D4AF37] mt-1">{stats.ultimos_7_dias}</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Buscar por e-mail ou nome..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                        />
                    </div>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value as any)}
                        className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    >
                        <option value="todos">Todos Status</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="nao_confirmado">Não Confirmado</option>
                    </select>
                    <select
                        value={filtroCorretor}
                        onChange={(e) => setFiltroCorretor(e.target.value as any)}
                        className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    >
                        <option value="todos">Todos Usuários</option>
                        <option value="com">Com Corretor</option>
                        <option value="sem">Sem Corretor</option>
                    </select>
                </div>

                {/* Lista */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="h-8 w-8 text-[#D4AF37] animate-spin" />
                    </div>
                ) : usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-20">
                        <AlertCircle className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.02 }}
                    >
                        {usuariosFiltrados.map((usuario, idx) => {
                            const isSuspenso = usuario.banned_until && new Date(usuario.banned_until) > new Date();
                            return (
                                <motion.div
                                    key={usuario.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className={cn(
                                        'bg-white/[0.03] border rounded-xl p-4 hover:bg-white/[0.05] transition-all',
                                        isSuspenso ? 'border-red-500/30' : 'border-white/[0.08]'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {usuario.user_metadata.nome || usuario.email}
                                                </p>
                                                {isSuspenso && (
                                                    <Ban className="h-4 w-4 text-red-400 shrink-0" />
                                                )}
                                                {usuario.email_confirmed_at ? (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                                        E-mail confirmado
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                        E-mail não confirmado
                                                    </span>
                                                )}
                                                {usuario.corretor && (
                                                    <span className={cn(
                                                        'text-[11px] font-bold px-1.5 py-0.5 rounded',
                                                        usuario.corretor.role === 'administrador' ? 'bg-red-500/10 text-red-400'
                                                            : usuario.corretor.role === 'gestor_trafego' ? 'bg-blue-500/10 text-blue-400'
                                                                : usuario.corretor.role === 'assistente' ? 'bg-yellow-500/10 text-yellow-400'
                                                                    : 'bg-purple-500/10 text-purple-400',
                                                    )}>
                                                        {usuario.corretor.role === 'gestor_trafego' ? 'TRÁFEGO'
                                                            : usuario.corretor.role === 'administrador' ? 'ADMIN'
                                                                : usuario.corretor.role === 'assistente' ? 'ASSISTENTE'
                                                                    : 'CORRETOR'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs text-white/40 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {usuario.email}
                                                </span>
                                                {usuario.corretor && (
                                                    <span className="text-xs text-white/40 flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {usuario.corretor.nome}
                                                    </span>
                                                )}
                                                <span className="text-xs text-white/40 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                                {(usuario.ultimo_login || usuario.last_sign_in_at) && (
                                                    <span className="text-xs text-green-400/70 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Último login: {new Date(usuario.ultimo_login || usuario.last_sign_in_at!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setUsuarioSelecionado(usuario)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all text-xs font-medium shrink-0"
                                        >
                                            <UserCog className="h-3.5 w-3.5" />
                                            Gerenciar
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Modal de Detalhes */}
            <AnimatePresence>
                {usuarioSelecionado && (
                    <DetalhesModal
                        usuario={usuarioSelecionado}
                        onClose={() => setUsuarioSelecionado(null)}
                        onAction={() => {
                            carregarDados();
                            setUsuarioSelecionado(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
