'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  CrmDealDetail, CrmActivityInsert, CrmCommentInsert,
} from '@/lib/types/crm';
import {
  getDealFullDetail,
  updateDealField,
  addAttachment,
  deleteAttachment,
  followEntity,
  unfollowEntity,
  addComment,
  deleteComment,
  togglePinComment,
} from '@/app/actions/crm-detail';
import { createActivity } from '@/app/actions/crm';

export function useDealDetail(dealId: string | null) {
  const [deal, setDeal] = useState<CrmDealDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'comments' | 'changelog'>('timeline');

  const fetch = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    const res = await getDealFullDetail(dealId);
    if (res.success && res.data) {
      setDeal(res.data);
    } else {
      toast.error(res.error ?? 'Erro ao carregar oportunidade');
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (dealId) {
        void fetch();
      } else {
        setDeal(null);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dealId, fetch]);

  // Inline edit de campo
  const handleFieldUpdate = useCallback(async (
    field: string,
    value: string | number | boolean | null,
  ) => {
    if (!dealId) return;
    const res = await updateDealField(dealId, field, value);
    if (res.success) {
      if (field === 'owner_corretor_id') {
        await fetch();
        toast.success(value ? 'Responsável atualizado' : 'Responsável removido');
        return;
      }
      setDeal((prev) => prev ? { ...prev, [field]: value } : prev);
      toast.success('Campo atualizado');
    } else {
      toast.error(res.error ?? 'Erro ao atualizar');
    }
  }, [dealId, fetch]);

  // Adicionar atividade
  const handleAddActivity = useCallback(async (input: CrmActivityInsert): Promise<boolean> => {
    const res = await createActivity(input);
    if (res.success) {
      await fetch();
      toast.success('Atividade registrada');
      return true;
    }
    toast.error(res.error ?? 'Erro ao registrar atividade');
    return false;
  }, [fetch]);

  // Follow/Unfollow
  const handleToggleFollow = useCallback(async (corretorId: string) => {
    if (!deal) return;
    const isFollowing = deal.followers.some((f) => f.corretor_id === corretorId);

    const res = isFollowing
      ? await unfollowEntity('deal', deal.id, corretorId)
      : await followEntity('deal', deal.id, corretorId);

    if (res.success) {
      await fetch();
      toast.success(isFollowing ? 'Deixou de seguir' : 'Seguindo oportunidade');
    } else {
      toast.error(res.error);
    }
  }, [deal, fetch]);

  // Adicionar comentário
  const handleAddComment = useCallback(async (input: CrmCommentInsert): Promise<boolean> => {
    const res = await addComment(input);
    if (res.success) {
      await fetch();
      return true;
    }
    toast.error(res.error ?? 'Erro ao comentar');
    return false;
  }, [fetch]);

  // Deletar comentário
  const handleDeleteComment = useCallback(async (commentId: string) => {
    const res = await deleteComment(commentId);
    if (res.success) {
      await fetch();
      toast.success('Comentário excluído');
    }
  }, [fetch]);

  // Pin/Unpin comentário
  const handleTogglePinComment = useCallback(async (commentId: string, isPinned: boolean) => {
    const res = await togglePinComment(commentId, isPinned);
    if (res.success) {
      await fetch();
    }
  }, [fetch]);

  // Deletar attachment
  const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
    const res = await deleteAttachment(attachmentId);
    if (res.success) {
      await fetch();
      toast.success('Arquivo excluído');
    }
  }, [fetch]);

  return {
    deal,
    loading,
    activeTab,
    setActiveTab,
    refresh: fetch,
    handleFieldUpdate,
    handleAddActivity,
    handleToggleFollow,
    handleAddComment,
    handleDeleteComment,
    handleTogglePinComment,
    handleDeleteAttachment,
  };
}
