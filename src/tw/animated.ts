import AnimatedCore from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const View = withUniwind(AnimatedCore.View);
const Text = withUniwind(AnimatedCore.Text);
const Pressable = withUniwind(AnimatedCore.Pressable);
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
