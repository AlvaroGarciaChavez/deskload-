import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { useDownloadStore } from '../../store/downloadStore';
import Svg, { Path, Circle, Line } from 'react-native-svg';

function ChevronIcon({ color = Colors.textMuted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function FolderIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
function ZapIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

type RowProps = {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
};

function SettingRow({ icon, iconBg, label, value, onPress, rightEl }: RowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress && !rightEl}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {rightEl || (onPress && <ChevronIcon />)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { premium, setPremium } = useDownloadStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [simultaneousLimit, setSimultaneousLimit] = useState(2);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar descargas',
      '¿Eliminar todo el historial de descargas? Los archivos en tu dispositivo no se borrarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            useDownloadStore.getState().clearCompleted();
            Alert.alert('✅ Historial limpiado');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSub}>DeskLoad v{appVersion}</Text>
        </View>

        {/* Premium banner */}
        {!premium.isPremium && (
          <Pressable style={styles.premiumBanner} onPress={() => router.push('/premium')}>
            <LinearGradient colors={Colors.gradientPremium} style={styles.premiumBannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.premiumBannerText}>⭐ Actualizar a Premium</Text>
              <Text style={styles.premiumBannerSub}>{premium.dailyLimit - premium.downloadsToday} descargas restantes hoy</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* Descargas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descargas</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon={<FolderIcon color={Colors.primary} />}
              iconBg={Colors.primary + '20'}
              label="Carpeta de destino"
              value="DeskLoad/"
              onPress={() => Alert.alert('📁 Carpeta', 'Los archivos se guardan en:\nDeskLoad/ dentro del almacenamiento interno del dispositivo.\n\nEn iOS también se guardan en la Galería de Fotos.')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<ZapIcon color={Colors.accent} />}
              iconBg={Colors.accent + '20'}
              label="Descargas simultáneas"
              value={`${simultaneousLimit} ${premium.isPremium ? '(Premium: hasta 5)' : '(máx. 2)'}`}
              onPress={() => {
                const max = premium.isPremium ? 5 : 2;
                const next = simultaneousLimit < max ? simultaneousLimit + 1 : 1;
                setSimultaneousLimit(next);
              }}
            />
          </View>
        </View>

        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon={<BellIcon color={Colors.warning} />}
              iconBg={Colors.warning + '20'}
              label="Notificaciones de descarga"
              rightEl={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.bgSurface, true: Colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
          </View>
        </View>

        {/* Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan actual</Text>
          <View style={styles.sectionCard}>
            <View style={styles.planRow}>
              <View style={[styles.planBadge, { backgroundColor: premium.isPremium ? Colors.premium + '20' : Colors.bgSurface }]}>
                <Text style={[styles.planBadgeText, { color: premium.isPremium ? Colors.premium : Colors.textSecondary }]}>
                  {premium.isPremium ? '⭐ Premium' : '🆓 Gratuito'}
                </Text>
              </View>
              {!premium.isPremium && (
                <Text style={styles.planLimit}>{premium.downloadsToday}/{premium.dailyLimit} descargas hoy</Text>
              )}
            </View>
            {premium.isPremium && (
              <Pressable style={styles.manageSub}>
                <Text style={styles.manageSubText}>Gestionar suscripción</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          <View style={styles.sectionCard}>
            <SettingRow
              icon={<InfoIcon color={Colors.error} />}
              iconBg={Colors.error + '18'}
              label="Limpiar historial de cola"
              onPress={handleClearAll}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.sectionCard}>
            <View style={styles.aboutRow}>
              <LinearGradient colors={Colors.gradientPrimary} style={styles.aboutLogo}>
                <Text style={{ fontSize: 20 }}>⬇️</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.aboutName}>DeskLoad</Text>
                <Text style={styles.aboutVersion}>Versión {appVersion}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.aboutDesc}>
              Descarga videos, audio, imágenes y aplicaciones desde cualquier enlace o red social directamente en tu dispositivo.
            </Text>
            <View style={styles.divider} />
            <View style={styles.legalLinks}>
              <Pressable onPress={() => Alert.alert('Política de Privacidad', 'Próximamente disponible en nuestra web.')}>
                <Text style={styles.legalLink}>Privacidad</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => Alert.alert('Términos de Uso', 'Próximamente disponible en nuestra web.')}>
                <Text style={styles.legalLink}>Términos</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => Alert.alert('Soporte', 'Contáctanos en:\nsoporte@deskload.app')}>
                <Text style={styles.legalLink}>Soporte</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Hecho con ❤️ para descargar el mundo</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },

  header: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.xxl, fontWeight: Typography.weight.bold, color: Colors.textPrimary,
  },
  headerSub: { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },

  premiumBanner: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden' },
  premiumBannerGradient: { padding: Spacing.md, gap: 2 },
  premiumBannerText: { color: '#fff', fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  premiumBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.size.sm },

  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: 8 },
  sectionTitle: {
    fontSize: 11, color: Colors.textMuted, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: '500' },
  rowValue: { fontSize: Typography.size.sm, color: Colors.textMuted },

  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

  planRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  planBadge: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: Radius.full,
  },
  planBadgeText: { fontWeight: '700', fontSize: 14 },
  planLimit: { fontSize: 13, color: Colors.textMuted },
  manageSub: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  manageSubText: { color: Colors.primary, fontSize: 14, textDecorationLine: 'underline' },

  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  aboutLogo: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  aboutName: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  aboutVersion: { fontSize: Typography.size.sm, color: Colors.textMuted },
  aboutDesc: { padding: Spacing.md, fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: Spacing.md, gap: 8 },
  legalLink: { color: Colors.primary, fontSize: 13 },
  legalDot: { color: Colors.textMuted },

  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: Spacing.xl },
});
