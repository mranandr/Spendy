import React, { useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../theme/tokens';
import { View, Text, Pressable } from '../primitives';
import { useFinanceStore } from '../../store/financeStore';
import { fetchPortfolioInsights, getApiErrorMessage } from '../../services/api';
import type { AiProvider } from '../../types/portfolio';

export function PortfolioInsights() {
  const theme = useTheme();
  const { investments } = useFinanceStore();
  const [loading, setLoading] = useState<AiProvider | null>(null);
  const [claudeText, setClaudeText] = useState<string | null>(null);
  const [geminiText, setGeminiText] = useState<string | null>(null);

  const run = async (provider: AiProvider) => {
    if (investments.length === 0) {
      Alert.alert('Portfolio', 'Connect Zerodha or Groww and sync holdings first.');
      return;
    }
    setLoading(provider);
    try {
      const result = await fetchPortfolioInsights(provider, investments);
      if (provider === 'claude') setClaudeText(result.text);
      else setGeminiText(result.text);
    } catch (e: unknown) {
      Alert.alert('AI insights', getApiErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="caption" color="secondary" style={styles.label}>
        AI portfolio insights
      </Text>
      <View row style={styles.row}>
        <Pressable
          onPress={() => run('claude')}
          style={[styles.btn, { backgroundColor: theme.colors.accent + '18', borderColor: theme.colors.accent }]}
        >
          {loading === 'claude' ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.accent, fontWeight: '700' }}>
              Ask Claude
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => run('gemini')}
          style={[styles.btn, { backgroundColor: '#4285F418', borderColor: '#4285F4' }]}
        >
          {loading === 'gemini' ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <Text variant="bodySmall" style={{ color: '#4285F4', fontWeight: '700' }}>
              Ask Gemini
            </Text>
          )}
        </Pressable>
      </View>
      {(claudeText || geminiText) && (
        <ScrollView style={[styles.panel, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {claudeText ? (
            <View style={styles.block}>
              <Text variant="caption" color="secondary" style={styles.blockTitle}>
                Claude
              </Text>
              <Text variant="bodySmall">{claudeText}</Text>
            </View>
          ) : null}
          {geminiText ? (
            <View style={styles.block}>
              <Text variant="caption" color="secondary" style={styles.blockTitle}>
                Gemini
              </Text>
              <Text variant="bodySmall">{geminiText}</Text>
            </View>
          ) : null}
          <Text variant="caption" color="secondary" style={{ marginTop: 8, fontStyle: 'italic' }}>
            Educational only — not financial advice.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    maxHeight: 280,
  },
  block: {
    marginBottom: 10,
  },
  blockTitle: {
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontSize: 10,
  },
});
