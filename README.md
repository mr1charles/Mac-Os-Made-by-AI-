# MacWebOS (HTML macOS-style Desktop)

A browser-based desktop operating system inspired by macOS. Everything runs as static HTML/CSS/JS and can be opened locally.

## Run locally

1. Download or clone the repository.
2. Open `MacWebOS/index.html` in a browser.

## Project structure

```
/MacWebOS
- index.html
- /css
  - system.css
  - windows.css
  - widgets.css
- /js
  - system.js
  - window-manager.js
  - widgets.js
  - apps.js
  - finder.js (Finder app registry)
  - media.js (media app registry)
- /apps
  - mp4-player.html
  - mp3-player.html
  - finder.html
  - browser.html
- /assets
  - icons
  - wallpapers
  - sounds
- /widgets
  - clock.js
  - weather.js
  - music.js
```

## Included features

- macOS-style menu bar, dock, windows, and desktop icons
- Finder-style file manager launched from a shared app registry
- YouTube-themed MP4 app with search, categories, local uploads, drag/drop, seek/speed/volume/fullscreen controls
- Spotify-themed MP3 app with playlist search, queue, shuffle/repeat, local track imports, visualizer, and now-playing bar
- Draggable/resizable widgets with saved positions
- Control Center and Notification Center
- LocalStorage persistence for wallpaper, windows, widgets, and notifications
