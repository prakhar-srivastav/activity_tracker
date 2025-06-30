# Manual Edit Mode Guide

## Overview
The Manual Edit Mode allows you to set exact values for each activity in your tracker, making it easy to input precise data or quickly apply common activity patterns.

## Features

### 🎯 Manual Edit Mode
- **Purpose**: Set exact values for all activities
- **Activation**: Click "Manual Edit Mode" button or press `Ctrl/Cmd + E`
- **Visual Feedback**: Activities highlighted in yellow/orange theme
- **Behavior**: All quantity controls become visible, allowing precise value entry

### 🚀 Quick Presets
Pre-configured activity patterns for common scenarios:

1. **Productive Day**: High engineering focus with balanced health habits
   - Engineering: 8, Algorithm: 3, Water: 4L, Eggs: 6, etc.
   - Keyboard shortcut: `Ctrl/Cmd + 1` (in edit mode)

2. **Light Day**: Minimal activities with focus on rest
   - Engineering: 2, Water: 2L, Sleep: 9 hours, etc.
   - Keyboard shortcut: `Ctrl/Cmd + 2` (in edit mode)

3. **Health Focus**: Emphasis on physical wellness activities
   - Water: 5L, Eggs: 8, Runner: 1, Sleep: 8 hours, etc.
   - Keyboard shortcut: `Ctrl/Cmd + 3` (in edit mode)

### ⚡ Quick Input Modal
- **Purpose**: Rapid data entry via comma-separated values
- **Access**: Click "Quick Input" button or press `Ctrl/Cmd + Q` (in edit mode)
- **Format**: Enter 14 values separated by commas
- **Order**: Engineering, Algorithm, Teknokian, Runner, Water, Eggs, Caffeine, No Fear, Neem Tulsi, Green Tea, Meals, Sleep, Podcast, Finance
- **Example**: `8,3,2,1,4.5,6,2,1,1,3,3,8,2,1`

### 📋 Export Current Values
- **Purpose**: Copy current activity values to clipboard
- **Access**: Click "Export Values" button
- **Output**: Comma-separated string of all 14 activity values
- **Use Case**: Save configurations for later reuse or sharing

## How to Use

### Basic Manual Editing
1. Click "Manual Edit Mode" button
2. All activities become visible with quantity inputs
3. Set exact values for each activity
4. Click "Save Activities" when done OR click "Exit Edit Mode" (will prompt to save)
5. Exit edit mode by clicking "Exit Edit Mode" or use `Ctrl/Cmd + Shift + S` for quick save and exit

### Using Presets
1. Enter Manual Edit Mode
2. Select a preset from the dropdown
3. Values are automatically applied
4. Modify individual values if needed
5. Save when satisfied

### Quick Input Method
1. Enter Manual Edit Mode
2. Click "Quick Input" button
3. Enter 14 comma-separated values
4. Click "Apply Values"
5. Review and adjust if needed

### Exporting for Reuse
1. Set up your desired activity values
2. Click "Export Values"
3. Values are copied to clipboard
4. Paste into Quick Input for future use

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + E` | Toggle Manual Edit Mode |
| `Ctrl/Cmd + Q` | Open Quick Input Modal (edit mode) |
| `Ctrl/Cmd + 1` | Apply Productive Day preset (edit mode) |
| `Ctrl/Cmd + 2` | Apply Light Day preset (edit mode) |
| `Ctrl/Cmd + 3` | Apply Health Focus preset (edit mode) |
| `Ctrl/Cmd + Shift + S` | Save and Exit Edit Mode (edit mode) |
| `Escape` | Close Quick Input Modal |
| `Ctrl/Cmd + S` | Save Activities |
| `Ctrl/Cmd + R` | Clear Form |

## Tips and Best Practices

### Workflow Recommendations
1. **Daily Planning**: Use presets as starting points, then customize
2. **Consistent Patterns**: Export successful configurations for reuse
3. **Quick Updates**: Use Quick Input for routine daily entries
4. **Review Mode**: Exit edit mode to see clean summary view

### Value Guidelines
- **Water**: Liters (e.g., 3.5 for 3.5L)
- **Sleep**: Hours with decimals (e.g., 7.5 for 7 hours 30 minutes)
- **Engineering/Algorithm**: Hours or intensity scale (0-100)
- **Eggs**: Number of eggs consumed
- **Other Activities**: Use appropriate units or intensity scales

### Efficiency Tips
- Keep commonly used value strings saved externally
- Use presets as templates, not rigid patterns
- Regular export helps track personal patterns
- Combine keyboard shortcuts for faster workflow

## Troubleshooting

### Common Issues
- **Values not applying**: Ensure Manual Edit Mode is active
- **Modal not opening**: Try keyboard shortcut or refresh page
- **Export not working**: Check browser clipboard permissions
- **Preset not loading**: Clear form first, then apply preset

### Browser Compatibility
- Modern browsers support all features
- Clipboard functionality requires HTTPS in some browsers
- Keyboard shortcuts work in all major browsers

## Advanced Usage

### Custom Presets
You can create custom presets by modifying the `applyPreset()` function in the JavaScript code. Add your own preset patterns to the `presets` object.

### Bulk Operations
- Set all values to same number: Use browser console `setAllToValue(5)`
- Clear specific activities: Manually uncheck unwanted items
- Pattern application: Use Quick Input with repeated values

### Integration with Analytics
- Exported values can be analyzed in the Analytics section
- Look for patterns in your most successful days
- Use data to optimize preset configurations

---

**Note**: All manual edits follow the same save process as normal activity tracking, including auto-commit to Git and GitHub push functionality.
