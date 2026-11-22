import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
export const metadata: Metadata = { title: 'Kullanım Koşulları' };
export default function Page() {
  return (
    <LegalPage title="Kullanım Koşulları" updated="22 Kasım 2026">
      <p>Bu koşullar NAR-J EV360-AI web platformunun kullanımını düzenler. Platformu kullanarak koşulları kabul etmiş sayılırsınız.</p>
      <h2>Hizmetin niteliği</h2>
      <p>Platform lansman öncesi aşamadadır. Haritadaki istasyonlar, doluluk durumları ve operatör tarifeleri örnek/simülasyon verisidir. Rezervasyon ve ödeme akışları demo niteliğindedir; gerçek rezervasyon veya ödeme oluşturmaz.</p>
      <h2>Hesaplamalar</h2>
      <p>Maliyet, süre, rota, karbon ve gelir hesaplamaları varsayımlara dayalı tahminlerdir. Sürüş güvenliği ve yolculuk kararları için tek başına kullanılmamalıdır.</p>
      <h2>Hesap güvenliği</h2>
      <p>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz kullanım fark ederseniz parolanızı değiştirin ve bize bildirin.</p>
      <h2>Kabul edilebilir kullanım</h2>
      <ul>
        <li>Platformu otomatik araçlarla aşırı yüklemek, güvenlik önlemlerini aşmaya çalışmak yasaktır.</li>
        <li>Başkasına ait kimlik veya ödeme bilgisi kullanılamaz.</li>
      </ul>
      <h2>Fikri mülkiyet</h2>
      <p>NAR-J adı, logosu, arayüz tasarımı ve özgün görseller NAR-J’ye aittir. Harita altlığı OpenStreetMap katkıcıları ve CARTO lisanslarına tabidir.</p>
    </LegalPage>
  );
}
