import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import {
  Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet,
  Switch, Text, TextInput, View,
} from 'react-native';
import { fetchFilamentCatalog, Filament, INITIAL_FILAMENTS, METRICS, FILAMENT_SOURCE_URL } from './src/data/filaments';

const designLogo = require('./assets/design-logo.png');

const colors = {
  ink: '#263746', muted: '#70808c', canvas: '#eef2f3', surface: '#f9fbfb',
  line: '#d8e1e4', accent: '#607f91', accentDark: '#426172', white: '#fff',
};
type Screen = 'list' | 'detail' | 'compare';
type Layout = 'table' | 'card';
type SortKey = 'name' | 'brand' | 'material' | 'color';
type SortDirection = 'asc' | 'desc' | null;

export default function App() {
  const [filaments, setFilaments] = useState(INITIAL_FILAMENTS);
  const [selected, setSelected] = useState<string[]>([]);
  const [screen, setScreen] = useState<Screen>('list');
  const [detail, setDetail] = useState<Filament | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showDry, setShowDry] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [workImage, setWorkImage] = useState('');
  const [layout, setLayout] = useState<Layout>('table');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [catalog, setCatalog] = useState<Filament[]>(INITIAL_FILAMENTS);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    AsyncStorage.getItem('3dprintingdb-filaments').then((saved) => {
      if (saved) setFilaments(JSON.parse(saved));
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    fetchFilamentCatalog().then(setCatalog).catch(() => setCatalog(INITIAL_FILAMENTS));
  }, []);
  const persist = (next: Filament[]) => {
    setFilaments(next);
    AsyncStorage.setItem('3dprintingdb-filaments', JSON.stringify(next)).catch(() => undefined);
  };
  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleFavorite = (id: string) => persist(filaments.map((item) =>
    item.id === id ? { ...item, favorite: !item.favorite } : item));
  const openDetail = (item: Filament) => { setDetail(item); setWorkImage(''); setScreen('detail'); };
  const selectedFilaments = useMemo(() => filaments.filter((item) => selected.includes(item.id)), [filaments, selected]);
  const font = (size: number) => ({ fontSize: Math.round(size * fontScale) });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen === 'list' && <ListScreen {...{ filaments, selected, toggle, toggleFavorite, openDetail, setScreen, setSettingsOpen, setRegistrationOpen, showMaterial, showDry, showImages, layout, font, sortKey, sortDirection, setSortKey, setSortDirection }} />}
      {screen === 'detail' && detail && <DetailScreen item={detail} workImage={workImage} setWorkImage={setWorkImage} onBack={() => setScreen('list')} onDelete={() => Alert.alert('削除の確認', '印刷設定等も消えます。本当に削除しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'OK', style: 'destructive', onPress: () => {
          persist(filaments.filter((item) => item.id !== detail.id));
          setSelected((current) => current.filter((id) => id !== detail.id));
          setDetail(null);
          setScreen('list');
        } },
      ])} onSave={(image: string) => {
        const next = filaments.map((item) => item.id === detail.id ? { ...item, notes: image ? `${item.notes}\n作品画像: ${image}` : item.notes } : item);
        persist(next); setDetail(next.find((item) => item.id === detail.id) || detail);
        Alert.alert('保存しました', '作品画像の参照先をフィラメントに保存しました。');
      }} font={font} />}
      {screen === 'compare' && <CompareScreen items={selectedFilaments} onBack={() => setScreen('list')} font={font} />}
      <RegistrationModal visible={registrationOpen} catalog={catalog} onClose={() => setRegistrationOpen(false)} onRegister={(item) => {
        const registered = { ...item, id: `${item.id}-${Date.now()}` };
        persist([...filaments, registered]);
        setRegistrationOpen(false);
      }} />
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.settings}>
          <Text style={[styles.modalTitle, font(20)]}>表示設定</Text>
          <Text style={styles.settingLabel}>一覧に表示する項目</Text>
          <Text style={styles.settingLabel}>表示形式</Text>
          <View style={styles.fontButtons}>
            {([{ id: 'table', label: '一覧' }, { id: 'card', label: 'カード' }] as const).map((option) => <Pressable key={option.id} style={[styles.fontButton, layout === option.id && styles.fontButtonActive]} onPress={() => setLayout(option.id)}><Text style={styles.fontButtonText}>{option.label}</Text></Pressable>)}
          </View>
          <SettingRow label="素材" value={showMaterial} onChange={setShowMaterial} />
          <SettingRow label="推奨乾燥条件" value={showDry} onChange={setShowDry} />
          <SettingRow label="製品画像" value={showImages} onChange={setShowImages} />
          <Text style={styles.settingLabel}>フォントサイズ</Text>
          <View style={styles.fontButtons}>{[0.9, 1, 1.15].map((scale) => <Pressable key={scale} style={[styles.fontButton, fontScale === scale && styles.fontButtonActive]} onPress={() => setFontScale(scale)}><Text style={styles.fontButtonText}>{scale === 1 ? '標準' : scale < 1 ? '小' : '大'}</Text></Pressable>)}</View>
          <Pressable style={styles.primaryButton} onPress={() => setSettingsOpen(false)}><Text style={styles.primaryText}>完了</Text></Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function ListScreen({ filaments, selected, toggle, toggleFavorite, openDetail, setScreen, setSettingsOpen, setRegistrationOpen, showMaterial, showDry, showImages, layout, font, sortKey, sortDirection, setSortKey, setSortDirection }: any) {
  const sorted = sortKey && sortDirection ? [...filaments].sort((a, b) => {
    const left = String(a[sortKey]).toLocaleLowerCase();
    const right = String(b[sortKey]).toLocaleLowerCase();
    return (left.localeCompare(right, 'ja')) * (sortDirection === 'asc' ? 1 : -1);
  }) : filaments;
  const sort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortKey(null); setSortDirection(null); }
  };
  const heading = (label: string, key: SortKey, flex?: number) => <Pressable style={[styles.tableHeading, flex ? { flex } : undefined]} onPress={() => sort(key)}><Text style={styles.tableHeadingText}>{label}{sortKey === key && (sortDirection === 'asc' ? ' ↑' : ' ↓')}</Text></Pressable>;
  return <View style={styles.container}>
    <View style={styles.header}><View style={styles.branding}><Image source={designLogo} resizeMode="contain" style={styles.logo} accessibilityLabel="3DprintingDB" /><Text style={styles.eyebrow}>MY FILAMENT LIBRARY</Text></View><View style={styles.headerActions}><Pressable onPress={() => setSettingsOpen(true)} accessibilityLabel="表示設定"><Text style={styles.headerIcon}>⚙</Text></Pressable><View style={styles.actionRow}><Pressable style={styles.registerButton} onPress={() => setRegistrationOpen(true)}><Text style={styles.compareText}>登録</Text></Pressable><Pressable style={styles.compareButton} onPress={() => setScreen('compare')}><Text style={styles.compareText}>比較 {selected.length > 0 && `(${selected.length})`}</Text></Pressable></View></View></View>
    {layout === 'table' && <View style={styles.tableHeader}><Text style={styles.checkHeader}>✓</Text>{heading('フィラメント', 'name', 1.5)}{showMaterial && heading('素材', 'material')}{heading('色', 'color')}{showDry && <Text style={styles.tableHeadingText}>乾燥</Text>}</View>}
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={[styles.sectionCaption, font(13)]}>{filaments.length}本の登録フィラメント</Text>
      <View style={layout === 'card' && styles.cardGrid}>{sorted.map((item: Filament) => layout === 'table' ? <Pressable key={item.id} style={styles.filamentRow} onPress={() => openDetail(item)}>
        <Pressable style={[styles.checkbox, selected.includes(item.id) && styles.checkboxChecked]} onPress={() => toggle(item.id)}><Text style={styles.checkText}>{selected.includes(item.id) ? '✓' : ''}</Text></Pressable>
        <Pressable onPress={() => toggleFavorite(item.id)} accessibilityLabel={`${item.name}をお気に入りにする`}><Text style={[styles.favorite, item.favorite && styles.favoriteActive]}>{item.favorite ? '★' : '☆'}</Text></Pressable>
        {showImages && <Image source={{ uri: item.productImage }} style={styles.thumb} />}
        <View style={{ flex: 1.5 }}><Text style={[styles.rowName, font(16)]}>{item.name}</Text><Text style={styles.rowBrand}>{item.brand} · {item.color}</Text></View>
        {showMaterial && <Text style={[styles.cell, font(14)]}>{item.material}</Text>}{showDry && <Text style={[styles.cell, font(12)]}>{item.dry}</Text>}<Text style={styles.chevron}>›</Text>
      </Pressable> : <Pressable key={item.id} style={styles.filamentCard} onPress={() => openDetail(item)}>
        {showImages && <Image source={{ uri: item.productImage }} style={styles.cardImage} />}
        <View style={styles.cardActions}><Pressable style={[styles.checkbox, selected.includes(item.id) && styles.checkboxChecked]} onPress={() => toggle(item.id)}><Text style={styles.checkText}>{selected.includes(item.id) ? '✓' : ''}</Text></Pressable><Pressable onPress={() => toggleFavorite(item.id)} accessibilityLabel={`${item.name}をお気に入りにする`}><Text style={[styles.favorite, item.favorite && styles.favoriteActive]}>{item.favorite ? '★' : '☆'}</Text></Pressable></View>
        <Text style={[styles.rowName, font(16)]} numberOfLines={1}>{item.name}</Text><Text style={styles.rowBrand}>{item.brand} · {item.color}</Text>
        <Text style={styles.cardMeta}>{showMaterial ? item.material : ''}{showMaterial && showDry ? '  /  ' : ''}{showDry ? item.dry : ''}</Text>
      </Pressable>)}</View>
    </ScrollView>
  </View>;
}

