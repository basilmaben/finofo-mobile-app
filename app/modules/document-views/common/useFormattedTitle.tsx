import { useTheme } from "react-native-paper";
import { StyleSheet, Text, View } from "react-native";
import { getFilename } from "./filename";

export const useFormattedTitle = () => {
  const theme = useTheme();
  return (label: string, url?: string | null, number?: string | null) => {
    const topRow = number
      ? (
        <View style={styles.topRow}>
          <Text style={{...styles.labelText, color: theme.colors.secondary}}>{label}{' '}</Text>
          <Text style={{...styles.mainText, color: theme.colors.primary}}>{'#'}{number}</Text>
        </View>
      )
      : (
        <View style={styles.topRow}>
          <Text style={{...styles.missingText, color: theme.colors.secondary}}>- No {label} # -</Text>
        </View>
      );
    return (
      <View style={styles.container}>
        {topRow}
        <View style={styles.bottomRow}>
          <Text>
            {getFilename(url)}
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  bottomRow: {
    flex: 1
  },
  topRow: {
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    paddingBottom: 3
  },
  mainText: {
    fontWeight: '600',
    letterSpacing: 1,
  },
  labelText: {
    fontWeight: '100'
  },
  missingText: {
    fontWeight: '100',
    fontStyle: 'italic',
  }
})