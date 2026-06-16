# BigQuery Release Pulse Dashboard

A modern, responsive, and visually stunning web application built with a Python Flask backend and a premium vanilla HTML, JavaScript, and CSS frontend. It aggregates Google Cloud BigQuery release notes live, allowing users to search, filter by category, and easily share specific updates directly to Twitter/X.

## Features

- **Live Feeds Integration**: Proxies and fetches Google Cloud's BigQuery Atom XML feed.
- **Granular Category Extraction**: Splits feed entries into separate updates categorized by type:
  - `Feature` (Green)
  - `Breaking` (Red)
  - `Issue` (Yellow)
  - `Change` (Blue)
  - `Announcement` (Purple)
- **Instant Client-Side Filtering**: Sort updates immediately by category badge or text queries.
- **Tweet Composer Integration**: Opens a native `<dialog>` preview modal with automatic text truncation to compose and post updates to X using Twitter Web Intents.
- **Premium Aesthetics**: Features a modern dark-theme glassmorphism interface, custom gradients, scroll effects, and button micro-animations.

---

## Getting Started

### Prerequisites

- Python 3.8 or higher installed on your system.

### Installation & Setup

1. **Clone/Navigate to the Directory**:
   ```bash
   cd /Users/cinamonwhite/.gemini/antigravity-ide/scratch/agy-cli-projects/bq-releases-notes
   ```

2. **Initialize Python Virtual Environment**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate Environment & Install Dependencies**:
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Launch the Local Development Server**:
   ```bash
   python app.py
   ```

5. **Open in Browser**:
   Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## Testing

To run the unit tests verifying route statuses and API parsing:

```bash
python test_app.py
```

---

## File Structure

```
bq-releases-notes/
├── app.py                # Flask server and API endpoints
├── test_app.py           # Unit tests
├── requirements.txt      # Project dependencies
├── .gitignore            # Git ignore configuration
├── templates/
│   └── index.html        # Dashboard layout HTML
└── static/
    ├── css/
    │   └── style.css     # Dark-mode glassmorphic styling
    └── js/
        └── app.js        # Timeline logic, filter handling, and Twitter modal scripting
```
