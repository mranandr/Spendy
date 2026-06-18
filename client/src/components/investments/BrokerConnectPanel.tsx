import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../../theme/tokens';
import { View, Text, Pressable } from '../primitives';
import {
  getZerodhaLoginUrl,
  syncZerodhaWithRequestToken,
  syncGroww,
  refreshZerodhaFromServer,
  getBrokerStatus,
  getApiErrorMessage,
} from '../../services/api';
import { useBrokerStore } from '../../store/brokerStore';
import { useFinanceStore } from '../../store/financeStore';

WebBrowser.maybeCompleteAuthSession();

function parseRequestToken(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const q = parsed.queryParams?.request_token;
    if (typeof q === 'string') return q;
    if (Array.isArray(q) && q[0]) return q[0];
    const match = url.match(/request_token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function BrokerConnectPanel() {
  const theme = useTheme();
  const [growwTokenInput, setGrowwTokenInput] = useState('');
  const [loading, setLoading] = useState<'zerodha' | 'groww' | null>(null);
  const { zerodhaConnected, growwConnected, setStatus, markSynced, lastSyncedAt } = useBrokerStore();
  const { mergeInvestmentsByProvider } = useFinanceStore();

  useEffect(() => {
    getBrokerStatus()
      .then((s) => setStatus(s.zerodha, s.groww))
      .catch(() => {});
  }, [setStatus]);

  const connectZerodha = async () => {
    setLoading('zerodha');
    try {
      const { loginUrl, redirectUrl } = await getZerodhaLoginUrl();
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUrl);
      if (result.type !== 'success' || !result.url) {
        Alert.alert('Zerodha', 'Login was cancelled or did not return a token.');
        return;
      }
      const requestToken = parseRequestToken(result.url);
      if (!requestToken) {
        Alert.alert('Zerodha', 'Could not read request_token from redirect URL.');
        return;
      }
      const data = await syncZerodhaWithRequestToken(requestToken);
      mergeInvestmentsByProvider('zerodha', data.holdings);
      setStatus(true, growwConnected);
      markSynced();
      Alert.alert('Zerodha', `Synced ${data.holdings.length} holdings.`);
    } catch (e: unknown) {
      Alert.alert('Zerodha error', getApiErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  const refreshZerodha = async () => {
    if (!zerodhaConnected) return connectZerodha();
    setLoading('zerodha');
    try {
      const data = await refreshZerodhaFromServer();
      mergeInvestmentsByProvider('zerodha', data.holdings);
      markSynced();
      Alert.alert('Zerodha', `Refreshed ${data.holdings.length} holdings.`);
    } catch {
      setStatus(false, growwConnected);
      await connectZerodha();
    } finally {
      setLoading(null);
    }
  };

  const connectGroww = async () => {
    const token = growwTokenInput.trim();
    setLoading('groww');
    try {
      const data = await syncGroww(token || undefined);
      mergeInvestmentsByProvider('groww', data.holdings);
      setStatus(zerodhaConnected, true);
      markSynced();
      Alert.alert('Groww', `Synced ${data.holdings.length} holdings.`);
    } catch (e: unknown) {
      Alert.alert('Groww error', getApiErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text variant="caption" color="secondary" style={styles.label}>
        Broker connections
      </Text>
      <View row style={styles.row}>
        <Pressable
          onPress={zerodhaConnected ? refreshZerodha : connectZerodha}
          style={[styles.btn, { backgroundColor: '#0052cc22', borderColor: '#0052cc' }]}
        >
          {loading === 'zerodha' ? (
            <ActivityIndicator color="#0052cc" />
          ) : (
            <Text variant="bodySmall" style={{ color: '#0052cc', fontWeight: '700' }}>
              {zerodhaConnected ? 'Refresh Zerodha' : 'Connect Zerodha'}
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={connectGroww}
          style={[styles.btn, { backgroundColor: '#00d09c22', borderColor: '#00d09c' }]}
        >
          {loading === 'groww' ? (
            <ActivityIndicator color="#00d09c" />
          ) : (
            <Text variant="bodySmall" style={{ color: '#00d09c', fontWeight: '700' }}>
              {growwConnected ? 'Sync Groww' : 'Connect Groww'}
            </Text>
          )}
        </Pressable>
      </View>
      <TextInput
        placeholder="Optional: Groww access token (or use server API key/secret)"
        placeholderTextColor={theme.colors.textSecondary}
        value={growwTokenInput}
        onChangeText={setGrowwTokenInput}
        secureTextEntry
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        ]}
      />
      {lastSyncedAt ? (
        <Text variant="caption" color="secondary">
          Last sync: {new Date(lastSyncedAt).toLocaleString('en-IN')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
});
