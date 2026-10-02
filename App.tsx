import React from 'react';
import { Animated, Pressable, RefreshControl, StatusBar, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const RNGH_VERSION: string = require('react-native-gesture-handler/package.json').version;

const PRIMARY = '#3f3d9e';
const COLLAPSING_HEADER_HEIGHT = 120;
const ROW_COUNT = 1000;
const INITIAL_DATA = Array.from({ length: ROW_COUNT }, (_, i) => ({ id: String(i) }));

const ACTION_WIDTH = 64;

type ActionProps = {
  label: string;
  color: string;
  index: number;
  count: number;
  progress: SharedValue<number>;
  onPress: () => void;
};

function Action({ label, color, index, count, progress, onPress }: ActionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [ACTION_WIDTH * (count - index), 0]) }],
  }));
  return (
    <Reanimated.View style={[styles.action, { backgroundColor: color }, animatedStyle]}>
      <Pressable style={styles.actionPressable} onPress={onPress}>
        <Text style={styles.actionText}>{label}</Text>
      </Pressable>
    </Reanimated.View>
  );
}

type RightActionsProps = {
  pinned: boolean;
  onPin: () => void;
  onDelete: () => void;
  progress: SharedValue<number>;
  methods: SwipeableMethods;
};

function RightActions({ pinned, onPin, onDelete, progress, methods }: RightActionsProps) {
  return (
    <View style={styles.actions}>
      <Action
        label={pinned ? 'Unpin' : 'Pin'}
        color={PRIMARY}
        index={0}
        count={3}
        progress={progress}
        onPress={() => {
          onPin();
          methods.close();
        }}
      />
      <Action label="Archive" color="#00897b" index={1} count={3} progress={progress} onPress={onDelete} />
      <Action label="Delete" color="#d32f2f" index={2} count={3} progress={progress} onPress={onDelete} />
    </View>
  );
}

const ACCESSIBILITY_ACTIONS = [{ name: 'escape' }];
const TAGS = ['alpha', 'beta', 'gamma', 'delta'];
const COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8'];

type RowProps = {
  id: string;
  pinned: boolean;
  onPress: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
};

