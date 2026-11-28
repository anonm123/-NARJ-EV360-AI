/**
 * Togg araç görselleri bildirimi (web). Görsel YALNIZCA yazılı kullanım izni / uygun lisansı olan kaynaktan eklenir.
 *
 * Dosya yeri: public/vehicles/togg/<model>/<renk>.webp  (ör. public/vehicles/togg/t10x/anadolu.webp)
 * Biçim: ön çapraz 45°, şeffaf arka plan, ≥ 2000 px genişlik kaynaktan 1600 px WebP (kalite ~82).
 * Ekledikten sonra aşağıya kaydı ve lisans bilgisini yazın; bkz. docs/VEHICLE-IMAGES.md.
 *
 * Şu an lisanslı görsel YOK → arayüz, araç çizimi yerine stüdyo ışık sahnesi ve "görsel lisansı bekleniyor" bilgisi gösterir.
 */
import type { ToggModel } from './togg';

export interface VehicleImage {
  src: string;
  width: number;
  height: number;
  /** Görsel sahibi / fotoğrafçı. */
  credit: string;
  /** Lisans veya izin belgesi (ör. "Togg yazılı izni, 2026-12-01" ya da "CC BY-SA 4.0"). */
  license: string;
}

export const TOGG_IMAGES: Partial<Record<ToggModel, Partial<Record<string, VehicleImage>>>> = {
  // T10X: { anadolu: { src: '/vehicles/togg/t10x/anadolu.webp', width: 1600, height: 900, credit: '…', license: '…' } },
};

export const toggImage = (model: ToggModel, color: string): VehicleImage | null => TOGG_IMAGES[model]?.[color] ?? null;
