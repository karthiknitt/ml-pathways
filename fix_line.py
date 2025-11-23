with open('src/app/workspace/[experimentId]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 695 (index 694) should have the template literal
# Current: {typeof col === 'string' ? col : col.name || }
# Target: {typeof col === 'string' ? col : col.name || `Column ${idx + 1}`}

# Build the correct line
correct_line = "                        {typeof col === 'string' ? col : col.name || `Column ${idx + 1}`}\n"

# Replace line 695 (index 694)
lines[694] = correct_line

with open('src/app/workspace/[experimentId]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Line 695 fixed!')
print('New content:', lines[694].strip())
