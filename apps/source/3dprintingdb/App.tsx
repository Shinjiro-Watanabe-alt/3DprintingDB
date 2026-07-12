import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import {
  Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet,
  Switch, Text, TextInput, View,
} from 'react-native';
import { Filament, INITIAL_FILAMENTS, METRICS } from './src/data/filaments';

const colors = {
  ink: '#263746', muted: '#70808c', canvas: '#eef2f3', surface: '#f9fbfb',
  line: '#d8e1e4', accent: '#607f91', accentDark: '#426172', white: '#fff',
};
type Screen = 'list' | 'detail' | 'compare';

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

  useEffect(() => {
    AsyncStorage.getItem('3dprintingdb-filaments').then((saved) => {
      if (saved) setFilaments(JSON.parse(saved));
    }).catch(() => undefined);
  }, []);
  const persist = (next: Filament[]) => {
    setFilaments(next);
    AsyncStorage.setItem('3dprintingdb-filaments', JSON.stringify(next)).catch(() => undefined);
  };
  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const openDetail = (item: Filament) => { setDetail(item); setWorkImage(''); setScreen('detail'); };
  const selectedFilaments = useMemo(() => filaments.filter((item) => selected.includes(item.id)), [filaments, selected]);
  const font = (size: number) => ({ fontSize: Math.round(size * fontScale) });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen === 'list' && <ListScreen {...{ filaments, selected, toggle, openDetail, setScreen, settingsOpen, setSettingsOpen, showMaterial, showDry, showImages, font }} />}
      {screen === 'detail' && detail && <DetailScreen item={detail} workImage={workImage} setWorkImage={setWorkImage} onBack={() => setScreen('list')} onSave={(image: string) => {
        const next = filaments.map((item) => item.id === detail.id ? { ...item, notes: image ? `${item.notes}\n作品画像: ${image}` : item.notes } : item);
        persist(next); setDetail(next.find((item) => item.id === detail.id) || detail);
        Alert.alert('保存しました', '作品画像の参照先をフィラメントに保存しました。');
      }} font={font} />}
      {screen === 'compare' && <CompareScreen items={selectedFilaments} onBack={() => setScreen('list')} font={font} />}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.modalBackdrop}><View style={styles.settings}>
          <Text style={[styles.modalTitle, font(20)]}>表示設定</Text>
          <Text style={styles.settingLabel}>一覧に表示する項目</Text>
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

