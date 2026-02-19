# 🧪 TESTE PRÁTICO: Queue/Steer/Stop

## 🎯 **Cenário de Teste 1: Criar Novo Componente**

### **Passo 1:**
No chat do Cursor, envie:
```
Crie um componente React chamado CorretorCard que recebe props 
nome, email e telefone e exibe em um card com Tailwind CSS
```

### **Passo 2:**
**ENQUANTO a IA responde**, envie imediatamente:
```
Adicione também um botão "Ver Detalhes" e um badge de status (ativo/inativo)
```

### **Passo 3:**
Quando o modal aparecer, clique em **[Steer]**

### **✅ Resultado Esperado:**
O componente será ajustado EM TEMPO REAL incluindo o botão e badge!

---

## 🎯 **Cenário de Teste 2: Editar Arquivo Existente**

### **Passo 1:**
Abra o arquivo: `frontend/app/actions/corretores.ts`

Pressione `Cmd + K` (Composer Mode)

### **Passo 2:**
Digite:
```
Adicione uma função getCorretoresByRole que filtra corretores por função
```

### **Passo 3:**
**ENQUANTO a IA gera**, envie:
```
Adicione também paginação com limit e offset
```

### **Passo 4:**
Clique em **[Queue]** desta vez

### **✅ Resultado Esperado:**
1. Primeiro cria a função básica
2. Depois adiciona a paginação automaticamente

---

## 🎯 **Cenário de Teste 3: Refatoração**

### **Passo 1:**
No chat, envie:
```
Refatore o arquivo frontend/app/portal-interno-hks-2026/corretores/painel/page.tsx 
para extrair o modal de edição em um componente separado
```

### **Passo 2:**
**Enquanto processa**, envie:
```
Na verdade, pare! Quero apenas adicionar validação de formulário com Zod
```

### **Passo 3:**
Clique em **[Cancel]**

### **✅ Resultado Esperado:**
IA cancela a refatoração e começa a adicionar validação Zod

---

## 📝 **CHECKLIST PÓS-TESTE**

Após testar, confirme:

- [ ] Modal de Queue/Steer/Cancel apareceu?
- [ ] Conseguiu usar [Steer] e viu ajuste em tempo real?
- [ ] Conseguiu usar [Queue] e viu execução sequencial?
- [ ] Conseguiu usar [Cancel] e viu nova tarefa começar?

Se marcou todos: **🎉 CONFIGURAÇÃO 100% FUNCIONAL!**

---

## 🚀 **DICAS AVANÇADAS**

### **1. Composer vs Chat**

- **Chat (Cmd + L):** Conversação, perguntas, explicações
- **Composer (Cmd + K):** Edição de múltiplos arquivos simultaneamente

**Recomendação:** Use Composer para tarefas que envolvem vários arquivos.

---

### **2. Timing Perfeito**

O modal só aparece se você enviar **enquanto a IA está gerando**.

**Dica visual:** Quando ver este ícone girando ⚡ ou texto "Generating...", já pode digitar!

---

### **3. Contexto Automático**

O Cursor entende o contexto do projeto automaticamente.

Você pode dizer:
```
"No arquivo de corretores, adicione..."
```

E ele já sabe qual arquivo é!

---

## 🎓 **EXERCÍCIO FINAL**

Tente este desafio completo:

1. Abra o Composer (`Cmd + K`)
2. Digite:
```
Crie um novo endpoint em /api/corretores/export que exporta 
a lista de corretores para CSV
```
3. Quando começar a gerar, envie:
```
Adicione também autenticação JWT neste endpoint
```
4. Escolha [Steer]
5. Veja a mágica acontecer! ✨

---

**Sucesso no teste! 🎉**
