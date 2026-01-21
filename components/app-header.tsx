import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showStatusBar?: boolean;
}

export default function AppHeader({ title, subtitle, showStatusBar = false }: AppHeaderProps) {
  return (
    <>
      {!showStatusBar && <StatusBar hidden />}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
});

