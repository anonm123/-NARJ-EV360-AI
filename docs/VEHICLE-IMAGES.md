# Togg araç görselleri — ekleme rehberi

Araç Garajı, Togg modellerini **fotogerçekçi görsellerle** gösterecek şekilde hazırdır; ancak depoda şu an **hiçbir Togg görseli yoktur.**
Togg'un resmî fotoğrafları ve render'ları Togg'un telif hakkı altındadır; yazılı kullanım izni veya uygun lisans olmadan kopyalanmaz.
Görsel yokken arayüz araç çizimi kullanmaz; seçili rengin ışığıyla aydınlanan boş stüdyo sahnesi ve "görsel lisansı bekleniyor" notu gösterir.

## Yasal kaynak seçenekleri
1. **Togg'dan yazılı izin** (Togg Medya Merkezi / kurumsal iletişim). Basın görselleri çoğunlukla yalnızca habercilik amaçlı kullanıma izin verir; ticari bir uygulamada kullanım için ayrıca izin istenmelidir.
2. **Kendi fotoğraf çekiminiz** (ön çapraz 45°, stüdyo ışığı) — fotoğrafın telif hakkı sizdedir; araç tasarımının tanıtım amaçlı gösterimi için hukuk görüşü önerilir.
3. **Açık lisanslı fotoğraflar** (ör. Wikimedia Commons, CC BY / CC BY-SA). Arka plan kaldırma "uyarlama" sayılır; atıf ve lisans bildirimi zorunludur, CC BY-SA'da uyarlanan görsel aynı lisansla paylaşılır.

## Dosya düzeni
| Model | Dosya | Renkler |
|---|---|---|
| T10X | `public/vehicles/togg/t10x/<renk>.webp` | anadolu, gemlik, oltu, kula, kapadokya, ayder, seyhan |
| T10F | `public/vehicles/togg/t10f/<renk>.webp` | urla, mardin, ayder (+ Togg'un doğruladığı diğer renkler) |

- Açı: ön çapraz 45°, araç çerçevenin ~%85'i, alt kenarda tekerlek hizası sabit.
- Biçim: şeffaf arka planlı WebP, 1600 px genişlik (kaynak ≥ 2000 px), kalite ~82; mobil için ayrıca 900 px.
- Ekledikten sonra `src/lib/data/togg-images.ts` (web) ve `mobile/src/lib/togg-images.ts` (mobil) içine `credit` ve `license` bilgisiyle kaydedin.
