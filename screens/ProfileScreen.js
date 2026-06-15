import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LogoutButton } from '../components/LogoutButton';
import { useExperience } from '../context/ExpContext';

const RESTAURANTS_SAVED = 12;
const SUGGESTIONS_SHARED = 3;

const MENU_ITEMS = [
  { id: 'macro-goals', label: 'Set Macro Goals', icon: 'fitness-outline' },
  { id: 'saved-locations', label: 'Saved Locations', icon: 'bookmark-outline' },
  { id: 'contributions', label: 'My Contributions', icon: 'chatbubble-ellipses-outline' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

function handleMenuPress(item, onOpenMacroGoals) {
  if (item.id === 'macro-goals') {
    onOpenMacroGoals?.();
    return;
  }

  // Placeholder handlers — wire up navigation or auth flows later.
  console.log(`[ProfileScreen] ${item.label} pressed`);
}

export function ProfileScreen({ onOpenMacroGoals }) {
  const { exp, levelProgress } = useExperience();
  const progressPercent = Math.round(levelProgress.progress * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.expDebug}>DEBUG exp state: {exp}</Text>

        <View style={styles.card}>
          <View style={styles.headerSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#8E8E93" />
            </View>
            <Text style={styles.displayName}>Student User</Text>
            <Text style={styles.levelLabel}>
              Level {levelProgress.level}: {levelProgress.title}
            </Text>

            <View style={styles.expSection}>
              <View style={styles.expHeader}>
                <Text style={styles.expLabel}>Experience</Text>
                <Text style={styles.expValue}>{exp} EXP</Text>
              </View>
              <View style={styles.expTrack}>
                <View style={[styles.expFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.expHint}>
                {levelProgress.isMaxLevel
                  ? 'Max level reached — keep exploring!'
                  : `${levelProgress.expToNext} EXP to Level ${levelProgress.level + 1}`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.statValue}>{RESTAURANTS_SAVED}</Text>
            <Text style={styles.statLabel}>Restaurants Saved</Text>
          </View>
          <View style={[styles.card, styles.statCard]}>
            <Text style={styles.statValue}>{SUGGESTIONS_SHARED}</Text>
            <Text style={styles.statLabel}>Suggestions Shared</Text>
          </View>
        </View>

        <View style={styles.card}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item, onOpenMacroGoals)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Ionicons name={item.icon} size={20} color="#0F1E3A" />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
            </View>
          ))}
          <View style={styles.menuDivider} />
          <LogoutButton variant="menu" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  expDebug: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7A66',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F1E3A',
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFC857',
  },
  expSection: {
    width: '100%',
    gap: 8,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  expValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1E3A',
  },
  expTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  expFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#43B06A',
  },
  expHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1E3A',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F1E3A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F1E3A',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 14,
    marginLeft: 32,
  },
});
