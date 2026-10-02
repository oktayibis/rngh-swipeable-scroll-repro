# RNGH ReanimatedSwipeable Android scroll repro

Minimal repro: on Android, a long `FlatList` (300 rows) where every row is wrapped in
`ReanimatedSwipeable` scrolls with jank/freezes and sometimes drops taps on
react-native-gesture-handler 3.2.x / 3.3.0. It works on 3.0.2. iOS is not affected.

## Versions

- react-native 0.86.3 (New Architecture + Hermes)
- react-native-gesture-handler 3.3.0
- react-native-reanimated 4.5.0
- react-native-worklets 0.10.2

## Steps to reproduce

1. `npm install`
2. Connect a real Android device and run `npx react-native run-android --mode release`
3. Scroll fast up and down for ~10 s, tap rows while scrolling and right after a fling stops.
4. Watch the "Taps registered" counter in the header.

**Expected:** smooth scrolling, every tap counted.
**Actual:** stutter/freezes, some taps are not registered.

Compare with 3.0.2: `npm install react-native-gesture-handler@3.0.2 --save-exact` and rebuild.

## Results

_To be filled in._
