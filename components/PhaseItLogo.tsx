import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function PhaseItLogo() {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🍲</Text>
      </View>
      <View>
        <Text style={styles.wordmark}>PhaseIt</Text>
        <Text style={styles.tagline}>Eat Smart, Stay on Track. We've Got You.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.muted,
    marginTop: 1,
    maxWidth: 200,
  },
});
