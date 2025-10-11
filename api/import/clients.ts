export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
    });
  }

  try {
    const body = await req.json();
    console.log('Recebidos clientes:', body);

    // Aqui você poderia chamar seu Supabase ou outro banco, ex:
    // await supabase.from('clients').insert(body);

    return new Response(JSON.stringify({ ok: true, count: body.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Erro import clients', err);
    return new Response(JSON.stringify({ error: 'Erro ao processar dados' }), {
      status: 500,
    });
  }
}
