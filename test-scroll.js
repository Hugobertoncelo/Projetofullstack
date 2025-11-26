// Script de teste para verificar scroll
// Execute no console do navegador

async function testScroll() {
  console.log('🧪 Iniciando teste de scroll...');

  // Verificar se há uma conversa selecionada
  const messagesArea = document.querySelector('[style*="calc(100vh - 140px)"]');
  if (!messagesArea) {
    console.log('❌ Área de mensagens não encontrada. Selecione uma conversa primeiro.');
    return;
  }

  console.log('✅ Área de mensagens encontrada');
  console.log('📏 Altura:', messagesArea.style.height);
  console.log('📏 Scroll Height:', messagesArea.scrollHeight);
  console.log('📏 Client Height:', messagesArea.clientHeight);
  console.log('🖱️ Overflow Y:', window.getComputedStyle(messagesArea).overflowY);

  // Testar scroll programático
  console.log('🧪 Testando scroll para o topo...');
  messagesArea.scrollTop = 0;

  setTimeout(() => {
    console.log('🧪 Testando scroll para o meio...');
    messagesArea.scrollTop = messagesArea.scrollHeight / 2;

    setTimeout(() => {
      console.log('🧪 Testando scroll para o final...');
      messagesArea.scrollTop = messagesArea.scrollHeight;

      console.log('✅ Teste de scroll concluído!');
      console.log('📊 Posição final do scroll:', messagesArea.scrollTop);
    }, 1000);
  }, 1000);
}

// Executar teste
testScroll();
