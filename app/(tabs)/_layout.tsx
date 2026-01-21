import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/custom-tab-bar';

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
        name="plan"
        options={{
          title: '计划',
        }}
      />
    </Tabs>
  );
}

