#!/usr/bin/env python3
"""Apply dark mode CSS variable replacements to index.html"""

import re

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# CSS replacements mapping
replacements = [
    # Background replacements
    (r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.95\)', 'background: var(--card-bg)'),
    (r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.15\)', 'background: var(--card-bg-light)'),
    (r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.2\)', 'background: var(--card-bg-light)'),
    (r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.3\)', 'background: var(--card-bg-light)'),
    (r'background:\s*white;', 'background: var(--input-bg);'),
    (r'background:\s*#fff;', 'background: var(--input-bg);'),

    # Color replacements
    (r'color:\s*#333;', 'color: var(--text-primary);'),
    (r'color:\s*#666;', 'color: var(--text-secondary);'),

    # Border replacements
    (r'border:\s*1px solid #ddd;', 'border: 1px solid var(--input-border);'),
    (r'border-color:\s*#ddd;', 'border-color: var(--input-border);'),

    # Shadow replacements
    (r'box-shadow:\s*0 8px 32px rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: 0 8px 32px var(--shadow-color)'),
]

# Apply replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Add transition to all elements that change with theme
# Find the body::before section and add transitions
content = content.replace(
    'body::before {',
    '''body::before {
            transition: opacity 0.3s ease;'''
)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Dark mode CSS variables applied successfully!")
print("📊 Replacements made:")
for pattern, _ in replacements:
    count = len(re.findall(pattern, content))
    if count > 0:
        print(f"  - {pattern[:50]}... → {count} matches")
