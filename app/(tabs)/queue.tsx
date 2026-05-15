import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { useDownloadStore, DownloadItem, DownloadStatus } from '../../store/downloadStore';
import { cancelDownload, formatBytes, formatEta } from '../../services/downloadService';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import * as Sharing from 'expo-sharing';

// ── Icons ──────────────────────────────────────────────────────────────────
function CancelIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DownloadStatus, { label: string; color: string }> = {
  pending: { label: 'En cola', color: Colors.textMuted },
  downloading: { label: 'Descargando', color: Colors.primary },
  paused: { label: 'Pausado', color: Colors.warning },
  completed: { label: 'Completado', color: Colors.success },
  error: { label: 'Error', color: Colors.error },
  cancelled: { label: 'Cancelado', color: Colors.textMuted },
};

const CONTENT_EMOJI: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
  apk: '📦',
  file: '📄',
};

// ── Download card ──────────────────────────────────────────────────────────
function DownloadCard({ item }: { item: DownloadItem }) {
  const removeFromQueue = useDownloadStore((s) => s.removeFromQueue);
  const statusCfg = STATUS_CONFIG[item.status];
  const emoji = CONTENT_EMOJI[item.contentType] || '📄';
  const isActive = item.status === 'downloading' || item.status === 'pending';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';

  const handleCancel = useCallback(() => {
    Alert.alert('Cancelar descarga', `¿Cancelar "${item.title}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelDownload(item.id) },
    ]);
  }, [item]);

  const handleRemove = useCallback(() => {
    removeFromQueue(item.id);
  }, [item.id]);

  const handleShare = useCallback(async () => {
    if (!item.localPath) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(item.localPath, { dialogTitle: 'Compartir o guardar archivo' });
    } else {
      Alert.alert('No soportado', 'La función de compartir no está disponible en este dispositivo.');
    }
  }, [item.localPath]);

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted, isError && styles.cardError]}>
      {/* Left: emoji icon */}
      <View style={[styles.cardIcon, { backgroundColor: statusCfg.color + '18' }]}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
      </View>

      {/* Middle: info */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>

        {/* Status + speed */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          {item.status === 'downloading' && item.speed !== undefined && (
            <Text style={styles.speedText}> · {formatBytes(item.speed)}/s</Text>
          )}
          {item.status === 'downloading' && item.eta !== undefined && (
            <Text style={styles.speedText}> · {formatEta(item.eta)}</Text>
          )}
        </View>

        {/* Progress bar */}
        {(item.status === 'downloading' || item.status === 'pending') && (
          <View style={styles.progressTrack}>
            <Animated.ProgressBar progress={item.progress} color={Colors.primary} />
          </View>
        )}

        {/* Size info */}
        {item.fileSize && item.fileSize > 0 && (
          <Text style={styles.sizeText}>
            {formatBytes(item.downloadedBytes)} / {formatBytes(item.fileSize)}
            {item.status === 'downloading' && ` (${Math.round(item.progress * 100)}%)`}
          </Text>
        )}

        {/* Error message */}
        {item.error && (
          <Text style={styles.errorText} numberOfLines={1}>{item.error}</Text>
        )}

        {/* Format / quality */}
        {item.quality && (
          <Text style={styles.qualityText}>{item.format?.toUpperCase()} · {item.quality}</Text>
        )}
      </View>

      {/* Right: action button */}
      <View style={styles.cardActions}>
        {isActive && (
          <Pressable style={styles.actionBtn} onPress={handleCancel}>
            <CancelIcon color={Colors.error} />
          </Pressable>
        )}
        {(isCompleted || isError || item.status === 'cancelled') && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {isCompleted && (
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <ShareIcon color={Colors.primary} />
              </Pressable>
            )}
            <Pressable style={styles.actionBtn} onPress={handleRemove}>
              <TrashIcon color={Colors.textMuted} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// Simple progress bar component (without react-native-progress for now)
const Animated = {
  ProgressBar: ({ progress, color }: { progress: number; color: string }) => (
    <View style={{ height: 4, backgroundColor: color + '25', borderRadius: 2, overflow: 'hidden' }}>
      <View style={{
        height: '100%',
        width: `${Math.round(progress * 100)}%`,
        backgroundColor: color,
        borderRadius: 2,
      }} />
    </View>
  ),
};

// ── Queue screen ───────────────────────────────────────────────────────────
export default function QueueScreen() {
  const queue = useDownloadStore((s) => s.queue);
  const clearCompleted = useDownloadStore((s) => s.clearCompleted);

  const activeItems = queue.filter((d) => d.status === 'downloading' || d.status === 'pending');
  const doneItems = queue.filter((d) => ['completed', 'error', 'cancelled'].includes(d.status));

  const hasDone = doneItems.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cola de descargas</Text>
          <Text style={styles.headerSub}>
            {activeItems.length} activas · {doneItems.length} completadas
          </Text>
        </View>
        {hasDone && (
          <Pressable style={styles.clearBtn} onPress={clearCompleted}>
            <TrashIcon color={Colors.textMuted} />
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </Pressable>
        )}
      </View>

      {queue.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[Colors.primary + '12', 'transparent']}
            style={styles.emptyGlow}
          />
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Sin descargas activas</Text>
          <Text style={styles.emptyText}>
            Ve a la pestaña de Descargar y pega un enlace para comenzar
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            // Active first
            ...activeItems,
            // Separator if needed
            ...doneItems,
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DownloadCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={
            activeItems.length > 0 ? (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.sectionLabel}>Activas</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            doneItems.length > 0 ? (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: Colors.textMuted }]} />
                <Text style={styles.sectionLabel}>Completadas / Errores</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary,
  },
  headerSub: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderRadius: Radius.sm,
    paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border,
  },
  clearBtnText: { color: Colors.textMuted, fontSize: 13 },

  list: { padding: Spacing.md, gap: 8 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 8, marginTop: 4,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: {
    fontSize: 11, color: Colors.textMuted, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardCompleted: { borderColor: Colors.success + '30' },
  cardError: { borderColor: Colors.error + '30' },
  cardIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: '500' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '500' },
  speedText: { fontSize: 11, color: Colors.textMuted },

  progressTrack: { marginTop: 4 },
  sizeText: { fontSize: 11, color: Colors.textMuted },
  errorText: { fontSize: 11, color: Colors.error },
  qualityText: { fontSize: 10, color: Colors.textMuted, letterSpacing: 0.3 },

  cardActions: { justifyContent: 'center' },
  actionBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.bgSurface,
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  emptyGlow: {
    position: 'absolute', top: '30%', left: '20%', right: '20%',
    height: 200, borderRadius: 100,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.size.xl, color: Colors.textPrimary, fontWeight: Typography.weight.bold },
  emptyText: { fontSize: Typography.size.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
