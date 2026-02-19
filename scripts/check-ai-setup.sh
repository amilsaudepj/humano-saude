#!/bin/bash

echo "═══════════════════════════════════════════"
echo "🔍 DIAGNÓSTICO: GitHub Copilot / Claude"
echo "═══════════════════════════════════════════"
echo ""

# 1. Detectar editor
echo "📝 Detectando editor..."
if command -v cursor &> /dev/null; then
    echo "✅ Cursor detectado: $(which cursor)"
    EDITOR="Cursor"
elif command -v code &> /dev/null; then
    echo "✅ VS Code detectado: $(which code)"
    EDITOR="VS Code"
else
    echo "⚠️  Nenhum editor CLI detectado"
    echo "   Se você tem VS Code/Cursor instalado, configure o PATH"
    EDITOR="Desconhecido"
fi
echo ""

# 2. Verificar extensões do VS Code
if [ "$EDITOR" = "VS Code" ]; then
    echo "📦 Extensões instaladas:"
    code --list-extensions 2>/dev/null | grep -i "github\|copilot\|claude\|anthropic" || echo "   Nenhuma extensão relevante encontrada"
    echo ""
fi

# 3. Verificar configurações
echo "⚙️  Verificando configurações do projeto..."
if [ -f ".vscode/settings.json" ]; then
    echo "✅ .vscode/settings.json encontrado"
else
    echo "⚠️  .vscode/settings.json não encontrado"
fi

if [ -f ".vscode/extensions.json" ]; then
    echo "✅ .vscode/extensions.json encontrado"
else
    echo "⚠️  .vscode/extensions.json não encontrado"
fi
echo ""

# 4. Verificar variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ ANTHROPIC_API_KEY configurada"
else
    echo "ℹ️  ANTHROPIC_API_KEY não encontrada (normal se usar Copilot)"
fi

if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GITHUB_TOKEN configurada"
else
    echo "ℹ️  GITHUB_TOKEN não encontrada"
fi
echo ""

# 5. Recomendações
echo "═══════════════════════════════════════════"
echo "📋 RECOMENDAÇÕES:"
echo "═══════════════════════════════════════════"

if [ "$EDITOR" = "Desconhecido" ]; then
    echo "1. Instale Cursor (recomendado): https://cursor.sh"
    echo "   OU"
    echo "   Instale VS Code: https://code.visualstudio.com"
    echo ""
fi

echo "2. Extensões necessárias (VS Code):"
echo "   • GitHub Copilot"
echo "   • GitHub Copilot Chat"
echo ""

echo "3. Para ativar recurso Queue/Steer/Stop:"
echo "   • Abra o Chat (Cmd/Ctrl + L no Cursor)"
echo "   • OU Cmd/Ctrl + I no VS Code com Copilot Chat"
echo "   • Envie uma mensagem"
echo "   • ENQUANTO a IA responde, digite outra"
echo "   • Modal com opções aparecerá automaticamente"
echo ""

echo "4. Cursor (mais fácil):"
echo "   • Recurso nativo, sem configuração extra"
echo "   • Chat: Cmd/Ctrl + L"
echo "   • Composer: Cmd/Ctrl + K"
echo ""

echo "═══════════════════════════════════════════"
echo "✅ Diagnóstico completo!"
echo "═══════════════════════════════════════════"
