# ESI Filter

A dynamic web-based task management application that helps you prioritize tasks using the **ESI (Energy, Simplicity, Impact) scoring system**.

![ESI Filter Preview](https://img.shields.io/badge/Status-Complete-green)

## Features

### 🚀 **Brain Dump**
- Add multiple tasks at once (one per line)
- Clean, intuitive text area interface
- Bulk task creation with automatic parsing

### 📊 **ESI Rating System**
- **Energy (1-5)**: How much energy does this task give you?
  - 5: Gives you energy/excitement
  - 3: Neutral energy impact  
  - 1: Completely drains you
- **Simplicity (1-5)**: How easy is this task to complete?
- **Impact (1-10)**: What's the potential positive impact?

### 🎯 **Smart Prioritization**
- Automatic scoring based on ESI formula
- Dynamic task reordering by priority
- Visual priority indicators

### ✅ **Task Management**
- Status tracking (Not Started → In Progress → Complete)
- Personal notes for each task
- Task deletion capabilities

### 🔍 **Reflection & Insights**
- Post-completion reflection prompts
- Compare predicted vs. actual experience
- Learning insights for better future predictions

## How to Use

1. **Brain Dump**: Enter all your tasks in the left column, one per line
2. **Rate Tasks**: Set Energy (1-5), Simplicity (1-5), and Impact (1-10) for each task
3. **Work on Tasks**: Follow the prioritized list, updating status as you progress
4. **Reflect**: After completing tasks, reflect on how they actually went vs. expectations

## Core Philosophy

The ESI Filter helps you identify tasks that are:
- **High Energy**: Tasks that energize rather than drain you
- **High Simplicity**: Tasks you can realistically complete
- **High Impact**: Tasks that actually move the needle

Perfect for those overwhelming days when you have too many tasks and can't decide where to start!

## Local Development

1. Clone this repository
2. Open `index.html` in your browser
3. Start organizing your tasks!

No build process or dependencies required - it's pure HTML, CSS, and JavaScript.

## 🏗️ Technical Details

### Built With
- **HTML5** - Semantic structure
- **CSS3** - Responsive grid layout, custom styling
- **Vanilla JavaScript** - No frameworks, just clean ES6+
- **LocalStorage** - Client-side data persistence

### Architecture
- **Dynamic Grid System**: Responsive 2/3-column layout
- **Component-based**: Modular task card components
- **Event-driven**: Efficient DOM manipulation
- **State Management**: Local storage with backward compatibility

## 🎨 Design Philosophy

- **Minimal & Clean**: Focus on functionality over fancy UI
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Keyboard shortcuts, proper ARIA labels
- **Progressive**: Features degrade gracefully

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Submit brain dump form
- `Escape`: Clear brain dump form

## 🔧 Browser Support

Works in all modern browsers that support:
- CSS Grid
- ES6+ JavaScript
- LocalStorage API

## 🤝 Contributing

This is a personal productivity tool, but if you have ideas for improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by productivity methodologies like Getting Things Done (GTD)
- ESI scoring system for rational task prioritization
- Clean, modern web design principles

---

**Start prioritizing smarter, not harder!** 🚀