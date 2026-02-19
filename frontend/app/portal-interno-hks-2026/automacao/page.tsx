'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bot, Zap, Clock, CheckCircle, Play, Pause, Settings, ArrowRight, MessageSquare, Mail, Bell, Loader2, Workflow, UserPlus, Trophy, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getAutomacoes, toggleAutomacao, getCrmWorkflows, toggleCrmWorkflow, type Automacao, type CrmWorkflow } from '@/app/actions/automacoes';

const actionIcons: Record<string, typeof MessageSquare> = {
  WhatsApp: MessageSquare,
  Email: Mail,
  Notificação: Bell,
  Tarefa: CheckCircle,
};

const triggerLabels: Record<string, string> = {
  'deal.stage.changed': 'Oportunidade muda de etapa',
  'deal.created': 'Nova oportunidade criada',
  'deal.won': 'Oportunidade ganha',
  'deal.lost': 'Oportunidade perdida',
  'contact.created': 'Novo contato',
  'contact.lifecycle.changed': 'Lifecycle alterado',
  'activity.overdue': 'Atividade vencida',
  'contact.form.submitted': 'Formulário enviado',
  'schedule.daily': 'Agendamento diário',
  'schedule.weekly': 'Agendamento semanal',
  'webhook.received': 'Webhook recebido',
};

const triggerIcons: Record<string, typeof Zap> = {
  'deal.stage.changed': ArrowRight,
  'deal.created': Zap,
  'deal.won': Trophy,
  'deal.lost': XCircle,
  'contact.created': UserPlus,
  'activity.overdue': Calendar,
  'schedule.daily': Clock,
  'webhook.received': Workflow,
};

const workflowActionLabels: Record<string, string> = {
  send_email: 'Enviar email',
  send_whatsapp: 'Enviar WhatsApp',
  create_task: 'Criar tarefa',
  assign_corretor: 'Atribuir corretor',
  move_stage: 'Mover de etapa',
  update_deal: 'Atualizar oportunidade',
  webhook: 'Chamar webhook',
  notify: 'Notificar equipe',
};

const workflowActionIcons: Record<string, typeof Zap> = {
  send_email: Mail,
  send_whatsapp: MessageSquare,
  create_task: CheckCircle,
  assign_corretor: UserPlus,
  move_stage: ArrowRight,
  webhook: Workflow,
  notify: Bell,
};

type AutomacaoSection = 'automacoes' | 'workflows';
const DEFAULT_SECTION: AutomacaoSection = 'automacoes';