function DetailScreen({ item, onBack, workImage, setWorkImage, onSave, onDelete, font }: any) {
  return <ScrollView style={styles.container} contentContainerStyle={styles.detailContent}>
    <Pressable onPress={onBack}><Text style={styles.back}>‹  一覧に戻る</Text></Pressable>
    <Image source={{ uri: item.productImage }} style={styles.heroImage} />
    <Text style={styles.eyebrow}>{item.brand.toUpperCase()} / {item.material}</Text><Text style={[styles.detailTitle, font(27)]}>{item.name}</Text><Text style={styles.detailNotes}>{item.notes}</Text>
    <View style={styles.cards}><Info label="ノズル温度" value={item.nozzle} /><Info label="ベッド温度" value={item.bed} /><Info label="乾燥推奨" value={item.dry} /><Info label="線径" value={`${item.diameter} mm`} /></View>
    <Text style={styles.subheading}>印刷設定</Text><Text style={styles.helper}>推奨値をデフォルト表示。必要に応じて変更できます。</Text>
    <View style={styles.inputRow}><Text style={styles.inputLabel}>ノズル温度 <Text style={styles.recommended}>推奨 {item.nozzle}</Text></Text><TextInput style={styles.input} defaultValue={item.nozzle.replace(' °C', '')} keyboardType="numeric" /></View>
    <View style={styles.inputRow}><Text style={styles.inputLabel}>ベッド温度 <Text style={styles.recommended}>推奨 {item.bed}</Text></Text><TextInput style={styles.input} defaultValue={item.bed.replace(' °C', '')} keyboardType="numeric" /></View>
    <Text style={styles.subheading}>作品例の画像</Text><Text style={styles.helper}>画像URLを入力すると、このフィラメントの作品例として保存できます。</Text>
    <TextInput style={styles.urlInput} value={workImage} onChangeText={setWorkImage} placeholder="https://..." placeholderTextColor={colors.muted} autoCapitalize="none" />
    {workImage ? <Image source={{ uri: workImage }} style={styles.workImage} /> : null}
    <Pressable style={styles.primaryButton} onPress={() => onSave(workImage)}><Text style={styles.primaryText}>作品画像を保存</Text></Pressable>
    <Pressable style={styles.deleteButton} onPress={onDelete}><Text style={styles.deleteText}>このフィラメントを削除</Text></Pressable>
  </ScrollView>;
}

