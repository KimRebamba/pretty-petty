def fix_html(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    new_lines = []
    i = 0
    changed = False
    while i < len(lines):
        line = lines[i]
        if 'QUIZ 5 REQUIREMENT: Search / Autocomplete' in line:
            # Replace this line and skip until the closing </div>
            new_lines.append('    <!-- Search -->\n')
            # Find the closing </div> for the search div
            i += 1  # skip comment line
            # Skip old <div style="position...">
            i += 1  # skip <div>
            # Now add new content
            new_lines.append('    <div>\n')
            new_lines.append('        <label for="search-input">Search Products:</label>\n')
            new_lines.append('        <input type="text" id="search-input" name="search" placeholder="Search for pet food, toys, etc..." autocomplete="off">\n')
            # Skip until </div>
            while i < len(lines):
                if '</div>' in lines[i] and 'search-results-dropdown' not in lines[i]:
                    new_lines.append('    </div>\n')
                    i += 1
                    break
                i += 1
            changed = True
        else:
            new_lines.append(line)
            i += 1

    if changed:
        with open(filepath, 'w', newline='') as f:
            f.writelines(new_lines)
        print(f'{filepath} updated')
    else:
        print(f'{filepath} - no changes needed')

fix_html('views/index.html')
fix_html('views/products.html')
