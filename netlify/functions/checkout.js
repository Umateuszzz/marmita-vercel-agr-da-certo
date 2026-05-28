// netlify/functions/checkout.js
// Substitui o checkout.php — gera QR Code Pix via Mercado Pago
//
// CONFIGURAÇÃO: Netlify → Site Settings → Environment Variables
//   MP_ACCESS_TOKEN = seu token do Mercado Pago
//
//   Token de TESTE:    TEST-xxxx...   (não cobra de verdade)
//   Token de PRODUÇÃO: APP_USR-xxxx...
//   Obtenha em: https://www.mercadopago.com.br/developers/panel/app

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ sucesso: false, erro: 'Método não permitido.' }) };
  }

  let dados;
  try {
    dados = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, erro: 'Payload inválido.' }) };
  }

  if (!dados || !dados.codigo_pedido) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, erro: 'Pedido não identificado.' }) };
  }

  // Token lido da variável de ambiente — nunca coloque o token direto no código
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucesso: false,
        erro: 'Token do Mercado Pago não configurado. Defina MP_ACCESS_TOKEN nas variáveis de ambiente do Netlify.',
      }),
    };
  }

  const subtotal = parseFloat(dados.subtotal) || 0;
  const taxa = dados.tipo === 'delivery' ? 5.0 : 0.0;
  const total = Math.max(subtotal + taxa, 0.01); // MP exige valor > 0

  const partesNome = (dados.nome || 'Cliente').trim().split(' ');
  const primeiroNome = partesNome[0].substring(0, 100);
  const sobrenome = (partesNome[1] || 'Silva').substring(0, 100);

  const idempotencyKey = `pix_${dados.codigo_pedido}_${Date.now()}`;

  const paymentData = {
    transaction_amount: total,
    description: `Marmita #${dados.codigo_pedido} - Personalizada`,
    payment_method_id: 'pix',
    external_reference: dados.codigo_pedido,
    payer: {
      email: 'cliente_teste@email.com',
      first_name: primeiroNome,
      last_name: sobrenome,
      identification: {
        type: 'CPF',
        number: '32025689090',
      },
    },
  };

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();

    if (response.status === 200 || response.status === 201) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sucesso: true,
          pix_copia_e_cola: result.point_of_interaction?.transaction_data?.qr_code ?? null,
          pix_qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
        }),
      };
    } else {
      const detalhe = result.message || 'Erro desconhecido';
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucesso: false, erro: `Erro MP Pix: ${detalhe}` }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sucesso: false, erro: 'Falha na comunicação com o Mercado Pago.' }),
    };
  }
};
