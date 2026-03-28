import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
} from 'react-native';
import { withUniwind } from 'uniwind';

export const ActivityIndicator = withUniwind(RNActivityIndicator);
export const FlatList = withUniwind(RNFlatList);
export const KeyboardAvoidingView = withUniwind(RNKeyboardAvoidingView);
export const Pressable = withUniwind(RNPressable);
export const ScrollView = withUniwind(RNScrollView);
export const Text = withUniwind(RNText);
export const TextInput = withUniwind(RNTextInput);
export const View = withUniwind(RNView);
