# 🛡️ EchoAlertAI - AI-Powered Emergency Detection

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://mohanraj9342.github.io/emergency-detector/)

> Smart real-time identification of emergency vs non-emergency visual situations using deep learning and computer vision.

## Project Overview

EchoAlertAI is an end-to-end computer vision portfolio project that demonstrates the full path from trained model artifacts to browser deployment.
The system uses an EfficientNetB3-based classifier to detect emergency-like visual patterns from webcam frames or uploaded images.

| Class | Description |
|---|---|
| Emergency | Distress, panic, pain, or urgent visual cues |
| No Emergency | Neutral, normal, calm, or non-urgent visual cues |

All inference runs locally in the browser with TensorFlow.js, so user images do not need to be sent to a backend server.

## Key Highlights

- Real-time webcam inference workflow
- Upload and analyze single images instantly
- Client-side TensorFlow.js model execution
- Responsive dashboard with confidence visualization
- Clean static-host deployment (GitHub Pages ready)



## Features

- Camera mode with periodic live predictions
- Upload mode with one-click analysis
- Emergency / non-emergency confidence display
- Visual alert state for high-risk predictions
- Clear/reset actions for camera and upload flows
- Mobile-friendly responsive UI

## Model Details

| Property | Value |
|---|---|
| Base Model | EfficientNetB3 |
| Runtime Format | TensorFlow.js Graph Model |
| Input Shape | 300 x 300 x 3 (RGB) |
| Output | 2-class softmax (Emergency / No Emergency) |
| Inference Engine | TensorFlow.js (browser) |

## Technical Stack

### Machine Learning

- Framework: TensorFlow / Keras
- Deployment Runtime: TensorFlow.js 4.x
- Model Type: EfficientNetB3-based image classifier

### Web Application

- Frontend: HTML5, CSS3, JavaScript
- Visualization: Custom dashboard UI components
- Hosting: GitHub Pages / static hosting

### Development

- Environment: Python, local static server
- Version Control: Git and GitHub

## Project Structure

```text
OldFinalRedeploy/
├── README.md
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── model.js
│   ├── ui.js
│   └── charts.js
├── tfjs_graph_model/
│   ├── model.json
│   └── group1-shard1of12.bin ... group1-shard12of12.bin
└── tfjs_model/
	├── model.json
	└── group1-shard1of12.bin ... group1-shard12of12.bin
```

## Quick Start

### 1) Clone the Repository

```bash
git clone <your-repo-url>
cd OldFinalRedeploy
```

### 2) Run Locally

```bash
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000
```

### 3) Test the App

- Use Camera mode and click Start Camera
- Or switch to Upload mode and analyze an image
- Review confidence scores and alert state



## Notes

- Keep model files in `tfjs_graph_model/` paths unchanged to avoid loading errors.
- Use a static server locally (not direct file-open) so model files load correctly.

## Contact

Mohanraj V

- GitHub: `@mohanraj9342`

If this project helped you, consider starring the repository.
