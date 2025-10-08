import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Acceso denegado: No estás autenticado.");

    const { data: profile } = await supabaseClient.from('perfiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      throw new Error("Acceso denegado: No eres un administrador.");
    }

    const { email, password, nombre, ubicacion, categoria, curp, numero_ine, telefono, folio } = await req.json();
    if (!email || !password || !nombre) {
      throw new Error("Faltan campos obligatorios: email, password, nombre.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin.from('perfiles').update({ role: 'artesano', telefono: telefono }).eq('id', newUser.user.id);
    if (profileError) throw profileError;

    const { error: artesanoError } = await supabaseAdmin.from('artesanos').insert({
      user_id: newUser.user.id,
      nombre, ubicacion, categoria, curp, numero_ine, folio
    });
    if (artesanoError) throw artesanoError;

    return new Response(JSON.stringify({ message: 'Artesano registrado con éxito' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});