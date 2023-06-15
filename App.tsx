import { StyleSheet, Text, View, StatusBar } from 'react-native';
import Account from './components/Account';

export default function App() {

  return (
    <>
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navigationBar}>
        <Text style={styles.title}>我的錢包</Text>
      </View>
      <Account />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationBar: {
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});
