// netlify/functions/checkout.js
// Substitui o checkout.php — gera QR Code Pix via Mercado Pago
// Configuração: defina a variável de ambiente MP_ACCESS_TOKEN no painel do Netlify

exports.handler = async function (event) {
  // Só aceita POST
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
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, erro: 'Pedido não identificado.' }),
    };
  }

  // ⚠️  Token do Mercado Pago — use variável de ambiente no Netlify (Site Settings → Environment Variables)
  // Nome da variável: MP_ACCESS_TOKEN
  const accessToken =
    process.env.MP_ACCESS_TOKEN ||
    'APP_USR-2584957840796592-052615-120b644587b387c977e5d54b7e17bd7c-3427107373';

  const subtotal = parseFloat(dados.subtotal) || 0;
  const taxa = dados.tipo === 'delivery' ? 5.0 : 0.0;
  const total = subtotal + taxa;

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
        number: '32025689090', // CPF de teste — substitua pelo CPF real do cliente se coletar
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
