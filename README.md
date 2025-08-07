# 🧩 Daily Slide Puzzle

A simple and beautiful **sliding puzzle game** — featuring a fresh photo every day, powered by the [Pexels API](https://www.pexels.com/api/). 

Solve the 3×3 image puzzle with the fewest moves possible. How efficiently can you think and slide?
(timer is available to add global/regional leaderboard in future)

## 🎮 How to Play
- Click tiles adjacent to the empty space to slide them.
- Timer starts after your **first move**.
- Your goal: **Recreate the original image**.
- Puzzle is scrambled in exactly **10 moves** — can you solve it in 10 or fewer?

## 📊 Performance Rating

| Moves Taken         | Performance  |
|---------------------|--------------|
| `< 10`              | 🧠 **Genius** — You found a better solution! |
| `= 10`              | ✅ **Perfect** — Nailed the scramble path |
| `11–15`             | 🤔 **Not Bad** — A little rusty, huh? |
| `> 15`              | 🫣 **Oof...** — Try again tomorrow! |

Your best and latest times are tracked in your browser (via `localStorage`).

## 🖼 Image Credits
All images are pulled daily using the **Pexels API** and include:
- Photographer attribution
- Reference image preview

## 🚀 Hosting
This game is [hosted for free on GitHub Pages](https://pages.github.com).

To host your own:
1. Fork this repo
2. Enable GitHub Pages under `Settings > Pages`
3. Set branch to `main` and folder to `/root`
4. Done ✅

## 📄 License
This project is licensed under the **MIT License**.  
Feel free to use, remix, and share — with credit.

---
