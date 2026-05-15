import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable,
  Image, ActivityIndicator, Alert, Keyboard, Animated, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { useDownloadStore, ContentType, MediaFormat } from '../../store/downloadStore';
import { analyzeUrl, startDownload, formatBytes } from '../../services/downloadService';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';

// ── Icons ──────────────────────────────────────────────────────────────────
function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function ClipboardIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function ClearIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function DownloadIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function VideoIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9l6 3-6 3V9z" fill={color} />
    </Svg>
  );
}
function AudioIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V5l12-2v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
function ImageIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Polyline points="21 15 16 10 5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function AppIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ── Content type config ────────────────────────────────────────────────────
const CONTENT_CONFIG: Record<ContentType, { label: string; color: string; Icon: any }> = {
  video: { label: 'Video', color: Colors.primary, Icon: VideoIcon },
  audio: { label: 'Audio', color: Colors.accent, Icon: AudioIcon },
  image: { label: 'Imagen', color: '#FF6B9D', Icon: ImageIcon },
  apk: { label: 'APK', color: Colors.warning, Icon: AppIcon },
  file: { label: 'Archivo', color: Colors.textSecondary, Icon: DownloadIcon },
};

// ── Supported platforms pill ───────────────────────────────────────────────
const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'X', 'Facebook', 'Twitter', 'Twitch', 'Vimeo', '+200 más'];

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { mediaPreview, isAnalyzing, analyzeError, premium, canDownload, remainingDownloads } =
    useDownloadStore();
  const addToQueue = useDownloadStore((s) => s.addToQueue);
  const setMediaPreview = useDownloadStore((s) => s.setMediaPreview);

  // Pulse animation for analyze button
  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    Keyboard.dismiss();
    animatePulse();
    await analyzeUrl(url.trim());
    if (useDownloadStore.getState().mediaPreview?.formats?.[0]) {
      setSelectedFormat(useDownloadStore.getState().mediaPreview!.formats[0]);
    }
  }, [url]);

  const handleDownload = useCallback(async () => {
    if (!mediaPreview || !selectedFormat) return;

    if (!canDownload()) {
      Alert.alert(
        '⚡ Límite alcanzado',
        `Has alcanzado el límite de ${premium.dailyLimit} descargas hoy.\n\nActualiza a Premium para descargas ilimitadas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }

    const id = Date.now().toString();
    const item = {
      id,
      url: mediaPreview.url,
      title: mediaPreview.title,
      thumbnail: mediaPreview.thumbnail,
      contentType: mediaPreview.contentType,
      format: selectedFormat.ext,
      quality: selectedFormat.quality,
      fileSize: selectedFormat.filesize,
      downloadedBytes: 0,
      progress: 0,
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    addToQueue(item);
    setMediaPreview(null);
    setUrl('');

    // Navigate to queue tab
    router.push('/queue');

    // Start download
    startDownload(item).catch((err) => Alert.alert('Error', err.message));
  }, [mediaPreview, selectedFormat, canDownload]);

  const remaining = remainingDownloads();
  const contentCfg = mediaPreview ? CONTENT_CONFIG[mediaPreview.contentType] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[Colors.primary + '20', 'transparent']}
              style={styles.headerGlow}
            />
            <View style={styles.logoRow}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.logoBg}>
                <DownloadIcon color="#fff" size={24} />
              </LinearGradient>
              <View>
                <Text style={styles.appName}>DeskLoad</Text>
                <Text style={styles.appTagline}>Descarga cualquier contenido</Text>
              </View>
            </View>

            {/* Daily limit pill */}
            {!premium.isPremium && (
              <Pressable style={styles.limitPill} onPress={() => router.push('/premium')}>
                <View style={[styles.limitDot, { backgroundColor: remaining > 3 ? Colors.success : Colors.warning }]} />
                <Text style={styles.limitText}>
                  {remaining > 0 ? `${remaining} descargas hoy` : 'Límite alcanzado'}
                </Text>
                <Text style={styles.limitArrow}>›</Text>
              </Pressable>
            )}

            {premium.isPremium && (
              <View style={[styles.limitPill, { borderColor: Colors.premium + '40' }]}>
                <Text style={{ fontSize: 12 }}>⭐</Text>
                <Text style={[styles.limitText, { color: Colors.premium }]}>Premium activo</Text>
              </View>
            )}
          </View>

          {/* Supported platforms */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.platformsScroll}
            contentContainerStyle={styles.platformsContent}
          >
            {PLATFORMS.map((p) => (
              <View key={p} style={styles.platformPill}>
                <Text style={styles.platformText}>{p}</Text>
              </View>
            ))}
          </ScrollView>

          {/* URL Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Pega tu enlace aquí</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconLeft}>
                <SearchIcon color={url ? Colors.primary : Colors.textMuted} />
              </View>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="search"
                onSubmitEditing={handleAnalyze}
                selectionColor={Colors.primary}
              />
              {url.length > 0 ? (
                <Pressable style={styles.inputIconRight} onPress={() => { setUrl(''); setMediaPreview(null); }}>
                  <ClearIcon color={Colors.textMuted} />
                </Pressable>
              ) : (
                <Pressable style={styles.inputIconRight} onPress={handlePaste}>
                  <ClipboardIcon color={Colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Analyze button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable
                style={[styles.analyzeBtn, !url.trim() && styles.analyzeBtnDisabled]}
                onPress={handleAnalyze}
                disabled={!url.trim() || isAnalyzing}
              >
                <LinearGradient
                  colors={url.trim() ? Colors.gradientPrimary : [Colors.bgSurface, Colors.bgSurface]}
                  style={styles.analyzeBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <SearchIcon color={url.trim() ? '#fff' : Colors.textMuted} />
                      <Text style={[styles.analyzeBtnText, !url.trim() && { color: Colors.textMuted }]}>
                        Analizar enlace
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Error */}
          {analyzeError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>No se pudo analizar</Text>
                <Text style={styles.errorText}>{analyzeError}</Text>
              </View>
            </View>
          )}

          {/* Media Preview */}
          {mediaPreview && contentCfg && (
            <View style={styles.previewCard}>
              <LinearGradient colors={Colors.gradientCard} style={styles.previewGradient}>
                {/* Thumbnail */}
                {mediaPreview.thumbnail ? (
                  <Image source={{ uri: mediaPreview.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumbnailPlaceholder, { backgroundColor: contentCfg.color + '22' }]}>
                    <contentCfg.Icon color={contentCfg.color} />
                  </View>
                )}

                {/* Content info */}
                <View style={styles.previewInfo}>
                  {/* Type badge */}
                  <View style={[styles.typeBadge, { backgroundColor: contentCfg.color + '22', borderColor: contentCfg.color + '44' }]}>
                    <contentCfg.Icon color={contentCfg.color} />
                    <Text style={[styles.typeBadgeText, { color: contentCfg.color }]}>{contentCfg.label}</Text>
                  </View>

                  <Text style={styles.previewTitle} numberOfLines={2}>
                    {mediaPreview.title}
                  </Text>

                  {mediaPreview.sourceDomain && (
                    <Text style={styles.previewDomain}>{mediaPreview.sourceDomain}</Text>
                  )}

                  {/* Format selector */}
                  {mediaPreview.formats.length > 0 && (
                    <View style={styles.formatSection}>
                      <Text style={styles.formatLabel}>Formato / Calidad</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatScroll}>
                        {mediaPreview.formats.map((fmt) => (
                          <Pressable
                            key={fmt.id}
                            style={[
                              styles.formatPill,
                              selectedFormat?.id === fmt.id && styles.formatPillActive,
                            ]}
                            onPress={() => setSelectedFormat(fmt)}
                          >
                            <Text style={[
                              styles.formatPillText,
                              selectedFormat?.id === fmt.id && styles.formatPillTextActive,
                            ]}>
                              {fmt.label}
                            </Text>
                            {fmt.filesize && (
                              <Text style={[
                                styles.formatSize,
                                selectedFormat?.id === fmt.id && { color: Colors.primary + 'cc' },
                              ]}>
                                {formatBytes(fmt.filesize)}
                              </Text>
                            )}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Download button */}
                <Pressable style={styles.downloadBtn} onPress={handleDownload}>
                  <LinearGradient
                    colors={Colors.gradientPrimary}
                    style={styles.downloadBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <DownloadIcon color="#fff" size={20} />
                    <Text style={styles.downloadBtnText}>Descargar</Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* Empty state */}
          {!mediaPreview && !isAnalyzing && !analyzeError && (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[Colors.primary + '15', Colors.accent + '10', 'transparent']}
                style={styles.emptyGlow}
              />
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyTitle}>Todo empieza con un enlace</Text>
              <Text style={styles.emptyText}>
                Copia cualquier URL de video, audio, imagen o aplicación y pégala arriba
              </Text>

              {/* Feature pills */}
              <View style={styles.featurePills}>
                {[
                  { icon: '🎬', label: 'Videos' },
                  { icon: '🎵', label: 'Audio' },
                  { icon: '🖼️', label: 'Imágenes' },
                  { icon: '📦', label: 'APKs' },
                ].map((f) => (
                  <View key={f.label} style={styles.featurePill}>
                    <Text style={styles.featurePillIcon}>{f.icon}</Text>
                    <Text style={styles.featurePillText}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 120,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  logoBg: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  appName: {
    fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary, letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium,
  },
  limitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.border,
  },
  limitDot: { width: 7, height: 7, borderRadius: 4 },
  limitText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  limitArrow: { fontSize: 14, color: Colors.textMuted },

  platformsScroll: { marginTop: Spacing.sm },
  platformsContent: { paddingHorizontal: Spacing.md, gap: 8 },
  platformPill: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border,
  },
  platformText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },

  inputSection: { padding: Spacing.md, gap: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.size.sm, color: Colors.textSecondary,
    fontWeight: Typography.weight.semibold, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputIconLeft: { paddingLeft: 14, paddingRight: 8 },
  input: {
    flex: 1, color: Colors.textPrimary,
    fontSize: Typography.size.md, paddingVertical: 14,
    fontWeight: Typography.weight.regular,
  },
  inputIconRight: { paddingHorizontal: 14, paddingVertical: 14 },

  analyzeBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  analyzeBtnText: {
    color: '#fff', fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold, letterSpacing: 0.3,
  },

  errorCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.error + '15', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error + '30',
    padding: Spacing.md, marginHorizontal: Spacing.md,
  },
  errorIcon: { fontSize: 20 },
  errorTitle: { color: Colors.error, fontWeight: '600', marginBottom: 2 },
  errorText: { color: Colors.textSecondary, fontSize: Typography.size.sm },

  previewCard: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  previewGradient: { padding: Spacing.md, gap: Spacing.md },
  thumbnail: { width: '100%', height: 180, borderRadius: Radius.md, backgroundColor: Colors.bgSurface },
  thumbnailPlaceholder: {
    width: '100%', height: 180, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  previewInfo: { gap: 8 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: Radius.full, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  previewTitle: {
    fontSize: Typography.size.lg, color: Colors.textPrimary,
    fontWeight: Typography.weight.semibold, lineHeight: 22,
  },
  previewDomain: { fontSize: Typography.size.sm, color: Colors.textMuted },

  formatSection: { gap: 8, marginTop: 4 },
  formatLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  formatScroll: {},
  formatPill: {
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: Colors.bgSurface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8, gap: 2,
  },
  formatPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' },
  formatPillText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
  formatPillTextActive: { color: Colors.primary, fontWeight: '600' },
  formatSize: { color: Colors.textMuted, fontSize: 10 },

  downloadBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  downloadBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  downloadBtnText: { color: '#fff', fontSize: Typography.size.md, fontWeight: Typography.weight.bold },

  emptyState: {
    alignItems: 'center', paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl, position: 'relative', gap: 12,
  },
  emptyGlow: {
    position: 'absolute', top: 0, left: '10%', right: '10%', height: 200, borderRadius: 100,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: Typography.size.xl, color: Colors.textPrimary,
    fontWeight: Typography.weight.bold, textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.size.md, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  featurePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.border,
  },
  featurePillIcon: { fontSize: 16 },
  featurePillText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
});