function CompareScreen({ items, onBack, font }: any) {
  return <ScrollView style={styles.container} contentContainerStyle={styles.detailContent}><Pressable onPress={onBack}><Text style={styles.back}>‹  一覧に戻る</Text></Pressable><Text style={styles.eyebrow}>COMPARISON</Text><Text style={[styles.detailTitle, font(27)]}>フィラメント比較</Text><Text style={styles.detailNotes}>設定した12項目をレーダー形式で比較</Text>
    <Radar items={items} /><View style={styles.legend}>{items.length === 0 ? <Text style={styles.helper}>一覧から比較したいフィラメントを選択してください。</Text> : items.map((item: Filament, index: number) => <View style={styles.legendItem} key={item.id}><View style={[styles.legendDot, { backgroundColor: index ? '#8aa6b4' : colors.accent }]} /><Text style={styles.legendText}>{item.name}</Text></View>)}</View>
    <Text style={styles.subheading}>比較項目</Text><View style={styles.metricGrid}>{METRICS.map((metric) => <Text key={metric} style={styles.metric}>{metric}</Text>)}</View>
  </ScrollView>;
}

function RegistrationModal({ visible, catalog, onClose, onRegister }: { visible: boolean; catalog: Filament[]; onClose: () => void; onRegister: (item: Filament) => void }) {
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const brands = [...new Set(catalog.map((item) => item.brand))];
  const materials = [...new Set(catalog.filter((item) => !brand || item.brand === brand).map((item) => item.material))];
  const products = [...new Set(catalog.filter((item) => (!brand || item.brand === brand) && (!material || item.material === material)).map((item) => item.name))];
  const colorsForProduct = [...new Set(catalog.filter((item) => item.brand === brand && item.material === material && item.name === name).map((item) => item.color))];
  const match = catalog.find((item) => item.brand === brand && item.material === material && item.name === name && item.color === color);
  const choose = (setter: (value: string) => void, value: string, resetters: Array<(value: string) => void>) => {
    setter(value);
    resetters.forEach((reset) => reset(''));
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}><View style={styles.registration}>
      <Text style={styles.modalTitle}>フィラメントを登録</Text>
      <Text style={styles.helper}>出典: {FILAMENT_SOURCE_URL}</Text>
      <Text style={styles.settingLabel}>メーカー</Text><OptionList options={brands} value={brand} onChange={(value) => choose(setBrand, value, [setMaterial, setName, setColor])} />
      <Text style={styles.settingLabel}>素材</Text><OptionList options={materials} value={material} onChange={(value) => choose(setMaterial, value, [setName, setColor])} />
      <Text style={styles.settingLabel}>製品</Text><OptionList options={products} value={name} onChange={(value) => choose(setName, value, [setColor])} />
      <Text style={styles.settingLabel}>色</Text><OptionList options={colorsForProduct} value={color} onChange={setColor} />
      <Pressable style={[styles.primaryButton, !match && styles.disabledButton]} disabled={!match} onPress={() => match && onRegister(match)}><Text style={styles.primaryText}>登録する</Text></Pressable>
      <Pressable style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>キャンセル</Text></Pressable>
    </View></View>
  </Modal>;
}

