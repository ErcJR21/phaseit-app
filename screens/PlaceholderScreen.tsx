import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type PlaceholderScreenProps = {
  title: string;
};

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming soon in PhaseIt</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
});
