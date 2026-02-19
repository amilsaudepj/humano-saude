#!/bin/bash

# 🚀 Setup Automático: GitHub Copilot + Queue/Steer/Stop
# Autor: AI Assistant (Humano Saúde)
# Data: 2026-02-19

clear
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🤖 SETUP: GitHub Copilot Queue/Steer/Stop           ║"
echo "║  Humano Saúde - Configuração Automatizada            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ══════════════════════════════════════════
# PASSO 1: Detectar Sistema Operacional
# ══════════════════════════════════════════
print_step "Detectando sistema operacional..."

OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    print_success "macOS detectado"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    print_success "Linux detectado"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="Windows"
    print_success "Windows detectado"
else
    print_warning "Sistema não identificado: $OSTYPE"
fi
echo ""

# ══════════════════════════════════════════
# PASSO 2: Verificar editores instalados
# ══════════════════════════════════════════
print_step "Verificando editores instalados..."

HAS_CURSOR=false
HAS_VSCODE=false
HAS_WINDSURF=false

if command -v cursor &> /dev/null; then
    HAS_CURSOR=true
    print_success "Cursor detectado: $(which cursor)"
fi

if command -v code &> /dev/null; then
    HAS_VSCODE=true
    print_success "VS Code detectado: $(which code)"
fi

if command -v windsurf &> /dev/null; then
    HAS_WINDSURF=true
    print_success "Windsurf detectado: $(which windsurf)"
fi

if [[ "$HAS_CURSOR" == false && "$HAS_VSCODE" == false && "$HAS_WINDSURF" == false ]]; then
    print_warning "Nenhum editor detectado via CLI"
    echo "          Isso é normal se você instalou mas não configurou o PATH"
fi
echo ""

# ══════════════════════════════════════════
# PASSO 3: Verificar extensões (VS Code)
# ══════════════════════════════════════════
if [[ "$HAS_VSCODE" == true ]]; then
    print_step "Verificando extensões do VS Code..."
    
    COPILOT_INSTALLED=$(code --list-extensions 2>/dev/null | grep -i "github.copilot" || echo "")
    COPILOT_CHAT_INSTALLED=$(code --list-extensions 2>/dev/null | grep -i "github.copilot-chat" || echo "")
    
    if [[ -n "$COPILOT_INSTALLED" ]]; then
        print_success "GitHub Copilot instalado"
    else
        print_warning "GitHub Copilot NÃO instalado"
    fi
    
    if [[ -n "$COPILOT_CHAT_INSTALLED" ]]; then
        print_success "GitHub Copilot Chat instalado"
    else
        print_warning "GitHub Copilot Chat NÃO instalado"
    fi
    echo ""
fi

# ══════════════════════════════════════════
# PASSO 4: Verificar arquivos de config
# ══════════════════════════════════════════
print_step "Verificando arquivos de configuração..."

if [[ -f ".vscode/settings.json" ]]; then
    print_success ".vscode/settings.json → OK"
else
    print_error ".vscode/settings.json → NÃO ENCONTRADO"
fi

if [[ -f ".vscode/extensions.json" ]]; then
    print_success ".vscode/extensions.json → OK"
else
    print_error ".vscode/extensions.json → NÃO ENCONTRADO"
fi

if [[ -f "docs/QUEUE_STEER_GUIDE.md" ]]; then
    print_success "docs/QUEUE_STEER_GUIDE.md → OK"
else
    print_warning "Guia de uso não encontrado"
fi
echo ""

# ══════════════════════════════════════════
# PASSO 5: Sugestões e próximos passos
# ══════════════════════════════════════════
echo "╔════════════════════════════════════════════════════════╗"
echo "║  📋 RECOMENDAÇÕES E PRÓXIMOS PASSOS                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

if [[ "$HAS_CURSOR" == true ]]; then
    echo -e "${GREEN}🎉 VOCÊ JÁ TEM CURSOR INSTALADO!${NC}"
    echo ""
    echo "Para usar Queue/Steer/Stop:"
    echo "  1. Abra o projeto no Cursor:"
    echo "     ${YELLOW}cursor \"$(pwd)\"${NC}"
    echo ""
    echo "  2. Abra o Chat: ${YELLOW}Cmd + L${NC} (Mac) ou ${YELLOW}Ctrl + L${NC} (Win/Linux)"
    echo ""
    echo "  3. Envie uma mensagem"
    echo ""
    echo "  4. ENQUANTO a IA responde, envie outra mensagem"
    echo "     → Modal com [Queue] [Steer] [Stop] aparecerá!"
    echo ""
    
elif [[ "$HAS_VSCODE" == true ]]; then
    echo -e "${BLUE}📝 VOCÊ TEM VS CODE${NC}"
    echo ""
    
    if [[ -n "$COPILOT_INSTALLED" && -n "$COPILOT_CHAT_INSTALLED" ]]; then
        echo -e "${GREEN}✅ Extensões instaladas!${NC}"
        echo ""
        echo "Para usar Queue/Steer/Stop:"
        echo "  1. Abra o projeto: ${YELLOW}code \"$(pwd)\"${NC}"
        echo "  2. Abra Chat: ${YELLOW}Cmd + I${NC} (Mac) ou ${YELLOW}Ctrl + I${NC} (Win/Linux)"
        echo "  3. Envie mensagem e teste interrupção"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Extensões faltando!${NC}"
        echo ""
        echo "Instale manualmente:"
        echo "  1. Abra VS Code"
        echo "  2. Extensions (Cmd+Shift+X)"
        echo "  3. Instale:"
        echo "     • GitHub Copilot"
        echo "     • GitHub Copilot Chat"
        echo ""
    fi
    
else
    echo -e "${YELLOW}💡 NENHUM EDITOR DETECTADO${NC}"
    echo ""
    echo "Opção 1 (RECOMENDADA): Instalar Cursor"
    echo "  • Download: ${BLUE}https://cursor.sh${NC}"
    echo "  • Gratuito (free tier)"
    echo "  • Queue/Steer/Stop nativo"
    echo "  • Mais fácil de usar"
    echo ""
    echo "Opção 2: Instalar VS Code + Copilot"
    echo "  • Download: ${BLUE}https://code.visualstudio.com${NC}"
    echo "  • Precisa assinatura GitHub Copilot (pago)"
    echo "  • Extensões: GitHub Copilot + Copilot Chat"
    echo ""
    echo "Opção 3: Instalar Windsurf"
    echo "  • Download: ${BLUE}https://codeium.com/windsurf${NC}"
    echo "  • Gratuito"
    echo "  • Interface similar ao Cursor"
    echo ""
fi

# ══════════════════════════════════════════
# PASSO 6: Links úteis
# ══════════════════════════════════════════
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🔗 LINKS ÚTEIS                                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📖 Guia completo: docs/QUEUE_STEER_GUIDE.md"
echo "🔍 Diagnóstico: ./scripts/check-ai-setup.sh"
echo ""
echo "Downloads:"
echo "  • Cursor:    https://cursor.sh"
echo "  • VS Code:   https://code.visualstudio.com"
echo "  • Windsurf:  https://codeium.com/windsurf"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ SETUP COMPLETO!                                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Perguntar se quer abrir o guia
if [[ -f "docs/QUEUE_STEER_GUIDE.md" ]]; then
    read -p "Deseja abrir o guia completo? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v code &> /dev/null; then
            code docs/QUEUE_STEER_GUIDE.md
        elif command -v cursor &> /dev/null; then
            cursor docs/QUEUE_STEER_GUIDE.md
        else
            cat docs/QUEUE_STEER_GUIDE.md
        fi
    fi
fi
