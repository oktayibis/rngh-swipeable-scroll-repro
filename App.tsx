import React from 'react';
import { FlatList, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const RNGH_VERSION: string = require('react-native-gesture-handler/package.json').version;

const ROW_COUNT = 300;
const DATA = Array.from({ length: ROW_COUNT }, (_, i) => ({ id: String(i) }));

function RightActions() {
  return (
    <View style={styles.actions}>
      <View style={[styles.action, styles.actionDelete]}>
        <Text style={styles.actionText}>Delete</Text>
      </View>
      <View style={[styles.action, styles.actionMore]}>
        <Text style={styles.actionText}>More</Text>
      </View>
    </View>
  );
}

const Row = React.memo(function SwipeableRow({ id, onPress }: { id: string; onPress: (id: string) => void }) {
  return (
    <Swipeable renderRightActions={RightActions} friction={2} rightThreshold={40} overshootRight={false}>
      <TouchableHighlight underlayColor="#eee" onPress={() => onPress(id)} testID={`row-${id}`}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Row {id}</Text>
          <Text style={styles.rowSubtitle}>Swipe left for actions, tap to count</Text>
        </View>
      </TouchableHighlight>
    </Swipeable>
  );
});

export default function App() {
  const [taps, setTaps] = React.useState(0);
  const [lastTapped, setLastTapped] = React.useState<string | null>(null);

  const onPress = React.useCallback((id: string) => {
    setTaps(count => count + 1);
    setLastTapped(id);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>react-native-gesture-handler {RNGH_VERSION}</Text>
        <Text style={styles.headerSubtitle}>
          Taps registered: {taps}
          {lastTapped !== null ? ` (last: row ${lastTapped})` : ''}
        </Text>
      </View>
      <FlatList
        data={DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Row id={item.id} onPress={onPress} />}
        ItemSeparatorComponent={Separator}
      />
    </GestureHandlerRootView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  header: { paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#f2f2f2' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSubtitle: { marginTop: 4, fontSize: 14 },
  row: { paddingVertical: 22, paddingHorizontal: 20, backgroundColor: 'white' },
  rowTitle: { fontSize: 16 },
  rowSubtitle: { marginTop: 2, fontSize: 12, color: '#666' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#ccc' },
  actions: { width: 160, flexDirection: 'row' },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionDelete: { backgroundColor: '#d32f2f' },
  actionMore: { backgroundColor: '#757575' },
  actionText: { color: 'white', fontWeight: '600' },
});
