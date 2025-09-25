# Gemini Context: ARORA TV Studio

## Project Overview

ARORA TV Studio is the backend and automation engine for the ARORA TV online television channel. The project's goal is to create a fully automated content pipeline.

**Core Technologies:**
- **Automation:** GitHub Actions (`workflows/jarvis.yml`)
- **Content Fetching:** Python with Telethon (`scripts/fetch_telegram.py`)
- **Data:** JSON files for schedule (`data/schedule.json`) and fetched links.
- **Frontend:** A web-based video player (code to be placed in `src/`).

**Architecture:**
1.  A GitHub Actions workflow, codenamed "Jarvis 2", orchestrates all automated tasks.
2.  A Python script, `fetch_telegram.py`, uses the Telethon library to scrape video links and metadata from public Telegram channels.
3.  The collected data is stored in `data/links.json`.
4.  The Jarvis workflow processes `links.json` to update the master program schedule in `data/schedule.json`.
5.  A web player consumes the schedule to display content.
6.  The system is designed to handle dynamic content like pop-up announcements and commercial breaks, and includes automated cleanup of old content.

## Building and Running

The project is primarily designed to be run via GitHub Actions.

**GitHub Actions Workflow:**
- The main workflow is defined in `.github/workflows/jarvis.yml`.
- It is responsible for executing the Python scripts on a schedule.
- **NOTE:** The `jarvis.yml` file is currently a placeholder and needs to be implemented.

**Running Scripts Locally:**
To run the Python scripts locally for development, you will need to set up a Python environment.

1.  **Install dependencies:**
    ```bash
    # TODO: Create a requirements.txt file
    pip install telethon
    ```
2.  **Set up credentials:**
    The `fetch_telegram.py` script will require Telegram API credentials. As per project conventions, these should not be hardcoded. For local development, you can use environment variables.
    ```bash
    export API_ID="your_api_id"
    export API_HASH="your_api_hash"
    export BOT_TOKEN="your_bot_token"
    ```
3.  **Execute the script:**
    ```bash
    python scripts/fetch_telegram.py
    ```
    **NOTE:** The `fetch_telegram.py` script is currently a non-functional prototype.

## Development Conventions

- **Configuration:** Project settings (like the list of Telegram channels to scrape) should be managed in a central `data/settings.json` file.
- **Security:** All sensitive credentials (API keys, tokens) MUST be stored as GitHub Secrets and loaded into workflows. Never commit them to the repository.
- **Data Flow:** The flow of data is strictly defined: Telegram -> `data/links.json` -> `data/schedule.json` -> Web Player.
- **Automation:** All core processes should be automated and managed by the `jarvis.yml` workflow.
