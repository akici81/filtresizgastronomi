import { supabase } from "./supabase";

export async function girisYap(email, sifre) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre });
  return { data, error };
}

export async function cikisYap() {
  await supabase.auth.signOut();
}

export async function mevcutKullanici() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from("kullanicilar")
    .select("*")
    .eq("id", user.id)
    .single();

  return profil;
}

export async function adminMi() {
  const kullanici = await mevcutKullanici();
  return kullanici?.rol === "admin";
}

export async function editorMu() {
  const kullanici = await mevcutKullanici();
  return ["admin", "editor"].includes(kullanici?.rol);
}
