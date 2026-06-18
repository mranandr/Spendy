import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useFinanceStore } from '../../store/financeStore';
import { View, Text, Icon } from '../../components/primitives';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { resetAllData } = useFinanceStore();
  
  // Theme Toggle Store hooks
  const { colorScheme, setTheme } = useThemeStore();
  const isDarkMode = colorScheme === 'dark';

  // Local switch settings states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);

  const handleToggleTheme = (nextValue: boolean) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setTheme(nextValue ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    await logout();
    router.replace('/auth/login' as any);
  };

  const handleResetData = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    resetAllData();
  };
  const initials = (user?.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const settingsItems = [
    { 
      icon: 'bell', 
      iconColor: '#3B82F6', 
      label: 'Push Notifications', 
      type: 'switch', 
      value: pushEnabled, 
      onValueChange: (val: boolean) => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        setPushEnabled(val);
      }
    },
    { 
      icon: 'shield', 
      iconColor: '#10B981', 
      label: 'FaceID Biometrics', 
      type: 'switch', 
      value: faceIdEnabled, 
      onValueChange: (val: boolean) => {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        setFaceIdEnabled(val);
      }
    },
    { icon: 'globe', iconColor: '#F59E0B', label: 'Currency', type: 'text', value: 'INR (₹)' },
    { icon: 'database', iconColor: '#8B5CF6', label: 'Cloud Backups', type: 'link' },
    { icon: 'trash-2', iconColor: '#EF4444', label: 'Reset App Data', type: 'button', onPress: handleResetData },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1" style={{ fontWeight: '800' }}>
          Settings
        </Text>
      </View>

      {/* Profile Overview Card */}
      <View style={styles.profileSection}>
        <View 
          style={[
            styles.profileCard, 
            { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border 
            }
          ]}
        >
          {/* Avatar circle */}
          <View center style={[styles.avatarCircle, { backgroundColor: theme.colors.accent + '20' }]}>
            <Text variant="h2" style={{ fontWeight: '900', color: theme.colors.accent }}>{initials}</Text>
          </View>
          
          <Text variant="h2" style={{ fontWeight: '800', marginTop: 12 }}>
            {user?.name ?? 'User'}
          </Text>
          <Text variant="caption" color="secondary" style={{ marginTop: 2, fontWeight: '600' }}>
            {user?.email ?? '-'}
          </Text>

          {/* Elite Tier Badge */}
          <View row center style={[styles.tierBadge, { backgroundColor: theme.colors.accent + '15' }]}>
            <Icon name="award" size="sm" color="accent" style={{ marginRight: 6 }} />
            <Text variant="label" color="accent" style={{ fontWeight: '800', fontSize: 9 }}>
              ELITE FINANCIAL TIER
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Options Group */}
      <View style={styles.sectionContainer}>
        <Text variant="bodySmall" color="secondary" style={styles.sectionTitle}>
          Preferences
        </Text>
        
        <View style={[styles.settingsList, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          
          {/* Theme mode toggle custom item */}
          <View row center={false} style={[styles.itemRow, { borderBottomColor: theme.colors.border + '30' }]}>
            <View row center={false} style={styles.itemLeft}>
              <View center style={[styles.iconCircle, { backgroundColor: '#EC489915' }]}>
                <Icon name="moon" size="sm" color="#EC4899" />
              </View>
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent + '60' }}
              thumbColor={isDarkMode ? theme.colors.accent : theme.colors.text.tertiary}
              style={styles.switch}
            />
          </View>

          {settingsItems.map((item, idx) => {
            const isLast = idx === settingsItems.length - 1;
            
            return (
              <TouchableOpacity 
                key={idx} 
                activeOpacity={0.8}
                disabled={item.type === 'switch' || item.type === 'text'}
                onPress={item.onPress}
                style={[
                  styles.itemRow, 
                  !isLast && { borderBottomColor: theme.colors.border + '30' }
                ]}
              >
                <View row center={false} style={styles.itemLeft}>
                  <View center style={[styles.iconCircle, { backgroundColor: item.iconColor + '15' }]}>
                    <Icon name={item.icon} size="sm" color={item.iconColor} />
                  </View>
                  <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                    {item.label}
                  </Text>
                </View>

                {item.type === 'switch' ? (
                  <Switch
                    value={item.value as boolean}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent + '60' }}
                    thumbColor={theme.colors.accent}
                    style={styles.switch}
                  />
                ) : item.type === 'text' ? (
                  <Text variant="caption" color="secondary" style={{ fontWeight: '700' }}>
                    {item.value}
                  </Text>
                ) : (
                  <Icon name="chevron-right" size="sm" color="secondary" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Logout Action Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: theme.colors.expense + '12', borderColor: theme.colors.expense + '30' }]}
        >
          <Icon name="log-out" size="sm" color="expense" style={{ marginRight: 8 }} />
          <Text variant="bodySmall" color="expense" style={{ fontWeight: '700' }}>
            Logout Workspace
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsList: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  itemRow: {
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
