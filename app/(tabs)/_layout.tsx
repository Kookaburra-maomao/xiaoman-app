import CustomTabBar from '@/components/custom-tab-bar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="record"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: false, // 禁用左右滑动切换标签页
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