function ListScreen({ filaments, selected, toggle, openDetail, setScreen, setSettingsOpen, showMaterial, showDry, showImages, font }: any) {
  return <View style={styles.container}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>FILAMENT LIBRARY</Text><Text style={[styles.title, font(28)]}>3DprintingDB</Text></View><View style={styles.headerActions}><Pressable onPress={() => setSettingsOpen(true)} accessibilityLabel="表示設定"><Text style={styles.headerIcon}>⚙</Text></Pressable><Pressable style={styles.compareButton} onPress={() => setScreen('compare')}><Text style={styles.compareText}>比較 {selected.length > 0 && `(${selected.length})`}</Text></Pressable></View></View>
    <View style={styles.tableHeader}><Text style={styles.checkHeader}>✓</Text><Text style={[styles.tableHeading, { flex: 1.5 }]}>フィラメント</Text>{showMaterial && <Text style={styles.tableHeading}>素材</Text>}{showDry && <Text style={styles.tableHeading}>乾燥</Text>}</View>
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={[styles.sectionCaption, font(13)]}>{filaments.length}本の登録フィラメント</Text>
      {filaments.map((item: Filament) => <Pressable key={item.id} style={styles.filamentRow} onPress={() => openDetail(item)}>
        <Pressable style={[styles.checkbox, selected.includes(item.id) && styles.checkboxChecked]} onPress={() => toggle(item.id)}><Text style={styles.checkText}>{selected.includes(item.id) ? '✓' : ''}</Text></Pressable>
        {showImages && <Image source={{ uri: item.productImage }} style={styles.thumb} />}
        <View style={{ flex: 1.5 }}><Text style={[styles.rowName, font(16)]}>{item.name}</Text><Text style={styles.rowBrand}>{item.brand} · {item.color}</Text></View>
        {showMaterial && <Text style={[styles.cell, font(14)]}>{item.material}</Text>}{showDry && <Text style={[styles.cell, font(12)]}>{item.dry}</Text>}<Text style={styles.chevron}>›</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}

function DetailScreen({ item, onBack, workImage, setWorkImage, onSave, font }: any) {
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
  </ScrollView>;
}

function CompareScreen({ items, onBack, font }: any) {
  return <ScrollView style={styles.container} contentContainerStyle={styles.detailContent}><Pressable onPress={onBack}><Text style={styles.back}>‹  一覧に戻る</Text></Pressable><Text style={styles.eyebrow}>COMPARISON</Text><Text style={[styles.detailTitle, font(27)]}>フィラメント比較</Text><Text style={styles.detailNotes}>設定した12項目をレーダー形式で比較</Text>
    <Radar items={items} /><View style={styles.legend}>{items.length === 0 ? <Text style={styles.helper}>一覧から比較したいフィラメントを選択してください。</Text> : items.map((item: Filament, index: number) => <View style={styles.legendItem} key={item.id}><View style={[styles.legendDot, { backgroundColor: index ? '#8aa6b4' : colors.accent }]} /><Text style={styles.legendText}>{item.name}</Text></View>)}</View>
    <Text style={styles.subheading}>比較項目</Text><View style={styles.metricGrid}>{METRICS.map((metric) => <Text key={metric} style={styles.metric}>{metric}</Text>)}</View>
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
  header: { padding: 22, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.canvas },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 1.7, fontWeight: '700' }, title: { color: colors.ink, fontWeight: '700', marginTop: 4 }, headerActions: { alignItems: 'flex-end', gap: 12 }, headerIcon: { color: colors.accentDark, fontSize: 22 }, compareButton: { backgroundColor: colors.accentDark, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }, compareText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 18, backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }, tableHeading: { color: colors.muted, fontSize: 11, fontWeight: '700', width: 70 }, checkHeader: { width: 30, color: colors.muted }, list: { paddingBottom: 28 }, sectionCaption: { color: colors.muted, padding: 18, paddingBottom: 8 }, filamentRow: { minHeight: 78, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.line, gap: 10 }, checkbox: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.accent }, checkText: { color: colors.white, fontWeight: '700' }, thumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: colors.line }, rowName: { color: colors.ink, fontWeight: '700' }, rowBrand: { color: colors.muted, fontSize: 11, marginTop: 4 }, cell: { color: colors.ink, width: 70 }, chevron: { color: colors.muted, fontSize: 23 },
  detailContent: { padding: 22, paddingBottom: 50 }, back: { color: colors.accentDark, fontWeight: '700', marginBottom: 18 }, heroImage: { width: '100%', height: 190, borderRadius: 14, backgroundColor: colors.line, marginBottom: 20 }, detailTitle: { color: colors.ink, fontWeight: '700', marginTop: 5 }, detailNotes: { color: colors.muted, lineHeight: 21, marginTop: 8 }, cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 22 }, info: { width: '48%', backgroundColor: colors.surface, borderRadius: 10, padding: 13 }, infoLabel: { color: colors.muted, fontSize: 11 }, infoValue: { color: colors.ink, fontSize: 15, fontWeight: '700', marginTop: 5 }, subheading: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 12 }, helper: { color: colors.muted, fontSize: 12, marginTop: 6, marginBottom: 12 }, inputRow: { marginTop: 13 }, inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '600' }, recommended: { color: colors.accentDark, fontSize: 11, fontWeight: '400' }, input: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 8, marginTop: 6, padding: 10, color: colors.ink }, urlInput: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 12, color: colors.ink, marginTop: 6 }, workImage: { height: 160, borderRadius: 10, marginTop: 12 }, primaryButton: { backgroundColor: colors.accentDark, borderRadius: 9, padding: 14, alignItems: 'center', marginTop: 22 }, primaryText: { color: colors.white, fontWeight: '700' },
  radar: { height: 320, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, radarGrid: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }, radarRing: { position: 'absolute', borderColor: colors.line, borderWidth: 1 }, radarShape: { position: 'absolute', width: 5, height: 210, backgroundColor: `${colors.accent}22`, top: 45 }, radarEmpty: { color: colors.muted, fontSize: 12 }, legend: { backgroundColor: colors.surface, borderRadius: 10, padding: 13 }, legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 }, legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 }, legendText: { color: colors.ink, fontSize: 12 }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, metric: { color: colors.accentDark, backgroundColor: '#dfe9ec', padding: 7, borderRadius: 6, fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: '#26374666', justifyContent: 'flex-end' }, settings: { backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }, modalTitle: { color: colors.ink, fontWeight: '700', marginBottom: 20 }, settingLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 }, settingText: { color: colors.ink, fontSize: 15 }, fontButtons: { flexDirection: 'row', gap: 8 }, fontButton: { borderColor: colors.line, borderWidth: 1, padding: 10, borderRadius: 7, flex: 1, alignItems: 'center' }, fontButtonActive: { backgroundColor: '#dfe9ec', borderColor: colors.accent }, fontButtonText: { color: colors.ink, fontWeight: '600' },
});
