StockPilot V41 — Code Files

This folder contains the same V41 website split into editable source files.

Files:
- index.html       Main page structure; open this file in a browser.
- styles.css       Original inline CSS extracted without changing its rules.
- model-data.js    Original local machine-learning model data. Load this before app.js.
- app.js           Original main application logic.
- motion.js        Original presentation motion controller.
- ML_MODEL_INFO.txt  Model information from the original package.
- README_Σ╕¡µûç.txt  Original project README from the original package.

All files must remain in the same folder. The script loading order in index.html
is intentional: model-data.js, app.js, then motion.js.

To run the website, extract the ZIP and open index.html in Chrome or Edge.
If your browser blocks any local-file behavior, run a local static server from
this folder (for example: python -m http.server 8000) and open
http://localhost:8000/StockPilot_Local_ML/
