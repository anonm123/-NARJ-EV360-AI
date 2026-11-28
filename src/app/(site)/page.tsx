import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ShieldCheck, Cpu, BatteryCharging, Network, Building2, Smartphone } from 'lucide-react';
import { Hero } from '@/components/home/hero';
import { QuickEstimate } from '@/components/home/quick-estimate';
import { MiniMap, RouteLine, Gauge, Bars, ChatBubbles, CardStack } from '@/components/home/visuals';
import { Picture } from '@/components/site/picture';
import { Reveal } from '@/components/site/reveal';
import { SectionHeading, Eyebrow } from '@/components/site/section-heading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PhoneMock } from '@/components/tools/phone-mock';
import { CtaBand } from '@/components/site/cta-band';
import { planRoute } from '@/lib/calc/route';
import { cityById, CITIES } from '@/lib/data/cities';
import { DEFAULT_VEHICLE_ID, vehicleById } from '@/lib/data/vehicles';
import { turkeyPath, projector } from '@/lib/geo';

export default function HomePage() {
  const car = vehicleById(DEFAULT_VEHICLE_ID)!;
  const plan = planRoute({
    from: cityById('istanbul')!,
    to: cityById('ankara')!,
    batteryKwh: car.batteryKwh,
    consumptionKwhPer100: car.consumptionKwhPer100,
    maxDcKw: car.maxDcKw,
    startSoc: 80,
    arrivalMinSoc: 15,
    mode: 'balanced',
    speedKmh: 110,
    tempC: 18,
    dcPricePerKwh: 13.9,
  });
  const path = turkeyPath(1000);
  const p = projector(1000);
  const dots = CITIES.map((c, i) => {
    const [x, y] = p(c.lat, c.lng);
    return { x, y, hot: i < 6 };
  });

  return (
    <>
      <Hero
        preview={{ vehicle: car.name, from: 'İstanbul', to: 'Ankara', distanceKm: plan.distanceKm, stops: plan.stops.length, totalMinutes: plan.totalMinutes, totalCost: plan.totalCost, arrivalSoc: plan.arrivalSoc }}
      />

      {/* 1 · Marka hikâyesi */}
      <section id="hikaye" className="relative scroll-mt-20 py-20 sm:py-28">
        <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-[32px] border border-line">
              <Picture name="battery-pack" alt="Hücreleri turkuaz ışıkla şarj olan batarya paketi render'ı" className="aspect-[4/3] w-full object-cover" sizes="(min-width:1024px) 600px, 100vw" />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(200deg,transparent_50%,rgba(5,10,18,0.85))]" />
              <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2 sm:inset-x-6 sm:bottom-6">
                {['Enerji zekâsı', 'Şeffaf maliyet', 'Tek hesap'].map((t) => (
                  <span key={t} className="glass rounded-full px-3 py-1.5 text-xs font-semibold text-fg">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div aria-hidden className="absolute -bottom-8 -left-8 -z-10 size-48 rounded-full bg-neon/20 blur-3xl" />
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Marka hikâyemiz"
              title={
                <>
                  Elektrikli yolculuğun <span className="text-electric-gradient">belirsizliğini</span> kaldırıyoruz.
                </>
              }
              description="Doğru istasyon nerede, kaç dakika sürer, kaça mal olur, varışta ne kadar şarj kalır? NAR-J; harita, rota, enerji ve ödeme katmanlarını tek bir akıllı deneyimde birleştirerek sürücülere ve filolara netlik kazandırmak için tasarlandı."
            />
            <div className="mt-10 space-y-5">
              {[
                { icon: Cpu, t: 'Önce hesap, sonra yol', d: 'Rota, hız ve sıcaklığa göre tüketimi modelleyip şarj duraklarını önceden planlar.' },
                { icon: ShieldCheck, t: 'Dürüst veri', d: 'Gerçek entegrasyon olmayan her alan açıkça etiketlenir; uydurma canlı veri gösterilmez.' },
                { icon: Network, t: 'Açık altyapı', d: 'OCPI/OCPP standartlarına uygun adaptör mimarisiyle operatörlere bağlanmaya hazır.' },
              ].map((s, i) => (
                <Reveal key={s.t} delay={i * 0.08} className="flex gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-neon">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-fg">{s.t}</h3>
                    <p className="mt-1 text-muted">{s.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Platform modülleri (bento) */}
      <section id="platform" className="relative scroll-mt-20 py-20 sm:py-28">
        <div aria-hidden className="grid-texture absolute inset-0 -z-10 opacity-60" />
        <div className="shell">
          <SectionHeading
            eyebrow="Platform"
            align="center"
            title="Tek platform, on sekiz yetenek"
            description="Her modül kendi sayfasında derinleşir. Aşağıdaki kartlardan ilgilendiğiniz alana geçin."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-6 lg:auto-rows-[minmax(0,1fr)]">
            <BentoCard href="/harita" className="md:col-span-4" title="Etkileşimli şarj haritası" text="Türkiye genelinde güç, soket ve operatöre göre filtrelenebilir istasyon keşfi." status="sample">
              <MiniMap path={path} dots={dots} className="mt-4" />
            </BentoCard>
            <BentoCard href="/rota" className="md:col-span-2" title="AI rota planlayıcı" text="Durakları, süreyi ve varış şarjını önceden bilin." status="live">
              <RouteLine className="mt-6" />
            </BentoCard>
            <BentoCard href="/hesaplayici" className="md:col-span-2" title="Maliyet & süre" text="Şarj eğrisine dayalı hassas süre ve maliyet." status="live">
              <Gauge className="mx-auto mt-4 max-w-[200px]" value={80} />
            </BentoCard>
            <BentoCard href="/analitik" className="md:col-span-2" title="Karbon analitiği" text="Yıllık emisyon tasarrufunuzu ölçün." status="live">
              <Bars className="mt-6" />
            </BentoCard>
            <BentoCard href="/asistan" className="md:col-span-2" title="NAR-J AI asistan" text="Şarj ve rota sorularınıza anında yanıt." status="beta">
              <ChatBubbles className="mt-5" />
            </BentoCard>
            <BentoCard href="/rfid" className="md:col-span-3" title="RFID & tek ödeme" text="Farklı operatörlerde tek kart ve tek cüzdan vizyonu." status="planned">
              <CardStack className="mt-4" />
            </BentoCard>
            <BentoCard href="/filo" className="md:col-span-3" title="Akıllı filo yönetimi" text="Araç SoC takibi, şarj planlama ve maliyet raporları." status="demo">
              <div className="mt-5 grid grid-cols-3 gap-2" aria-hidden>
                {[82, 34, 67].map((v, i) => (
                  <div key={i} className="rounded-xl border border-line bg-bg-2/70 p-2.5">
                    <p className="text-[10px] text-subtle">34 NJ {100 + i * 7}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-electric to-neon" style={{ width: `${v}%` }} />
                    </div>
                    <p className="tabular mt-1 text-xs font-semibold text-fg">%{v}</p>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
          <Reveal className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              ['/garaj', 'Araç garajı'],
              ['/operatorler', 'Operatör karşılaştırma'],
              ['/rezervasyon', 'Rezervasyon'],
              ['/mobil', 'Mobil uygulama'],
              ['/is-ortakligi', 'İş ortaklığı & API'],
              ['/abonelik', 'Abonelik & SaaS'],
              ['/yatirimci', 'Yatırımcı ilişkileri'],
              ['/hakkimizda', 'Yol haritası'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-muted transition-colors hover:border-neon/50 hover:text-fg">
                {label} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3 · Hızlı hesap */}
      <section className="py-20 sm:py-28">
        <div className="shell">
          <Card variant="feature" className="overflow-hidden p-6 sm:p-10 lg:p-14">
            <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-electric/15 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-14">
              <div>
                <Eyebrow>Saniyeler içinde</Eyebrow>
                <h2 className="mt-4 text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] font-semibold">Bir sonraki şarjınız ne kadar tutar?</h2>
                <p className="mt-4 text-muted">DC hızlı şarjın %80 sonrası yavaşlayan eğrisini hesaba katan gerçek hesaplama motoru. Değerleri değiştirin, sonuç anında güncellensin.</p>
                <div className="mt-6 flex items-center gap-2">
                  <StatusBadge status="live" />
                  <span className="text-xs text-subtle">Tarayıcınızda hesaplanır</span>
                </div>
              </div>
              <QuickEstimate />
            </div>
          </Card>
        </div>
      </section>

      {/* 4 · Filo bandı */}
      <section className="relative isolate overflow-hidden py-24 sm:py-36">
        <Picture name="fleet-highway" alt="Gece otoyolunda ışık izleri bırakan elektrikli filo araçları ve lojistik merkez noktaları" className="absolute inset-0 -z-20 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#050A12_0%,rgba(5,10,18,0.55)_30%,rgba(5,10,18,0.55)_70%,#050A12_100%)]" />
        <div className="shell">
          <div className="max-w-2xl">
            <Eyebrow>Kurumsal</Eyebrow>
            <h2 className="mt-4 text-[clamp(1.9rem,1.3rem+2.6vw,3.4rem)] font-semibold">Filonuzun enerjisini tek ekrandan yönetin.</h2>
            <p className="mt-5 text-lg text-muted">Araç bazlı şarj seviyesi, günlük kilometre, şarj maliyeti ve karbon raporları. Lojistik rotalarınızı enerji kısıtlarıyla birlikte planlayın.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/filo">
                  Filo çözümleri <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/abonelik">Kurumsal planlar</Link>
              </Button>
            </div>
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              { icon: BatteryCharging, t: 'Depo şarj planlama', d: 'Gece tarifesinde akıllı yük dağılımı (planlı)' },
              { icon: Building2, t: 'Çoklu şube', d: 'Rol bazlı erişim ve şube raporları' },
              { icon: ShieldCheck, t: 'KVKK uyumlu', d: 'Sürücü verisi için açık rıza ve minimizasyon' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.08}>
                <div className="glass h-full rounded-2xl p-5">
                  <f.icon className="size-5 text-neon" aria-hidden />
                  <p className="mt-3 font-semibold text-fg">{f.t}</p>
                  <p className="mt-1 text-sm text-muted">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Mobil uygulama önizleme */}
      <section className="py-20 sm:py-28">
        <div className="shell grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Mobil deneyim"
              title="Cebinizdeki enerji yardımcısı."
              description="Yakındaki istasyonlar, kişisel rota önerileri, rezervasyon ve tek dokunuşla ödeme. Mobil uygulama tasarım aşamasında — önizlemeyi inceleyin."
            >
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/mobil">
                    <Smartphone aria-hidden /> Uygulama önizlemesi
                  </Link>
                </Button>
                <StatusBadge status="planned" label="iOS & Android · planlı" />
              </div>
            </SectionHeading>
          </div>
          <Reveal className="relative mx-auto w-full max-w-[340px]">
            <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-full bg-[radial-gradient(closest-side,rgba(0,184,255,0.3),transparent)] blur-2xl" />
            <PhoneMock screen="home" />
          </Reveal>
        </div>
      </section>

      {/* 6 · Şeffaflık */}
      <section className="pb-8">
        <div className="shell">
          <Reveal className="rounded-3xl border border-line bg-white/[0.015] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-xl font-semibold">Şeffaflık etiketleri</h2>
                <p className="mt-2 text-sm text-muted">Platform lansman öncesi aşamadadır. Her modülde küçük bir durum etiketi, o alanın gerçekten çalışıp çalışmadığını gösterir.</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                <li><StatusBadge status="live" /></li>
                <li><StatusBadge status="beta" /></li>
                <li><StatusBadge status="demo" /></li>
                <li><StatusBadge status="sample" /></li>
                <li><StatusBadge status="model" /></li>
                <li><StatusBadge status="planned" /></li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function BentoCard({ href, title, text, status, className, children }: { href: string; title: string; text: string; status: Parameters<typeof StatusBadge>[0]['status']; className?: string; children?: React.ReactNode }) {
  return (
    <Reveal className={className}>
      <Link href={href} className="group block h-full rounded-3xl focus-visible:outline-offset-4">
        <Card variant="feature" interactive className="flex h-full flex-col overflow-hidden p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-fg sm:text-xl">{title}</h3>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-muted transition-all duration-500 group-hover:rotate-45 group-hover:border-neon/50 group-hover:text-neon">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">{text}</p>
          <div className="mt-auto">{children}</div>
          <StatusBadge status={status} className="mt-5 self-start" />
        </Card>
      </Link>
    </Reveal>
  );
}
