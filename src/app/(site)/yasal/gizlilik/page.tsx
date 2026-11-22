import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
export const metadata: Metadata = { title: 'Gizlilik Politikası' };
export default function Page() {
  return (
    <LegalPage title="Gizlilik Politikası" updated="22 Kasım 2026">
      <p>NAR-J EV360-AI (“NAR-J”), platformu kullanırken paylaştığınız bilgileri korumayı taahhüt eder. Bu politika hangi verileri neden topladığımızı açıklar.</p>
      <h2>Topladığımız veriler</h2>
      <ul>
        <li>Hesap verileri: ad, e-posta, hesap türü, isteğe bağlı şirket adı.</li>
        <li>Araç verileri: kullanıcı tarafından girilen batarya kapasitesi, tüketim, şarj gücü ve isteğe bağlı plaka.</li>
        <li>Kullanım verileri: kaydettiğiniz rotalar ve demo rezervasyonlar.</li>
        <li>İletişim verileri: erken erişim formunda paylaştığınız bilgiler.</li>
      </ul>
      <h2>Toplamadığımız veriler</h2>
      <ul>
        <li>Kart numarası, CVC veya son kullanma tarihi saklanmaz; demo ödeme formu yalnızca doğrulama yapar.</li>
        <li>Konum geçmişi tutulmaz. Hesaplamalar çoğunlukla tarayıcınızda yapılır.</li>
        <li>Üçüncü taraf reklam veya izleme çerezi kullanılmaz.</li>
      </ul>
      <h2>Çerezler</h2>
      <p>Yalnızca oturumunuzu sürdürmek için zorunlu, HttpOnly ve SameSite korumalı bir oturum çerezi kullanılır.</p>
      <h2>Güvenlik</h2>
      <p>Parolalar scrypt ile tek yönlü özetlenir, oturum belirteçleri sunucuda özet olarak tutulur, tüm trafik üretimde HTTPS ile şifrelenir.</p>
      <h2>Haklarınız ve iletişim</h2>
      <p>Verilerinize erişim, düzeltme ve silme talepleriniz için iletişim sayfasındaki formu kullanabilirsiniz.</p>
    </LegalPage>
  );
}
