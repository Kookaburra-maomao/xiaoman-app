lines = open('components/chat/MessageItem.tsx').readlines()
new_section = [
    '  const isActionable = !isDiaryCard && !!message.text && !message.imageUrl;\n',
    '\n',
    '  return (\n',
    '    <View style={containerStyle}>\n',
    '      {isUserMessage && message.timestamp && (\n',
    '        <Text style={styles.messageTimestamp} allowFontScaling={false}>\n',
    '          {message.timestamp}\n',
    '        </Text>\n',
    '      )}\n',
    '      {isActionable ? (\n',
    '        <TouchableOpacity\n',
    '          style={bubbleStyle}\n',
    '          onLongPress={onLongPress}\n',
    '          delayLongPress={400}\n',
    '          activeOpacity={0.8}\n',
    '        >\n',
    '          {renderContent()}\n',
    '        </TouchableOpacity>\n',
    '      ) : (\n',
    '        <View style={bubbleStyle}>\n',
    '          {renderContent()}\n',
    '        </View>\n',
    '      )}\n',
    '    </View>\n',
    '  );\n',
]
result = lines[:109] + new_section + lines[155:]
open('components/chat/MessageItem.tsx', 'w').writelines(result)
print('done')
