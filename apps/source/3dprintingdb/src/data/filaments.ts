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
  sourceUrl?: string;
  fetchedAt?: string;
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
export const SPOOLMANDB_SOURCE_URL = 'https://donkie.github.io/SpoolmanDB/filaments.json';

type SpoolmanColor = { name?: string; hex?: string; hexes?: string[] } | string;
type SpoolmanFilament = {
  manufacturer?: string;
  name?: string;
  material?: string;
  diameter?: number;
  diameters?: number[];
  color?: SpoolmanColor;
  colors?: SpoolmanColor[];
  extruder_temp?: number;
  extruder_temp_range?: number[];
  bed_temp?: number;
  bed_temp_range?: number[];
  density?: number;
  finish?: string;
  pattern?: string;
};

function temperature(value?: number, range?: number[]): string {
  if (typeof value === 'number') return `${value} °C`;
  if (range?.length === 2) return `${range[0]}–${range[1]} °C`;
  return '未設定';
}

function colorName(color: SpoolmanColor | undefined): string {
  if (typeof color === 'string') return color;
  return color?.name || (color?.hex ? `#${color.hex}` : '未設定');
}

function normalizeSpoolmanCatalog(payload: unknown, fetchedAt: string): Filament[] {
  const records = Array.isArray(payload)
    ? payload
    : (payload && typeof payload === 'object' && Array.isArray((payload as { filaments?: unknown }).filaments)
      ? (payload as { filaments: unknown[] }).filaments
      : []);

  return records.flatMap((value, index) => {
    if (!value || typeof value !== 'object') return [];
    const record = value as SpoolmanFilament;
    if (!record.name || !record.material) return [];
    const colors = record.colors?.length ? record.colors : [record.color];
    const diameter = record.diameter ?? record.diameters?.[0] ?? 1.75;
    return colors.map((color, colorIndex) => ({
      id: `spoolmandb-${index}-${colorIndex}`,
      brand: record.manufacturer || 'メーカー未設定',
      name: record.name.replace('{color_name}', colorName(color)),
      material: record.material,
      color: colorName(color),
      diameter,
      nozzle: temperature(record.extruder_temp, record.extruder_temp_range),
      bed: temperature(record.bed_temp, record.bed_temp_range),
      dry: '未設定',
      productImage: '',
      metrics: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      notes: [
        record.density ? `密度: ${record.density} g/cm³` : '',
        record.finish ? `仕上げ: ${record.finish}` : '',
        record.pattern ? `パターン: ${record.pattern}` : '',
      ].filter(Boolean).join(' / ') || 'SpoolmanDBから取得したフィラメント。',
      sourceUrl: SPOOLMANDB_SOURCE_URL,
      fetchedAt,
    }));
  });
}

/**
 * SpoolmanDBの公開JSONを取得する。失敗時は呼び出し側で初期カタログを使用する。
 */
export async function fetchFilamentCatalog(): Promise<Filament[]> {
  const response = await fetch(SPOOLMANDB_SOURCE_URL);
  if (!response.ok) throw new Error(`カタログ取得に失敗しました (${response.status})`);
  const data = normalizeSpoolmanCatalog(await response.json(), new Date().toISOString());
  if (!data.length) throw new Error('SpoolmanDBのカタログが空、または形式が不正です');
  return data;
}
