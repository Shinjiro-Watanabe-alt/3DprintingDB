export type Filament = {
  id: string;
  brand: string;
  name: string;
  material: string;
  color: string;
  diameter: number;
  nozzle: string;
  bed: string;
  dry: string;
  productImage: string;
  metrics: number[];
  notes: string;
  favorite?: boolean;
};

export const METRICS = [
  '強度', '耐熱性', '柔軟性', '造形性', '層間接着', '耐摩耗',
  '耐薬品性', '表面品質', '反りにくさ', '乾燥しやすさ', '軽量性', '光沢',
];

// 初期データは3D Filament Profiles（https://3dfilamentprofiles.com/）を参照したサンプル。
// 実データ連携時はこの型へ変換してローカル保存する。
export const INITIAL_FILAMENTS: Filament[] = [
  {
    id: 'polymaker-pla-pro',
    brand: 'Polymaker',
    name: 'PolyLite PLA Pro',
    material: 'PLA',
    color: 'グレーブルー',
    diameter: 1.75,
    nozzle: '210 °C',
    bed: '55 °C',
    dry: '55 °C / 6 h',
    productImage: 'https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=900',
    metrics: [8, 5, 3, 9, 8, 4, 5, 9, 8, 8, 7, 8],
    notes: '扱いやすく、日常使いの造形に向いたPLA。',
  },
  {
    id: 'esun-petg',
    brand: 'eSUN',
    name: 'ePETG Solid',
    material: 'PETG',
    color: 'スレートブルー',
    diameter: 1.75,
    nozzle: '235 °C',
    bed: '80 °C',
    dry: '65 °C / 6 h',
    productImage: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=900',
    metrics: [8, 7, 5, 7, 8, 7, 7, 7, 5, 7, 6, 6],
    notes: '強度と耐候性のバランスが良いPETG。',
  },
  {
    id: 'prusa-tpu',
    brand: 'Prusament',
    name: 'TPU 95A',
    material: 'TPU',
    color: 'ダスクブルー',
    diameter: 1.75,
    nozzle: '225 °C',
    bed: '50 °C',
    dry: '60 °C / 4 h',
    productImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900',
    metrics: [6, 4, 10, 5, 9, 9, 6, 6, 7, 6, 4, 5],
    notes: '柔軟なパーツや滑り止めに適したTPU。',
  },
];

export const FILAMENT_SOURCE_URL = 'https://3dfilamentprofiles.com/';

/**
 * 公式に公開されたJSONエンドポイントを設定した場合だけ外部カタログを取得する。
 * エンドポイント未設定時は、出典を確認済みの初期カタログを使用する。
 */
export async function fetchFilamentCatalog(): Promise<Filament[]> {
  const endpoint = (globalThis as { process?: { env?: { EXPO_PUBLIC_FILAMENT_CATALOG_URL?: string } } })
    .process?.env?.EXPO_PUBLIC_FILAMENT_CATALOG_URL;
  if (!endpoint) return INITIAL_FILAMENTS;

  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`カタログ取得に失敗しました (${response.status})`);
  const data = await response.json() as Filament[];
  if (!Array.isArray(data)) throw new Error('カタログの形式が不正です');
  return data;
}
