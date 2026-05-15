import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { useDownloadStore } from '../../store/downloadStore';
import Svg, { Path, Circle } from 'react-native-svg';

function CheckIcon({ color = Colors.success }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

const FREE_FEATURES = [
  { text: '10 descargas por día', included: true },
  { text: 'Videos, Audio, Imágenes, APK', included: true },
  { text: 'Cualquier red social', included: true },
  { text: 'Archivo máximo 500 MB', included: true },
  { text: '2 descargas simultáneas', included: true },
  { text: 'Descargas ilimitadas', included: false },
  { text: 'Archivos sin límite de tamaño', included: false },
  { text: '5 descargas simultáneas', included: false },
  { text: 'Prioridad en cola', included: false },
];

const PREMIUM_FEATURES = [
  { text: 'Descargas ilimitadas', emoji: '♾️' },
  { text: 'Archivos sin límite de tamaño', emoji: '📦' },
  { text: '5 descargas simultáneas', emoji: '⚡' },
  { text: 'Prioridad máxima en cola', emoji: '🚀' },
  { text: 'Videos, Audio, Imágenes, APK', emoji: '🎬' },
  { text: 'Todas las redes sociales', emoji: '🌐' },
  { text: 'Soporte prioritario', emoji: '🛟' },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { premium, setPremium, remainingDownloads } = useDownloadStore();
  const remaining = remainingDownloads();

  const handleMonthly = () => {
    // TODO: integrate RevenueCat
    // For now simulate
    setPremium(true);
    alert('✅ Suscripción activada (demo). Integración RevenueCat pendiente.');
  };

  const handleYearly = () => {
    setPremium(true);
    alert('✅ Suscripción anual activada (demo). Integración RevenueCat pendiente.');
  };

  const handleRestore = () => {
    alert('Restaurando compras... (integración RevenueCat pendiente)');
  };

  if (premium.isPremium) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.activePremiumContainer}>
          <LinearGradient
            colors={['rgba(255,184,0,0.15)', 'transparent']}
            style={styles.premiumGlow}
          />
          <Text style={styles.premiumActiveEmoji}>⭐</Text>
          <Text style={styles.premiumActiveTitle}>¡Ya eres Premium!</Text>
          <Text style={styles.premiumActiveText}>
            Disfruta de descargas ilimitadas sin restricciones
          </Text>
          <View style={styles.activeFeatures}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.activeFeatureRow}>
                <Text style={styles.activeFeatureEmoji}>{f.emoji}</Text>
                <Text style={styles.activeFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancelar suscripción</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(255,184,0,0.2)', 'transparent']}
            style={styles.headerGlow}
          />
          <Text style={styles.starEmoji}>⭐</Text>
          <Text style={styles.headerTitle}>DeskLoad Premium</Text>
          <Text style={styles.headerSub}>Sin límites. Sin restricciones.</Text>

          {/* Current usage */}
          <View style={styles.usagePill}>
            <View style={styles.usageBar}>
              <View style={[
                styles.usageFill,
                {
                  width: `${Math.max(0, Math.min(100, (1 - remaining / premium.dailyLimit) * 100))}%`,
                  backgroundColor: remaining <= 2 ? Colors.error : Colors.warning,
                },
              ]} />
            </View>
            <Text style={styles.usageText}>
              {remaining > 0
                ? `${remaining} de ${premium.dailyLimit} descargas disponibles hoy`
                : '⚠️ Límite diario alcanzado'
              }
            </Text>
          </View>
        </View>

        {/* Comparison table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué incluye cada plan?</Text>
          <View style={styles.comparisonTable}>
            {/* Header row */}
            <View style={styles.tableHeader}>
              <View style={{ flex: 2 }} />
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Gratis</Text>
              </View>
              <LinearGradient colors={Colors.gradientPremium} style={styles.tableHeaderPremium}>
                <Text style={styles.tableHeaderPremiumText}>Premium</Text>
              </LinearGradient>
            </View>

            {FREE_FEATURES.map((f) => (
              <View key={f.text} style={styles.tableRow}>
                <Text style={styles.tableFeatureText}>{f.text}</Text>
                <View style={styles.tableCell}>
                  {f.included
                    ? <CheckIcon color={Colors.success} />
                    : <LockIcon color={Colors.textMuted} />
                  }
                </View>
                <View style={styles.tableCell}>
                  <CheckIcon color={Colors.premium} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elige tu plan</Text>

          {/* Annual — recommended */}
          <Pressable style={styles.pricingCardFeatured} onPress={handleYearly}>
            <LinearGradient
              colors={Colors.gradientPremium}
              style={styles.pricingGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>⭐ RECOMENDADO</Text>
              </View>
              <Text style={styles.planName}>Anual</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>$19.99</Text>
                <Text style={styles.pricePeriod}>/año</Text>
              </View>
              <Text style={styles.priceNote}>≈ $1.67/mes · Ahorra 44%</Text>
            </LinearGradient>
          </Pressable>

          {/* Monthly */}
          <Pressable style={styles.pricingCard} onPress={handleMonthly}>
            <View style={styles.pricingCardInner}>
              <Text style={styles.planName}>Mensual</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmountAlt}>$2.99</Text>
                <Text style={[styles.pricePeriod, { color: Colors.textSecondary }]}>/mes</Text>
              </View>
              <Text style={[styles.priceNote, { color: Colors.textMuted }]}>Cancela cuando quieras</Text>
            </View>
          </Pressable>
        </View>

        {/* Feature highlights */}
        <View style={styles.section}>
          <View style={styles.featureHighlights}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIconBg}>
                  <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
                <CheckIcon color={Colors.premium} />
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={handleRestore}>
            <Text style={styles.restoreText}>Restaurar compras</Text>
          </Pressable>
          <Text style={styles.legalText}>
            El pago se cargará a tu cuenta de App Store / Google Play.{'\n'}
            Puedes cancelar en cualquier momento desde los ajustes de tu tienda.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 40 },

  header: {
    alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg, paddingBottom: Spacing.lg,
    position: 'relative', overflow: 'hidden', gap: 8,
  },
  headerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200,
  },
  starEmoji: { fontSize: 52 },
  headerTitle: {
    fontSize: Typography.size.xxxl, fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary, textAlign: 'center',
  },
  headerSub: { fontSize: Typography.size.lg, color: Colors.textSecondary, textAlign: 'center' },
  usagePill: {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, gap: 8, borderWidth: 1, borderColor: Colors.border, marginTop: 8,
  },
  usageBar: {
    height: 6, backgroundColor: Colors.bgSurface, borderRadius: 3, overflow: 'hidden',
  },
  usageFill: { height: '100%', borderRadius: 3 },
  usageText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.size.lg, fontWeight: Typography.weight.bold,
    color: Colors.textPrimary, marginBottom: 4,
  },

  // Comparison table
  comparisonTable: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  tableHeader: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tableHeaderCell: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },
  tableHeaderText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tableHeaderPremium: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderLeftWidth: 1, borderLeftColor: Colors.border,
  },
  tableHeaderPremiumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border + '80',
    paddingVertical: 10, paddingHorizontal: Spacing.md,
  },
  tableFeatureText: { flex: 2, color: Colors.textSecondary, fontSize: 13 },
  tableCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Pricing cards
  pricingCardFeatured: {
    borderRadius: Radius.lg, overflow: 'hidden',
    shadowColor: Colors.premium, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  pricingGradient: { padding: Spacing.lg, gap: 4, alignItems: 'center' },
  recommendedBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 8,
  },
  recommendedText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  planName: { color: '#fff', fontSize: Typography.size.xl, fontWeight: Typography.weight.bold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceAmount: { color: '#fff', fontSize: 40, fontWeight: Typography.weight.extrabold },
  priceAmountAlt: { color: Colors.textPrimary, fontSize: 40, fontWeight: Typography.weight.extrabold },
  pricePeriod: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.size.lg },
  priceNote: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  pricingCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  pricingCardInner: { padding: Spacing.lg, gap: 4, alignItems: 'center' },

  // Feature highlights
  featureHighlights: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border + '60',
  },
  featureIconBg: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.premium + '18', justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1, color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: '500' },

  footer: { alignItems: 'center', gap: 12, marginTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  restoreText: { color: Colors.primary, fontSize: 14, textDecorationLine: 'underline' },
  legalText: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // Active premium
  activePremiumContainer: { alignItems: 'center', padding: Spacing.lg, gap: 16, paddingBottom: 40 },
  premiumGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
  },
  premiumActiveEmoji: { fontSize: 72 },
  premiumActiveTitle: {
    fontSize: 32, fontWeight: Typography.weight.extrabold,
    color: Colors.premium,
  },
  premiumActiveText: { fontSize: Typography.size.lg, color: Colors.textSecondary, textAlign: 'center' },
  activeFeatures: {
    width: '100%', backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.premium + '30', overflow: 'hidden',
  },
  activeFeatureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '60',
  },
  activeFeatureEmoji: { fontSize: 20 },
  activeFeatureText: { flex: 1, color: Colors.textPrimary, fontSize: Typography.size.md },
  cancelBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.error + '50',
  },
  cancelBtnText: { color: Colors.error, fontSize: 14 },
});
