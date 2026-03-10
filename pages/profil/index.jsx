import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

export default function ProfilYonlendirme() {
  const router = useRouter();

  useEffect(() => {
    async function kontrol() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Giriş yapmamış, giriş sayfasına yönlendir
        router.replace("/giris");
        return;
      }

      // Kullanıcı adını al
      const { data } = await supabase
        .from("kullanicilar")
        .select("kullanici_adi")
        .eq("id", user.id)
        .single();

      if (data?.kullanici_adi) {
        // Profil sayfasına yönlendir
        router.replace(`/profil/${data.kullanici_adi}`);
      } else {
        // Kullanıcı adı yok, ana sayfaya
        router.replace("/");
      }
    }

    kontrol();
  }, []);

  return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid #e8000d", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );
}