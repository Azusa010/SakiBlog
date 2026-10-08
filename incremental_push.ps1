git reset --soft HEAD~1
git reset HEAD .

# Commit 1: Code and text
git add src/
git add public/*.html
git add DESIGN.md
git add download.js compress.ps1
git commit -m "feat(home): overhaul landing page with GSAP mood boards and cinematic interactions"
git push

# Commit 2: Images (~1.5MB)
git add public/images/
git commit -m "feat(home): add compressed Unsplash assets"
git push

# Commit 3: Video 1 (~4MB)
git add public/videos/12160567-hd_1280_720_25fps.mp4
git commit -m "feat(home): add mood board video 1"
git push

# Commit 4: Video 2 (~6MB)
git add public/videos/5437124-hd_1280_720_24fps.mp4
git commit -m "feat(home): add mood board video 2"
git push

# Commit 5: Video 3 (~1.8MB)
git add public/videos/7276307-hd_1280_720_18fps.mp4
git commit -m "feat(home): add mood board video 3"
git push

# Commit 6: Video 4 (~7.7MB)
git add public/videos/mixkit-gigantic-field-of-sunflowers-on-a-sunny-day-4881-hd-ready.mp4
git commit -m "feat(home): add mood board video 4"
git push
