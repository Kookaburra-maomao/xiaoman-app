import CustomTabBar from '@/components/custom-tab-bar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="record"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="record"
        options={{
          title: '记录',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '对话',
        }}
      />
      <Tabs.Screen
        name="future"
        options={{
          title: '计划',
        }}
      />
    </Tabs>
  );
}

