lines = open('components/chat/MessageItem.tsx').readlines()
# Find and remove copyButton styles (lines 225-241, 0-indexed 224-240)
# Keep the closing });
result = lines[:224] + ['});\n']
open('components/chat/MessageItem.tsx', 'w').writelines(result)
print('done')
