import { Pressable as RNPressable } from 'react-native';
import AnimatedCore, { createAnimatedComponent } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const View = withUniwind(AnimatedCore.View);
const Text = withUniwind(AnimatedCore.Text);
const AnimatedPressable = createAnimatedComponent(RNPressable);
const Pressable = withUniwind(AnimatedPressable);
const ScrollView = withUniwind(AnimatedCore.ScrollView);
const FlatList = withUniwind(AnimatedCore.FlatList);

export const Animated = {
  ...AnimatedCore,
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
};