export default function AutomacaoPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [automations, setAutomations] = useState<Automacao[]>([]);
  const [workflows, setWorkflows] = useState<CrmWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionParam = searchParams.get('section');
  const activeSection: AutomacaoSection = sectionParam === 'workflows' ? 'workflows' : DEFAULT_SECTION;

  useEffect(() => {
    Promise.all([getAutomacoes(), getCrmWorkflows()]).then(([autos, wfs]) => {
      setAutomations(autos);
      setWorkflows(wfs);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic update
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ativa: !currentState } : a))
    );
    const result = await toggleAutomacao(id, !currentState);
    if (!result.success) {
      // Revert
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ativa: currentState } : a))
      );
      toast.error('Erro ao alterar automação');
    }
  };

  const activeCount = automations.filter((a) => a.ativa).length + workflows.filter(w => w.is_active).length;
  const totalExecutions = automations.reduce((sum, a) => sum + a.execucoes, 0) + workflows.reduce((sum, w) => sum + w.execution_count, 0);
  const totalCount = automations.length + workflows.length;

  function handleSectionChange(nextSection: AutomacaoSection) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSection === DEFAULT_SECTION) {
      params.delete('section');
    } else {
      params.set('section', nextSection);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          AUTOMAÇÃO IA
        </h1>
        <p className="mt-2 text-gray-400">Workflows inteligentes para automatizar processos</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <Bot className="h-6 w-6 text-[#D4AF37] mb-3" />
          <p className="text-2xl font-bold text-white">{totalCount}</p>
          <p className="text-sm text-gray-400">Automações</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <Zap className="h-6 w-6 text-green-400 mb-3" />
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-sm text-gray-400">Ativas</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
          <CheckCircle className="h-6 w-6 text-blue-400 mb-3" />
          <p className="text-2xl font-bold text-white">{totalExecutions}</p>
          <p className="text-sm text-gray-400">Execuções Totais</p>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSectionChange('automacoes')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'automacoes'
              ? 'bg-[#D4AF37] text-white'
              : 'border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Bot className="h-4 w-4" /> Automações IA ({automations.length})
        </button>
        <button
          onClick={() => handleSectionChange('workflows')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === 'workflows'
              ? 'bg-[#D4AF37] text-white'
              : 'border border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <Workflow className="h-4 w-4" /> Workflows CRM ({workflows.length})
        </button>
      </div>

      {/* Automações Legado */}
      {activeSection === 'automacoes' && (
        <div className="space-y-4">
          {automations.map((auto) => (
          <div
            key={auto.id}
            className={`rounded-lg border bg-[#0a0a0a] p-6 transition-all ${
              auto.ativa ? 'border-[#D4AF37]/30' : 'border-white/10 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${auto.ativa ? 'bg-[#D4AF37]/10' : 'bg-white/5'}`}>
                  <Bot className={`h-5 w-5 ${auto.ativa ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{auto.nome}</h3>
                  <p className="text-sm text-gray-400">{auto.descricao}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(auto.id, auto.ativa)}
                className={`rounded-full p-2 transition-colors ${
                  auto.ativa ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {auto.ativa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>

            {/* Trigger → Actions Flow */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> {auto.trigger_evento}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-600" />
              {auto.acoes.map((acao: string, i: number) => {
                const [type] = acao.split(':');
                const Icon = actionIcons[type.trim()] || Settings;
                return (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#D4AF37]" /> {acao}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {auto.execucoes} execuções</span>
              {auto.ultima_execucao && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Última: {auto.ultima_execucao}</span>}
            </div>
          </div>
        ))}

        {automations.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-12 text-center">
            <Bot className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma automação IA configurada</p>
          </div>
        )}
        </div>
      )}

      {/* CRM Workflows */}
      {activeSection === 'workflows' && (
        <div className="space-y-4">
          {workflows.map((wf) => {
            const TriggerIcon = triggerIcons[wf.trigger_type] || Zap;
            return (
              <div
                key={wf.id}
                className={`rounded-lg border bg-[#0a0a0a] p-6 transition-all ${
                  wf.is_active ? 'border-[#D4AF37]/30' : 'border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${wf.is_active ? 'bg-[#D4AF37]/10' : 'bg-white/5'}`}>
                      <Workflow className={`h-5 w-5 ${wf.is_active ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{wf.nome}</h3>
                      {wf.descricao && <p className="text-sm text-gray-400">{wf.descricao}</p>}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const newState = !wf.is_active;
                      setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, is_active: newState } : w));
                      const result = await toggleCrmWorkflow(wf.id, newState);
                      if (!result.success) {
                        setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, is_active: !newState } : w));
                        toast.error('Erro ao alterar workflow');
                      }
                    }}
                    className={`rounded-full p-2 transition-colors ${
                      wf.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                  >
                    {wf.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>

                {/* Trigger → Actions Flow */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400 flex items-center gap-1.5">
                    <TriggerIcon className="h-3.5 w-3.5" /> {triggerLabels[wf.trigger_type] || wf.trigger_type}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                  {Array.isArray(wf.actions) && wf.actions.map((action, i) => {
                    const ActionIcon = workflowActionIcons[action.type] || Settings;
                    return (
                      <div key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 flex items-center gap-1.5">
                        <ActionIcon className="h-3.5 w-3.5 text-[#D4AF37]" /> {workflowActionLabels[action.type] || action.type}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {wf.execution_count} execuções</span>
                  {wf.last_executed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Última: {new Date(wf.last_executed_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {workflows.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-12 text-center">
              <Workflow className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum workflow CRM configurado</p>
              <p className="text-sm text-gray-600 mt-1">Workflows são ações automáticas do pipeline de vendas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
