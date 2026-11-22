import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';
export const metadata: Metadata = { title: 'KVKK Aydınlatma Metni' };
export default function Page() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" updated="22 Kasım 2026">
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla NAR-J, kişisel verilerinizi aşağıda açıklanan çerçevede işler.</p>
      <h2>İşlenen kişisel veriler ve amaçlar</h2>
      <ul>
        <li>Kimlik ve iletişim (ad, e-posta): hesap oluşturma, kimlik doğrulama, erken erişim bilgilendirmesi.</li>
        <li>Müşteri işlem (araç profili, rota, rezervasyon): hizmetin sunulması ve kişiselleştirilmesi.</li>
        <li>İşlem güvenliği (oturum kayıtları): hesap güvenliğinin sağlanması.</li>
      </ul>
      <h2>Hukuki sebepler</h2>
      <p>KVKK m.5/2-c (sözleşmenin kurulması ve ifası), m.5/2-f (meşru menfaat) ve pazarlama amaçlı iletişim için m.5/1 (açık rıza).</p>
      <h2>Aktarım</h2>
      <p>Kişisel verileriniz yalnızca barındırma hizmeti gibi altyapı sağlayıcılarıyla, gerekli güvenlik tedbirleri alınarak ve KVKK m.8–9’a uygun olarak paylaşılır. Yurt dışı aktarım yapılması hâlinde ilgili mevzuat şartları sağlanır.</p>
      <h2>Saklama süresi</h2>
      <p>Hesap verileri hesap aktif olduğu sürece; erken erişim talepleri en fazla 24 ay saklanır ve süre sonunda silinir veya anonimleştirilir.</p>
      <h2>Haklarınız (KVKK m.11)</h2>
      <ul>
        <li>Verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,</li>
        <li>Düzeltilmesini, silinmesini veya yok edilmesini isteme,</li>
        <li>İşlemeye itiraz etme ve zararın giderilmesini talep etme.</li>
      </ul>
      <p>Başvurularınızı iletişim formu üzerinden iletebilirsiniz.</p>
    </LegalPage>
  );
}