function OptionList({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionList}>
    {options.map((option) => <Pressable key={option} style={[styles.option, value === option && styles.optionActive]} onPress={() => onChange(option)}><Text style={styles.optionText}>{option}</Text></Pressable>)}
  </ScrollView>;
}
function Radar({ items }: { items: Filament[] }) {
  const size = 300; const center = size / 2; const radius = 100;
  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / METRICS.length;
    return `${center + Math.cos(angle) * radius * (value / 10)},${center + Math.sin(angle) * radius * (value / 10)}`;
  };
  const axis = (i: number, scale = 1) => point(i, 10 * scale);
  return <View style={styles.radar}><Svg width={size} height={size}>
    {[1, .66, .33].map((scale) => <Polygon key={scale} points={METRICS.map((_, i) => axis(i, scale)).join(' ')} fill="none" stroke={colors.line} strokeWidth="1" />)}
    {METRICS.map((metric, i) => <React.Fragment key={metric}><Line x1={center} y1={center} x2={axis(i).split(',')[0]} y2={axis(i).split(',')[1]} stroke={colors.line} strokeWidth="1" /><SvgText x={Number(axis(i, 1.22).split(',')[0])} y={Number(axis(i, 1.22).split(',')[1])} fill={colors.muted} fontSize="9" textAnchor="middle">{metric}</SvgText></React.Fragment>)}
    {items.map((item, index) => <Polygon key={item.id} points={item.metrics.map((value, i) => point(i, value)).join(' ')} fill={index ? '#8aa6b444' : '#607f9144'} stroke={index ? '#8aa6b4' : colors.accentDark} strokeWidth="2" />)}
    <Circle cx={center} cy={center} r="3" fill={colors.accentDark} />
  </Svg>{!items.length && <Text style={styles.radarEmpty}>選択してください</Text>}</View>;
}
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function SettingRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.settingRow}><Text style={styles.settingText}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent }} /></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, container: { flex: 1, backgroundColor: colors.canvas },
  header: { padding: 18, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.accentDark }, branding: { gap: 5 }, logo: { width: 154, height: 28 },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 1.7, fontWeight: '700' }, title: { color: colors.ink, fontWeight: '700', marginTop: 4 }, headerActions: { alignItems: 'flex-end', gap: 8 }, actionRow: { flexDirection: 'row', gap: 7 }, headerIcon: { color: colors.white, fontSize: 22 }, registerButton: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 }, compareButton: { backgroundColor: '#ffffff24', borderWidth: 1, borderColor: '#ffffff59', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 }, compareText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 18, backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }, tableHeading: { width: 70 }, tableHeadingText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, checkHeader: { width: 30, color: colors.muted }, list: { paddingBottom: 28 }, sectionCaption: { color: colors.muted, padding: 18, paddingBottom: 8 }, filamentRow: { minHeight: 78, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.line, gap: 10 }, checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.accent }, checkText: { color: colors.white, fontWeight: '700' }, favorite: { color: colors.muted, fontSize: 22, lineHeight: 24 }, favoriteActive: { color: '#c79342' }, thumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: colors.line }, rowName: { color: colors.ink, fontWeight: '700' }, rowBrand: { color: colors.muted, fontSize: 11, marginTop: 4 }, cell: { color: colors.ink, width: 70 }, chevron: { color: colors.muted, fontSize: 23 }, cardGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 }, filamentCard: { width: '47%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 10, gap: 4, overflow: 'hidden' }, cardImage: { width: '100%', height: 94, borderRadius: 9, backgroundColor: colors.line, marginBottom: 4 }, cardActions: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardMeta: { color: colors.accentDark, fontSize: 11, fontWeight: '600', marginTop: 5 },
  detailContent: { padding: 22, paddingBottom: 50 }, back: { color: colors.accentDark, fontWeight: '700', marginBottom: 18 }, heroImage: { width: '100%', height: 190, borderRadius: 14, backgroundColor: colors.line, marginBottom: 20 }, detailTitle: { color: colors.ink, fontWeight: '700', marginTop: 5 }, detailNotes: { color: colors.muted, lineHeight: 21, marginTop: 8 }, cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 22 }, info: { width: '48%', backgroundColor: colors.surface, borderRadius: 10, padding: 13 }, infoLabel: { color: colors.muted, fontSize: 11 }, infoValue: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 5 }, subheading: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 12 }, helper: { color: colors.muted, fontSize: 12, marginTop: 6, marginBottom: 12 }, inputRow: { marginTop: 13 }, inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '600' }, recommended: { color: colors.accentDark, fontSize: 11, fontWeight: '400' }, input: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 8, marginTop: 6, padding: 10, color: colors.ink }, urlInput: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 12, color: colors.ink, marginTop: 6 }, workImage: { height: 160, borderRadius: 10, marginTop: 12 }, primaryButton: { backgroundColor: colors.accentDark, borderRadius: 9, padding: 14, alignItems: 'center', marginTop: 22 }, primaryText: { color: colors.white, fontWeight: '700' }, deleteButton: { alignSelf: 'flex-end', marginTop: 48, padding: 10 }, deleteText: { color: '#a33f3f', fontWeight: '700' },
  radar: { height: 320, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, radarGrid: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }, radarRing: { position: 'absolute', borderColor: colors.line, borderWidth: 1 }, radarShape: { position: 'absolute', width: 5, height: 210, backgroundColor: `${colors.accent}22`, top: 45 }, radarEmpty: { color: colors.muted, fontSize: 12 }, legend: { backgroundColor: colors.surface, borderRadius: 10, padding: 13 }, legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 }, legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 }, legendText: { color: colors.ink, fontSize: 12 }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, metric: { color: colors.accentDark, backgroundColor: '#dfe9ec', padding: 7, borderRadius: 6, fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: '#26374666', justifyContent: 'flex-end' }, settings: { backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }, registration: { backgroundColor: colors.surface, padding: 24, maxHeight: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }, modalTitle: { color: colors.ink, fontWeight: '700', marginBottom: 20 }, settingLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 }, settingText: { color: colors.ink, fontSize: 15 }, fontButtons: { flexDirection: 'row', gap: 8 }, fontButton: { borderColor: colors.line, borderWidth: 1, padding: 10, borderRadius: 7, flex: 1, alignItems: 'center' }, fontButtonActive: { backgroundColor: '#dfe9ec', borderColor: colors.accent }, fontButtonText: { color: colors.ink, fontWeight: '600' }, optionList: { gap: 8 }, option: { borderColor: colors.line, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 }, optionActive: { backgroundColor: '#dfe9ec', borderColor: colors.accent }, optionText: { color: colors.ink }, cancelButton: { alignItems: 'center', padding: 12, marginTop: 5 }, cancelText: { color: colors.muted }, disabledButton: { opacity: 0.45 },
});
