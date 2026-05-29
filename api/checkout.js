// api/checkout.js
// Vercel Function - Mercado Pago PIX

export default async function handler(req,res){

if(req.method!=="POST"){

return res.status(405).json({

sucesso:false,

erro:"Método não permitido"

})

}

try{

const dados=req.body

if(!dados?.codigo_pedido){

return res.status(400).json({

sucesso:false,

erro:"Pedido inválido"

})

}

const accessToken=
process.env.MP_ACCESS_TOKEN

if(!accessToken){

return res.status(500).json({

sucesso:false,

erro:"MP_ACCESS_TOKEN não configurado"

})

}

const subtotal=
parseFloat(dados.subtotal)||0

const taxa=
dados.tipo==="delivery"
?5
:0

const total=
Math.max(
subtotal+taxa,
0.01
)

const nomeCompleto=
(dados.nome||"Cliente")
.trim()
.split(" ")

const primeiroNome=
nomeCompleto[0]
.substring(0,100)

const sobrenome=
(
nomeCompleto.slice(1).join(" ")
||
"Cliente"
)
.substring(0,100)

const paymentData={

transaction_amount:total,

description:
`Pedido ${dados.codigo_pedido}`,

payment_method_id:"pix",

external_reference:
String(
dados.codigo_pedido
),

payer:{

first_name:
primeiroNome,

last_name:
sobrenome,

email:
dados.email
||
`cliente_${Date.now()}@email.com`

}

}

const response=
await fetch(

"https://api.mercadopago.com/v1/payments",

{

method:"POST",

headers:{

Authorization:
`Bearer ${accessToken}`,

"Content-Type":
"application/json",

"X-Idempotency-Key":

`pix_${dados.codigo_pedido}`

},

body:
JSON.stringify(
paymentData
)

}

)

const result=
await response.json()

if(
response.ok
){

return res.status(200).json({

sucesso:true,

payment_id:
result.id,

status:
result.status,

pix_copia_e_cola:

result
.point_of_interaction
?.transaction_data
?.qr_code,

pix_qr_code_base64:

result
.point_of_interaction
?.transaction_data
?.qr_code_base64

})

}

return res.status(400).json({

sucesso:false,

erro:
result.message
||
"Erro Mercado Pago",

detalhes:
result

})

}catch(err){

return res.status(500).json({

sucesso:false,

erro:
"Falha interna",

detalhes:
String(err)

})

}

}