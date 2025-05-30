# ESI Filter - Task Prioritization System

A dynamic web-based task management application that helps you prioritize tasks using the **ESI (Excitement, Simplicity, Impact) scoring system**.

![ESI Filter Preview](https://img.shields.io/badge/Status-Complete-green)

## 🎯 What is ESI Filter?

ESI Filter is a task prioritization tool that helps you make better decisions about what to work on next. Instead of endless to-do lists, it uses a simple scoring system to automatically rank your tasks by priority.

### The ESI Scoring System

- **E**xcitement (1-5): How excited are you about this task?
- **S**implicity (1-5): How simple is this task to complete?
- **I**mpact (1-10): What impact will completing this task have?

Tasks are automatically sorted by their total ESI score, with higher scores indicating higher priority.

## ✨ Features

### 🧠 Brain Dump Interface
- Quick task entry - just type one task per line
- Clean, distraction-free input area
- Batch task creation

### 📊 Dynamic Prioritization
- Three-column layout that adapts based on your workflow
- Tasks automatically sorted by ESI score
- Visual priority indicators (🏆 Highest, 🥈 Second, 🥉 Third)

### 📝 Notes System
- Add detailed notes to any task
- Edit notes in both active and completed tasks
- Perfect for retrospectives and future planning

### 📅 Timeline Tracking
- See when tasks were originally added
- Track completion dates
- Full lifecycle visibility

### 🔄 Status Management
- Ready to Start → In Progress → Complete workflow
- Visual status indicators
- Clean task progression

### 💾 Data Persistence
- All data saved locally in your browser
- No account required
- Instant loading

## 🚀 Getting Started

### Quick Start
1. Clone this repository or download the files
2. Open `index.html` in your web browser
3. Start brain dumping your tasks!

### Usage
1. **Add Tasks**: Type your tasks in the "Brain Dump" box, one per line
2. **Rate Tasks**: Set Excitement (1-5), Simplicity (1-5), and Impact (1-10) for each task
3. **Work on Tasks**: Tasks are automatically sorted by priority - start with the highest!
4. **Track Progress**: Move tasks through Ready → In Progress → Complete
5. **Add Notes**: Click the note icon to add context, learnings, or next steps

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