const Row = React.memo(function SwipeableRow({ id, pinned, onPress, onPin, onDelete }: RowProps) {
  const n = Number(id);
  const swipeableRef = React.useRef<SwipeableMethods>(null);
  const onAccessibilityAction = React.useCallback(() => swipeableRef.current?.close(), []);
  const renderRightActions = React.useCallback(
    (progress: SharedValue<number>, _translation: SharedValue<number>, methods: SwipeableMethods) => (
      <RightActions
        pinned={pinned}
        onPin={() => onPin(id)}
        onDelete={() => onDelete(id)}
        progress={progress}
        methods={methods}
      />
    ),
    [id, pinned, onPin, onDelete],
  );
  return (
    <View accessibilityActions={ACCESSIBILITY_ACTIONS} onAccessibilityAction={onAccessibilityAction}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
        overshootRight={false}>
      <TouchableHighlight underlayColor="#eee" onPress={() => onPress(id)} testID={`row-${id}`}>
        <View style={[styles.row, pinned && styles.rowPinned]}>
          <View style={[styles.avatar, { backgroundColor: COLORS[n % COLORS.length] }]}>
            <Text style={styles.avatarText}>{id.slice(-2)}</Text>
          </View>
          <View style={styles.body}>
            <View style={styles.titleLine}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                Row {id}
                {pinned ? '  📌' : ''}
              </Text>
              <Text style={styles.time}>{`${(n % 12) + 1}:${String((n * 7) % 60).padStart(2, '0')} PM`}</Text>
            </View>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              Swipe left for actions, tap to count
            </Text>
            <Text style={styles.preview} numberOfLines={2}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
              et dolore magna aliqua.
            </Text>
            <View style={styles.tags}>
              {TAGS.map((tag, i) => (
                <View key={tag} style={[styles.tag, { borderColor: COLORS[(n + i) % COLORS.length] }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.trailing}>
            <View style={[styles.badge, n % 3 === 0 && styles.badgeHidden]}>
              <Text style={styles.badgeText}>{(n % 9) + 1}</Text>
            </View>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {}}>
              <View style={styles.iconDot} />
              <View style={styles.iconDot} />
              <View style={styles.iconDot} />
            </Pressable>
          </View>
        </View>
      </TouchableHighlight>
      </Swipeable>
    </View>
  );
});

export default function App() {
  const [taps, setTaps] = React.useState(0);
  const [lastTapped, setLastTapped] = React.useState<string | null>(null);

  const [data, setData] = React.useState(INITIAL_DATA);
  const [pinnedIds, setPinnedIds] = React.useState<ReadonlySet<string>>(new Set());

  const onPin = React.useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const onDelete = React.useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  }, []);

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const onScroll = React.useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, COLLAPSING_HEADER_HEIGHT],
    outputRange: [0, -COLLAPSING_HEADER_HEIGHT],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSING_HEADER_HEIGHT * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const onPress = React.useCallback((id: string) => {
    setTaps(count => count + 1);
    setLastTapped(id);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <View>
            <Text style={styles.topBarTitle}>Swipeable list</Text>
            <Text style={styles.topBarSubtitle}>{data.length} rows · RNGH {RNGH_VERSION}</Text>
          </View>
          <View style={styles.counterChip}>
            <Text style={styles.counterLabel}>Taps</Text>
            <Text style={styles.counterValue}>{taps}</Text>
          </View>
        </View>
        <Text style={styles.topBarStatus}>
          Taps registered: {taps}
          {lastTapped !== null ? ` (last: row ${lastTapped})` : ''}
        </Text>
      </View>
      <View style={styles.listContainer}>
        <Animated.FlatList
          data={data}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={COLLAPSING_HEADER_HEIGHT}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Row id={item.id} pinned={pinnedIds.has(item.id)} onPress={onPress} onPin={onPin} onDelete={onDelete} />
          )}
          ItemSeparatorComponent={Separator}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.collapsingHeader, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
          <Text style={styles.collapsingTitle}>Collapsing header</Text>
          <Text style={styles.collapsingSubtitle}>Fades and slides away as you scroll</Text>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5fa' },
  topBar: {
    paddingTop: (StatusBar.currentHeight ?? 24) + 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: PRIMARY,
    elevation: 6,
  },
  topBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarTitle: { fontSize: 22, fontWeight: '700', color: 'white' },
  topBarSubtitle: { marginTop: 2, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  topBarStatus: { marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  counterChip: {
    minWidth: 64,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  counterLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  counterValue: { fontSize: 20, fontWeight: '700', color: 'white' },
  row: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'white' },
  rowPinned: { backgroundColor: '#f0efff' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700' },
  body: { flex: 1, marginHorizontal: 12 },
  titleLine: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 12, color: '#888' },
  preview: { marginTop: 4, fontSize: 13, color: '#444' },
  tags: { flexDirection: 'row', marginTop: 8 },
  tag: { borderWidth: 1, borderRadius: 10, backgroundColor: '#fafaff', paddingHorizontal: 8, paddingVertical: 2, marginRight: 6 },
  tagText: { fontSize: 11, color: '#333' },
  trailing: { alignItems: 'center', justifyContent: 'space-between' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#d32f2f', alignItems: 'center' },
  badgeHidden: { opacity: 0 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  iconButton: { padding: 4 },
  iconDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#666', marginVertical: 1 },
  rowTitle: { fontSize: 16, flexShrink: 1 },
  rowSubtitle: { marginTop: 2, fontSize: 12, color: '#666' },
  listContainer: { flex: 1 },
  listContent: { paddingTop: COLLAPSING_HEADER_HEIGHT },
  collapsingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COLLAPSING_HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#e8e7fb',
  },
  collapsingTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  collapsingSubtitle: { marginTop: 4, fontSize: 13, color: '#555' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#d9d9e3' },
  actions: { width: ACTION_WIDTH * 3, flexDirection: 'row' },
  action: { width: ACTION_WIDTH },
  actionPressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: 'white', fontWeight: '600' },
});
